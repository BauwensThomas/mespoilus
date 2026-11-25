import { runAwinCleanup } from '../catalog-sync-helper';
export const maxDuration = 300;
export async function GET(req: Request) {
  return runAwinCleanup(req);
}
