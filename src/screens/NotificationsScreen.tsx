import { useNavigate } from 'react-router-dom';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/context/AuthContext';
import {
  ArrowLeft, Bell, UserPlus, Music, Heart, MessageCircle, BadgeCheck, Check,
} from 'lucide-react';
import type { AppNotification, NotificationTipo } from '@/types/database';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function NotificationsScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notifications, loading, markAsRead, markAllAsRead, unreadCount } = useNotifications();
  const [senderProfiles, setSenderProfiles] = useState<Record<string, { display_name: string | null; username: string | null; avatar_url: string | null; verificado: boolean }>>({});

  useEffect(() => {
    if (notifications.length === 0) return;
    const senderIds = notifications
      .filter((n) => n.tipo === 'novo_seguidor' || n.tipo === 'gosto' || n.tipo === 'comentario')
      .map((n) => n.referencia_id)
      .filter((id): id is string => !!id);
    if (senderIds.length === 0) return;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, display_name, username, avatar_url, verificado')
        .in('id', [...new Set(senderIds)]);
      if (data) {
        const map: Record<string, { display_name: string | null; username: string | null; avatar_url: string | null; verificado: boolean }> = {};
        data.forEach((p) => {
          map[p.id] = { display_name: p.display_name, username: p.username, avatar_url: p.avatar_url, verificado: p.verificado };
        });
        setSenderProfiles(map);
      }
    })();
  }, [notifications]);

  if (!user) {
    return (
      <div className="min-h-screen bg-black pb-32 flex flex-col items-center justify-center px-6">
        <div className="w-16 h-16 rounded-2xl accent-gradient flex items-center justify-center mb-4 glow-accent-sm">
          <Bell size={28} className="text-black" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Notificações</h1>
        <p className="text-neutral-400 text-sm text-center mb-6">
          Inicia sessão para veres as tuas notificações.
        </p>
        <button
          onClick={() => navigate('/login')}
          className="px-8 py-3.5 rounded-xl accent-gradient hover:opacity-90 text-black font-bold transition-all glow-accent-sm"
        >
          Entrar ou registar
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-32">
      <header className="px-6 pt-14 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-300 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-bold text-white">Notificações</h1>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-amber-500 hover:text-amber-400 text-sm font-medium transition-colors flex items-center gap-1"
            >
              <Check size={16} />
              Marcar todas como lidas
            </button>
          )}
        </div>
      </header>

      <div className="px-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-neutral-800 mx-auto mb-3 flex items-center justify-center">
              <Bell size={26} className="text-neutral-600" />
            </div>
            <p className="text-white font-medium mb-1">Sem notificações</p>
            <p className="text-neutral-400 text-sm">Quando alguém te seguir, gostar das tuas faixas ou comentar, vais ver aqui.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <NotificationRow
                key={n.id}
                notification={n}
                sender={n.referencia_id ? senderProfiles[n.referencia_id] : undefined}
                onClick={() => {
                  if (!n.lida) markAsRead(n.id);
                  if (n.tipo === 'novo_seguidor' && n.referencia_id) {
                    navigate(`/artista/${n.referencia_id}`);
                  } else if ((n.tipo === 'gosto' || n.tipo === 'comentario') && n.referencia_id) {
                    navigate(`/artista/${n.referencia_id}`);
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function NotificationRow({
  notification,
  sender,
  onClick,
}: {
  notification: AppNotification;
  sender?: { display_name: string | null; username: string | null; avatar_url: string | null; verificado: boolean };
  onClick: () => void;
}) {
  const icon = getIcon(notification.tipo);
  const label = getLabel(notification.tipo, sender);

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-start gap-3 p-4 rounded-xl border transition-all text-left ${
        notification.lida
          ? 'bg-neutral-900 border-neutral-800'
          : 'bg-amber-600/5 border-amber-600/20'
      }`}
    >
      <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center shrink-0">
        {sender?.avatar_url ? (
          <img src={sender.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
        ) : (
          <div className="text-amber-500">{icon}</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm">
          {label}
          {sender?.verificado && <BadgeCheck size={13} className="inline text-amber-500 ml-1" />}
        </p>
        {notification.referencia_texto && (
          <p className="text-neutral-500 text-xs truncate mt-0.5">"{notification.referencia_texto}"</p>
        )}
        <p className="text-neutral-600 text-xs mt-1">{timeAgo(notification.criado_em)}</p>
      </div>
      {!notification.lida && (
        <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-2" />
      )}
    </button>
  );
}

function getIcon(tipo: NotificationTipo) {
  switch (tipo) {
    case 'novo_seguidor': return <UserPlus size={18} />;
    case 'nova_faixa': return <Music size={18} />;
    case 'gosto': return <Heart size={18} />;
    case 'comentario': return <MessageCircle size={18} />;
  }
}

function getLabel(tipo: NotificationTipo, sender?: { display_name: string | null; username: string | null }) {
  const name = sender?.display_name || sender?.username || 'Alguém';
  switch (tipo) {
    case 'novo_seguidor': return `${name} começou a seguir-te.`;
    case 'nova_faixa': return `Nova faixa de um artista que segues.`;
    case 'gosto': return `${name} gostou da tua faixa.`;
    case 'comentario': return `${name} comentou na tua faixa.`;
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora mesmo';
  if (mins < 60) return `há ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `há ${days}d`;
  const months = Math.floor(days / 30);
  return `há ${months} meses`;
}
