import { gzipSync } from 'node:zlib';
import { createAdminClient } from '@/lib/supabase/server';

type SupabaseClient = ReturnType<typeof createAdminClient>;

export const BACKUP_BUCKET = 'db-backups';
const RETENTION = 4;          // nombre de sauvegardes conservées (1 par semaine)
// 500 lignes séquentielles : products_catalog (~3,5 KB/ligne) dépassait le statement_timeout
// de 8 s du rôle API avec des pages de 1000 en parallèle.
const PAGE_SIZE = 500;
const PART_SIZE = 5000;       // lignes par fichier .json.gz (reste sous la limite 50 MB du plan Free)

type TableInfo = { table_name: string; pk_columns: string[]; depends_on: string[]; columns: string[] };

export type BackupManifest = {
  created_at: string;
  folder: string;
  total_rows: number;
  total_bytes: number;
  tables: Array<{
    name: string;
    pk: string[];
    depends_on: string[];
    columns: string[];
    rows: number;
    parts: string[];
    bytes: number;
  }>;
};

async function fetchAllRows(supabase: SupabaseClient, table: TableInfo): Promise<Record<string, unknown>[]> {
  const select = table.columns.map((c) => `"${c}"`).join(',');
  const rows: Record<string, unknown>[] = [];
  const singlePk = table.pk_columns.length === 1 ? table.pk_columns[0] : null;
  let last: unknown = null;

  // Clé primaire simple : pagination par curseur (pk > dernière valeur), coût constant par page.
  // Clé composite (prenoms, 20 lignes) : offset trié sur la clé.
  for (let page = 0; ; page++) {
    let query = supabase.from(table.table_name).select(select);
    for (const col of table.pk_columns) query = query.order(col, { ascending: true });
    if (singlePk && last !== null) query = query.gt(singlePk, last);
    query = singlePk ? query.limit(PAGE_SIZE) : query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    const { data, error } = await query;
    if (error) throw new Error(`${table.table_name} (page ${page}) : ${error.message}`);
    const batch = (data ?? []) as unknown as Record<string, unknown>[];
    rows.push(...batch);
    if (batch.length < PAGE_SIZE) return rows;
    if (singlePk) last = batch[batch.length - 1][singlePk];
  }
}

/** Exporte toutes les tables du schéma public vers db-backups/<YYYY-MM-DD>/. */
export async function runDbBackup(supabase: SupabaseClient): Promise<BackupManifest> {
  const now = new Date();
  const folder = now.toISOString().slice(0, 10);
  const storage = supabase.storage.from(BACKUP_BUCKET);

  const { data: tables, error } = await supabase.rpc('backup_list_tables');
  if (error) throw new Error(`backup_list_tables : ${error.message}`);

  const manifest: BackupManifest = { created_at: now.toISOString(), folder, total_rows: 0, total_bytes: 0, tables: [] };

  for (const table of (tables ?? []) as TableInfo[]) {
    const rows = await fetchAllRows(supabase, table);
    const parts: string[] = [];
    let bytes = 0;

    // Toujours au moins une part (même vide) pour qu'une table vide soit restaurable à l'identique
    for (let i = 0; i === 0 || i * PART_SIZE < rows.length; i++) {
      const path = `${folder}/${table.table_name}/${String(i).padStart(3, '0')}.json.gz`;
      const gz = gzipSync(JSON.stringify(rows.slice(i * PART_SIZE, (i + 1) * PART_SIZE)));
      const { error: upError } = await storage.upload(path, gz, { contentType: 'application/gzip', upsert: true });
      if (upError) throw new Error(`${path} : ${upError.message}`);
      parts.push(path);
      bytes += gz.length;
    }

    manifest.tables.push({ name: table.table_name, pk: table.pk_columns, depends_on: table.depends_on, columns: table.columns, rows: rows.length, parts, bytes });
    manifest.total_rows += rows.length;
    manifest.total_bytes += bytes;
  }

  // Le manifest est écrit en dernier : sa présence garantit que la sauvegarde est complète
  const { error: manifestError } = await storage.upload(
    `${folder}/manifest.json`,
    JSON.stringify(manifest, null, 2),
    { contentType: 'application/json', upsert: true },
  );
  if (manifestError) throw new Error(`manifest : ${manifestError.message}`);

  return manifest;
}

/** Supprime les sauvegardes au-delà des RETENTION plus récentes. Renvoie les dossiers supprimés. */
export async function pruneOldBackups(supabase: SupabaseClient): Promise<string[]> {
  const storage = supabase.storage.from(BACKUP_BUCKET);
  const { data: root, error } = await storage.list('', { limit: 1000 });
  if (error) throw new Error(`list : ${error.message}`);

  const folders = (root ?? [])
    .map((f) => f.name)
    .filter((name) => /^\d{4}-\d{2}-\d{2}$/.test(name))
    .sort()
    .reverse();
  const toDelete = folders.slice(RETENTION);

  for (const folder of toDelete) {
    const { data: tableDirs } = await storage.list(folder, { limit: 1000 });
    const paths: string[] = [];
    for (const entry of tableDirs ?? []) {
      if (entry.id) { paths.push(`${folder}/${entry.name}`); continue; } // fichier (manifest.json)
      const { data: files } = await storage.list(`${folder}/${entry.name}`, { limit: 1000 });
      for (const f of files ?? []) paths.push(`${folder}/${entry.name}/${f.name}`);
    }
    if (paths.length) await storage.remove(paths);
  }
  return toDelete;
}
