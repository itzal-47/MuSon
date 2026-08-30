import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { uploadTrackAudio, uploadTrackCover } from '@/lib/storageService';
import { getAudioDuration } from '@/lib/tracks';
import { usePlatformSettings } from '@/context/PlatformSettingsContext';
import {
  ArrowLeft, Music, Upload, Image as ImageIcon, AlertCircle,
  Check, Loader2, FileAudio,
} from 'lucide-react';

const MAX_AUDIO_SIZE = 20 * 1024 * 1024; // 20MB
const VALID_AUDIO_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/m4a', 'audio/x-m4a', 'audio/mp4'];

function defaultScheduleValue(): string {
  const d = new Date(Date.now() + 60 * 60 * 1000); // daqui a 1 hora, valor inicial sugerido
  d.setSeconds(0, 0);
  return d.toISOString().slice(0, 16);
}

export default function UploadScreen() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const { settings } = usePlatformSettings();
  const GENEROS = settings?.generos && settings.generos.length > 0 ? settings.generos : ['Outro'];
  const [titulo, setTitulo] = useState('');
  const [genero, setGenero] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [explicita, setExplicita] = useState(false);
  const [permiteDownload, setPermiteDownload] = useState(false);
  const [publicarEm, setPublicarEm] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const audioRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (profile && profile.tipo_perfil !== 'artista' && profile.tipo_perfil !== 'produtor') {
      navigate('/perfil');
    }
  }, [user, profile, navigate]);

  if (!user || (profile && profile.tipo_perfil !== 'artista' && profile.tipo_perfil !== 'produtor')) {
    return null;
  }

  const handleAudio = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!VALID_AUDIO_TYPES.includes(file.type) && !file.name.match(/\.(mp3|wav|m4a)$/i)) {
      setError('Formato não suportado. Usa MP3, WAV ou M4A.');
      return;
    }
    if (file.size > MAX_AUDIO_SIZE) {
      setError('O ficheiro é demasiado grande. Máximo 20MB.');
      return;
    }
    setError(null);
    setAudioFile(file);
    if (!titulo) {
      setTitulo(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleCover = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('A capa deve ser uma imagem.');
      return;
    }
    setError(null);
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!user || !audioFile || !titulo.trim() || !genero) {
      setError('Preenche todos os campos obrigatórios.');
      return;
    }
    setError(null);
    setLoading(true);
    setUploadProgress(0);
    try {
      // Upload audio with progress
      const audioResult = await uploadTrackAudio(user.id, audioFile, (p) => setUploadProgress(p));

      // Upload cover if provided
      let coverUrl: string | null = null;
      if (coverFile) {
        const coverResult = await uploadTrackCover(user.id, coverFile);
        coverUrl = coverResult.url;
      }

      // Get duration
      const duracao = await getAudioDuration(audioFile);

      // Insert track
      const { error: insertError } = await supabase.from('tracks').insert({
        artist_id: user.id,
        titulo: titulo.trim(),
        capa_url: coverUrl,
        audio_url: audioResult.url,
        duracao_segundos: duracao,
        genero: genero,
        explicita: explicita,
        permite_download: permiteDownload,
        publicada: true,
        publicar_em: publicarEm ? new Date(publicarEm).toISOString() : null,
      });

      if (insertError) throw insertError;

      setSuccess(true);
      setTimeout(() => {
        refreshProfile();
        navigate('/perfil');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao publicar a faixa.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
        <div className="w-20 h-20 rounded-full accent-gradient flex items-center justify-center mb-4 glow-accent">
          <Check size={40} className="text-black" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">{publicarEm ? 'Faixa agendada!' : 'Faixa publicada!'}</h1>
        <p className="text-neutral-400 text-sm">
          {publicarEm
            ? `Vai ficar visível ao público a partir de ${new Date(publicarEm).toLocaleString('pt-PT')}.`
            : 'A tua faixa está agora disponível para reprodução.'}
        </p>
      </div>
    );
  }

  if (settings && !settings.uploads_ativados) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 text-center">
        <AlertCircle size={32} className="text-neutral-600 mb-3" />
        <p className="text-white font-medium mb-1">Publicações temporariamente desativadas</p>
        <p className="text-neutral-500 text-sm">A equipa do MuSon desativou novas publicações por agora. Tenta novamente mais tarde.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-32">
      <header className="px-6 pt-14 pb-6 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="text-neutral-400 hover:text-white transition-colors">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold text-white">Publicar faixa</h1>
      </header>

      <div className="px-6 max-w-sm mx-auto space-y-6">
        {/* Audio file picker */}
        <div>
          <label className="text-neutral-400 text-sm mb-2 block">Ficheiro de áudio *</label>
          <input ref={audioRef} type="file" accept=".mp3,.wav,.m4a,audio/*" onChange={handleAudio} className="hidden" />
          <button
            onClick={() => audioRef.current?.click()}
            className={`w-full p-6 rounded-2xl border-2 border-dashed flex flex-col items-center gap-2 transition-all ${
              audioFile ? 'border-amber-600 bg-amber-600/5' : 'border-neutral-700 hover:border-neutral-600'
            }`}
          >
            {audioFile ? (
              <>
                <FileAudio size={28} className="text-amber-500" />
                <p className="text-white text-sm font-medium truncate max-w-full">{audioFile.name}</p>
                <p className="text-neutral-500 text-xs">{(audioFile.size / 1024 / 1024).toFixed(1)} MB</p>
              </>
            ) : (
              <>
                <Upload size={28} className="text-neutral-600" />
                <p className="text-neutral-400 text-sm">Seleciona um ficheiro de áudio</p>
                <p className="text-neutral-600 text-xs">MP3, WAV ou M4A — máx 20MB</p>
              </>
            )}
          </button>
        </div>

        {/* Cover image picker */}
        <div>
          <label className="text-neutral-400 text-sm mb-2 block">Capa da faixa</label>
          <input ref={coverRef} type="file" accept="image/*" onChange={handleCover} className="hidden" />
          <button
            onClick={() => coverRef.current?.click()}
            className="w-full flex items-center gap-4 p-4 rounded-2xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 transition-colors"
          >
            <div className="w-16 h-16 rounded-xl bg-neutral-800 overflow-hidden shrink-0">
              {coverPreview ? (
                <img src={coverPreview} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon size={22} className="text-neutral-600" />
                </div>
              )}
            </div>
            <div className="text-left">
              <p className="text-white text-sm font-medium">{coverFile ? 'Capa selecionada' : 'Adicionar capa'}</p>
              <p className="text-neutral-500 text-xs">Opcional — imagem da faixa</p>
            </div>
          </button>
        </div>

        {/* Title */}
        <div>
          <label className="text-neutral-400 text-sm mb-1.5 block">Título *</label>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Nome da faixa"
            className="w-full px-4 py-3.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-600 focus:border-amber-600 focus:outline-none transition-colors"
          />
        </div>

        {/* Genre */}
        <div>
          <label className="text-neutral-400 text-sm mb-1.5 block">Género *</label>
          <div className="flex flex-wrap gap-2">
            {GENEROS.map((g) => (
              <button
                key={g}
                onClick={() => setGenero(g)}
                className={`px-3.5 py-2 rounded-full text-sm font-medium transition-all ${
                  genero === g
                    ? 'accent-gradient text-black glow-accent-sm'
                    : 'bg-neutral-900 border border-neutral-800 text-neutral-400'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-xl bg-neutral-900 border border-neutral-800">
            <div>
              <p className="text-white text-sm font-medium">Conteúdo explícito</p>
              <p className="text-neutral-500 text-xs">Marca se a faixa tem linguagem explícita</p>
            </div>
            <button
              onClick={() => setExplicita((v) => !v)}
              className={`w-12 h-7 rounded-full transition-colors relative shrink-0 ${explicita ? 'accent-gradient' : 'bg-neutral-700'}`}
            >
              <span className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${explicita ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-neutral-900 border border-neutral-800">
            <div>
              <p className="text-white text-sm font-medium">Permitir download</p>
              <p className="text-neutral-500 text-xs">Permitir que os ouvintes descarreguem a faixa</p>
            </div>
            <button
              onClick={() => setPermiteDownload((v) => !v)}
              className={`w-12 h-7 rounded-full transition-colors relative shrink-0 ${permiteDownload ? 'accent-gradient' : 'bg-neutral-700'}`}
            >
              <span className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${permiteDownload ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
            <div className="flex items-center justify-between mb-1">
              <p className="text-white text-sm font-medium">Agendar publicação</p>
              <button
                onClick={() => setPublicarEm(publicarEm ? '' : defaultScheduleValue())}
                className={`w-12 h-7 rounded-full transition-colors relative shrink-0 ${publicarEm ? 'accent-gradient' : 'bg-neutral-700'}`}
              >
                <span className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${publicarEm ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            <p className="text-neutral-500 text-xs mb-3">A faixa só fica visível ao público na data escolhida</p>
            {publicarEm && (
              <input
                type="datetime-local"
                value={publicarEm}
                min={defaultScheduleValue()}
                onChange={(e) => setPublicarEm(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-black border border-neutral-800 text-white text-sm focus:border-amber-600 focus:outline-none"
              />
            )}
          </div>
        </div>

        {/* Upload progress */}
        {loading && (
          <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-4">
            <div className="flex items-center gap-3 mb-2">
              <Loader2 size={18} className="text-amber-500 animate-spin" />
              <p className="text-white text-sm font-medium">A publicar faixa...</p>
            </div>
            <div className="h-2 rounded-full bg-neutral-800 overflow-hidden">
              <div className="h-full accent-gradient transition-all" style={{ width: `${uploadProgress}%` }} />
            </div>
            <p className="text-neutral-500 text-xs mt-1.5">{uploadProgress}%</p>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl p-3">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading || !audioFile || !titulo.trim() || !genero}
          className="w-full py-4 rounded-xl accent-gradient hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold flex items-center justify-center gap-2 transition-all glow-accent-sm"
        >
          {loading ? 'A publicar...' : 'Publicar faixa'}
          {!loading && <Music size={18} />}
        </button>
      </div>
    </div>
  );
}
