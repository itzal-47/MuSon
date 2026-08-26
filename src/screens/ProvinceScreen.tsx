import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchProfilesByProvincia } from '@/lib/tracks';
import { fetchProvinceRadioQueue } from '@/lib/radio';
import { usePlayer } from '@/context/PlayerContext';
import { ArrowLeft, MapPin, Music, BadgeCheck, ChevronDown, Radio, Loader2 } from 'lucide-react';

interface ProfileResult {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  tipo_perfil: string | null;
  provincia: string | null;
  verificado: boolean;
}

export default function ProvinceScreen() {
  const { provincia } = useParams<{ provincia: string }>();
  const navigate = useNavigate();
  const { playTrack } = usePlayer();
  const [artists, setArtists] = useState<ProfileResult[]>([]);
  const [producers, setProducers] = useState<ProfileResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRadio, setLoadingRadio] = useState(false);
  const [radioEmpty, setRadioEmpty] = useState(false);

  const decodedProvincia = provincia ? decodeURIComponent(provincia) : '';

  useEffect(() => {
    if (!decodedProvincia) return;
    setLoading(true);
    Promise.all([
      fetchProfilesByProvincia(decodedProvincia, 'artista'),
      fetchProfilesByProvincia(decodedProvincia, 'produtor'),
    ]).then(([a, p]) => {
      setArtists(a);
      setProducers(p);
      setLoading(false);
    });
  }, [decodedProvincia]);

  const handlePlayRadio = async () => {
    if (!decodedProvincia || loadingRadio) return;
    setLoadingRadio(true);
    setRadioEmpty(false);
    const queue = await fetchProvinceRadioQueue(decodedProvincia);
    setLoadingRadio(false);
    if (queue.length === 0) {
      setRadioEmpty(true);
      setTimeout(() => setRadioEmpty(false), 3000);
      return;
    }
    playTrack(queue[0], queue);
  };

  return (
    <div className="min-h-screen bg-black pb-32">
      {/* Header */}
      <div className="relative h-40 bg-gradient-to-br from-amber-600/30 via-neutral-900 to-black">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80" />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-14 left-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white z-10"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
          <div>
            <p className="text-white/70 text-xs uppercase tracking-wider mb-1">Província</p>
            <h1 className="text-3xl font-black text-white flex items-center gap-2">
              <MapPin size={28} className="text-amber-500" />
              {decodedProvincia}
            </h1>
          </div>
          <button
            onClick={handlePlayRadio}
            disabled={loadingRadio}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full accent-gradient text-black font-bold text-sm glow-accent-sm disabled:opacity-60 shrink-0"
          >
            {loadingRadio ? <Loader2 size={16} className="animate-spin" /> : <Radio size={16} />}
            Rádio
          </button>
        </div>
      </div>

      <div className="px-6 pt-6">
        {radioEmpty && (
          <div className="mb-4 rounded-xl bg-amber-600/10 border border-amber-600/30 px-4 py-3 text-amber-400 text-sm text-center">
            Ainda não há faixas publicadas de artistas de {decodedProvincia}.
          </div>
        )}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : artists.length === 0 && producers.length === 0 ? (
          <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-neutral-800 mx-auto mb-3 flex items-center justify-center">
              <MapPin size={26} className="text-neutral-600" />
            </div>
            <p className="text-white font-medium mb-1">Sem artistas nesta província</p>
            <p className="text-neutral-400 text-sm">Ainda não há artistas ou produtores registados em {decodedProvincia}.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {artists.length > 0 && (
              <section>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Artistas</h3>
                <div className="space-y-2">
                  {artists.map((p) => (
                    <ProfileRow key={p.id} profile={p} onClick={() => navigate(`/artista/${p.id}`)} />
                  ))}
                </div>
              </section>
            )}
            {producers.length > 0 && (
              <section>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Produtores</h3>
                <div className="space-y-2">
                  {producers.map((p) => (
                    <ProfileRow key={p.id} profile={p} onClick={() => navigate(`/produtor/${p.id}`)} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileRow({ profile, onClick }: { profile: ProfileResult; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-xl bg-neutral-900 border border-neutral-800 card-elevate"
    >
      <div className="w-12 h-12 rounded-full bg-neutral-800 overflow-hidden shrink-0 ring-2 ring-neutral-700">
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music size={18} className="text-neutral-600" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-1">
          <p className="text-white font-medium text-sm truncate">{profile.display_name || profile.username}</p>
          {profile.verificado && <BadgeCheck size={14} className="text-amber-500 shrink-0" />}
        </div>
        <p className="text-neutral-500 text-xs">{profile.tipo_perfil === 'artista' ? 'Artista' : 'Produtor'}</p>
      </div>
      <ChevronDown size={16} className="text-neutral-600 -rotate-90" />
    </button>
  );
}
