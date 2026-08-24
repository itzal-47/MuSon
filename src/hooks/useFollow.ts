import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export function useFollow(followingId: string | undefined) {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!followingId) return;
    (async () => {
      const { count } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', followingId);
      setFollowerCount(count || 0);

      if (user) {
        const { data } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', user.id)
          .eq('following_id', followingId)
          .maybeSingle();
        setIsFollowing(!!data);
      }
    })();
  }, [followingId, user]);

  const toggleFollow = useCallback(async () => {
    if (!user || !followingId) return;
    setLoading(true);
    try {
      if (isFollowing) {
        await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', followingId);
        setIsFollowing(false);
        setFollowerCount((c) => Math.max(0, c - 1));
      } else {
        await supabase.from('follows').insert({ follower_id: user.id, following_id: followingId });
        setIsFollowing(true);
        setFollowerCount((c) => c + 1);
      }
    } finally {
      setLoading(false);
    }
  }, [user, followingId, isFollowing]);

  return { isFollowing, followerCount, toggleFollow, loading };
}
