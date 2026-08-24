import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Music, Mail, AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react';

export default function ForgotPasswordScreen() {
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setError(null);
    setLoading(true);
    try {
      await resetPassword(email.trim());
      navigate('/redefinir-senha', { state: { email: email.trim() } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar o código.');
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
        <h1 className="text-2xl font-bold text-white text-center mb-2">Recuperar senha</h1>
        <p className="text-neutral-400 text-sm text-center mb-8">
          Insere o teu email e enviaremos um código para redefinir a tua senha.
        </p>

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

          {error && (
            <div className="flex items-start gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl p-3">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="w-full py-4 rounded-xl accent-gradient hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold flex items-center justify-center gap-2 transition-all glow-accent-sm"
          >
            {loading ? 'A enviar...' : 'Enviar código'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
}
