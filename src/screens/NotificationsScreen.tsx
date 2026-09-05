import { useNavigate } from 'react-router-dom';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/context/AuthContext';
import { fetchIsAdmin } from '@/lib/admin';
import { timeAgo } from '@/lib/format';
import {
  ArrowLeft, Bell, UserPlus, Music, Heart, MessageCircle, BadgeCheck, Check,
  Flag, Wallet, LifeBuoy, Shield,
} from 'lucide-react';
import type { AppNotification, NotificationTipo } from '@/types/database';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const ADMIN_TIPOS: NotificationTipo[] = ['admin_denuncia', 'admin_verificacao', 'admin_pagamento', 'admin_suporte'];

export default function NotificationsScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notifications, loading, markAsRead, markAllAsRead, unreadCount } = useNotifications();
  const [senderProfiles, setSenderProfiles] = useState<Record<string, { display_name: string | null; username: string | null; avatar_url: string | null; verificado: boolean }>>({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [tab, setTab] = useState<'normais' | 'admin'>('normais');

  useEffect(() => {
    if (!user) return;
    fetchIsAdmin(user.id).then(setIsAdmin);
  }, [user]);

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

  const visibleNotifications = notifications.filter((n) =>
    tab === 'admin' ? ADMIN_TIPOS.includes(n.tipo) : !ADMIN_TIPOS.includes(n.tipo)
  );

  const handleClick = (n: AppNotification) => {
    if (!n.lida) markAsRead(n.id);
    switch (n.tipo) {
      case 'novo_seguidor':
      case 'gosto':
      case 'comentario':
        if (n.referencia_id) navigate(`/artista/${n.referencia_id}`);
        break;
      case 'admin_denuncia':
        navigate('/admin/moderacao', { state: { tab: 'denuncias' } });
        break;
      case 'admin_verificacao':
        navigate('/admin/moderacao', { state: { tab: 'verificacao' } });
        break;
      case 'admin_pagamento':
        navigate('/admin/pagamentos');
        break;
      case 'admin_suporte':
        navigate('/admin/moderacao', { state: { tab: 'suporte' } });
        break;
    }
  };

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
              Marcar todas
            </button>
          )}
        </div>

        {isAdmin && (
          <div className="flex gap-2">
            <button
              onClick={() => setTab('normais')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                tab === 'normais' ? 'accent-gradient text-black' : 'bg-neutral-900 border border-neutral-800 text-neutral-400'
              }`}
            >
              Normais
            </button>
            <button
              onClick={() => setTab('admin')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                tab === 'admin' ? 'accent-gradient text-black' : 'bg-neutral-900 border border-neutral-800 text-neutral-400'
              }`}
            >
              <Shield size={14} /> Painel ADM
            </button>
          </div>
        )}
      </header>

      <div className="px-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : visibleNotifications.length === 0 ? (
          <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-neutral-800 mx-auto mb-3 flex items-center justify-center">
              <Bell size={26} className="text-neutral-600" />
            </div>
            <p className="text-white font-medium mb-1">Sem notificações</p>
            <p className="text-neutral-400 text-sm">
              {tab === 'admin'
                ? 'Denúncias, pedidos de verificação e de pagamento aparecem aqui.'
                : 'Quando alguém te seguir, gostar das tuas faixas ou comentar, vais ver aqui.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {visibleNotifications.map((n) => (
              <NotificationRow
                key={n.id}
                notification={n}
                sender={n.referencia_id ? senderProfiles[n.referencia_id] : undefined}
                onClick={() => handleClick(n)}
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
  const isAdminTipo = ADMIN_TIPOS.includes(notification.tipo);

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-start gap-3 p-4 rounded-xl border transition-all text-left ${
        notification.lida
          ? 'bg-neutral-900 border-neutral-800'
          : isAdminTipo ? 'bg-cyan-500/5 border-cyan-500/20' : 'bg-amber-600/5 border-amber-600/20'
      }`}
    >
      <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center shrink-0">
        {sender?.avatar_url ? (
          <img src={sender.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
        ) : (
          <div className={isAdminTipo ? 'text-cyan-400' : 'text-amber-500'}>{icon}</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm">
          {label}
          {sender?.verificado && <BadgeCheck size={13} className="inline text-white fill-blue-500 ml-1" />}
        </p>
        {notification.referencia_texto && (
          <p className="text-neutral-500 text-xs truncate mt-0.5">"{notification.referencia_texto}"</p>
        )}
        <p className="text-neutral-600 text-xs mt-1">{timeAgo(notification.criado_em)}</p>
      </div>
      {!notification.lida && (
        <div className={`w-2 h-2 rounded-full shrink-0 mt-2 ${isAdminTipo ? 'bg-cyan-400' : 'bg-amber-500'}`} />
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
    case 'admin_denuncia': return <Flag size={18} />;
    case 'admin_verificacao': return <BadgeCheck size={18} />;
    case 'admin_pagamento': return <Wallet size={18} />;
    case 'admin_suporte': return <LifeBuoy size={18} />;
  }
}

function getLabel(tipo: NotificationTipo, sender?: { display_name: string | null; username: string | null }) {
  const name = sender?.display_name || sender?.username || 'Alguém';
  switch (tipo) {
    case 'novo_seguidor': return `${name} começou a seguir-te.`;
    case 'nova_faixa': return `Nova faixa de um artista que segues.`;
    case 'gosto': return `${name} gostou da tua faixa.`;
    case 'comentario': return `${name} comentou na tua faixa.`;
    case 'admin_denuncia': return 'Nova denúncia recebida.';
    case 'admin_verificacao': return 'Novo pedido de selo verificado.';
    case 'admin_pagamento': return 'Novo pedido de pagamento pendente.';
    case 'admin_suporte': return 'Novo ticket de suporte.';
  }
}
