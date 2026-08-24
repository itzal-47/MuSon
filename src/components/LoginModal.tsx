import { useLoginModal } from '@/context/LoginModalContext';
import { useNavigate } from 'react-router-dom';
import { X, Music } from 'lucide-react';

export default function LoginModal() {
  const { isOpen, message, close } = useLoginModal();
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm px-6">
      <div className="w-full max-w-sm rounded-3xl bg-neutral-900 border border-neutral-800 p-8 text-center">
        <button
          onClick={close}
          className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors"
          aria-label="Fechar"
        >
          <X size={22} />
        </button>
        <div className="mx-auto mb-5 w-16 h-16 rounded-2xl bg-amber-600/10 border border-amber-600/30 flex items-center justify-center">
          <Music size={28} className="text-amber-500" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Inicia sessão</h2>
        <p className="text-neutral-400 text-sm mb-6">{message}</p>
        <button
          onClick={() => {
            close();
            navigate('/login');
          }}
          className="w-full py-3.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold transition-colors"
        >
          Entrar ou registar
        </button>
        <button
          onClick={close}
          className="w-full mt-3 py-3 rounded-xl text-neutral-400 hover:text-white transition-colors text-sm"
        >
          Agora não
        </button>
      </div>
    </div>
  );
}
