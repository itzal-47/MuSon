import { useState, useEffect, useCallback } from 'react';
import { Wallet, Check, X, Clock, AlertCircle, Music } from 'lucide-react';
import AdminShell from '@/components/AdminShell';
import {
  fetchPendingOrders, confirmPaymentOrder, cancelPaymentOrder,
  type PaymentOrder,
} from '@/lib/subscriptions';
import { formatKz } from '@/lib/format';

export default function AdminPaymentsScreen() {
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const o = await fetchPendingOrders();
    setOrders(o);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleConfirm = async (id: string) => {
    setError(null);
    setBusyId(id);
    const result = await confirmPaymentOrder(id);
    setBusyId(null);
    if (!result.ok) { setError(result.error || 'Erro ao confirmar pagamento.'); return; }
    setOrders((prev) => prev.filter((o) => o.id !== id));
  };

  const handleCancel = async (id: string) => {
    setBusyId(id);
    const result = await cancelPaymentOrder(id);
    setBusyId(null);
    if (result.ok) setOrders((prev) => prev.filter((o) => o.id !== id));
  };

  return (
    <AdminShell active="pagamentos">
      <div className="animate-fade-in">
        <p className="text-neutral-400 text-sm mb-6">
          Pedidos de Premium a aguardar confirmação de pagamento (transferência/Multicaixa Express manual).
        </p>

        {error && (
          <div className="mb-4 flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl p-3">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-full admin-glass flex items-center justify-center mb-3">
              <Wallet size={22} className="text-neutral-600" />
            </div>
            <p className="text-neutral-500 text-sm">Sem pedidos pendentes.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => (
              <div key={o.id} className="admin-glass p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center shrink-0">
                    <Music size={16} className="text-neutral-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm truncate">{o.user_display_name || o.user_username}</p>
                    <p className="text-neutral-500 text-xs">{o.plano_nome} — {formatKz(o.valor_kz)}</p>
                  </div>
                  <Clock size={16} className="text-cyan-400 shrink-0" />
                </div>
                {o.referencia_utilizador && (
                  <p className="text-neutral-400 text-xs mb-3">Referência: <span className="text-neutral-200">{o.referencia_utilizador}</span></p>
                )}
                <p className="text-neutral-600 text-[11px] mb-3">Pedido em {new Date(o.criado_em).toLocaleString('pt-PT')}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCancel(o.id)}
                    disabled={busyId === o.id}
                    className="flex-1 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 text-sm font-semibold flex items-center justify-center gap-1 disabled:opacity-50"
                  >
                    <X size={14} /> Cancelar
                  </button>
                  <button
                    onClick={() => handleConfirm(o.id)}
                    disabled={busyId === o.id}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-500 text-black text-sm font-bold flex items-center justify-center gap-1 disabled:opacity-50"
                  >
                    <Check size={14} /> {busyId === o.id ? 'A confirmar...' : 'Confirmar pagamento'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
