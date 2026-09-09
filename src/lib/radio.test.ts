import { describe, it, expect } from 'vitest';
import { weightedShuffle } from './radio';
import type { TrackWithArtist } from '@/types/database';

function fakeTrack(id: string): TrackWithArtist {
  return {
    id,
    artist_id: 'artista-1',
    titulo: `Faixa ${id}`,
    capa_url: null,
    audio_url: null,
    duracao_segundos: 180,
    genero: 'Kizomba',
    explicita: false,
    permite_download: false,
    album_id: null,
    numero_faixa: null,
    publicada: true,
    criado_em: new Date().toISOString(),
  };
}

describe('weightedShuffle', () => {
  it('devolve o mesmo número de faixas que recebeu', () => {
    const tracks = [fakeTrack('1'), fakeTrack('2'), fakeTrack('3')];
    const resultado = weightedShuffle(tracks, new Map());
    expect(resultado).toHaveLength(3);
  });

  it('é uma permutação — nunca inventa nem perde faixas', () => {
    const tracks = [fakeTrack('a'), fakeTrack('b'), fakeTrack('c'), fakeTrack('d')];
    const resultado = weightedShuffle(tracks, new Map());
    const idsOriginais = tracks.map((t) => t.id).sort();
    const idsResultado = resultado.map((t) => t.id).sort();
    expect(idsResultado).toEqual(idsOriginais);
  });

  it('não rebenta com uma lista vazia', () => {
    expect(weightedShuffle([], new Map())).toEqual([]);
  });

  it('funciona mesmo sem pesos definidos (faixas novas, sem plays)', () => {
    const tracks = [fakeTrack('x'), fakeTrack('y')];
    const resultado = weightedShuffle(tracks, new Map());
    expect(resultado).toHaveLength(2);
  });

  it('não modifica o array original', () => {
    const tracks = [fakeTrack('1'), fakeTrack('2'), fakeTrack('3')];
    const copiaOriginal = [...tracks];
    weightedShuffle(tracks, new Map());
    expect(tracks).toEqual(copiaOriginal);
  });

  it('funciona com uma única faixa', () => {
    const tracks = [fakeTrack('solo')];
    expect(weightedShuffle(tracks, new Map())).toHaveLength(1);
  });

  it('não rebenta com pesos de valor 0 (faixa nunca ouvida ainda conta)', () => {
    const tracks = [fakeTrack('a'), fakeTrack('b')];
    const pesos = new Map([['a', 0], ['b', 0]]);
    const resultado = weightedShuffle(tracks, pesos);
    expect(resultado).toHaveLength(2);
  });

  it('inclui faixas mesmo quando só algumas têm peso definido', () => {
    const tracks = [fakeTrack('popular'), fakeTrack('nova')];
    const pesos = new Map([['popular', 500]]); // 'nova' fica sem entrada no mapa
    const resultado = weightedShuffle(tracks, pesos);
    const ids = resultado.map((t) => t.id).sort();
    expect(ids).toEqual(['nova', 'popular']);
  });
});
