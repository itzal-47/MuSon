import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Music, FileText, Shield, Mail } from 'lucide-react';
import { usePlatformSettings } from '@/context/PlatformSettingsContext';
import { useAuth } from '@/context/AuthContext';
import RichTextViewer from '@/components/RichTextViewer';
import { fetchMyTickets, submitTicket, type SupportTicket } from '@/lib/supportTickets';

type View = 'menu' | 'termos' | 'privacidade' | 'contacto';

export default function AboutScreen() {
  const navigate = useNavigate();
  const { settings } = usePlatformSettings();
  const [view, setView] = useState<View>('menu');

  if (view === 'termos') {
    return (
      <div className="min-h-screen bg-black pb-32">
        <header className="px-6 pt-14 pb-6 flex items-center gap-4">
          <button onClick={() => setView('menu')} className="text-neutral-400 hover:text-white transition-colors">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-xl font-bold text-white">Termos de Uso</h1>
        </header>
        <div className="px-6 max-w-sm mx-auto">
          <div className="space-y-4 text-neutral-400 text-sm leading-relaxed">
            <p className="text-neutral-500 text-xs bg-neutral-900 border border-neutral-800 rounded-xl p-3">
              Este documento descreve as regras de utilização do MuSon. Não substitui aconselhamento jurídico — antes de um lançamento público ou de introduzir pagamentos reais, recomenda-se a revisão por um advogado.
            </p>
            {settings?.termos_uso ? (
              <RichTextViewer text={settings.termos_uso} />
            ) : (
              <p className="text-neutral-600 text-sm">A carregar...</p>
            )}
            <p className="text-neutral-600 text-xs pt-4">
              Última atualização: {settings?.atualizado_em ? new Date(settings.atualizado_em).toLocaleDateString('pt-PT') : 'Agosto 2026'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'privacidade') {
    return (
      <div className="min-h-screen bg-black pb-32">
        <header className="px-6 pt-14 pb-6 flex items-center gap-4">
          <button onClick={() => setView('menu')} className="text-neutral-400 hover:text-white transition-colors">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-xl font-bold text-white">Política de Privacidade</h1>
        </header>
        <div className="px-6 max-w-sm mx-auto">
          <div className="space-y-4 text-neutral-400 text-sm leading-relaxed">
            <p className="text-neutral-500 text-xs bg-neutral-900 border border-neutral-800 rounded-xl p-3">
              Este documento explica que dados o MuSon recolhe e como são usados. Não substitui aconselhamento jurídico — recomenda-se revisão por um advogado antes de um lançamento público.
            </p>
            {settings?.politica_privacidade ? (
              <RichTextViewer text={settings.politica_privacidade} />
            ) : (
              <p className="text-neutral-600 text-sm">A carregar...</p>
            )}
            <p className="text-neutral-600 text-xs pt-4">
              Última atualização: {settings?.atualizado_em ? new Date(settings.atualizado_em).toLocaleDateString('pt-PT') : 'Agosto 2026'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'contacto') {
    return <ContactSupportView onBack={() => setView('menu')} />;
  }

  return (
    <div className="min-h-screen bg-black pb-32">
      <header className="px-6 pt-14 pb-6 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="text-neutral-400 hover:text-white transition-colors">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold text-white">Sobre e Ajuda</h1>
      </header>

      <div className="px-6 max-w-sm mx-auto">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-amber-600/10 border border-amber-600/30 flex items-center justify-center mb-3">
            <Music size={30} className="text-amber-500" />
          </div>
          <h2 className="text-xl font-bold text-white">MuSon</h2>
          <p className="text-neutral-500 text-sm">Versão 1.0.0</p>
        </div>

        <div className="space-y-2">
          <button
            onClick={() => setView('termos')}
            className="w-full flex items-center gap-4 p-4 rounded-xl bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 transition-colors"
          >
            <FileText size={18} className="text-amber-500" />
            <span className="flex-1 text-left text-white">Termos de uso</span>
            <ChevronRight size={18} className="text-neutral-600" />
          </button>

          <button
            onClick={() => setView('privacidade')}
            className="w-full flex items-center gap-4 p-4 rounded-xl bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 transition-colors"
          >
            <Shield size={18} className="text-amber-500" />
            <span className="flex-1 text-left text-white">Política de privacidade</span>
            <ChevronRight size={18} className="text-neutral-600" />
          </button>

          <button
            onClick={() => setView('contacto')}
            className="w-full flex items-center gap-4 p-4 rounded-xl bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 transition-colors"
          >
            <Mail size={18} className="text-amber-500" />
            <span className="flex-1 text-left text-white">Contacto e suporte</span>
            <ChevronRight size={18} className="text-neutral-600" />
          </button>
        </div>

        <p className="text-neutral-600 text-xs text-center mt-8">
          MuSon — Música Angolana e Lusófona<br />© 2026 MuSon. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}

function ContactSupportView({ onBack }: { onBack: () => void }) {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [assunto, setAssunto] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    const t = await fetchMyTickets(user.id);
    setTickets(t);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async () => {
    if (!user || !assunto.trim() || !mensagem.trim()) return;
    setSubmitting(true);
    setError(null);
    const result = await submitTicket(user.id, assunto.trim(), mensagem.trim());
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error || 'Não foi possível enviar. Tenta novamente.');
      return;
    }
    setSuccess(true);
    setAssunto('');
    setMensagem('');
    await load();
    setTimeout(() => setSuccess(false), 2500);
  };

  return (
    <div className="min-h-screen bg-black pb-32">
      <header className="px-6 pt-14 pb-6 flex items-center gap-4">
        <button onClick={onBack} className="text-neutral-400 hover:text-white transition-colors">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold text-white">Contacto e Suporte</h1>
      </header>

      <div className="px-6 max-w-sm mx-auto">
        {!user ? (
          <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-6 text-center">
            <p className="text-neutral-400 text-sm">Inicia sessão para enviares uma mensagem de suporte.</p>
          </div>
        ) : (
          <>
            <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-4 mb-6">
              <p className="text-white font-semibold mb-3 text-sm">Enviar nova mensagem</p>
              <input
                value={assunto}
                onChange={(e) => setAssunto(e.target.value)}
                placeholder="Assunto"
                className="w-full px-4 py-3 rounded-xl bg-black border border-neutral-800 text-white placeholder-neutral-600 text-sm mb-2 focus:border-amber-600 focus:outline-none"
              />
              <textarea
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                rows={4}
                placeholder="Descreve a tua questão..."
                className="w-full px-4 py-3 rounded-xl bg-black border border-neutral-800 text-white placeholder-neutral-600 text-sm mb-3 resize-none focus:border-amber-600 focus:outline-none"
              />
              {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
              {success && <p className="text-emerald-400 text-xs mb-3">Mensagem enviada! Vamos responder em breve.</p>}
              <button
                onClick={handleSubmit}
                disabled={submitting || !assunto.trim() || !mensagem.trim()}
                className="w-full py-3 rounded-xl accent-gradient text-black font-bold text-sm disabled:opacity-40"
              >
                {submitting ? 'A enviar...' : 'Enviar'}
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-6">
                <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : tickets.length > 0 && (
              <div>
                <p className="text-neutral-500 text-xs uppercase tracking-wider mb-3">As tuas mensagens</p>
                <div className="space-y-2">
                  {tickets.map((t) => (
                    <div key={t.id} className="rounded-xl bg-neutral-900 border border-neutral-800 p-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-white text-sm font-medium">{t.assunto}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${t.status === 'aberto' ? 'bg-amber-500/15 text-amber-400' : 'bg-emerald-500/15 text-emerald-400'}`}>{t.status}</span>
                      </div>
                      <p className="text-neutral-400 text-xs mb-2">{t.mensagem}</p>
                      {t.resposta_admin && (
                        <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 p-2 mt-2">
                          <p className="text-amber-300 text-xs">{t.resposta_admin}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
