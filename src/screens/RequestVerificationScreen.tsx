import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, BadgeCheck, Plus, X, Clock, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { fetchMyVerificationRequest, submitVerificationRequest } from '@/lib/verification';
import type { VerificationRequest } from '@/lib/admin';

export default function RequestVerificationScreen() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [existing, setExisting] = useState<VerificationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [mensagem, setMensagem] = useState('');
  const [links, setLinks] = useState(['']);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const req = await fetchMyVerificationRequest(user.id);
    setExisting(req);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const handleLinkChange = (i: number, value: string) => {
    setLinks((prev) => prev.map((l, idx) => (idx === i ? value : l)));
  };

  const addLinkField = () => setLinks((prev) => [...prev, '']);
  const removeLinkField = (i: number) => setLinks((prev) => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async () => {
    if (!user || !mensagem.trim()) return;
    setSubmitting(true);
    setError(null);
    const result = await submitVerificationRequest(user.id, mensagem.trim(), links);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error || 'Não foi possível enviar o pedido.');
      return;
    }
    setSuccess(true);
    await load();
  };

  if (!user || (profile?.tipo_perfil !== 'artista' && profile?.tipo_perfil !== 'produtor')) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-6 text-center">
        <p className="text-neutral-400 text-sm">A verificação está disponível apenas para artistas e produtores.</p>
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
            <BadgeCheck size={22} className="text-amber-500" />
            Pedir selo verificado
          </h1>
        </div>
        <p className="text-neutral-500 text-sm">
          O selo verificado ajuda os ouvintes a confiar que és mesmo tu. Explica quem és e junta links de prova (redes sociais, outras plataformas onde já publicas).
        </p>
      </header>

      <div className="px-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : profile?.verificado ? (
          <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-6 text-center">
            <BadgeCheck size={32} className="text-amber-500 mx-auto mb-2" />
            <p className="text-white font-semibold mb-1">Já és verificado</p>
            <p className="text-neutral-400 text-sm">O teu perfil já tem o selo verificado.</p>
          </div>
        ) : existing?.status === 'pendente' ? (
          <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-6 text-center">
            <Clock size={28} className="text-amber-500 mx-auto mb-2" />
            <p className="text-white font-semibold mb-1">Pedido em análise</p>
            <p className="text-neutral-400 text-sm">Enviaste um pedido a {new Date(existing.criado_em).toLocaleDateString('pt-PT')}. Avisamos quando for revisto.</p>
          </div>
        ) : success ? (
          <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-6 text-center">
            <Check size={28} className="text-emerald-400 mx-auto mb-2" />
            <p className="text-white font-semibold mb-1">Pedido enviado</p>
            <p className="text-neutral-400 text-sm">Vamos analisar e avisamos assim que houver resposta.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {existing?.status === 'rejeitado' && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4">
                <p className="text-red-400 text-sm font-medium mb-1">O pedido anterior foi rejeitado</p>
                {existing.motivo_rejeicao && <p className="text-neutral-400 text-xs">{existing.motivo_rejeicao}</p>}
                <p className="text-neutral-500 text-xs mt-1">Podes tentar novamente com mais informação.</p>
              </div>
            )}

            <div>
              <label className="text-neutral-400 text-xs mb-2 block">Conta-nos quem és</label>
              <textarea
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                rows={4}
                placeholder="Ex: Sou cantor de kizomba baseado no Huambo, já publiquei em..."
                className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-600 focus:border-amber-600 focus:outline-none text-sm resize-none"
              />
            </div>

            <div>
              <label className="text-neutral-400 text-xs mb-2 block">Links de prova (redes sociais, outras plataformas)</label>
              <div className="space-y-2">
                {links.map((link, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      value={link}
                      onChange={(e) => handleLinkChange(i, e.target.value)}
                      placeholder="https://instagram.com/..."
                      className="flex-1 px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-600 focus:border-amber-600 focus:outline-none text-sm"
                    />
                    {links.length > 1 && (
                      <button onClick={() => removeLinkField(i)} className="text-neutral-500 hover:text-red-400 px-2">
                        <X size={18} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={addLinkField} className="flex items-center gap-1 text-amber-500 text-xs mt-2 font-medium">
                <Plus size={14} /> Adicionar outro link
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={!mensagem.trim() || submitting}
              className="w-full py-4 rounded-xl accent-gradient hover:opacity-90 disabled:opacity-40 text-black font-bold transition-all glow-accent-sm"
            >
              {submitting ? 'A enviar...' : 'Enviar pedido'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
