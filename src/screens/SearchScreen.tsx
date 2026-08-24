import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchTracks, searchProfiles } from '@/lib/tracks';
import type { TrackWithArtist } from '@/types/database';
import TrackCard from '@/components/TrackCard';
import { GENEROS, PROVINCIAS } from '@/types/database';
import {
  Search as SearchIcon, SlidersHorizontal, X, Music, Users,
  MapPin, BadgeCheck, ChevronDown,
} from 'lucide-react';

interface ProfileResult {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  tipo_perfil: string | null;
  provincia: string | null;
  verificado: boolean;
}

export default function SearchScreen() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [tracks, setTracks] = useState<TrackWithArtist[]>([]);
  const [profiles, setProfiles] = useState<ProfileResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filtroGenero, setFiltroGenero] = useState('');
  const [filtroProvincia, setFiltroProvincia] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim() && !filtroGenero && !filtroProvincia && !filtroTipo) {
      setTracks([]);
      setProfiles([]);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const [t, p] = await Promise.all([
        searchTracks(query),
        searchProfiles(
          query,
          filtroTipo ? (filtroTipo as 'artista' | 'produtor') : null,
          filtroProvincia || null
        ),
      ]);
      const filteredTracks = filtroGenero ? t.filter((tr) => tr.genero === filtroGenero) : t;
      setTracks(filteredTracks);
      setProfiles(p);
      setLoading(false);
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, filtroGenero, filtroProvincia, filtroTipo]);

  const hasResults = tracks.length > 0 || profiles.length > 0;
  const hasFilters = filtroGenero || filtroProvincia || filtroTipo;

  return (
    <div className="min-h-screen bg-black pb-32">
      <header className="px-6 pt-14 pb-4">
        <h1 className="text-2xl font-bold text-white mb-4">Pesquisar</h1>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <SearchIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Artistas, faixas, produtores..."
              className="w-full pl-12 pr-10 py-3.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-600 focus:border-amber-600 focus:outline-none transition-colors"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
              >
                <X size={18} />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all shrink-0 ${
              showFilters || hasFilters
                ? 'accent-gradient text-black glow-accent-sm'
                : 'bg-neutral-900 border border-neutral-800 text-neutral-400'
            }`}
          >
            <SlidersHorizontal size={18} />
          </button>
        </div>

        {/* Active filter chips */}
        {hasFilters && (
          <div className="flex flex-wrap gap-2 mt-3">
            {filtroGenero && (
              <button
                onClick={() => setFiltroGenero('')}
                className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-600/20 border border-amber-600/40 text-amber-400 text-xs"
              >
                {filtroGenero} <X size={12} />
              </button>
            )}
            {filtroProvincia && (
              <button
                onClick={() => setFiltroProvincia('')}
                className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-600/20 border border-amber-600/40 text-amber-400 text-xs"
              >
                {filtroProvincia} <X size={12} />
              </button>
            )}
            {filtroTipo && (
              <button
                onClick={() => setFiltroTipo('')}
                className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-600/20 border border-amber-600/40 text-amber-400 text-xs"
              >
                {filtroTipo === 'artista' ? 'Artista' : 'Produtor'} <X size={12} />
              </button>
            )}
          </div>
        )}
      </header>

      {/* Filters panel */}
      {showFilters && (
        <div className="px-6 mb-4 animate-fade-in">
          <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-4 space-y-4">
            <div>
              <label className="text-neutral-400 text-xs uppercase tracking-wider mb-2 block">Género</label>
              <div className="flex flex-wrap gap-2">
                {GENEROS.map((g) => (
                  <button
                    key={g}
                    onClick={() => setFiltroGenero(filtroGenero === g ? '' : g)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      filtroGenero === g
                        ? 'accent-gradient text-black'
                        : 'bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-neutral-400 text-xs uppercase tracking-wider mb-2 block">Província</label>
              <select
                value={filtroProvincia}
                onChange={(e) => setFiltroProvincia(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm focus:border-amber-600 focus:outline-none transition-colors"
              >
                <option value="">Todas as províncias</option>
                {PROVINCIAS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-neutral-400 text-xs uppercase tracking-wider mb-2 block">Tipo de perfil</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setFiltroTipo(filtroTipo === 'artista' ? '' : 'artista')}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    filtroTipo === 'artista' ? 'accent-gradient text-black' : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  Artista
                </button>
                <button
                  onClick={() => setFiltroTipo(filtroTipo === 'produtor' ? '' : 'produtor')}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    filtroTipo === 'produtor' ? 'accent-gradient text-black' : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  Produtor
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="px-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !query.trim() && !hasFilters ? (
          <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-neutral-800 mx-auto mb-3 flex items-center justify-center">
              <SearchIcon size={24} className="text-neutral-600" />
            </div>
            <p className="text-neutral-400 text-sm">Pesquisa por artistas, faixas ou usa os filtros para descobrir música.</p>
          </div>
        ) : !hasResults ? (
          <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-neutral-800 mx-auto mb-3 flex items-center justify-center">
              <SearchIcon size={24} className="text-neutral-600" />
            </div>
            <p className="text-white font-medium mb-1">Sem resultados</p>
            <p className="text-neutral-400 text-sm">Tenta com outras palavras ou ajusta os filtros.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {profiles.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Users size={16} className="text-amber-500" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Artistas e Produtores</h3>
                </div>
                <div className="space-y-2">
                  {profiles.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => navigate(p.tipo_perfil === 'produtor' ? `/produtor/${p.id}` : `/artista/${p.id}`)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-neutral-900 border border-neutral-800 card-elevate"
                    >
                      <div className="w-12 h-12 rounded-full bg-neutral-800 overflow-hidden shrink-0 ring-2 ring-neutral-700">
                        {p.avatar_url ? (
                          <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Music size={18} className="text-neutral-600" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center gap-1">
                          <p className="text-white font-medium text-sm truncate">{p.display_name || p.username}</p>
                          {p.verificado && <BadgeCheck size={14} className="text-amber-500 shrink-0" />}
                        </div>
                        <div className="flex items-center gap-2 text-neutral-500 text-xs">
                          <span>{p.tipo_perfil === 'artista' ? 'Artista' : p.tipo_perfil === 'produtor' ? 'Produtor' : 'Ouvinte'}</span>
                          {p.provincia && (
                            <>
                              <span>·</span>
                              <span className="flex items-center gap-0.5"><MapPin size={10} /> {p.provincia}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <ChevronDown size={16} className="text-neutral-600 -rotate-90" />
                    </button>
                  ))}
                </div>
              </section>
            )}

            {tracks.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Music size={16} className="text-amber-500" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Faixas</h3>
                </div>
                <div className="space-y-2">
                  {tracks.map((track) => (
                    <TrackCard key={track.id} track={track} queue={tracks} />
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
