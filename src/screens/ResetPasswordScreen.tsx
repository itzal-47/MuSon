import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Music, Lock, AlertCircle, ArrowLeft, Eye, EyeOff, Check } from 'lucide-react';

const RESEND_COOLDOWN = 30;

export default function ResetPasswordScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as { email?: string })?.email || '';
  const { verifyRecoveryCode, updatePassword, resendRecoveryCode } = useAuth();
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

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
    if (code.length !== 6 || !newPassword || !confirmPassword) return;
    if (newPassword.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await verifyRecoveryCode(email, code);
      await updatePassword(newPassword);
      setSuccess(true);
      setTimeout(() => navigate('/login', { state: { recovered: true } }), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Código inválido ou expirado.');
      setDigits(['', '', '', '', '', '']);
      refs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending || !email) return;
    setResending(true);
    setResendMessage(null);
    setError(null);
    try {
      await resendRecoveryCode(email);
      setResendMessage('Enviámos um novo código para o teu email.');
      setCooldown(RESEND_COOLDOWN);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível reenviar o código.');
    } finally {
      setResending(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
        <div className="w-20 h-20 rounded-full accent-gradient flex items-center justify-center mb-4 glow-accent">
          <Check size={40} className="text-black" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Senha redefinida!</h1>
        <p className="text-neutral-400 text-sm">Agora podes entrar com a tua nova senha.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col px-6 pt-16 pb-8">
      <button
        onClick={() => navigate('/recuperar-senha')}
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
        <h1 className="text-2xl font-bold text-white text-center mb-2">Redefinir senha</h1>
        <p className="text-neutral-400 text-sm text-center mb-8">
          Insere o código enviado para<br />
          <span className="text-white font-medium">{email || 'o teu email'}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
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

          <div className="relative">
            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nova senha"
              className="w-full pl-12 pr-12 py-4 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-600 focus:border-amber-600 focus:outline-none transition-colors"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="relative">
            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirmar nova senha"
              className="w-full pl-12 pr-4 py-4 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-600 focus:border-amber-600 focus:outline-none transition-colors"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl p-3">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {resendMessage && (
            <div className="flex items-center gap-2 text-emerald-400 text-sm bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
              <span>{resendMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || digits.join('').length !== 6 || !newPassword || !confirmPassword}
            className="w-full py-4 rounded-xl accent-gradient hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold transition-all glow-accent-sm"
          >
            {loading ? 'A redefinir...' : 'Redefinir senha'}
          </button>
        </form>

        <button
          onClick={handleResend}
          disabled={cooldown > 0 || resending}
          className="text-center text-amber-500 hover:text-amber-400 disabled:text-neutral-600 text-sm mt-6 transition-colors"
        >
          {resending
            ? 'A reenviar...'
            : cooldown > 0
              ? `Reenviar código (${cooldown}s)`
              : 'Não recebeste o código? Reenviar'}
        </button>
      </div>
    </div>
  );
}
