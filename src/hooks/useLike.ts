import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export function useLike(trackId: string | undefined) {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!trackId) return;
    (async () => {
      const { count } = await supabase
        .from('track_likes')
        .select('*', { count: 'exact', head: true })
        .eq('track_id', trackId);
      setLikeCount(count || 0);

      if (user) {
        const { data } = await supabase
          .from('track_likes')
          .select('id')
          .eq('track_id', trackId)
          .eq('user_id', user.id)
          .maybeSingle();
        setIsLiked(!!data);
      }
    })();
  }, [trackId, user]);

  const toggleLike = useCallback(async () => {
    if (!user || !trackId) return;
    setLoading(true);
    try {
      if (isLiked) {
        await supabase.from('track_likes').delete().eq('track_id', trackId).eq('user_id', user.id);
        setIsLiked(false);
        setLikeCount((c) => Math.max(0, c - 1));
      } else {
        await supabase.from('track_likes').insert({ track_id: trackId, user_id: user.id });
        setIsLiked(true);
        setLikeCount((c) => c + 1);
      }
    } finally {
      setLoading(false);
    }
  }, [user, trackId, isLiked]);

  return { isLiked, likeCount, toggleLike, loading };
}
