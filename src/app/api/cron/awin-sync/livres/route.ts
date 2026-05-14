import { runAwinSyncForCategory } from '../awin-sync-helper';
export const maxDuration = 60;
export async function GET(req: Request) {
  return runAwinSyncForCategory(req, 'livres');
}
