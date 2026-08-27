import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useLoginModal } from '@/context/LoginModalContext';
import { Flag, X, AlertCircle, Check } from 'lucide-react';
import type { ReportTipo } from '@/types/database';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  tipo: ReportTipo;
  itemId: string;
}

const MOTIVOS = [
  'Conteúdo ofensivo ou inadequado',
  'Spam ou publicidade',
  'Violação de direitos de autor',
  'Discurso de ódio ou discriminação',
  'Outro motivo',
];

export default function ReportModal({ isOpen, onClose, tipo, itemId }: Props) {
  const { user } = useAuth();
  const { requireLogin } = useLoginModal();
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!user) {
      requireLogin('Inicia sessão para enviar uma denúncia.');
      return;
    }
    if (!motivo) {
      setError('Seleciona um motivo.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const { error } = await supabase.from('reports').insert({
        tipo,
        item_id: itemId,
        reporter_id: user.id,
        motivo,
      });
      if (error) throw error;
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setMotivo('');
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar a denúncia. Tenta novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm px-6" onClick={onClose}>
      <div className="w-full max-w-sm rounded-3xl bg-neutral-900 border border-neutral-800 p-6" onClick={(e) => e.stopPropagation()}>
        {success ? (
          <div className="flex flex-col items-center py-6">
            <div className="w-14 h-14 rounded-full accent-gradient flex items-center justify-center mb-3 glow-accent-sm">
              <Check size={26} className="text-black" />
            </div>
            <p className="text-white font-semibold">Denúncia enviada</p>
            <p className="text-neutral-400 text-sm mt-1">Obrigado por ajudar a manter a MuSon segura.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Flag size={20} className="text-amber-500" />
                <h2 className="text-lg font-bold text-white">Denunciar</h2>
              </div>
              <button onClick={onClose} className="text-neutral-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <p className="text-neutral-400 text-sm mb-4">Qual o motivo da denúncia?</p>

            <div className="space-y-2 mb-4">
              {MOTIVOS.map((m) => (
                <button
                  key={m}
                  onClick={() => { setMotivo(m); setError(null); }}
                  className={`w-full text-left p-3 rounded-xl border text-sm transition-all ${
                    motivo === m
                      ? 'border-amber-600 bg-amber-600/10 text-white'
                      : 'border-neutral-800 bg-neutral-800 text-neutral-400'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            {error && (
              <div className="flex items-start gap-2 text-red-400 text-sm mb-3">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading || !motivo}
              className="w-full py-3.5 rounded-xl accent-gradient hover:opacity-90 disabled:opacity-40 text-black font-bold transition-all"
            >
              {loading ? 'A enviar...' : 'Enviar denúncia'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
