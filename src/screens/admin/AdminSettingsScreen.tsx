import { useState, useEffect, useCallback } from 'react';
import {
  Wrench, Megaphone, ToggleLeft, Gauge, FileText, Tags, Save, Plus, X, Check, Crown, Trash2,
} from 'lucide-react';
import AdminShell from '@/components/AdminShell';
import { useAuth } from '@/context/AuthContext';
import { usePlatformSettings } from '@/context/PlatformSettingsContext';
import { updatePlatformSettings, type PlatformSettings } from '@/lib/platformSettings';
import { fetchAllPlans, createPlan, updatePlan, deletePlan, type SubscriptionPlan } from '@/lib/subscriptions';

type Section = 'manutencao' | 'banner' | 'funcionalidades' | 'limites' | 'legal' | 'generos' | 'premium';

const SECTIONS: { id: Section; label: string; icon: typeof Wrench }[] = [
  { id: 'manutencao', label: 'Manutenção', icon: Wrench },
  { id: 'banner', label: 'Banner', icon: Megaphone },
  { id: 'funcionalidades', label: 'Funcionalidades', icon: ToggleLeft },
  { id: 'premium', label: 'Premium', icon: Crown },
  { id: 'limites', label: 'Limites', icon: Gauge },
  { id: 'legal', label: 'Termos e Privacidade', icon: FileText },
  { id: 'generos', label: 'Géneros', icon: Tags },
];

