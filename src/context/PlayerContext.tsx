import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import type { Track } from '@/types/database';
import { supabase } from '@/lib/supabase';

export interface PlayerTrack extends Track {
  artist_name?: string;
  artist_avatar?: string | null;
}

export type RepeatMode = 'none' | 'track' | 'queue';

interface PlayerState {
  currentTrack: PlayerTrack | null;
  queue: PlayerTrack[];
  queueIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isExpanded: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  playTrack: (track: PlayerTrack, queue?: PlayerTrack[]) => void;
  togglePlay: () => void;
  next: () => void;
  prev: () => void;
  seek: (time: number) => void;
  setVolume: (v: number) => void;
  setExpanded: (expanded: boolean) => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  reorderQueue: (from: number, to: number) => void;
  removeFromQueue: (index: number) => void;
  addToQueue: (track: PlayerTrack) => void;
  stop: () => void;
}

const PlayerContext = createContext<PlayerState | undefined>(undefined);

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  if (!audioRef.current && typeof Audio !== 'undefined') {
    audioRef.current = new Audio();
  }

  const [currentTrack, setCurrentTrack] = useState<PlayerTrack | null>(null);
  const [queue, setQueue] = useState<PlayerTrack[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [isExpanded, setExpanded] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>('none');
  const playedRef = useRef<string | null>(null);

  const registerPlay = useCallback((track: PlayerTrack) => {
    if (playedRef.current === track.id) return;
    playedRef.current = track.id;
    Promise.resolve(supabase.from('track_plays').insert({ track_id: track.id }))
      .then(() => undefined)
      .catch(() => undefined);
  }, []);

  const loadAndPlay = useCallback((track: PlayerTrack) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (track.audio_url) {
      audio.src = track.audio_url;
      audio.play().then(() => {
        setIsPlaying(true);
        registerPlay(track);
      }).catch(() => setIsPlaying(false));
    } else {
      setIsPlaying(true);
      registerPlay(track);
    }
  }, [registerPlay]);

  const playTrack = useCallback((track: PlayerTrack, newQueue?: PlayerTrack[]) => {
    playedRef.current = null;
    if (newQueue && newQueue.length > 0) {
      let q = newQueue;
      if (shuffle) q = shuffleArray(newQueue);
      setQueue(q);
      const idx = q.findIndex((t) => t.id === track.id);
      setQueueIndex(idx >= 0 ? idx : 0);
    } else {
      setQueue([track]);
      setQueueIndex(0);
    }
    setCurrentTrack(track);
    loadAndPlay(track);
  }, [shuffle, loadAndPlay]);

  const togglePlay = useCallback(() => {
    if (!currentTrack) return;
    const audio = audioRef.current;
    if (!audio || !currentTrack.audio_url) {
      setIsPlaying((p) => !p);
      return;
    }
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  }, [currentTrack, isPlaying]);

  const next = useCallback(() => {
    if (queue.length === 0) return;
    if (repeat === 'track') {
      const track = queue[queueIndex];
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = 0;
        audio.play().then(() => setIsPlaying(true)).catch(() => {});
      }
      registerPlay(track);
      return;
    }
    let nextIdx = queueIndex + 1;
    if (nextIdx >= queue.length) {
      if (repeat === 'queue') {
        nextIdx = 0;
      } else {
        setIsPlaying(false);
        return;
      }
    }
    setQueueIndex(nextIdx);
    const track = queue[nextIdx];
    setCurrentTrack(track);
    playedRef.current = null;
    loadAndPlay(track);
  }, [queue, queueIndex, repeat, loadAndPlay, registerPlay]);

  const prev = useCallback(() => {
    if (queue.length === 0) return;
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      setCurrentTime(0);
      return;
    }
    let prevIdx = queueIndex - 1;
    if (prevIdx < 0) {
      if (repeat === 'queue') {
        prevIdx = queue.length - 1;
      } else {
        prevIdx = 0;
      }
    }
    setQueueIndex(prevIdx);
    const track = queue[prevIdx];
    setCurrentTrack(track);
    playedRef.current = null;
    loadAndPlay(track);
  }, [queue, queueIndex, repeat, loadAndPlay]);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    if (audioRef.current) audioRef.current.volume = v;
  }, []);

  const toggleShuffle = useCallback(() => {
    setShuffle((s) => {
      if (!s && queue.length > 1) {
        const shuffled = shuffleArray(queue);
        const currIdx = shuffled.findIndex((t) => t.id === currentTrack?.id);
        setQueue(shuffled);
        setQueueIndex(currIdx >= 0 ? currIdx : 0);
      }
      return !s;
    });
  }, [queue, currentTrack]);

  const cycleRepeat = useCallback(() => {
    setRepeat((r) => (r === 'none' ? 'queue' : r === 'queue' ? 'track' : 'none'));
  }, []);

  const reorderQueue = useCallback((from: number, to: number) => {
    setQueue((q) => {
      const copy = [...q];
      const [item] = copy.splice(from, 1);
      copy.splice(to, 0, item);
      const newIdx = copy.findIndex((t) => t.id === currentTrack?.id);
      setQueueIndex(newIdx >= 0 ? newIdx : 0);
      return copy;
    });
  }, [currentTrack]);

  const removeFromQueue = useCallback((index: number) => {
    if (queue.length <= 1) return;
    setQueue((q) => q.filter((_, i) => i !== index));
    if (index < queueIndex) {
      setQueueIndex((i) => i - 1);
    } else if (index === queueIndex) {
      const newIdx = Math.min(queueIndex, queue.length - 2);
      setQueueIndex(newIdx);
      const track = queue[newIdx];
      setCurrentTrack(track);
      playedRef.current = null;
      loadAndPlay(track);
    }
  }, [queue, queueIndex, loadAndPlay]);

  const addToQueue = useCallback((track: PlayerTrack) => {
    setQueue((q) => [...q, track]);
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    setCurrentTrack(null);
    setIsPlaying(false);
    setQueue([]);
    setQueueIndex(0);
    setCurrentTime(0);
    setDuration(0);
    setExpanded(false);
    playedRef.current = null;
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTime = () => setCurrentTime(audio.currentTime);
    const onDur = () => setDuration(audio.duration || 0);
    const onEnd = () => {
      if (repeat === 'track') {
        audio.currentTime = 0;
        audio.play().then(() => setIsPlaying(true)).catch(() => {});
        return;
      }
      next();
    };

    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onDur);
    audio.addEventListener('ended', onEnd);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onDur);
      audio.removeEventListener('ended', onEnd);
    };
  }, [next, repeat]);

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        queue,
        queueIndex,
        isPlaying,
        currentTime,
        duration,
        volume,
        isExpanded,
        shuffle,
        repeat,
        playTrack,
        togglePlay,
        next,
        prev,
        seek,
        setVolume,
        setExpanded,
        toggleShuffle,
        cycleRepeat,
        reorderQueue,
        removeFromQueue,
        addToQueue,
        stop,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer deve ser usado dentro de PlayerProvider');
  return ctx;
}
