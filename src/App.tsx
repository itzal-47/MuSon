import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { PlayerProvider } from '@/context/PlayerContext';
import { LoginModalProvider } from '@/context/LoginModalContext';
import PlayerShell from '@/components/PlayerShell';
import BottomNav from '@/components/BottomNav';
import LoginModal from '@/components/LoginModal';
import SplashScreen from '@/screens/SplashScreen';
import LoginScreen from '@/screens/LoginScreen';
import VerifyCodeScreen from '@/screens/VerifyCodeScreen';
import ForgotPasswordScreen from '@/screens/ForgotPasswordScreen';
import ResetPasswordScreen from '@/screens/ResetPasswordScreen';
import OnboardingScreen from '@/screens/OnboardingScreen';
import HomeScreen from '@/screens/HomeScreen';
import SearchScreen from '@/screens/SearchScreen';
import LibraryScreen from '@/screens/LibraryScreen';
import ProfileScreen from '@/screens/ProfileScreen';
import ArtistProfileScreen from '@/screens/ArtistProfileScreen';
import ProducerProfileScreen from '@/screens/ProducerProfileScreen';
import EditProfileScreen from '@/screens/EditProfileScreen';
import SettingsScreen from '@/screens/SettingsScreen';
import AboutScreen from '@/screens/AboutScreen';
import UploadScreen from '@/screens/UploadScreen';
import MyTracksScreen from '@/screens/MyTracksScreen';
import GenreScreen from '@/screens/GenreScreen';
import ProvinceScreen from '@/screens/ProvinceScreen';
import NotificationsScreen from '@/screens/NotificationsScreen';
import PlaylistScreen from '@/screens/PlaylistScreen';
import StatsScreen from '@/screens/StatsScreen';
import { useEffect, useState } from 'react';

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

function AppRoutes() {
  return (
    <div className="min-h-screen bg-black">
      <Routes>
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/verificar" element={<VerifyCodeScreen />} />
        <Route path="/recuperar-senha" element={<ForgotPasswordScreen />} />
        <Route path="/redefinir-senha" element={<ResetPasswordScreen />} />
        <Route path="/onboarding" element={<OnboardingScreen />} />
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
        <Route path="/definicoes" element={<SettingsScreen />} />
        <Route path="/sobre" element={<AboutScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

function AppShell() {
  return (
    <SplashGate>
      <OnboardingGate>
        <AppRoutes />
        <BottomNav />
        <PlayerShell />
        <LoginModal />
      </OnboardingGate>
    </SplashGate>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LoginModalProvider>
        <PlayerProvider>
          <HashRouter>
            <AppShell />
          </HashRouter>
        </PlayerProvider>
      </LoginModalProvider>
    </AuthProvider>
  );
}
