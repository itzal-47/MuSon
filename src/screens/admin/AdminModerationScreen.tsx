import { useState, useEffect, useCallback } from 'react';
import {
  BadgeCheck, Flag, Check, X, ExternalLink, Music, Clock, AlertCircle, Trash2,
  Sparkles, LifeBuoy, ScrollText, Plus, Power, GripVertical,
} from 'lucide-react';
import AdminShell from '@/components/AdminShell';
import { useAuth } from '@/context/AuthContext';
import {
  fetchVerificationRequests, approveVerificationRequest, rejectVerificationRequest,
  fetchReports, resolveReport, adminDeleteTrack, adminDeleteComment,
  type VerificationRequest, type ReportItem,
} from '@/lib/admin';
import {
  fetchAllFeatured, addFeatured, toggleFeatured, removeFeatured,
  type FeaturedItem,
} from '@/lib/featuredContent';
import { fetchOpenTickets, replyToTicket, type SupportTicket } from '@/lib/supportTickets';
import { fetchAdminLogs, formatAcao, type AdminLogEntry } from '@/lib/adminLogs';
import { searchTracks } from '@/lib/tracks';
import { searchUsers } from '@/lib/adminUsers';
import type { TrackWithArtist } from '@/types/database';

type Tab = 'verificacao' | 'denuncias' | 'destaques' | 'suporte' | 'auditoria';

const REPORT_TIPO_LABEL: Record<string, string> = {
  faixa: 'Faixa',
  comentario: 'Comentário',
  perfil: 'Perfil',
};

const TABS: { id: Tab; label: string; icon: typeof BadgeCheck }[] = [
  { id: 'verificacao', label: 'Verificação', icon: BadgeCheck },
  { id: 'denuncias', label: 'Denúncias', icon: Flag },
  { id: 'destaques', label: 'Destaques', icon: Sparkles },
  { id: 'suporte', label: 'Suporte', icon: LifeBuoy },
  { id: 'auditoria', label: 'Auditoria', icon: ScrollText },
];

