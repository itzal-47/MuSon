import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, mapAuthError } from '@/context/AuthContext';
import { usePlatformSettings } from '@/context/PlatformSettingsContext';
import { Music, Mail, Lock, AlertCircle, ArrowRight, UserPlus, LogIn, Eye, EyeOff } from 'lucide-react';

export default function LoginScreen() {
  const navigate = useNavigate();
  const { signUp, signIn, signInWithGoogle } = useAuth();
  const { settings } = usePlatformSettings();
  const [mode, setMode] = useState<'entrar' | 'registar'>('entrar');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registosDesativados = settings ? !settings.registos_ativados : false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) return;

    if (mode === 'registar') {
      if (registosDesativados) {
        setError('Os registos estão temporariamente desativados. Tenta novamente mais tarde.');
        return;
      }
      if (password.length < 8) {
        setError('A senha deve ter pelo menos 8 caracteres.');
        return;
      }
      if (password !== confirmPassword) {
        setError('As senhas não coincidem.');
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'registar') {
        await signUp(email.trim(), password);
        navigate('/verificar', { state: { email: email.trim(), mode: 'registar' } });
      } else {
        await signIn(email.trim(), password);
        navigate('/');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro. Tenta novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao iniciar sessão com Google.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col px-6 pt-16 pb-8">
      <div className="flex flex-col items-center mb-10">
        <div className="w-20 h-20 rounded-3xl accent-gradient flex items-center justify-center mb-4 glow-accent">
          <Music size={40} className="text-black" />
        </div>
        <h1 className="text-3xl font-black text-white">MuSon</h1>
        <p className="text-neutral-500 text-sm mt-1">A música angolana no teu bolso</p>
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-sm w-full mx-auto">
        <div className="flex p-1 rounded-2xl bg-neutral-900 border border-neutral-800 mb-6">
          <button
            onClick={() => { setMode('entrar'); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
              mode === 'entrar' ? 'accent-gradient text-black' : 'text-neutral-400'
            }`}
          >
            <LogIn size={16} />
            Entrar
          </button>
          <button
            onClick={() => { setMode('registar'); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
              mode === 'registar' ? 'accent-gradient text-black' : 'text-neutral-400'
            }`}
          >
            <UserPlus size={16} />
            Registar
          </button>
        </div>

        <h2 className="text-xl font-bold text-white mb-1">
          {mode === 'entrar' ? 'Bem-vindo de volta' : 'Criar a tua conta'}
        </h2>
        <p className="text-neutral-400 text-sm mb-6">
          {mode === 'entrar'
            ? 'Entra com o teu email e senha.'
            : 'Cria a tua conta com email e senha.'}
        </p>

        {mode === 'registar' && registosDesativados && (
          <div className="flex items-center gap-2 text-amber-400 text-sm bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-4">
            <AlertCircle size={16} className="shrink-0" />
            <span>Os registos estão temporariamente desativados. Tenta novamente mais tarde.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="O teu email"
              className="w-full pl-12 pr-4 py-4 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-600 focus:border-amber-600 focus:outline-none transition-colors"
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div className="relative">
            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha"
              className="w-full pl-12 pr-12 py-4 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-600 focus:border-amber-600 focus:outline-none transition-colors"
              disabled={loading}
              autoComplete={mode === 'entrar' ? 'current-password' : 'new-password'}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {mode === 'registar' && (
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmar senha"
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-600 focus:border-amber-600 focus:outline-none transition-colors"
                disabled={loading}
                autoComplete="new-password"
              />
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl p-3">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {mode === 'entrar' && (
            <button
              type="button"
              onClick={() => navigate('/recuperar-senha')}
              className="text-amber-500 hover:text-amber-400 text-sm transition-colors"
            >
              Esqueci a senha
            </button>
          )}

          <button
            type="submit"
            disabled={loading || !email.trim() || !password || (mode === 'registar' && registosDesativados)}
            className="w-full py-4 rounded-xl accent-gradient hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold flex items-center justify-center gap-2 transition-all glow-accent-sm"
          >
            {loading ? 'A processar...' : mode === 'entrar' ? 'Entrar' : 'Registar'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-neutral-800" />
          <span className="text-neutral-600 text-xs uppercase tracking-wider">ou</span>
          <div className="flex-1 h-px bg-neutral-800" />
        </div>

        <button
          onClick={handleGoogle}
          disabled={loading}
          className="w-full py-4 rounded-xl bg-white hover:bg-neutral-200 disabled:opacity-40 text-black font-semibold flex items-center justify-center gap-3 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continuar com Google
        </button>
      </div>

      <p className="text-center text-neutral-600 text-xs mt-8">
        Ao continuar, aceitas os Termos de Uso e a Política de Privacidade.
      </p>
    </div>
  );
}

void mapAuthError;
