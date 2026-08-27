import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/database';

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  needsOnboarding: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  verifySignupCode: (email: string, code: string) => Promise<void>;
  resendSignupCode: (email: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  verifyRecoveryCode: (email: string, code: string) => Promise<void>;
  resendRecoveryCode: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function mapAuthError(error: { message: string }): string {
  const msg = error.message.toLowerCase();
  if (msg.includes('already') && msg.includes('registered')) return 'Este email já tem conta. Tenta "Entrar".';
  if (msg.includes('already') && msg.includes('exists')) return 'Este email já tem conta. Tenta "Entrar".';
  if (msg.includes('invalid') && msg.includes('credentials')) return 'Email ou senha incorretos.';
  if (msg.includes('invalid') && msg.includes('login')) return 'Email ou senha incorretos.';
  if (msg.includes('email not confirmed')) return 'Ainda não confirmaste o teu email. Verifica o código que enviámos.';
  if (msg.includes('not found') || msg.includes('no user')) return 'Nenhuma conta encontrada com este email. Tenta "Registar".';
  if (msg.includes('password') && msg.includes('weak')) return 'A senha é demasiado fraca. Usa pelo menos 8 caracteres.';
  if (msg.includes('password') && msg.includes('short')) return 'A senha é demasiado curta. Usa pelo menos 8 caracteres.';
  if (msg.includes('rate limit') || msg.includes('too many')) return 'Demasiadas tentativas. Aguarda um momento e tenta novamente.';
  if (msg.includes('expired')) return 'O código expirou. Solicita um novo.';
  if (msg.includes('invalid') && msg.includes('otp')) return 'Código inválido. Verifica e tenta novamente.';
  if (msg.includes('invalid') && msg.includes('token')) return 'Código inválido. Verifica e tenta novamente.';
  if (msg.includes('network')) return 'Erro de ligação. Verifica a tua internet e tenta novamente.';
  return 'Ocorreu um erro. Tenta novamente.';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  const fetchProfile = useCallback(async (uid: string): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .maybeSingle();
    if (error) return null;
    return data as Profile | null;
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const p = await fetchProfile(user.id);
    setProfile(p);
  }, [user, fetchProfile]);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        fetchProfile(data.session.user.id).then((p) => {
          if (mounted) {
            setProfile(p);
            setLoading(false);
          }
        });
      } else {
        setLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      (async () => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user) {
          // Marca o perfil como "a carregar" enquanto o pedido está em curso,
          // para o OnboardingGate não decidir com base num perfil ainda desatualizado
          // (evita mandar para o onboarding quem já tem conta, só porque o perfil
          // ainda não chegou nesse instante).
          setProfileLoading(true);
          const p = await fetchProfile(newSession.user.id);
          setProfile(p);
          setProfileLoading(false);
        } else {
          setProfile(null);
          setProfileLoading(false);
        }
      })();
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signUp = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw new Error(mapAuthError(error));
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(mapAuthError(error));
  }, []);

  const verifySignupCode = useCallback(async (email: string, code: string) => {
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'signup' });
    if (error) throw new Error(mapAuthError(error));
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw new Error(mapAuthError(error));
  }, []);

  const verifyRecoveryCode = useCallback(async (email: string, code: string) => {
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'recovery' });
    if (error) throw new Error(mapAuthError(error));
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(mapAuthError(error));
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) throw new Error(mapAuthError(error));
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  const resendSignupCode = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    if (error) throw new Error(mapAuthError(error));
  }, []);

  const resendRecoveryCode = useCallback(async (email: string) => {
    // O Supabase não tem um "resend" dedicado para recuperação — pedir de novo o
    // envio do email de recuperação gera um código novo, o que tem o mesmo efeito.
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw new Error(mapAuthError(error));
  }, []);

  const needsOnboarding = !!user && !profileLoading && !profile?.username;

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        loading,
        needsOnboarding,
        signUp,
        signIn,
        verifySignupCode,
        resendSignupCode,
        resetPassword,
        verifyRecoveryCode,
        resendRecoveryCode,
        updatePassword,
        signInWithGoogle,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