export default function AdminModerationScreen() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('verificacao');

  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [featured, setFeatured] = useState<FeaturedItem[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [logs, setLogs] = useState<AdminLogEntry[]>([]);

  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectMotivo, setRejectMotivo] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [deletingReportId, setDeletingReportId] = useState<string | null>(null);

  // Destaques
  const [featuredSearch, setFeaturedSearch] = useState('');
  const [featuredType, setFeaturedType] = useState<'faixa' | 'artista'>('faixa');
  const [trackResults, setTrackResults] = useState<TrackWithArtist[]>([]);
  const [artistResults, setArtistResults] = useState<{ id: string; display_name: string | null; username: string | null }[]>([]);

  // Suporte
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    const [r, rep, feat, tix, lg] = await Promise.all([
      fetchVerificationRequests('pendente'),
      fetchReports(true),
      fetchAllFeatured(),
      fetchOpenTickets(),
      fetchAdminLogs(),
    ]);
    setRequests(r);
    setReports(rep);
    setFeatured(feat);
    setTickets(tix);
    setLogs(lg);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleApprove = async (id: string) => {
    setActionError(null);
    const result = await approveVerificationRequest(id);
    if (!result.ok) { setActionError(result.error || 'Erro ao aprovar.'); return; }
    setRequests((prev) => prev.filter((r) => r.id !== id));
  };

  const handleReject = async (id: string) => {
    setActionError(null);
    const result = await rejectVerificationRequest(id, rejectMotivo.trim() || 'Não foi possível verificar as provas submetidas.');
    if (!result.ok) { setActionError(result.error || 'Erro ao rejeitar.'); return; }
    setRequests((prev) => prev.filter((r) => r.id !== id));
    setRejectingId(null);
    setRejectMotivo('');
  };

  const handleResolveReport = async (id: string) => {
    const ok = await resolveReport(id);
    if (ok) setReports((prev) => prev.filter((r) => r.id !== id));
  };

  const handleDeleteReportedContent = async (report: ReportItem) => {
    setActionError(null);
    setDeletingReportId(report.id);
    const action = report.tipo === 'faixa'
      ? adminDeleteTrack(report.item_id)
      : report.tipo === 'comentario'
        ? adminDeleteComment(report.item_id)
        : null;
    if (!action) {
      setActionError('Remoção direta não está disponível para este tipo de denúncia.');
      setDeletingReportId(null);
      return;
    }
    const result = await action;
    setDeletingReportId(null);
    if (!result.ok) { setActionError(result.error || 'Erro ao remover o conteúdo.'); return; }
    await resolveReport(report.id);
    setReports((prev) => prev.filter((r) => r.id !== report.id));
  };

  const handleFeaturedSearch = async () => {
    if (!featuredSearch.trim()) return;
    if (featuredType === 'faixa') {
      const r = await searchTracks(featuredSearch.trim());
      setTrackResults(r);
      setArtistResults([]);
    } else {
      const r = await searchUsers(featuredSearch.trim());
      setArtistResults(r.filter((u) => u.tipo_perfil === 'artista' || u.tipo_perfil === 'produtor'));
      setTrackResults([]);
    }
  };

  const handleAddFeatured = async (itemId: string, label: string) => {
    if (!user) return;
    setActionError(null);
    const result = await addFeatured(featuredType, itemId, user.id, { titulo_custom: label });
    if (!result.ok) { setActionError(result.error || 'Erro ao adicionar destaque.'); return; }
    setFeaturedSearch('');
    setTrackResults([]);
    setArtistResults([]);
    loadData();
  };

  const handleToggleFeatured = async (item: FeaturedItem) => {
    const ok = await toggleFeatured(item.id, !item.ativo);
    if (ok) setFeatured((prev) => prev.map((f) => (f.id === item.id ? { ...f, ativo: !f.ativo } : f)));
  };

  const handleRemoveFeatured = async (id: string) => {
    const ok = await removeFeatured(id);
    if (ok) setFeatured((prev) => prev.filter((f) => f.id !== id));
  };

  const handleReplyTicket = async (ticketId: string, fechar: boolean) => {
    if (!user || !replyText.trim()) return;
    const result = await replyToTicket(ticketId, replyText.trim(), user.id, fechar);
    if (result.ok) {
      setTickets((prev) => (fechar ? prev.filter((t) => t.id !== ticketId) : prev.map((t) => (t.id === ticketId ? { ...t, status: 'respondido', resposta_admin: replyText.trim() } : t))));
      setReplyingId(null);
      setReplyText('');
    }
  };

  return (
    <AdminShell active="moderacao">
      <div className="animate-fade-in">
        <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar pb-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            const count = t.id === 'verificacao' ? requests.length : t.id === 'denuncias' ? reports.length : t.id === 'suporte' ? tickets.length : 0;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  tab === t.id ? 'bg-gradient-to-br from-cyan-500 to-violet-500 text-black font-bold' : 'bg-neutral-900 border border-white/10 text-neutral-400'
                }`}
              >
                <Icon size={13} /> {t.label} {count > 0 && `(${count})`}
              </button>
            );
          })}
        </div>

        {actionError && (
          <div className="mb-4 flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl p-3">
            <AlertCircle size={16} className="shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tab === 'verificacao' ? (
          requests.length === 0 ? <EmptyState text="Sem pedidos de verificação pendentes." /> : (
            <div className="space-y-3">
              {requests.map((req) => (
                <div key={req.id} className="admin-glass p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-neutral-800 overflow-hidden shrink-0 flex items-center justify-center">
                      {req.profile_avatar_url ? <img src={req.profile_avatar_url} alt="" className="w-full h-full object-cover" /> : <Music size={16} className="text-neutral-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm truncate">{req.profile_display_name || req.profile_username}</p>
                      <p className="text-neutral-500 text-xs capitalize">{req.profile_tipo} • {new Date(req.criado_em).toLocaleDateString('pt-PT')}</p>
                    </div>
                    <Clock size={16} className="text-cyan-400 shrink-0" />
                  </div>
                  <p className="text-neutral-300 text-sm mb-3">{req.mensagem}</p>
                  {req.links.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {req.links.map((link, i) => (
                        <a key={i} href={link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-cyan-300 bg-cyan-500/10 px-2 py-1 rounded-lg">
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
                        className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white placeholder-neutral-600 text-xs focus:border-cyan-500/50 focus:outline-none"
                      />
                      <div className="flex gap-2">
                        <button onClick={() => { setRejectingId(null); setRejectMotivo(''); }} className="flex-1 py-2 rounded-lg bg-neutral-800 text-neutral-300 text-xs font-medium">Cancelar</button>
                        <button onClick={() => handleReject(req.id)} className="flex-1 py-2 rounded-lg bg-red-500/20 text-red-400 text-xs font-bold">Confirmar rejeição</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => setRejectingId(req.id)} className="flex-1 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 text-sm font-semibold flex items-center justify-center gap-1">
                        <X size={14} /> Rejeitar
                      </button>
                      <button onClick={() => handleApprove(req.id)} className="flex-1 py-2.5 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-500 text-black text-sm font-bold flex items-center justify-center gap-1">
                        <Check size={14} /> Aprovar
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        ) : tab === 'denuncias' ? (
          reports.length === 0 ? <EmptyState text="Sem denúncias por resolver." /> : (
            <div className="space-y-3">
              {reports.map((report) => (
                <div key={report.id} className="admin-glass p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400">{REPORT_TIPO_LABEL[report.tipo] || report.tipo}</span>
                    <span className="text-neutral-500 text-xs">{new Date(report.criado_em).toLocaleDateString('pt-PT')}</span>
                  </div>
                  <p className="text-neutral-300 text-sm mb-1">{report.motivo}</p>
                  <p className="text-neutral-600 text-xs mb-3">Denunciado por @{report.reporter_username || 'utilizador'} • item: {report.item_id.slice(0, 8)}...</p>
                  <div className="flex gap-2">
                    {(report.tipo === 'faixa' || report.tipo === 'comentario') && (
                      <button onClick={() => handleDeleteReportedContent(report)} disabled={deletingReportId === report.id} className="flex-1 py-2.5 rounded-xl bg-red-500/10 text-red-400 text-sm font-semibold flex items-center justify-center gap-1 disabled:opacity-50">
                        <Trash2 size={14} /> {deletingReportId === report.id ? 'A remover...' : 'Remover conteúdo'}
                      </button>
                    )}
                    <button onClick={() => handleResolveReport(report.id)} className="flex-1 py-2.5 rounded-xl bg-neutral-800 text-white text-sm font-semibold flex items-center justify-center gap-1">
                      <Check size={14} /> Marcar resolvida
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : tab === 'destaques' ? (
          <div className="space-y-4">
            <div className="admin-glass p-4">
              <div className="flex gap-2 mb-3">
                {(['faixa', 'artista'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => { setFeaturedType(t); setTrackResults([]); setArtistResults([]); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize ${featuredType === t ? 'bg-gradient-to-br from-cyan-500 to-violet-500 text-black font-bold' : 'bg-neutral-900 border border-white/10 text-neutral-400'}`}
                  >
                    {t === 'faixa' ? 'Faixas' : 'Artistas/Produtores'}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={featuredSearch}
                  onChange={(e) => setFeaturedSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleFeaturedSearch()}
                  placeholder={featuredType === 'faixa' ? 'Pesquisar faixa por título...' : 'Pesquisar artista/produtor...'}
                  className="flex-1 px-4 py-3 rounded-xl bg-neutral-900 border border-white/10 text-white placeholder-neutral-600 text-sm focus:border-cyan-500/50 focus:outline-none"
                />
                <button onClick={handleFeaturedSearch} className="px-4 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-500 text-black font-bold text-sm">Buscar</button>
              </div>

              {trackResults.length > 0 && (
                <div className="mt-3 space-y-2">
                  {trackResults.map((t) => (
                    <button key={t.id} onClick={() => handleAddFeatured(t.id, t.titulo)} className="w-full flex items-center gap-3 p-2.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 transition-colors">
                      <Music size={14} className="text-neutral-500 shrink-0" />
                      <span className="flex-1 text-left text-sm text-white truncate">{t.titulo} <span className="text-neutral-500">— {t.artist_name}</span></span>
                      <Plus size={14} className="text-cyan-400 shrink-0" />
                    </button>
                  ))}
                </div>
              )}
              {artistResults.length > 0 && (
                <div className="mt-3 space-y-2">
                  {artistResults.map((a) => (
                    <button key={a.id} onClick={() => handleAddFeatured(a.id, a.display_name || a.username || '')} className="w-full flex items-center gap-3 p-2.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 transition-colors">
                      <Music size={14} className="text-neutral-500 shrink-0" />
                      <span className="flex-1 text-left text-sm text-white truncate">{a.display_name || a.username}</span>
                      <Plus size={14} className="text-cyan-400 shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {featured.length === 0 ? <EmptyState text="Nenhum destaque configurado ainda." /> : (
              <div className="space-y-2">
                {featured.map((f) => (
                  <div key={f.id} className="admin-glass p-3 flex items-center gap-3">
                    <GripVertical size={14} className="text-neutral-700 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{f.titulo_custom || f.item_id}</p>
                      <p className="text-neutral-500 text-xs capitalize">{f.tipo}</p>
                    </div>
                    <button onClick={() => handleToggleFeatured(f)} className={`p-2 rounded-lg ${f.ativo ? 'text-cyan-400 bg-cyan-500/10' : 'text-neutral-600 bg-neutral-900'}`}>
                      <Power size={14} />
                    </button>
                    <button onClick={() => handleRemoveFeatured(f.id)} className="p-2 rounded-lg text-neutral-600 hover:text-red-400">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : tab === 'suporte' ? (
          tickets.length === 0 ? <EmptyState text="Sem tickets de suporte em aberto." /> : (
            <div className="space-y-3">
              {tickets.map((t) => (
                <div key={t.id} className="admin-glass p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-white font-medium text-sm">{t.assunto}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${t.status === 'aberto' ? 'bg-amber-500/15 text-amber-400' : 'bg-cyan-500/15 text-cyan-300'}`}>{t.status}</span>
                  </div>
                  <p className="text-neutral-500 text-xs mb-2">De @{t.user_username || t.user_display_name || 'utilizador'} • {new Date(t.criado_em).toLocaleDateString('pt-PT')}</p>
                  <p className="text-neutral-300 text-sm mb-3">{t.mensagem}</p>
                  {t.resposta_admin && (
                    <div className="rounded-lg bg-cyan-500/5 border border-cyan-500/20 p-2.5 mb-3">
                      <p className="text-cyan-300 text-xs">{t.resposta_admin}</p>
                    </div>
                  )}
                  {replyingId === t.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        rows={2}
                        placeholder="A tua resposta..."
                        className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white placeholder-neutral-600 text-xs resize-none focus:border-cyan-500/50 focus:outline-none"
                      />
                      <div className="flex gap-2">
                        <button onClick={() => handleReplyTicket(t.id, false)} className="flex-1 py-2 rounded-lg bg-neutral-800 text-neutral-300 text-xs font-medium">Responder</button>
                        <button onClick={() => handleReplyTicket(t.id, true)} className="flex-1 py-2 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-500 text-black text-xs font-bold">Responder e fechar</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => { setReplyingId(t.id); setReplyText(''); }} className="w-full py-2.5 rounded-xl bg-neutral-800 text-white text-sm font-semibold">
                      Responder
                    </button>
                  )}
                </div>
              ))}
            </div>
          )
        ) : (
          logs.length === 0 ? <EmptyState text="Ainda não há ações registadas." /> : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="admin-glass p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-white text-sm font-medium">{formatAcao(log.acao)}</p>
                    <span className="text-neutral-600 text-[10px]">{new Date(log.criado_em).toLocaleString('pt-PT')}</span>
                  </div>
                  <p className="text-neutral-500 text-xs">
                    por @{log.admin_username || 'admin'}{log.alvo_tipo && ` • ${log.alvo_tipo}: ${log.alvo_id?.slice(0, 8)}...`}
                  </p>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </AdminShell>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-full admin-glass flex items-center justify-center mb-3">
        <Check size={22} className="text-neutral-600" />
      </div>
      <p className="text-neutral-500 text-sm">{text}</p>
    </div>
  );
}
