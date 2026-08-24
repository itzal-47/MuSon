import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { AppNotification } from '@/types/database';

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('criado_em', { ascending: false })
      .limit(50);
    setNotifications((data || []) as AppNotification[]);
    setUnreadCount((data || []).filter((n) => !n.lida).length);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchNotifications]);

  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user) return;
    await supabase.from('notifications').update({ lida: true }).eq('id', notificationId).eq('user_id', user.id);
    setNotifications((prev) => prev.map((n) => n.id === notificationId ? { ...n, lida: true } : n));
    setUnreadCount((c) => Math.max(0, c - 1));
  }, [user]);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    await supabase.from('notifications').update({ lida: true }).eq('user_id', user.id).eq('lida', false);
    setNotifications((prev) => prev.map((n) => ({ ...n, lida: true })));
    setUnreadCount(0);
  }, [user]);

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead, refetch: fetchNotifications };
}