export default function AdminSettingsScreen() {
  const { user } = useAuth();
  const { settings: liveSettings, refresh } = usePlatformSettings();
  const [section, setSection] = useState<Section>('manutencao');
  const [draft, setDraft] = useState<PlatformSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [novoGenero, setNovoGenero] = useState('');
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [newPlanNome, setNewPlanNome] = useState('');
  const [newPlanPreco, setNewPlanPreco] = useState('');
  const [newPlanDias, setNewPlanDias] = useState('30');

  useEffect(() => {
    if (liveSettings && !draft) setDraft(liveSettings);
  }, [liveSettings, draft]);

  useEffect(() => {
    fetchAllPlans().then(setPlans);
  }, []);

  const set = useCallback(<K extends keyof PlatformSettings>(key: K, value: PlatformSettings[K]) => {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
    setSaved(false);
  }, []);

  const handleSave = async () => {
    if (!draft || !user) return;
    setSaving(true);
    const result = await updatePlatformSettings(draft, user.id);
    setSaving(false);
    if (result.ok) {
      setSaved(true);
      await refresh();
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const addGenero = () => {
    if (!draft || !novoGenero.trim()) return;
    if (draft.generos.includes(novoGenero.trim())) return;
    set('generos', [...draft.generos, novoGenero.trim()]);
    setNovoGenero('');
  };

  const removeGenero = (g: string) => {
    if (!draft) return;
    set('generos', draft.generos.filter((x) => x !== g));
  };

  const handleAddPlan = async () => {
    const preco = parseFloat(newPlanPreco);
    const dias = parseInt(newPlanDias);
    if (!newPlanNome.trim() || !preco || preco <= 0 || !dias || dias <= 0) return;
    const result = await createPlan(newPlanNome.trim(), preco, dias);
    if (result.ok) {
      setNewPlanNome('');
      setNewPlanPreco('');
      setNewPlanDias('30');
      fetchAllPlans().then(setPlans);
    }
  };

  const handleTogglePlan = async (plan: SubscriptionPlan) => {
    const ok = await updatePlan(plan.id, { ativo: !plan.ativo });
    if (ok) setPlans((prev) => prev.map((p) => (p.id === plan.id ? { ...p, ativo: !p.ativo } : p)));
  };

  const handleDeletePlan = async (id: string) => {
    const ok = await deletePlan(id);
    if (ok) setPlans((prev) => prev.filter((p) => p.id !== id));
  };

  if (!draft) {
    return (
      <AdminShell active="configuracoes">
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell active="configuracoes">
      <div className="animate-fade-in pb-4">
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6 pb-1">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => setSection(s.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  section === s.id
                    ? 'bg-gradient-to-br from-cyan-500 to-violet-500 text-black font-bold'
                    : 'bg-neutral-900 border border-white/10 text-neutral-400'
                }`}
              >
                <Icon size={13} /> {s.label}
              </button>
            );
          })}
        </div>

        {section === 'manutencao' && (
          <div className="admin-glass p-4 space-y-4">
            <ToggleRow
              label="Modo de manutenção"
              description="Mostra um ecrã de manutenção a todos, exceto administradores."
              value={draft.manutencao_ativa}
              onChange={(v) => set('manutencao_ativa', v)}
            />
            <div>
              <label className="text-neutral-400 text-xs mb-2 block">Mensagem mostrada</label>
              <textarea
                value={draft.manutencao_mensagem || ''}
                onChange={(e) => set('manutencao_mensagem', e.target.value)}
                rows={2}
                className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-white/10 text-white text-sm resize-none focus:border-cyan-500/50 focus:outline-none"
              />
            </div>
          </div>
        )}

        {section === 'banner' && (
          <div className="admin-glass p-4 space-y-4">
            <ToggleRow
              label="Banner ativo"
              description="Mostra uma mensagem no topo da app para todos os utilizadores."
              value={draft.banner_ativo}
              onChange={(v) => set('banner_ativo', v)}
            />
            <div>
              <label className="text-neutral-400 text-xs mb-2 block">Mensagem</label>
              <input
                value={draft.banner_mensagem || ''}
                onChange={(e) => set('banner_mensagem', e.target.value)}
                placeholder="Ex: Nova funcionalidade: Rádio por província!"
                className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-white/10 text-white placeholder-neutral-600 text-sm focus:border-cyan-500/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-neutral-400 text-xs mb-2 block">Nível</label>
              <div className="flex gap-2">
                {(['info', 'aviso', 'urgente'] as const).map((nivel) => (
                  <button
                    key={nivel}
                    onClick={() => set('banner_nivel', nivel)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-all ${
                      draft.banner_nivel === nivel
                        ? 'bg-gradient-to-br from-cyan-500 to-violet-500 text-black font-bold'
                        : 'bg-neutral-900 border border-white/10 text-neutral-400'
                    }`}
                  >
                    {nivel}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-neutral-400 text-xs mb-2 block">Expira em (opcional)</label>
              <input
                type="datetime-local"
                value={draft.banner_expira_em ? draft.banner_expira_em.slice(0, 16) : ''}
                onChange={(e) => set('banner_expira_em', e.target.value ? new Date(e.target.value).toISOString() : null)}
                className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-white/10 text-white text-sm focus:border-cyan-500/50 focus:outline-none"
              />
            </div>
          </div>
        )}

        {section === 'funcionalidades' && (
          <div className="admin-glass p-4 space-y-4">
            <ToggleRow label="Uploads" description="Permitir publicar faixas novas." value={draft.uploads_ativados} onChange={(v) => set('uploads_ativados', v)} />
            <ToggleRow label="Comentários" description="Permitir comentar em faixas." value={draft.comentarios_ativados} onChange={(v) => set('comentarios_ativados', v)} />
            <ToggleRow label="Registos" description="Permitir criar contas novas." value={draft.registos_ativados} onChange={(v) => set('registos_ativados', v)} />
            <ToggleRow label="Playlists colaborativas" description="Permitir ativar colaboração em playlists." value={draft.playlists_colaborativas_ativadas} onChange={(v) => set('playlists_colaborativas_ativadas', v)} />
          </div>
        )}

        {section === 'premium' && (
          <div className="space-y-4">
            <div className="admin-glass p-4">
              <ToggleRow
                label="Vendas de Premium ativas"
                description="Quando desligado, ninguém consegue subscrever (mas continuas a poder dar Premium manualmente)."
                value={draft.premium_ativado}
                onChange={(v) => set('premium_ativado', v)}
              />
            </div>

            <div className="admin-glass p-4">
              <label className="text-neutral-400 text-xs mb-2 block">Instruções de pagamento</label>
              <textarea
                value={draft.pagamento_instrucoes || ''}
                onChange={(e) => set('pagamento_instrucoes', e.target.value)}
                rows={4}
                placeholder="Ex: Transfere para Multicaixa Express 9XX XXX XXX..."
                className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-white/10 text-white placeholder-neutral-600 text-sm resize-none focus:border-cyan-500/50 focus:outline-none"
              />
              <p className="text-neutral-600 text-[11px] mt-2">Mostrado a quem escolhe um plano. Atualiza sempre que mudares de número/conta.</p>
            </div>

            <div className="admin-glass p-4">
              <p className="text-neutral-400 text-xs mb-3">Planos</p>
              <div className="space-y-2 mb-4">
                {plans.map((p) => (
                  <div key={p.id} className="flex items-center gap-2 p-2.5 rounded-lg bg-neutral-900 border border-white/10">
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{p.nome}</p>
                      <p className="text-neutral-500 text-xs">{p.preco_kz.toLocaleString('pt-AO')} Kz — {p.duracao_dias} dias</p>
                    </div>
                    <button onClick={() => handleTogglePlan(p)} className={`px-2 py-1 rounded text-[10px] font-medium ${p.ativo ? 'bg-cyan-500/15 text-cyan-300' : 'bg-neutral-800 text-neutral-500'}`}>
                      {p.ativo ? 'Ativo' : 'Inativo'}
                    </button>
                    <button onClick={() => handleDeletePlan(p.id)} className="text-neutral-600 hover:text-red-400 p-1">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2 mb-2">
                <input value={newPlanNome} onChange={(e) => setNewPlanNome(e.target.value)} placeholder="Nome" className="col-span-1 px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white placeholder-neutral-600 text-xs focus:border-cyan-500/50 focus:outline-none" />
                <input value={newPlanPreco} onChange={(e) => setNewPlanPreco(e.target.value)} placeholder="Preço Kz" type="number" className="px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white placeholder-neutral-600 text-xs focus:border-cyan-500/50 focus:outline-none" />
                <input value={newPlanDias} onChange={(e) => setNewPlanDias(e.target.value)} placeholder="Dias" type="number" className="px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white placeholder-neutral-600 text-xs focus:border-cyan-500/50 focus:outline-none" />
              </div>
              <button onClick={handleAddPlan} className="w-full py-2 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-500 text-black font-bold text-xs flex items-center justify-center gap-1">
                <Plus size={13} /> Adicionar plano
              </button>
            </div>
          </div>
        )}

        {section === 'limites' && (
          <div className="admin-glass p-4 space-y-4">
            <div>
              <label className="text-neutral-400 text-xs mb-2 block">Faixas por hora, por artista</label>
              <input
                type="number"
                min={1}
                value={draft.rate_limit_faixas_por_hora}
                onChange={(e) => set('rate_limit_faixas_por_hora', Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-white/10 text-white text-sm focus:border-cyan-500/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-neutral-400 text-xs mb-2 block">Denúncias por dia, por utilizador</label>
              <input
                type="number"
                min={1}
                value={draft.rate_limit_denuncias_por_dia}
                onChange={(e) => set('rate_limit_denuncias_por_dia', Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-white/10 text-white text-sm focus:border-cyan-500/50 focus:outline-none"
              />
            </div>
          </div>
        )}

        {section === 'legal' && (
          <div className="space-y-4">
            <div className="admin-glass p-4">
              <label className="text-neutral-400 text-xs mb-2 block">Termos de Uso</label>
              <textarea
                value={draft.termos_uso || ''}
                onChange={(e) => set('termos_uso', e.target.value)}
                rows={10}
                className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-white/10 text-white text-sm resize-none focus:border-cyan-500/50 focus:outline-none font-mono"
              />
              <p className="text-neutral-600 text-[11px] mt-2">Usa **texto** para títulos de secção a negrito. Parágrafos separados por linha em branco.</p>
            </div>
            <div className="admin-glass p-4">
              <label className="text-neutral-400 text-xs mb-2 block">Política de Privacidade</label>
              <textarea
                value={draft.politica_privacidade || ''}
                onChange={(e) => set('politica_privacidade', e.target.value)}
                rows={10}
                className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-white/10 text-white text-sm resize-none focus:border-cyan-500/50 focus:outline-none font-mono"
              />
            </div>
          </div>
        )}

        {section === 'generos' && (
          <div className="admin-glass p-4">
            <div className="flex gap-2 mb-4">
              <input
                value={novoGenero}
                onChange={(e) => setNovoGenero(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addGenero()}
                placeholder="Novo género..."
                className="flex-1 px-4 py-3 rounded-xl bg-neutral-900 border border-white/10 text-white placeholder-neutral-600 text-sm focus:border-cyan-500/50 focus:outline-none"
              />
              <button onClick={addGenero} className="px-4 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-500 text-black font-bold">
                <Plus size={18} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {draft.generos.map((g) => (
                <span key={g} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-900 border border-white/10 text-neutral-300 text-xs">
                  {g}
                  <button onClick={() => removeGenero(g)} className="text-neutral-600 hover:text-red-400">
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full mt-6 py-3.5 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-500 text-black font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2 sticky bottom-24"
        >
          {saving ? 'A guardar...' : saved ? <><Check size={16} /> Guardado</> : <><Save size={16} /> Guardar alterações</>}
        </button>
      </div>
    </AdminShell>
  );
}

function ToggleRow({
  label, description, value, onChange,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-white text-sm font-medium">{label}</p>
        <p className="text-neutral-500 text-xs">{description}</p>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`w-12 h-7 rounded-full transition-colors relative shrink-0 ${value ? 'bg-gradient-to-r from-cyan-500 to-violet-500' : 'bg-neutral-700'}`}
      >
        <span className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );
}
