import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { fetchTracksByArtist } from '@/lib/tracks';
import { fetchSimilarArtists, type SimilarArtist } from '@/lib/similarArtists';
import { useAuth } from '@/context/AuthContext';
import { useLoginModal } from '@/context/LoginModalContext';
import { useFollow } from '@/hooks/useFollow';
import type { Profile, ArtistProfile, TrackWithArtist } from '@/types/database';
import TrackCard from '@/components/TrackCard';
import ReportModal from '@/components/ReportModal';
import { shareOrCopyLink } from '@/lib/shareLink';
import {
  ArrowLeft, MapPin, Music, Share2, BadgeCheck,
  Instagram, Youtube, Plus, Disc3, Flag, Check, Users, Sparkles, Link2,
} from 'lucide-react';

export default function ArtistProfileScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { requireLogin } = useLoginModal();
  const { isFollowing, followerCount, toggleFollow, loading: followLoading } = useFollow(id);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [artistData, setArtistData] = useState<ArtistProfile | null>(null);
  const [tracks, setTracks] = useState<TrackWithArtist[]>([]);
  const [similarArtists, setSimilarArtists] = useState<SimilarArtist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReport, setShowReport] = useState(false);
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied'>('idle');

  const handleShare = async () => {
    if (!profile) return;
    const result = await shareOrCopyLink({
      title: profile.display_name || profile.username || 'Artista no MuSon',
      text: `Ouve ${profile.display_name || profile.username} no MuSon`,
      url: window.location.href,
    });
    if (result === 'copied') {
      setShareStatus('copied');
      setTimeout(() => setShareStatus('idle'), 2000);
    }
  };

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    (async () => {
      const { data: p } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
      setProfile(p as Profile | null);
      const { data: ap } = await supabase.from('artist_profiles').select('*').eq('profile_id', id).maybeSingle();
      setArtistData(ap as ArtistProfile | null);
      const t = await fetchTracksByArtist(id);
      setTracks(t);
      setLoading(false);

      const generos = (ap as ArtistProfile | null)?.generos || [];
      const provincia = (p as Profile | null)?.provincia || null;
      const similar = await fetchSimilarArtists(id, generos, provincia);
      setSimilarArtists(similar);
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
        <p className="text-neutral-400 mb-4">Artista não encontrado.</p>
        <button onClick={() => navigate(-1)} className="text-amber-500">Voltar</button>
      </div>
    );
  }

  const redes = artistData?.redes_sociais || {};
  const isOwnProfile = user?.id === id;

  const handleFollow = () => {
    if (!user) {
      requireLogin('Inicia sessão para seguir este artista.');
      return;
    }
    toggleFollow();
  };

  return (
    <div className="min-h-screen bg-black pb-32">
      <div className="relative h-48 bg-gradient-to-br from-amber-600/20 via-neutral-900 to-black">
        {artistData?.capa_url && (
          <img src={artistData.capa_url} alt="" className="w-full h-full object-cover" />
        )}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-14 left-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white"
        >
          <ArrowLeft size={20} />
        </button>
      </div>

      <div className="px-6 -mt-12 relative">
        <div className="w-24 h-24 rounded-full bg-neutral-800 border-4 border-black overflow-hidden mb-4 ring-2 ring-amber-600/20">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.display_name || ''} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Music size={32} className="text-neutral-600" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold text-white">{profile.display_name || profile.username}</h1>
          {profile.verificado && <BadgeCheck size={20} className="text-amber-500" />}
        </div>

        <p className="text-neutral-500 text-sm mb-2">Artista</p>

        <div className="flex items-center gap-4 text-sm mb-3">
          {profile.provincia && (
            <div className="flex items-center gap-1 text-neutral-400">
              <MapPin size={14} className="text-amber-500" />
              <span>{profile.provincia}</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-neutral-400">
            <Users size={14} className="text-amber-500" />
            <span>{followerCount} {followerCount === 1 ? 'seguidor' : 'seguidores'}</span>
          </div>
        </div>

        {profile.bio && <p className="text-neutral-300 text-sm mb-4">{profile.bio}</p>}

        {artistData?.generos && artistData.generos.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {artistData.generos.map((g) => (
              <button
                key={g}
                onClick={() => navigate(`/genero/${encodeURIComponent(g)}`)}
                className="px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-300 text-xs hover:border-amber-600/50 transition-all"
              >
                {g}
              </button>
            ))}
          </div>
        )}

        {Object.keys(redes).length > 0 && (
          <div className="flex gap-3 mb-4">
            {redes.instagram && (
              <a href={redes.instagram} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-300 hover:text-amber-500 hover:border-amber-600/50 transition-all">
                <Instagram size={18} />
              </a>
            )}
            {redes.youtube && (
              <a href={redes.youtube} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-300 hover:text-amber-500 hover:border-amber-600/50 transition-all">
                <Youtube size={18} />
              </a>
            )}
          </div>
        )}

        {!isOwnProfile && (
          <div className="flex gap-3 mb-6">
            <button
              onClick={handleFollow}
              disabled={followLoading}
              className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                isFollowing
                  ? 'bg-neutral-900 border border-neutral-800 text-white'
                  : 'accent-gradient hover:opacity-90 text-black glow-accent-sm'
              }`}
            >
              {isFollowing ? <><Check size={18} /> A seguir</> : <><Plus size={18} /> Seguir</>}
            </button>
            <button
              onClick={handleShare}
              className="w-12 h-12 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-300 hover:text-white transition-colors"
            >
              {shareStatus === 'copied' ? <Link2 size={18} className="text-amber-500" /> : <Share2 size={18} />}
            </button>
            <button
              onClick={() => {
                if (!user) { requireLogin('Inicia sessão para denunciar.'); return; }
                setShowReport(true);
              }}
              className="w-12 h-12 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-300 hover:text-red-400 transition-colors"
            >
              <Flag size={18} />
            </button>
          </div>
        )}
      </div>

      <div className="px-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Music size={18} className="text-amber-500" />
            <h2 className="text-lg font-bold text-white">Faixas</h2>
          </div>
          {isOwnProfile && (
            <button
              onClick={() => navigate('/minhas-faixas')}
              className="text-neutral-500 text-xs hover:text-amber-500 transition-colors"
            >
              Gerir faixas
            </button>
          )}
        </div>

        {tracks.length === 0 ? (
          <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-neutral-800 mx-auto mb-3 flex items-center justify-center">
              <Disc3 size={26} className="text-neutral-600" />
            </div>
            <p className="text-white font-medium mb-1">Sem faixas publicadas</p>
            <p className="text-neutral-400 text-sm">
              {isOwnProfile ? 'Publica a tua primeira faixa para chegar aos ouvintes.' : 'Este artista ainda não publicou faixas.'}
            </p>
            {isOwnProfile && (
              <button
                onClick={() => navigate('/publicar')}
                className="mt-4 px-6 py-2.5 rounded-xl accent-gradient text-black font-semibold text-sm glow-accent-sm"
              >
                Publicar faixa
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {tracks.map((track) => (
              <TrackCard key={track.id} track={track} queue={tracks} />
            ))}
          </div>
        )}
      </div>

      {similarArtists.length > 0 && (
        <div className="px-6 mt-8">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={18} className="text-amber-500" />
            <h2 className="text-lg font-bold text-white">Artistas semelhantes</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {similarArtists.map((a) => (
              <button
                key={a.id}
                onClick={() => navigate(`/artista/${a.id}`)}
                className="w-24 shrink-0 text-center"
              >
                <div className="w-24 h-24 rounded-full bg-neutral-900 border border-neutral-800 overflow-hidden mb-2 flex items-center justify-center">
                  {a.avatar_url ? (
                    <img src={a.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Music size={22} className="text-neutral-600" />
                  )}
                </div>
                <div className="flex items-center justify-center gap-1">
                  <p className="text-white text-xs font-medium truncate">{a.display_name || a.username}</p>
                  {a.verificado && <BadgeCheck size={11} className="text-amber-500 shrink-0" />}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <ReportModal
        isOpen={showReport}
        onClose={() => setShowReport(false)}
        tipo="perfil"
        itemId={id || ''}
      />
    </div>
  );
}
