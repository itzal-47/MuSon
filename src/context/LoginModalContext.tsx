import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';

interface LoginModalState {
  isOpen: boolean;
  message: string;
  requireLogin: (message?: string) => void;
  close: () => void;
}

const LoginModalContext = createContext<LoginModalState | undefined>(undefined);

export function LoginModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');

  const requireLogin = useCallback((msg?: string) => {
    setMessage(msg || 'Precisas de iniciar sessão para continuar.');
    setIsOpen(true);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  return (
    <LoginModalContext.Provider value={{ isOpen, message, requireLogin, close }}>
      {children}
    </LoginModalContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLoginModal() {
  const ctx = useContext(LoginModalContext);
  if (!ctx) throw new Error('useLoginModal deve ser usado dentro de LoginModalProvider');
  return ctx;
}
