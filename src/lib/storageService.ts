import { supabase } from './supabase';

/**
 * storageService.ts — Abstração para upload/download de ficheiros.
 *
 * A interface é genérica para permitir trocar o provider (ex: Cloudflare R2)
 * sem alterar código fora deste ficheiro.
 */

export interface UploadResult {
  path: string;
  url: string;
}

export type ProgressCallback = (progress: number) => void;

export interface StorageProvider {
  upload(bucket: string, filePath: string, file: File, onProgress?: ProgressCallback): Promise<UploadResult>;
  getUrl(bucket: string, filePath: string): Promise<string>;
  delete(bucket: string, filePath: string): Promise<void>;
}

const supabaseStorage: StorageProvider = {
  async upload(bucket: string, filePath: string, file: File, onProgress?: ProgressCallback): Promise<UploadResult> {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        upsert: true,
        onUploadProgress: (e: { loaded: number; total: number }) => {
          if (onProgress && e.total) {
            onProgress(Math.round((e.loaded / e.total) * 100));
          }
        },
      } as Record<string, unknown>);
    if (error) throw error;
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return { path: data.path, url: urlData.publicUrl };
  },

  async getUrl(bucket: string, filePath: string): Promise<string> {
    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return data.publicUrl;
  },

  async delete(bucket: string, filePath: string): Promise<void> {
    const { error } = await supabase.storage.from(bucket).remove([filePath]);
    if (error) throw error;
  },
};

export const storage: StorageProvider = supabaseStorage;

export async function uploadImage(
  bucket: string,
  userId: string,
  file: File,
  kind: 'avatar' | 'capa'
): Promise<UploadResult> {
  const ext = file.name.split('.').pop() || 'jpg';
  const filePath = `${userId}/${kind}-${Date.now()}.${ext}`;
  return storage.upload(bucket, filePath, file);
}

export async function uploadTrackAudio(
  userId: string,
  file: File,
  onProgress?: ProgressCallback
): Promise<UploadResult> {
  const ext = file.name.split('.').pop() || 'mp3';
  const filePath = `${userId}/audio-${Date.now()}.${ext}`;
  return storage.upload('audio-tracks', filePath, file, onProgress);
}

export async function uploadTrackCover(
  userId: string,
  file: File
): Promise<UploadResult> {
  const ext = file.name.split('.').pop() || 'jpg';
  const filePath = `${userId}/cover-${Date.now()}.${ext}`;
  return storage.upload('track-covers', filePath, file);
}
