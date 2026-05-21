import { runCatalogSyncForCategory } from '../catalog-sync-helper';
export const maxDuration = 60;
export async function GET(req: Request) {
  return runCatalogSyncForCategory(req, 'chiens');
}
