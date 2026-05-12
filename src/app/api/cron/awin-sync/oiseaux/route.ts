import { runAwinSyncForCategory } from '../awin-sync-helper';
export async function GET(req: Request) {
  return runAwinSyncForCategory(req, 'oiseaux');
}
