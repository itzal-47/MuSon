import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Music, Play, TrendingUp, UserPlus, BadgeCheck, Flag, Mic2, Disc3, MapPin, Tags, Bug, Check,
} from 'lucide-react';
import AdminShell from '@/components/AdminShell';
import {
  fetchDashboardStats, fetchTopProvinces, fetchTopGenres, fetchSignupTrend,
  type DashboardStats, type ProvinceBreakdownItem, type GenreBreakdownItem, type SignupTrendPoint,
} from '@/lib/adminDashboard';
import { fetchRecentErrors, markErrorResolved, type ErrorLogEntry } from '@/lib/errorLogsAdmin';

export default function AdminDashboardScreen() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [provinces, setProvinces] = useState<ProvinceBreakdownItem[]>([]);
  const [genres, setGenres] = useState<GenreBreakdownItem[]>([]);
  const [trend, setTrend] = useState<SignupTrendPoint[]>([]);
  const [errors, setErrors] = useState<ErrorLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchDashboardStats(),
      fetchTopProvinces(),
      fetchTopGenres(),
      fetchSignupTrend(14),
      fetchRecentErrors(),
    ]).then(([s, p, g, t, e]) => {
      setStats(s);
      setProvinces(p);
      setGenres(g);
      setTrend(t);
      setErrors(e);
      setLoading(false);
    });
  }, []);

  const handleResolveError = async (id: string) => {
    const ok = await markErrorResolved(id);
    if (ok) setErrors((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <AdminShell active="dashboard">
      <div className="animate-fade-in">
        <p className="text-neutral-400 text-sm mb-6">O estado do MuSon, num relance.</p>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : stats ? (
          <div className="space-y-6">
            {/* Erros recentes por resolver */}
            {errors.length > 0 && (
              <div className="admin-glass p-4">
                <p className="text-xs text-neutral-500 mb-3 uppercase tracking-wider flex items-center gap-1.5">
                  <Bug size={12} /> Erros por resolver ({errors.length})
                </p>
                <div className="space-y-2">
                  {errors.slice(0, 5).map((err) => (
                    <div key={err.id} className="flex items-start gap-2 p-2.5 rounded-lg bg-red-500/5 border border-red-500/15">
                      <div className="flex-1 min-w-0">
                        <p className="text-red-300 text-xs font-medium truncate">{err.mensagem}</p>
                        <p className="text-neutral-600 text-[10px] truncate">{err.url}</p>
                      </div>
                      <button
                        onClick={() => handleResolveError(err.id)}
                        className="shrink-0 p-1.5 rounded-lg bg-neutral-800 text-neutral-400 hover:text-emerald-400"
                        aria-label="Marcar como resolvido"
                      >
                        <Check size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ações pendentes — destaque se houver algo por fazer */}
            {(stats.pendingVerifications > 0 || stats.unresolvedReports > 0) && (
              <div className="admin-glass p-4">
                <p className="text-xs text-neutral-500 mb-3 uppercase tracking-wider">Precisa da tua atenção</p>
                <div className="flex gap-3">
                  {stats.pendingVerifications > 0 && (
                    <button
                      onClick={() => navigate('/admin/moderacao')}
                      className="flex-1 flex items-center gap-3 p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20"
                    >
                      <BadgeCheck size={20} className="text-cyan-400 shrink-0" />
                      <div className="text-left">
                        <p className="text-white font-bold text-lg leading-none">{stats.pendingVerifications}</p>
                        <p className="text-neutral-400 text-xs">pedidos de selo</p>
                      </div>
                    </button>
                  )}
                  {stats.unresolvedReports > 0 && (
                    <button
                      onClick={() => navigate('/admin/moderacao')}
                      className="flex-1 flex items-center gap-3 p-3 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/20"
                    >
                      <Flag size={20} className="text-fuchsia-400 shrink-0" />
                      <div className="text-left">
                        <p className="text-white font-bold text-lg leading-none">{stats.unresolvedReports}</p>
                        <p className="text-neutral-400 text-xs">denúncias</p>
                      </div>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Grid de números principais */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard icon={Users} label="Utilizadores" value={stats.totalUsers} color="cyan" />
              <StatCard icon={UserPlus} label="Novos (7 dias)" value={stats.newUsersWeek} color="violet" />
              <StatCard icon={Mic2} label="Artistas" value={stats.totalArtists} color="fuchsia" />
              <StatCard icon={Disc3} label="Produtores" value={stats.totalProducers} color="cyan" />
              <StatCard icon={Music} label="Faixas publicadas" value={stats.totalTracks} color="violet" />
              <StatCard icon={Play} label="Plays hoje" value={stats.playsToday} color="fuchsia" />
            </div>

            <div className="admin-glass p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center shrink-0">
                <TrendingUp size={18} className="text-cyan-300" />
              </div>
              <div>
                <p className="text-white font-bold">{stats.playsWeek} plays</p>
                <p className="text-neutral-500 text-xs">nos últimos 7 dias, em toda a plataforma</p>
              </div>
            </div>

            {/* Crescimento — registos nos últimos 14 dias */}
            {trend.some((t) => t.count > 0) && (
              <div className="admin-glass p-4">
                <p className="text-xs text-neutral-500 mb-3 uppercase tracking-wider flex items-center gap-1.5">
                  <UserPlus size={12} /> Registos — últimos 14 dias
                </p>
                <div className="flex items-end gap-1 h-16">
                  {trend.map((t) => {
                    const max = Math.max(1, ...trend.map((x) => x.count));
                    const pct = Math.max(6, (t.count / max) * 100);
                    return (
                      <div
                        key={t.date}
                        className="flex-1 rounded-t bg-gradient-to-t from-cyan-500/40 to-violet-500/60"
                        style={{ height: `${pct}%` }}
                        title={`${t.date}: ${t.count}`}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Províncias e géneros lado a lado */}
            <div className="grid grid-cols-1 gap-3">
              {provinces.length > 0 && (
                <div className="admin-glass p-4">
                  <p className="text-xs text-neutral-500 mb-3 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin size={12} /> Províncias mais ativas
                  </p>
                  <div className="space-y-2">
                    {provinces.map((p) => {
                      const max = provinces[0].count;
                      const pct = Math.round((p.count / max) * 100);
                      return (
                        <div key={p.provincia}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-neutral-300">{p.provincia}</span>
                            <span className="text-neutral-500">{p.count}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-cyan-500 to-violet-500" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {genres.length > 0 && (
                <div className="admin-glass p-4">
                  <p className="text-xs text-neutral-500 mb-3 uppercase tracking-wider flex items-center gap-1.5">
                    <Tags size={12} /> Géneros mais publicados
                  </p>
                  <div className="space-y-2">
                    {genres.map((g) => {
                      const max = genres[0].count;
                      const pct = Math.round((g.count / max) * 100);
                      return (
                        <div key={g.genero}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-neutral-300">{g.genero}</span>
                            <span className="text-neutral-500">{g.count}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-fuchsia-500 to-violet-500" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="text-neutral-500 text-sm">Não foi possível carregar as estatísticas.</p>
        )}
      </div>
    </AdminShell>
  );
}

function StatCard({
  icon: Icon, label, value, color,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  color: 'cyan' | 'fuchsia' | 'violet';
}) {
  const colorMap = {
    cyan: 'text-cyan-300',
    fuchsia: 'text-fuchsia-300',
    violet: 'text-violet-300',
  };
  return (
    <div className="admin-glass p-4">
      <Icon size={16} className={`${colorMap[color]} mb-2`} />
      <p className="text-white font-black text-2xl leading-none mb-1">{value.toLocaleString('pt-PT')}</p>
      <p className="text-neutral-500 text-xs">{label}</p>
    </div>
  );
}
