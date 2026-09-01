import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { PlayerProvider } from '@/context/PlayerContext';
import { LoginModalProvider } from '@/context/LoginModalContext';
import { PlatformSettingsProvider, usePlatformSettings } from '@/context/PlatformSettingsContext';
import PlayerShell from '@/components/PlayerShell';
import BottomNav from '@/components/BottomNav';
import LoginModal from '@/components/LoginModal';
import GlobalBanner from '@/components/GlobalBanner';
import SplashScreen from '@/screens/SplashScreen';
import LoginScreen from '@/screens/LoginScreen';
import HomeScreen from '@/screens/HomeScreen';
import MaintenanceScreen from '@/screens/MaintenanceScreen';
import { useEffect, useState, lazy, Suspense } from 'react';
import { fetchIsAdmin } from '@/lib/admin';

// Ecrãs menos usados no arranque da app ficam em chunks separados,
// descarregados só quando alguém navega até eles — reduz o peso inicial.
const VerifyCodeScreen = lazy(() => import('@/screens/VerifyCodeScreen'));
const ForgotPasswordScreen = lazy(() => import('@/screens/ForgotPasswordScreen'));
const ResetPasswordScreen = lazy(() => import('@/screens/ResetPasswordScreen'));
const OnboardingScreen = lazy(() => import('@/screens/OnboardingScreen'));
const SearchScreen = lazy(() => import('@/screens/SearchScreen'));
const LibraryScreen = lazy(() => import('@/screens/LibraryScreen'));
const ProfileScreen = lazy(() => import('@/screens/ProfileScreen'));
const ArtistProfileScreen = lazy(() => import('@/screens/ArtistProfileScreen'));
const ProducerProfileScreen = lazy(() => import('@/screens/ProducerProfileScreen'));
const EditProfileScreen = lazy(() => import('@/screens/EditProfileScreen'));
const SettingsScreen = lazy(() => import('@/screens/SettingsScreen'));
const AboutScreen = lazy(() => import('@/screens/AboutScreen'));
const UploadScreen = lazy(() => import('@/screens/UploadScreen'));
const MyTracksScreen = lazy(() => import('@/screens/MyTracksScreen'));
const GenreScreen = lazy(() => import('@/screens/GenreScreen'));
const ProvinceScreen = lazy(() => import('@/screens/ProvinceScreen'));
const NotificationsScreen = lazy(() => import('@/screens/NotificationsScreen'));
const PlaylistScreen = lazy(() => import('@/screens/PlaylistScreen'));
const StatsScreen = lazy(() => import('@/screens/StatsScreen'));
const ChartsScreen = lazy(() => import('@/screens/ChartsScreen'));
const RequestVerificationScreen = lazy(() => import('@/screens/RequestVerificationScreen'));
const SuspendedScreen = lazy(() => import('@/screens/SuspendedScreen'));

// Painel de administração — bloco isolado, só quem tem acesso o descarrega
const AdminDashboardScreen = lazy(() => import('@/screens/admin/AdminDashboardScreen'));
const AdminUsersScreen = lazy(() => import('@/screens/admin/AdminUsersScreen'));
const AdminModerationScreen = lazy(() => import('@/screens/admin/AdminModerationScreen'));
const AdminSettingsScreen = lazy(() => import('@/screens/admin/AdminSettingsScreen'));
const AdminPaymentsScreen = lazy(() => import('@/screens/admin/AdminPaymentsScreen'));
const PremiumScreen = lazy(() => import('@/screens/PremiumScreen'));

function SplashGate({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash || loading) return <SplashScreen />;
  return <>{children}</>;
}

function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { user, needsOnboarding } = useAuth();
  const location = useLocation();

  const authRoutes = ['/login', '/verificar', '/recuperar-senha', '/redefinir-senha'];
  const onAuthRoute = authRoutes.some((r) => location.pathname.startsWith(r));

  if (user && needsOnboarding && !onAuthRoute && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }
  return <>{children}</>;
}

function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { settings, loading } = usePlatformSettings();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      return;
    }
    fetchIsAdmin(user.id).then(setIsAdmin);
  }, [user]);

  if (loading || (user && isAdmin === null)) return <>{children}</>;
  if (settings?.manutencao_ativa && !isAdmin) return <MaintenanceScreen />;
  return <>{children}</>;
}

function SuspendedGate({ children }: { children: React.ReactNode }) {
  const { user, profile, signOut } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (user && profile?.suspenso) {
      signOut();
    }
  }, [user, profile, signOut]);

  if (user && profile?.suspenso && location.pathname !== '/suspenso') {
    return <Navigate to="/suspenso" replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <div className="min-h-screen bg-black">
      <GlobalBanner />
      <Suspense fallback={<SplashScreen />}>
        <Routes>
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/verificar" element={<VerifyCodeScreen />} />
          <Route path="/recuperar-senha" element={<ForgotPasswordScreen />} />
          <Route path="/redefinir-senha" element={<ResetPasswordScreen />} />
          <Route path="/onboarding" element={<OnboardingScreen />} />
          <Route path="/suspenso" element={<SuspendedScreen />} />
          <Route path="/" element={<HomeScreen />} />
          <Route path="/pesquisar" element={<SearchScreen />} />
          <Route path="/biblioteca" element={<LibraryScreen />} />
          <Route path="/perfil" element={<ProfileScreen />} />
          <Route path="/perfil/editar" element={<EditProfileScreen />} />
          <Route path="/publicar" element={<UploadScreen />} />
          <Route path="/minhas-faixas" element={<MyTracksScreen />} />
          <Route path="/artista/:id" element={<ArtistProfileScreen />} />
          <Route path="/produtor/:id" element={<ProducerProfileScreen />} />
          <Route path="/genero/:genero" element={<GenreScreen />} />
          <Route path="/provincia/:provincia" element={<ProvinceScreen />} />
          <Route path="/notificacoes" element={<NotificationsScreen />} />
          <Route path="/playlist/:id" element={<PlaylistScreen />} />
          <Route path="/estatisticas" element={<StatsScreen />} />
          <Route path="/charts" element={<ChartsScreen />} />
          <Route path="/verificacao" element={<RequestVerificationScreen />} />
          <Route path="/admin" element={<AdminDashboardScreen />} />
          <Route path="/admin/utilizadores" element={<AdminUsersScreen />} />
          <Route path="/admin/moderacao" element={<AdminModerationScreen />} />
          <Route path="/admin/configuracoes" element={<AdminSettingsScreen />} />
          <Route path="/admin/pagamentos" element={<AdminPaymentsScreen />} />
          <Route path="/premium" element={<PremiumScreen />} />
          <Route path="/definicoes" element={<SettingsScreen />} />
          <Route path="/sobre" element={<AboutScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </div>
  );
}

function AppShell() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <SplashGate>
      <MaintenanceGate>
        <SuspendedGate>
          <OnboardingGate>
            <AppRoutes />
            {!isAdminRoute && <BottomNav />}
            {!isAdminRoute && <PlayerShell />}
            <LoginModal />
          </OnboardingGate>
        </SuspendedGate>
      </MaintenanceGate>
    </SplashGate>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <PlatformSettingsProvider>
        <LoginModalProvider>
          <PlayerProvider>
            <BrowserRouter>
              <AppShell />
            </BrowserRouter>
          </PlayerProvider>
        </LoginModalProvider>
      </PlatformSettingsProvider>
    </AuthProvider>
  );
}
