import { useState } from 'react';
import {
  Search, BadgeCheck, ShieldOff, Crown, X, Check, AlertCircle, Music, ShieldCheck,
} from 'lucide-react';
import AdminShell from '@/components/AdminShell';
import {
  searchUsers, grantPremium, revokePremium, suspendUser, unsuspendUser,
  isPremiumActive, type AdminUserResult,
} from '@/lib/adminUsers';

const PREMIUM_PRESETS = [
  { label: '7 dias', dias: 7 },
  { label: '1 mês', dias: 30 },
  { label: '3 meses', dias: 90 },
  { label: '1 ano', dias: 365 },
];

export default function AdminUsersScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AdminUserResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const [premiumTarget, setPremiumTarget] = useState<AdminUserResult | null>(null);
  const [premiumDias, setPremiumDias] = useState(30);
  const [premiumMotivo, setPremiumMotivo] = useState('');
  const [premiumBusy, setPremiumBusy] = useState(false);
  const [premiumError, setPremiumError] = useState<string | null>(null);

  const [suspendTarget, setSuspendTarget] = useState<AdminUserResult | null>(null);
  const [suspendMotivo, setSuspendMotivo] = useState('');
  const [suspendBusy, setSuspendBusy] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    setSearched(true);
    const r = await searchUsers(query.trim());
    setResults(r);
    setLoading(false);
  };

  const updateResult = (id: string, patch: Partial<AdminUserResult>) => {
    setResults((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)));
  };

  const handleGrantPremium = async () => {
    if (!premiumTarget) return;
    setPremiumBusy(true);
    setPremiumError(null);
    const result = await grantPremium(premiumTarget.id, premiumDias, premiumMotivo.trim());
    setPremiumBusy(false);
    if (!result.ok) {
      setPremiumError(result.error || 'Erro ao conceder Premium.');
      return;
    }
    const novoFim = new Date(Date.now() + premiumDias * 24 * 60 * 60 * 1000).toISOString();
    updateResult(premiumTarget.id, { premium_until: novoFim });
    setPremiumTarget(null);
    setPremiumMotivo('');
    setPremiumDias(30);
  };

  const handleRevokePremium = async (user: AdminUserResult) => {
    const result = await revokePremium(user.id);
    if (result.ok) updateResult(user.id, { premium_until: null });
  };

  const handleSuspend = async () => {
    if (!suspendTarget || !suspendMotivo.trim()) return;
    setSuspendBusy(true);
    const result = await suspendUser(suspendTarget.id, suspendMotivo.trim());
    setSuspendBusy(false);
    if (result.ok) {
      updateResult(suspendTarget.id, { suspenso: true, suspenso_motivo: suspendMotivo.trim() });
      setSuspendTarget(null);
      setSuspendMotivo('');
    }
  };

  const handleUnsuspend = async (user: AdminUserResult) => {
    const result = await unsuspendUser(user.id);
    if (result.ok) updateResult(user.id, { suspenso: false, suspenso_motivo: null });
  };

  return (
    <AdminShell active="utilizadores">
      <div className="animate-fade-in">
        <p className="text-neutral-400 text-sm mb-4">Pesquisa por username, nome ou email.</p>

        <div className="flex gap-2 mb-6">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="username, nome ou email..."
              className="w-full pl-9 pr-4 py-3 rounded-xl bg-neutral-900 border border-white/10 text-white placeholder-neutral-600 focus:border-cyan-500/50 focus:outline-none text-sm"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-5 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-500 text-black font-bold text-sm"
          >
            Buscar
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-7 h-7 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : searched && results.length === 0 ? (
          <p className="text-neutral-500 text-sm text-center py-8">Nenhum utilizador encontrado.</p>
        ) : (
          <div className="space-y-2">
            {results.map((u) => {
              const premiumActive = isPremiumActive(u.premium_until);
              return (
                <div key={u.id} className="admin-glass p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-neutral-800 overflow-hidden shrink-0 flex items-center justify-center">
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Music size={16} className="text-neutral-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-white font-medium text-sm truncate">{u.display_name || u.username}</p>
                        {u.verificado && <BadgeCheck size={13} className="text-amber-500 shrink-0" />}
                        {premiumActive && <Crown size={13} className="text-cyan-300 shrink-0" />}
                      </div>
                      <p className="text-neutral-500 text-xs truncate">{u.email} · {u.tipo_perfil}</p>
                    </div>
                    {u.suspenso && (
                      <span className="text-[10px] px-2 py-1 rounded-full bg-red-500/15 text-red-400 font-medium shrink-0">
                        Suspenso
                      </span>
                    )}
                  </div>

                  {premiumActive && (
                    <p className="text-cyan-300/80 text-xs mb-3">
                      Premium até {new Date(u.premium_until!).toLocaleDateString('pt-PT')}
                    </p>
                  )}

                  <div className="flex gap-2">
                    {premiumActive ? (
                      <button
                        onClick={() => handleRevokePremium(u)}
                        className="flex-1 py-2 rounded-lg bg-neutral-800 text-neutral-300 text-xs font-semibold flex items-center justify-center gap-1"
                      >
                        <X size={13} /> Remover Premium
                      </button>
                    ) : (
                      <button
                        onClick={() => setPremiumTarget(u)}
                        className="flex-1 py-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 text-cyan-200 text-xs font-semibold flex items-center justify-center gap-1"
                      >
                        <Crown size={13} /> Dar Premium
                      </button>
                    )}

                    {u.suspenso ? (
                      <button
                        onClick={() => handleUnsuspend(u)}
                        className="flex-1 py-2 rounded-lg bg-emerald-500/15 text-emerald-400 text-xs font-semibold flex items-center justify-center gap-1"
                      >
                        <ShieldCheck size={13} /> Reativar
                      </button>
                    ) : (
                      <button
                        onClick={() => setSuspendTarget(u)}
                        className="flex-1 py-2 rounded-lg bg-red-500/10 text-red-400 text-xs font-semibold flex items-center justify-center gap-1"
                      >
                        <ShieldOff size={13} /> Suspender
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: conceder Premium */}
      {premiumTarget && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="admin-glass w-full sm:max-w-sm p-5 rounded-t-3xl sm:rounded-3xl bg-neutral-950">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Crown size={18} className="text-cyan-300" /> Dar Premium
              </h2>
              <button onClick={() => setPremiumTarget(null)} className="text-neutral-500 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <p className="text-neutral-400 text-sm mb-4">
              Para <strong className="text-white">{premiumTarget.display_name || premiumTarget.username}</strong>
            </p>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {PREMIUM_PRESETS.map((p) => (
                <button
                  key={p.dias}
                  onClick={() => setPremiumDias(p.dias)}
                  className={`py-2.5 rounded-xl text-sm font-medium transition-all ${
                    premiumDias === p.dias
                      ? 'bg-gradient-to-br from-cyan-500 to-violet-500 text-black font-bold'
                      : 'bg-neutral-900 border border-white/10 text-neutral-300'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <input
              type="number"
              min={1}
              value={premiumDias}
              onChange={(e) => setPremiumDias(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-white/10 text-white text-sm mb-3 focus:border-cyan-500/50 focus:outline-none"
              placeholder="Número de dias personalizado"
            />

            <input
              value={premiumMotivo}
              onChange={(e) => setPremiumMotivo(e.target.value)}
              placeholder="Motivo (opcional, ex: prenda de aniversário)"
              className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-white/10 text-white placeholder-neutral-600 text-sm mb-4 focus:border-cyan-500/50 focus:outline-none"
            />

            {premiumError && (
              <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4">
                <AlertCircle size={14} className="shrink-0" />
                <span>{premiumError}</span>
              </div>
            )}

            <button
              onClick={handleGrantPremium}
              disabled={premiumBusy}
              className="w-full py-3.5 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-500 text-black font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {premiumBusy ? 'A conceder...' : <><Check size={16} /> Confirmar {premiumDias} dias</>}
            </button>
          </div>
        </div>
      )}

      {/* Modal: suspender */}
      {suspendTarget && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="admin-glass w-full sm:max-w-sm p-5 rounded-t-3xl sm:rounded-3xl bg-neutral-950">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldOff size={18} className="text-red-400" /> Suspender conta
              </h2>
              <button onClick={() => setSuspendTarget(null)} className="text-neutral-500 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <p className="text-neutral-400 text-sm mb-4">
              Vais suspender <strong className="text-white">{suspendTarget.display_name || suspendTarget.username}</strong>. A conta dela vai encerrar sessão e não conseguir voltar a entrar até seres tu a reativá-la.
            </p>
            <textarea
              value={suspendMotivo}
              onChange={(e) => setSuspendMotivo(e.target.value)}
              placeholder="Motivo da suspensão (obrigatório)"
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-white/10 text-white placeholder-neutral-600 text-sm mb-4 resize-none focus:border-red-500/50 focus:outline-none"
            />
            <button
              onClick={handleSuspend}
              disabled={!suspendMotivo.trim() || suspendBusy}
              className="w-full py-3.5 rounded-xl bg-red-500/90 text-white font-bold text-sm disabled:opacity-40"
            >
              {suspendBusy ? 'A suspender...' : 'Confirmar suspensão'}
            </button>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
