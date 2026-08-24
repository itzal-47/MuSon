import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { TrackComment } from '@/types/database';

export function useComments(trackId: string | undefined) {
  const { user } = useAuth();
  const [comments, setComments] = useState<TrackComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = useCallback(async () => {
    if (!trackId) return;
    setLoading(true);
    const { data } = await supabase
      .from('track_comments')
      .select(`
        *,
        author:profiles!track_comments_user_id_fkey(display_name, username, avatar_url, verificado)
      `)
      .eq('track_id', trackId)
      .order('criado_em', { ascending: false });
    if (data) {
      setComments(data.map((c) => {
        const author = c.author as { display_name: string | null; username: string | null; avatar_url: string | null; verificado: boolean } | null;
        return {
          ...c,
          author_name: author?.display_name || author?.username || 'Utilizador',
          author_avatar: author?.avatar_url || null,
          author_verificado: author?.verificado || false,
        } as TrackComment;
      }));
    }
    setLoading(false);
  }, [trackId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const addComment = useCallback(async (texto: string) => {
    if (!user || !trackId || !texto.trim()) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('track_comments')
        .insert({ track_id: trackId, user_id: user.id, texto: texto.trim() })
        .select(`
          *,
          author:profiles!track_comments_user_id_fkey(display_name, username, avatar_url, verificado)
        `)
        .single();
      if (!error && data) {
        const author = data.author as { display_name: string | null; username: string | null; avatar_url: string | null; verificado: boolean } | null;
        setComments((prev) => [{
          ...data,
          author_name: author?.display_name || author?.username || 'Utilizador',
          author_avatar: author?.avatar_url || null,
          author_verificado: author?.verificado || false,
        } as TrackComment, ...prev]);
      }
    } finally {
      setSubmitting(false);
    }
  }, [user, trackId]);

  const deleteComment = useCallback(async (commentId: string) => {
    if (!user) return;
    await supabase.from('track_comments').delete().eq('id', commentId).eq('user_id', user.id);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  }, [user]);

  return { comments, loading, submitting, addComment, deleteComment, refetch: fetchComments };
}
