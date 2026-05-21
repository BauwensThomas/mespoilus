import CatalogCard from './CatalogCard';
import CatalogListItem from './CatalogListItem';
import AdminHideButton from './AdminHideButton';

export interface CatalogItem {
  catalog_id: string;
  name: string;
  name_fr?: string | null;
  image_url: string | null;
  brand: string | null;
  category: string;
  weight_g: number | null;
  price: number;
  currency: string;
  merchant_name: string;
  country: string | null;
  affiliate_url: string;
  offer_count: number;
  status?: 'active' | 'hidden';
}

export default function CatalogGrid({
  items, view, isAdmin = false,
}: {
  items: CatalogItem[];
  view: 'grid' | 'list';
  isAdmin?: boolean;
}) {
  if (view === 'list') {
    return (
      <div className="space-y-2">
        {items.map(item => {
          const hidden = item.status === 'hidden';
          return (
            <div key={item.catalog_id} className={`relative ${hidden ? 'opacity-50 grayscale' : ''}`}>
              {isAdmin && (
                <AdminHideButton catalogId={item.catalog_id} name={item.name} status={item.status} />
              )}
              <CatalogListItem
                catalogId={item.catalog_id}
                name={item.name}
                nameFr={item.name_fr}
                imageUrl={item.image_url}
                brand={item.brand}
                weightG={item.weight_g}
                category={item.category}
                price={item.price}
                currency={item.currency}
                merchantName={item.merchant_name}
                country={item.country}
                affiliateUrl={item.affiliate_url}
                offerCount={item.offer_count}
              />
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4">
      {items.map(item => {
        const hidden = item.status === 'hidden';
        return (
          <div key={item.catalog_id} className={`relative h-full ${hidden ? 'opacity-50 grayscale' : ''}`}>
            {isAdmin && (
              <AdminHideButton catalogId={item.catalog_id} name={item.name} status={item.status} />
            )}
            <CatalogCard
              catalogId={item.catalog_id}
              name={item.name}
              nameFr={item.name_fr}
              imageUrl={item.image_url}
              brand={item.brand}
              weightG={item.weight_g}
              price={item.price}
              currency={item.currency}
              merchantName={item.merchant_name}
              country={item.country}
              affiliateUrl={item.affiliate_url}
              offerCount={item.offer_count}
            />
          </div>
        );
      })}
    </div>
  );
}
