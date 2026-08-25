import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Music, ArrowLeft, AlertCircle } from 'lucide-react';

export default function VerifyCodeScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as { email?: string })?.email || '';
  const { verifySignupCode } = useAuth();
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (idx: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const newDigits = [...digits];
    newDigits[idx] = val;
    setDigits(newDigits);
    setError(null);
    if (val && idx < 5) refs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      refs.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text.length > 0) {
      const newDigits = text.split('').concat(Array(6 - text.length).fill('')).slice(0, 6);
      setDigits(newDigits);
      refs.current[Math.min(text.length, 5)]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = digits.join('');
    if (code.length !== 6) return;
    setError(null);
    setLoading(true);
    try {
      await verifySignupCode(email, code);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Código inválido ou expirado.');
      setDigits(['', '', '', '', '', '']);
      refs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col px-6 pt-16 pb-8">
      <button
        onClick={() => navigate('/login')}
        className="flex items-center text-neutral-400 hover:text-white transition-colors mb-8"
      >
        <ArrowLeft size={20} className="mr-2" />
        Voltar
      </button>

      <div className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 rounded-2xl accent-gradient flex items-center justify-center mb-4 glow-accent-sm">
          <Music size={32} className="text-black" />
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-sm w-full mx-auto">
        <h1 className="text-2xl font-bold text-white text-center mb-2">Verifica o teu email</h1>
        <p className="text-neutral-400 text-sm text-center mb-8">
          Enviámos um código de 6 dígitos para<br />
          <span className="text-white font-medium">{email || 'o teu email'}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center gap-2" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => { refs.current[i] = el; }}
                type="tel"
                maxLength={1}
                value={d}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                disabled={loading}
                className="w-12 h-14 rounded-xl bg-neutral-900 border border-neutral-800 text-center text-2xl font-bold text-white focus:border-amber-600 focus:outline-none transition-colors"
                inputMode="numeric"
                autoFocus={i === 0}
              />
            ))}
          </div>

          {error && (
            <div className="flex items-start gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl p-3">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || digits.join('').length !== 6}
            className="w-full py-4 rounded-xl accent-gradient hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold transition-all glow-accent-sm"
          >
            {loading ? 'A verificar...' : 'Confirmar código'}
          </button>
        </form>

        <button
          onClick={() => navigate('/login')}
          className="text-center text-amber-500 hover:text-amber-400 text-sm mt-6 transition-colors"
        >
          Não recebeste o código? Voltar
        </button>
      </div>
    </div>
  );
}
