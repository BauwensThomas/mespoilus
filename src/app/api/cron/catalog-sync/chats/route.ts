import { runCatalogSyncForCategory } from '../catalog-sync-helper';
export const maxDuration = 300;
export async function GET(req: Request) {
  return runCatalogSyncForCategory(req, 'chats');
}
