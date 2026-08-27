import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Shield, BadgeCheck, Flag, Check, X, ExternalLink,
  Music, Clock, AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  fetchIsAdmin, fetchVerificationRequests, approveVerificationRequest, rejectVerificationRequest,
  fetchReports, resolveReport, type VerificationRequest, type ReportItem,
} from '@/lib/admin';

type Tab = 'verificacao' | 'denuncias';

const REPORT_TIPO_LABEL: Record<string, string> = {
  faixa: 'Faixa',
  comentario: 'Comentário',
  perfil: 'Perfil',
};

export default function AdminScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [tab, setTab] = useState<Tab>('verificacao');

  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectMotivo, setRejectMotivo] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setCheckingAccess(false);
      return;
    }
    fetchIsAdmin(user.id).then((ok) => {
      setIsAdmin(ok);
      setCheckingAccess(false);
    });
  }, [user]);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [r, rep] = await Promise.all([
      fetchVerificationRequests('pendente'),
      fetchReports(true),
    ]);
    setRequests(r);
    setReports(rep);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isAdmin) loadData();
  }, [isAdmin, loadData]);

  const handleApprove = async (id: string) => {
    setActionError(null);
    const result = await approveVerificationRequest(id);
    if (!result.ok) {
      setActionError(result.error || 'Erro ao aprovar.');
      return;
    }
    setRequests((prev) => prev.filter((r) => r.id !== id));
  };

  const handleReject = async (id: string) => {
    setActionError(null);
    const result = await rejectVerificationRequest(id, rejectMotivo.trim() || 'Não foi possível verificar as provas submetidas.');
    if (!result.ok) {
      setActionError(result.error || 'Erro ao rejeitar.');
      return;
    }
    setRequests((prev) => prev.filter((r) => r.id !== id));
    setRejectingId(null);
    setRejectMotivo('');
  };

  const handleResolveReport = async (id: string) => {
    const ok = await resolveReport(id);
    if (ok) setReports((prev) => prev.filter((r) => r.id !== id));
  };

  if (checkingAccess) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 text-center">
        <Shield size={32} className="text-neutral-700 mb-3" />
        <p className="text-white font-medium mb-1">Acesso restrito</p>
        <p className="text-neutral-500 text-sm">Este painel é apenas para administradores.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-32">
      <header className="px-6 pt-14 pb-4">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="text-neutral-400 hover:text-white transition-colors">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield size={22} className="text-amber-500" />
            Administração
          </h1>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setTab('verificacao')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              tab === 'verificacao' ? 'accent-gradient text-black' : 'bg-neutral-900 border border-neutral-800 text-neutral-400'
            }`}
          >
            <BadgeCheck size={14} /> Verificação {requests.length > 0 && `(${requests.length})`}
          </button>
          <button
            onClick={() => setTab('denuncias')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              tab === 'denuncias' ? 'accent-gradient text-black' : 'bg-neutral-900 border border-neutral-800 text-neutral-400'
            }`}
          >
            <Flag size={14} /> Denúncias {reports.length > 0 && `(${reports.length})`}
          </button>
        </div>
      </header>

      {actionError && (
        <div className="mx-6 mb-4 flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl p-3">
          <AlertCircle size={16} className="shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      <div className="px-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tab === 'verificacao' ? (
          requests.length === 0 ? (
            <EmptyState text="Sem pedidos de verificação pendentes." />
          ) : (
            <div className="space-y-3">
              {requests.map((req) => (
                <div key={req.id} className="rounded-2xl bg-neutral-900 border border-neutral-800 p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-neutral-800 overflow-hidden shrink-0 flex items-center justify-center">
                      {req.profile_avatar_url ? (
                        <img src={req.profile_avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Music size={16} className="text-neutral-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm truncate">{req.profile_display_name || req.profile_username}</p>
                      <p className="text-neutral-500 text-xs capitalize">{req.profile_tipo} • {new Date(req.criado_em).toLocaleDateString('pt-PT')}</p>
                    </div>
                    <Clock size={16} className="text-amber-500 shrink-0" />
                  </div>

                  <p className="text-neutral-300 text-sm mb-3">{req.mensagem}</p>

                  {req.links.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {req.links.map((link, i) => (
                        <a
                          key={i}
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-amber-500 bg-amber-500/10 px-2 py-1 rounded-lg"
                        >
                          <ExternalLink size={11} /> Link {i + 1}
                        </a>
                      ))}
                    </div>
                  )}

                  {rejectingId === req.id ? (
                    <div className="space-y-2">
                      <input
                        value={rejectMotivo}
                        onChange={(e) => setRejectMotivo(e.target.value)}
                        placeholder="Motivo da rejeição (opcional)"
                        className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-600 text-xs focus:border-amber-600 focus:outline-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setRejectingId(null); setRejectMotivo(''); }}
                          className="flex-1 py-2 rounded-lg bg-neutral-800 text-neutral-300 text-xs font-medium"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => handleReject(req.id)}
                          className="flex-1 py-2 rounded-lg bg-red-500/20 text-red-400 text-xs font-bold"
                        >
                          Confirmar rejeição
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setRejectingId(req.id)}
                        className="flex-1 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 text-sm font-semibold flex items-center justify-center gap-1"
                      >
                        <X size={14} /> Rejeitar
                      </button>
                      <button
                        onClick={() => handleApprove(req.id)}
                        className="flex-1 py-2.5 rounded-xl accent-gradient text-black text-sm font-bold flex items-center justify-center gap-1"
                      >
                        <Check size={14} /> Aprovar
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        ) : reports.length === 0 ? (
          <EmptyState text="Sem denúncias por resolver." />
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <div key={report.id} className="rounded-2xl bg-neutral-900 border border-neutral-800 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400">
                    {REPORT_TIPO_LABEL[report.tipo] || report.tipo}
                  </span>
                  <span className="text-neutral-500 text-xs">{new Date(report.criado_em).toLocaleDateString('pt-PT')}</span>
                </div>
                <p className="text-neutral-300 text-sm mb-1">{report.motivo}</p>
                <p className="text-neutral-600 text-xs mb-3">
                  Denunciado por @{report.reporter_username || 'utilizador'} • item: {report.item_id.slice(0, 8)}...
                </p>
                <button
                  onClick={() => handleResolveReport(report.id)}
                  className="w-full py-2.5 rounded-xl bg-neutral-800 text-white text-sm font-semibold flex items-center justify-center gap-1"
                >
                  <Check size={14} /> Marcar como resolvida
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-3">
        <Check size={22} className="text-neutral-600" />
      </div>
      <p className="text-neutral-500 text-sm">{text}</p>
    </div>
  );
}
