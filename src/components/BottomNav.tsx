import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, Library, User, Bell } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/context/AuthContext';

const items = [
  { path: '/', label: 'Início', icon: Home },
  { path: '/pesquisar', label: 'Pesquisar', icon: Search },
  { path: '/biblioteca', label: 'Biblioteca', icon: Library },
  { path: '/perfil', label: 'Perfil', icon: User },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-black/95 backdrop-blur-lg border-t border-neutral-900">
      <div className="max-w-md mx-auto flex items-center justify-around px-2 pt-2 pb-3">
        {items.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center gap-1 px-3 py-1 transition-colors"
            >
              <div className={active ? 'glow-accent-sm rounded-lg' : ''}>
                <item.icon
                  size={22}
                  className={active ? 'text-amber-500' : 'text-neutral-500'}
                  strokeWidth={active ? 2.5 : 2}
                />
              </div>
              <span className={`text-xs ${active ? 'text-amber-500 font-medium' : 'text-neutral-500'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
        {user && (
          <button
            onClick={() => navigate('/notificacoes')}
            className="flex flex-col items-center gap-1 px-3 py-1 transition-colors relative"
          >
            <div className={isActive('/notificacoes') ? 'glow-accent-sm rounded-lg' : ''}>
              <Bell
                size={22}
                className={isActive('/notificacoes') ? 'text-amber-500' : 'text-neutral-500'}
                strokeWidth={isActive('/notificacoes') ? 2.5 : 2}
              />
            </div>
            {unreadCount > 0 && (
              <span className="absolute top-0 right-2 w-4 h-4 rounded-full bg-amber-500 text-black text-[10px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
            <span className={`text-xs ${isActive('/notificacoes') ? 'text-amber-500 font-medium' : 'text-neutral-500'}`}>
              Avisos
            </span>
          </button>
        )}
      </div>
    </nav>
  );
}
