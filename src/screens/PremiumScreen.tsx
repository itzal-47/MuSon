import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Crown, Check, Clock, AlertCircle, Download, Zap, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { usePlatformSettings } from '@/context/PlatformSettingsContext';
import { isPremiumActive } from '@/lib/premium';
import {
  fetchActivePlans, createPaymentOrder, fetchMyPendingOrder,
  type SubscriptionPlan, type PaymentOrder,
} from '@/lib/subscriptions';

function formatKz(value: number): string {
  return new Intl.NumberFormat('pt-AO', { maximumFractionDigits: 0 }).format(value) + ' Kz';
}

export default function PremiumScreen() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const { settings } = usePlatformSettings();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [pendingOrder, setPendingOrder] = useState<PaymentOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [referencia, setReferencia] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userIsPremium = isPremiumActive(profile?.premium_until);

  const load = useCallback(async () => {
    setLoading(true);
    const p = await fetchActivePlans();
    setPlans(p);
    if (user) {
      const pending = await fetchMyPendingOrder(user.id);
      setPendingOrder(pending);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { refreshProfile(); }, [refreshProfile]);

  const handleSubscribe = async () => {
    if (!user || !selectedPlan) return;
    setSubmitting(true);
    setError(null);
    const result = await createPaymentOrder(user.id, selectedPlan, referencia.trim());
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error || 'Não foi possível criar o pedido.');
      return;
    }
    setSelectedPlan(null);
    setReferencia('');
    await load();
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 text-center">
        <Crown size={32} className="text-amber-500 mb-3" />
        <p className="text-white font-medium mb-1">Inicia sessão para veres o Premium</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-32">
      <header className="px-6 pt-14 pb-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="text-neutral-400 hover:text-white transition-colors">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Crown size={22} className="text-amber-500" /> MuSon Premium
          </h1>
        </div>
      </header>

      <div className="px-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : userIsPremium ? (
          <div className="rounded-2xl bg-amber-600/10 border border-amber-600/30 p-6 text-center">
            <Crown size={32} className="text-amber-500 mx-auto mb-2" />
            <p className="text-white font-semibold mb-1">Já és Premium</p>
            <p className="text-neutral-400 text-sm">Válido até {new Date(profile!.premium_until!).toLocaleDateString('pt-PT')}</p>
          </div>
        ) : !settings?.premium_ativado ? (
          <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-6 text-center">
            <p className="text-neutral-400 text-sm">O Premium ainda não está disponível para subscrição. Volta em breve.</p>
          </div>
        ) : pendingOrder ? (
          <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Clock size={24} className="text-amber-500 shrink-0" />
              <div>
                <p className="text-white font-semibold">Pedido pendente</p>
                <p className="text-neutral-500 text-xs">Plano {pendingOrder.plano_nome} — {formatKz(pendingOrder.valor_kz)}</p>
              </div>
            </div>
            <div className="rounded-xl bg-black border border-neutral-800 p-4 mb-2">
              <p className="text-neutral-300 text-sm whitespace-pre-wrap">{settings.pagamento_instrucoes}</p>
            </div>
            <p className="text-neutral-600 text-xs">Assim que confirmarmos o pagamento, o Premium é ativado automaticamente.</p>
          </div>
        ) : (
          <>
            <div className="grid gap-3 mb-6">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan)}
                  className={`text-left p-4 rounded-2xl border transition-all ${
                    selectedPlan?.id === plan.id ? 'bg-amber-600/10 border-amber-600' : 'bg-neutral-900 border-neutral-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-white font-bold">{plan.nome}</p>
                    {selectedPlan?.id === plan.id && <Check size={18} className="text-amber-500" />}
                  </div>
                  <p className="text-amber-500 font-black text-xl mt-1">{formatKz(plan.preco_kz)}</p>
                </button>
              ))}
            </div>

            <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-4 mb-6">
              <p className="text-white font-semibold text-sm mb-3">O que ganhas</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-neutral-300 text-sm"><Download size={14} className="text-amber-500 shrink-0" /> Download offline das faixas que o artista permitir</div>
                <div className="flex items-center gap-2 text-neutral-300 text-sm"><Zap size={14} className="text-amber-500 shrink-0" /> Sem limites de utilização</div>
                <div className="flex items-center gap-2 text-neutral-300 text-sm"><Sparkles size={14} className="text-amber-500 shrink-0" /> Selo de apoiante no perfil</div>
              </div>
            </div>

            {selectedPlan && (
              <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-4">
                <p className="text-white font-semibold text-sm mb-3">Como pagar</p>
                <div className="rounded-xl bg-black border border-neutral-800 p-4 mb-4">
                  <p className="text-neutral-300 text-sm whitespace-pre-wrap">{settings?.pagamento_instrucoes}</p>
                </div>
                <input
                  value={referencia}
                  onChange={(e) => setReferencia(e.target.value)}
                  placeholder="Referência do pagamento (opcional)"
                  className="w-full px-4 py-3 rounded-xl bg-black border border-neutral-800 text-white placeholder-neutral-600 text-sm mb-3 focus:border-amber-600 focus:outline-none"
                />
                {error && (
                  <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-3">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                <button
                  onClick={handleSubscribe}
                  disabled={submitting}
                  className="w-full py-3.5 rounded-xl accent-gradient text-black font-bold text-sm disabled:opacity-50"
                >
                  {submitting ? 'A criar pedido...' : `Confirmar — ${formatKz(selectedPlan.preco_kz)}`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
