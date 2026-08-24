import { usePlayer } from '@/context/PlayerContext';
import { useAuth } from '@/context/AuthContext';
import { useLoginModal } from '@/context/LoginModalContext';
import { useLike } from '@/hooks/useLike';
import type { TrackWithArtist } from '@/types/database';
import { Play, Pause, Music, BadgeCheck, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  track: TrackWithArtist;
  queue?: TrackWithArtist[];
  variant?: 'list' | 'card';
}

export default function TrackCard({ track, queue, variant = 'list' }: Props) {
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayer();
  const { user } = useAuth();
  const { requireLogin } = useLoginModal();
  const { isLiked, likeCount, toggleLike } = useLike(track.id);
  const navigate = useNavigate();

  const isCurrent = currentTrack?.id === track.id;
  const isCurrentPlaying = isCurrent && isPlaying;

  const handlePlay = () => {
    if (!user) {
      requireLogin('Inicia sessão para ouvir música.');
      return;
    }
    if (isCurrent) {
      togglePlay();
    } else {
      playTrack(track, queue);
    }
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      requireLogin('Inicia sessão para gostar de faixas.');
      return;
    }
    toggleLike();
  };

  if (variant === 'card') {
    return (
      <button
        onClick={handlePlay}
        className="card-elevate w-40 shrink-0 text-left group"
      >
        <div className={`relative w-40 h-40 rounded-2xl overflow-hidden bg-neutral-900 border ${isCurrent ? 'border-amber-600 glow-accent-sm' : 'border-neutral-800'}`}>
          {track.capa_url ? (
            <img src={track.capa_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Music size={32} className="text-neutral-700" />
            </div>
          )}
          <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${isCurrentPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
            <div className="w-12 h-12 rounded-full accent-gradient flex items-center justify-center glow-accent">
              {isCurrentPlaying ? <Pause size={22} className="text-black" /> : <Play size={22} className="text-black ml-0.5" />}
            </div>
          </div>
          <button
            onClick={handleLike}
            className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-black/60 backdrop-blur flex items-center justify-center"
          >
            <Heart size={14} className={isLiked ? 'text-amber-500 fill-amber-500' : 'text-white'} />
          </button>
        </div>
        <p className={`text-sm font-medium mt-2 truncate ${isCurrent ? 'text-amber-500' : 'text-white'}`}>{track.titulo}</p>
        <p className="text-neutral-500 text-xs truncate">{track.artist_name}</p>
      </button>
    );
  }

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl card-elevate border ${
        isCurrent ? 'bg-amber-600/5 border-amber-600/30' : 'bg-neutral-900 border-neutral-800'
      }`}
    >
      <button onClick={handlePlay} className="relative w-12 h-12 rounded-lg bg-neutral-800 overflow-hidden shrink-0 group">
        {track.capa_url ? (
          <img src={track.capa_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music size={18} className="text-neutral-600" />
          </div>
        )}
        <div className={`absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity ${isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          {isCurrentPlaying ? <Pause size={18} className="text-amber-500" /> : <Play size={18} className="text-white ml-0.5" />}
        </div>
      </button>

      <div className="flex-1 min-w-0">
        <p className={`font-medium text-sm truncate ${isCurrent ? 'text-amber-500' : 'text-white'}`}>{track.titulo}</p>
        <button
          onClick={() => navigate(`/artista/${track.artist_id}`)}
          className="flex items-center gap-1 text-neutral-500 text-xs hover:text-amber-500 transition-colors"
        >
          <span className="truncate">{track.artist_name}</span>
          {track.artist_verificado && <BadgeCheck size={11} className="text-amber-500 shrink-0" />}
        </button>
      </div>

      <button onClick={handleLike} className="flex items-center gap-1 shrink-0 px-2">
        <Heart size={16} className={isLiked ? 'text-amber-500 fill-amber-500' : 'text-neutral-500 hover:text-white'} />
        {likeCount > 0 && <span className="text-neutral-500 text-xs">{likeCount}</span>}
      </button>

      <button onClick={handlePlay} className="w-10 h-10 rounded-full bg-amber-600/10 flex items-center justify-center text-amber-500 hover:bg-amber-600/20 transition-colors shrink-0">
        {isCurrentPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
      </button>
    </div>
  );
}
