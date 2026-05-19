import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import Link from 'next/link';

interface Props { params: { id: string } }

async function updatePost(id: string, formData: FormData) {
  'use server';
  const supabase = createAdminClient();
  await supabase.from('adoption_posts').update({
    poster_name:  (formData.get('poster_name') as string).trim(),
    email:        (formData.get('email') as string).trim().toLowerCase(),
    animal_type:  formData.get('animal_type') as string,
    breed:        (formData.get('breed') as string)?.trim() || null,
    age:          (formData.get('age') as string)?.trim() || null,
    gender:       formData.get('gender') as string,
    region:       (formData.get('region') as string).trim(),
    description:  (formData.get('description') as string).trim(),
    reason:       (formData.get('reason') as string)?.trim() || null,
    contact_info: (formData.get('contact_info') as string)?.trim() || null,
    status:       formData.get('status') as string,
    updated_at:   new Date().toISOString(),
  }).eq('id', id);
  revalidatePath('/adoption-admin');
  redirect('/adoption-admin');
}

const ANIMAL_TYPES = ['chien','chat','oiseau','rongeur','reptile','autre'];
const inputCls = 'w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-200';

export default async function EditPostPage({ params }: Props) {
  const supabase = createAdminClient();
  const { data: post } = await supabase.from('adoption_posts').select('*').eq('id', params.id).single();

  if (!post) return <div className="p-8 text-gray-500">Annonce introuvable.</div>;

  const action = updatePost.bind(null, params.id);

  return (
    <div className="px-8 py-8 max-w-2xl space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link href="/adoption-admin" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">← Retour</Link>
        <h1 className="text-2xl font-bold text-gray-900">Modifier l'annonce</h1>
      </div>

      <form action={action} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Prénom</label>
            <input name="poster_name" required defaultValue={post.poster_name} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
            <input name="email" type="email" required defaultValue={post.email} className={inputCls} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Type d'animal</label>
            <select name="animal_type" required defaultValue={post.animal_type} className={inputCls}>
              {ANIMAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Race</label>
            <input name="breed" defaultValue={post.breed ?? ''} className={inputCls} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Âge</label>
            <input name="age" defaultValue={post.age ?? ''} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Sexe</label>
            <select name="gender" defaultValue={post.gender} className={inputCls}>
              <option value="inconnu">Inconnu</option>
              <option value="mâle">Mâle</option>
              <option value="femelle">Femelle</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Statut</label>
            <select name="status" defaultValue={post.status} className={inputCls}>
              <option value="pending">En attente</option>
              <option value="approved">Approuvé</option>
              <option value="rejected">Rejeté</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Région / Ville</label>
          <input name="region" required defaultValue={post.region} className={inputCls} />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Téléphone</label>
          <input name="contact_info" defaultValue={post.contact_info ?? ''} className={inputCls} />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
          <textarea name="description" required rows={4} defaultValue={post.description} className={`${inputCls} resize-none`} />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Raison du don</label>
          <textarea name="reason" rows={2} defaultValue={post.reason ?? ''} className={`${inputCls} resize-none`} />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit"
            className="bg-orange-600 hover:bg-orange-500 text-white font-semibold px-6 py-2 rounded-xl text-sm transition-colors">
            Enregistrer
          </button>
          <Link href="/adoption-admin"
            className="px-6 py-2 rounded-xl text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
            Annuler
          </Link>
        </div>
      </form>
    </div>
  );
}
