import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const admin = createAdminClient();

  try {
    // 1. Trouver tous les produits marqués comme amazon_imported_json = true
    const { data: productsToDelete, error: selectError } = await admin
      .from('products_catalog')
      .select('id')
      .eq('amazon_imported_json', true);

    if (selectError) {
      return NextResponse.json({ error: selectError.message }, { status: 500 });
    }

    if (!productsToDelete?.length) {
      return NextResponse.json({
        success: true,
        deleted: 0,
        message: 'Aucun produit JSON importé à supprimer',
      });
    }

    const productIds = productsToDelete.map(p => p.id);

    // 2. Supprimer les product_offers associés
    const { error: offersError } = await admin
      .from('product_offers')
      .delete()
      .in('catalog_id', productIds);

    if (offersError) {
      return NextResponse.json({ error: offersError.message }, { status: 500 });
    }

    // 3. Supprimer les products_catalog
    const { error: catalogError } = await admin
      .from('products_catalog')
      .delete()
      .in('id', productIds);

    if (catalogError) {
      return NextResponse.json({ error: catalogError.message }, { status: 500 });
    }

    // 4. Log l'action
    await admin.from('activity_logs').insert({
      agent_id: 'thomas',
      agent_name: 'Thomas',
      action: `[Admin] Suppression de ${productIds.length} produits Amazon importés du JSON`,
      details: { deleted_count: productIds.length },
      status: 'success',
    });

    return NextResponse.json({
      success: true,
      deleted: productIds.length,
      message: `${productIds.length} produit(s) supprimé(s)`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    );
  }
}
