import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { supabase } from './supabase';

// Object key convention: {coach_id}/{player_id}/{uuid}.{ext}
// The storage RLS policies authorize reads/writes off these folders.
function makePath(coachId: string, playerId: string, ext: string) {
  const id =
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${coachId}/${playerId}/${id}.${ext}`;
}

// Let the coach pick photos, upload them, and return the stored object paths.
export async function pickAndUploadMedia(
  coachId: string,
  playerId: string,
): Promise<string[]> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return [];

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsMultipleSelection: true,
    quality: 0.7,
    base64: true,
    selectionLimit: 6,
  });
  if (result.canceled) return [];

  const paths: string[] = [];
  for (const asset of result.assets) {
    if (!asset.base64) continue;
    const ext = (asset.uri.split('.').pop() || 'jpg').toLowerCase();
    const contentType = asset.mimeType ?? `image/${ext === 'jpg' ? 'jpeg' : ext}`;
    const path = makePath(coachId, playerId, ext);

    const { error } = await supabase.storage
      .from('session-media')
      .upload(path, decode(asset.base64), { contentType, upsert: false });

    if (!error) paths.push(path);
  }
  return paths;
}

// Resolve private object paths to temporary signed URLs for display.
export async function signMediaUrls(paths: string[]): Promise<string[]> {
  if (!paths.length) return [];
  const { data } = await supabase.storage
    .from('session-media')
    .createSignedUrls(paths, 60 * 60);
  return (data ?? [])
    .map((d) => d.signedUrl)
    .filter((u): u is string => !!u);
}
