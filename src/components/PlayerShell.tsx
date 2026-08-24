import { usePlayer } from '@/context/PlayerContext';
import { useLoginModal } from '@/context/LoginModalContext';
import { useAuth } from '@/context/AuthContext';
import { useLike } from '@/hooks/useLike';
import { useComments } from '@/hooks/useComments';
import { useNavigate } from 'react-router-dom';
import {
  Play, Pause, SkipForward, SkipBack, ChevronDown,
  Music, Heart, Share2, Volume2, Shuffle,
  Repeat, Repeat1, ListMusic, GripVertical, X, BadgeCheck,
  MessageCircle, Flag, Send, Trash2,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import ReportModal from '@/components/ReportModal';

export default function PlayerShell() {
  const {
    currentTrack,
    isPlaying,
    isExpanded,
    togglePlay,
    next,
    prev,
    seek,
    currentTime,
    duration,
    volume,
    setVolume,
    setExpanded,
    shuffle,
    repeat,
    toggleShuffle,
    cycleRepeat,
    queue,
    queueIndex,
    reorderQueue,
    removeFromQueue,
  } = usePlayer();
  const { requireLogin } = useLoginModal();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showQueue, setShowQueue] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [showReport, setShowReport] = useState(false);

  const likeHook = useLike(currentTrack?.id);
  const commentHook = useComments(currentTrack?.id);

  if (!currentTrack) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleLike = () => {
    if (!user) {
      requireLogin('Inicia sessão para guardar faixas favoritas.');
      return;
    }
    likeHook.toggleLike();
  };

  return (
    <>
      {/* Mini-player */}
      {!isExpanded && (
        <div className="fixed bottom-16 left-0 right-0 z-40 px-2 pb-1">
          <div className="max-w-md mx-auto">
            <div className="rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden">
              <div className="h-0.5 bg-neutral-800">
                <div className="h-full accent-gradient transition-all" style={{ width: `${progress}%` }} />
              </div>
              <div className="flex items-center gap-3 p-2.5">
                <button
                  onClick={() => setExpanded(true)}
                  className="flex items-center gap-3 flex-1 min-w-0 text-left"
                >
                  <div className="w-11 h-11 rounded-lg bg-neutral-800 overflow-hidden shrink-0">
                    {currentTrack.capa_url ? (
                      <img src={currentTrack.capa_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music size={18} className="text-neutral-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{currentTrack.titulo}</p>
                    <p className="text-neutral-500 text-xs truncate">{currentTrack.artist_name || 'Artista'}</p>
                  </div>
                </button>
                <button
                  onClick={handleLike}
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                >
                  <Heart size={18} className={likeHook.isLiked ? 'text-amber-500 fill-amber-500' : 'text-neutral-400'} />
                </button>
                <button
                  onClick={togglePlay}
                  className="w-10 h-10 rounded-full accent-gradient hover:opacity-90 flex items-center justify-center text-black transition-all glow-accent-sm shrink-0"
                >
                  {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full-screen player */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col animate-fade-in">
          <div className="absolute inset-0 overflow-hidden">
            {currentTrack.capa_url ? (
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: `url(${currentTrack.capa_url})`,
                  filter: 'blur(80px) saturate(1.5)',
                  transform: 'scale(1.3)',
                }}
              />
            ) : (
              <div className="absolute inset-0 accent-gradient opacity-20" />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/80 to-black" />
          </div>

          <div className="relative flex flex-col h-full max-w-md mx-auto w-full px-6">
            {/* Header */}
            <div className="flex items-center justify-between pt-14 pb-4">
              <button
                onClick={() => { setShowQueue(false); setShowComments(false); setExpanded(false); }}
                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white"
              >
                <ChevronDown size={22} />
              </button>
              <p className="text-white/70 text-xs uppercase tracking-wider">A tocar</p>
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowComments(!showComments); setShowQueue(false); }}
                  className={`w-10 h-10 rounded-full backdrop-blur flex items-center justify-center transition-colors ${showComments ? 'accent-gradient text-black' : 'bg-white/10 text-white'}`}
                >
                  <MessageCircle size={20} />
                </button>
                <button
                  onClick={() => { setShowQueue(!showQueue); setShowComments(false); }}
                  className={`w-10 h-10 rounded-full backdrop-blur flex items-center justify-center transition-colors ${showQueue ? 'accent-gradient text-black' : 'bg-white/10 text-white'}`}
                >
                  <ListMusic size={20} />
                </button>
              </div>
            </div>

            {showQueue ? (
              <QueueView
                queue={queue}
                queueIndex={queueIndex}
                onClose={() => setShowQueue(false)}
                onReorder={reorderQueue}
                onRemove={removeFromQueue}
                draggedIdx={draggedIdx}
                setDraggedIdx={setDraggedIdx}
              />
            ) : showComments ? (
              <CommentsView
                trackId={currentTrack.id}
                comments={commentHook.comments}
                loading={commentHook.loading}
                submitting={commentHook.submitting}
                onAdd={commentHook.addComment}
                onDelete={commentHook.deleteComment}
                currentUserId={user?.id}
                onClose={() => setShowComments(false)}
              />
            ) : (
              <>
                {/* Album art */}
                <div className="flex-1 flex items-center justify-center py-6">
                  <div className="w-full aspect-square rounded-2xl bg-neutral-900 border border-neutral-800 overflow-hidden shadow-2xl">
                    {currentTrack.capa_url ? (
                      <img src={currentTrack.capa_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music size={64} className="text-neutral-700" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Track info */}
                <div className="mb-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-2xl font-bold text-white truncate">{currentTrack.titulo}</h2>
                      <button
                        onClick={() => {
                          setExpanded(false);
                          navigate(`/artista/${currentTrack.artist_id}`);
                        }}
                        className="flex items-center gap-1 text-white/70 text-lg hover:text-amber-400 transition-colors mt-1"
                      >
                        <span className="truncate">{currentTrack.artist_name || 'Artista'}</span>
                        {(currentTrack as { artist_verificado?: boolean }).artist_verificado && <BadgeCheck size={16} className="text-amber-400 shrink-0" />}
                      </button>
                    </div>
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <button
                        onClick={handleLike}
                        className="w-12 h-12 rounded-full bg-white/10 backdrop-blur border border-white/10 flex items-center justify-center transition-colors"
                      >
                        <Heart size={22} className={likeHook.isLiked ? 'text-amber-500 fill-amber-500' : 'text-white hover:text-amber-400'} />
                      </button>
                      {likeHook.likeCount > 0 && (
                        <span className="text-white/50 text-xs">{likeHook.likeCount}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-2">
                  <div
                    className="relative h-1.5 rounded-full bg-white/10 cursor-pointer group"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const pct = (e.clientX - rect.left) / rect.width;
                      if (duration > 0) seek(pct * duration);
                    }}
                  >
                    <div className="h-full rounded-full accent-gradient transition-all" style={{ width: `${progress}%` }} />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ left: `calc(${progress}% - 6px)` }}
                    />
                  </div>
                  <div className="flex justify-between text-white/50 text-xs mt-1.5">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-6 mb-4">
                  <button
                    onClick={toggleShuffle}
                    className={`transition-colors ${shuffle ? 'text-amber-400 glow-accent-sm' : 'text-white/60 hover:text-white'}`}
                  >
                    <Shuffle size={22} />
                  </button>
                  <button onClick={prev} className="text-white hover:text-amber-400 transition-colors">
                    <SkipBack size={30} />
                  </button>
                  <button
                    onClick={togglePlay}
                    className="w-16 h-16 rounded-full accent-gradient hover:opacity-90 flex items-center justify-center text-black transition-all glow-accent"
                  >
                    {isPlaying ? <Pause size={30} /> : <Play size={30} className="ml-1" />}
                  </button>
                  <button onClick={next} className="text-white hover:text-amber-400 transition-colors">
                    <SkipForward size={30} />
                  </button>
                  <button
                    onClick={cycleRepeat}
                    className={`transition-colors ${repeat !== 'none' ? 'text-amber-400 glow-accent-sm' : 'text-white/60 hover:text-white'}`}
                  >
                    {repeat === 'track' ? <Repeat1 size={22} /> : <Repeat size={22} />}
                  </button>
                </div>

                {/* Bottom actions */}
                <div className="flex items-center justify-between pb-10">
                  <button
                    onClick={() => setShowReport(true)}
                    className="text-white/60 hover:text-red-400 transition-colors"
                  >
                    <Flag size={20} />
                  </button>
                  <div className="flex items-center gap-2 text-white/60">
                    <Volume2 size={18} />
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={volume}
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      className="w-24 accent-amber-500"
                    />
                  </div>
                  <button className="text-white/60 hover:text-white transition-colors">
                    <Share2 size={20} />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <ReportModal
        isOpen={showReport}
        onClose={() => setShowReport(false)}
        tipo="faixa"
        itemId={currentTrack.id}
      />
    </>
  );
}

function QueueView({
  queue,
  queueIndex,
  onClose,
  onReorder,
  onRemove,
  draggedIdx,
  setDraggedIdx,
}: {
  queue: ReturnType<typeof usePlayer>['queue'];
  queueIndex: number;
  onClose: () => void;
  onReorder: (from: number, to: number) => void;
  onRemove: (index: number) => void;
  draggedIdx: number | null;
  setDraggedIdx: (i: number | null) => void;
}) {
  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-bold text-lg">Fila de reprodução</h3>
        <button onClick={onClose} className="text-white/60 hover:text-white">
          <X size={20} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto space-y-1 no-scrollbar pb-10">
        {queue.map((track, i) => (
          <div
            key={track.id}
            draggable
            onDragStart={() => setDraggedIdx(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (draggedIdx !== null && draggedIdx !== i) onReorder(draggedIdx, i);
              setDraggedIdx(null);
            }}
            className={`flex items-center gap-2 p-2 rounded-xl transition-colors ${
              i === queueIndex ? 'bg-amber-600/10 border border-amber-600/30' : 'bg-white/5'
            } ${draggedIdx === i ? 'opacity-50' : ''}`}
          >
            <GripVertical size={16} className="text-white/30 shrink-0 cursor-grab" />
            <div className="w-10 h-10 rounded-lg bg-neutral-800 overflow-hidden shrink-0">
              {track.capa_url ? (
                <img src={track.capa_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Music size={14} className="text-neutral-600" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${i === queueIndex ? 'text-amber-400' : 'text-white'}`}>
                {track.titulo}
              </p>
              <p className="text-white/50 text-xs truncate">{track.artist_name}</p>
            </div>
            <button
              onClick={() => onRemove(i)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-red-400 transition-colors shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function CommentsView({
  trackId,
  comments,
  loading,
  submitting,
  onAdd,
  onDelete,
  currentUserId,
  onClose,
}: {
  trackId: string;
  comments: ReturnType<typeof useComments>['comments'];
  loading: boolean;
  submitting: boolean;
  onAdd: (texto: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  currentUserId?: string;
  onClose: () => void;
}) {
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { requireLogin } = useLoginModal();

  void trackId;

  const handleSubmit = () => {
    if (!currentUserId) {
      requireLogin('Inicia sessão para comentar.');
      return;
    }
    if (!text.trim()) return;
    onAdd(text);
    setText('');
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-bold text-lg">Comentários</h3>
        <button onClick={onClose} className="text-white/60 hover:text-white">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar pb-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle size={32} className="text-neutral-700 mx-auto mb-2" />
            <p className="text-white/50 text-sm">Sem comentários ainda. Sê o primeiro!</p>
          </div>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <div className="w-9 h-9 rounded-full bg-neutral-800 overflow-hidden shrink-0">
                {c.author_avatar ? (
                  <img src={c.author_avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music size={14} className="text-neutral-600" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <p className="text-white text-sm font-medium">{c.author_name}</p>
                  {c.author_verificado && <BadgeCheck size={12} className="text-amber-500" />}
                  <span className="text-neutral-600 text-xs ml-1">{timeAgo(c.criado_em)}</span>
                </div>
                <p className="text-white/70 text-sm mt-0.5 break-words">{c.texto}</p>
                {currentUserId === c.user_id && (
                  <button
                    onClick={() => onDelete(c.id)}
                    className="text-neutral-600 hover:text-red-400 text-xs mt-1 flex items-center gap-1 transition-colors"
                  >
                    <Trash2 size={12} /> Apagar
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Comment input */}
      <div className="flex gap-2 pb-10 pt-2">
        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escreve um comentário..."
          rows={1}
          className="flex-1 px-4 py-3 rounded-xl bg-white/10 backdrop-blur border border-white/10 text-white placeholder-white/40 focus:border-amber-500/50 focus:outline-none resize-none text-sm"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={submitting || !text.trim()}
          className="w-12 h-12 rounded-xl accent-gradient hover:opacity-90 disabled:opacity-40 flex items-center justify-center text-black shrink-0 transition-all"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `há ${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `há ${days}d`;
  return `há ${Math.floor(days / 30)} meses`;
}
