const BUFFER_API = 'https://api.bufferapp.com/1';

type Platform = 'facebook' | 'instagram' | 'tiktok';

interface BufferProfile {
  id: string;
  service: string;
  service_username: string;
}

interface BufferResult {
  success: boolean;
  bufferId?: string;
  error?: string;
}

// Cache profiles in-memory for the lifetime of the process
let profilesCache: BufferProfile[] | null = null;

async function getProfiles(token: string): Promise<BufferProfile[]> {
  if (profilesCache) {
    console.log('[Buffer] Profiles depuis le cache:', profilesCache.map(p => `${p.service}(${p.id})`));
    return profilesCache;
  }
  console.log('[Buffer] Appel API profiles...');
  const res = await fetch(`${BUFFER_API}/profiles.json?access_token=${encodeURIComponent(token)}`);
  console.log('[Buffer] Réponse profiles — status:', res.status);
  if (!res.ok) throw new Error(`Buffer profiles fetch failed: ${res.status}`);
  profilesCache = await res.json();
  console.log('[Buffer] Profiles trouvés:', profilesCache!.map(p => `${p.service}(${p.service_username})`));
  return profilesCache!;
}

export async function publishToBuffer(
  text: string,
  platform: Platform,
  scheduledAt?: Date
): Promise<BufferResult> {
  const token = process.env.BUFFER_ACCESS_TOKEN;
  if (!token) {
    console.warn('[Buffer] BUFFER_ACCESS_TOKEN non configuré — publication ignorée');
    return { success: false, error: 'BUFFER_ACCESS_TOKEN non configuré' };
  }

  try {
    const profiles = await getProfiles(token);
    const profile = profiles.find(p => p.service === platform);
    if (!profile) {
      console.warn(`[Buffer] Aucun profil trouvé pour ${platform} — profils dispo: ${profiles.map(p => p.service).join(', ')}`);
      return { success: false, error: `Aucun profil Buffer pour ${platform}` };
    }

    console.log(`[Buffer] Publication sur ${platform} (profil: ${profile.service_username}, id: ${profile.id})`);

    const body = new URLSearchParams();
    body.append('access_token', token);
    body.append('profile_ids[]', profile.id);
    body.append('text', text);
    if (scheduledAt) body.append('scheduled_at', scheduledAt.toISOString());

    const res = await fetch(`${BUFFER_API}/updates/create.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    const data = await res.json();
    console.log(`[Buffer] Réponse ${platform} — status: ${res.status}, success: ${data.success}, message: ${data.message ?? 'OK'}`);

    if (!res.ok || !data.success) {
      return { success: false, error: data.message ?? `Buffer error ${res.status}` };
    }

    console.log(`[Buffer] ✅ Post ${platform} programmé — bufferId: ${data.updates?.[0]?.id}`);
    return { success: true, bufferId: data.updates?.[0]?.id };
  } catch (err) {
    console.error(`[Buffer] Exception sur ${platform}:`, err);
    return { success: false, error: String(err) };
  }
}
