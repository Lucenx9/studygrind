import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ExportImport } from '@/components/settings/ExportImport';
import { clearAllData } from '@/lib/storage';
import { fetchOpenRouterModels, fetchDirectModels, type ModelInfo } from '@/lib/models';
import { t } from '@/lib/i18n';
import type { Settings, ProviderConfig, DirectProvider } from '@/lib/types';
import { Key, Globe, Palette, Trash2, Check, Loader2, RefreshCw, AlertTriangle, Database, Shield, Info } from 'lucide-react';
import { toast } from 'sonner';

interface SettingsPageProps {
  settings: Settings;
  onUpdate: (partial: Partial<Settings>) => void;
}

type SettingsSection = 'openrouter' | 'direct' | 'oauth' | 'preferences' | 'data' | 'danger';

export function SettingsPage({ settings, onUpdate }: SettingsPageProps) {
  const lang = settings.language;
  const [activeSection, setActiveSection] = useState<SettingsSection>('openrouter');

  // OpenRouter state
  const [openRouterKey, setOpenRouterKey] = useState(settings.provider?.method === 'openrouter' ? settings.provider.apiKey : '');
  const [openRouterModel, setOpenRouterModel] = useState(settings.provider?.method === 'openrouter' ? settings.provider.model : 'openai/gpt-4o-mini');
  const [openRouterModels, setOpenRouterModels] = useState<ModelInfo[]>([]);
  const [openRouterLoading, setOpenRouterLoading] = useState(false);
  const [openRouterError, setOpenRouterError] = useState<string | null>(null);
  const [openRouterSearch, setOpenRouterSearch] = useState('');

  // Direct API state
  const [directProvider, setDirectProvider] = useState<DirectProvider>(settings.provider?.method === 'direct' ? settings.provider.provider : 'openai');
  const [directKey, setDirectKey] = useState(settings.provider?.method === 'direct' ? settings.provider.apiKey : '');
  const [directModel, setDirectModel] = useState(settings.provider?.method === 'direct' ? settings.provider.model : 'gpt-4o-mini');
  const [directModels, setDirectModels] = useState<ModelInfo[]>([]);
  const [directLoading, setDirectLoading] = useState(false);
  const [directError, setDirectError] = useState<string | null>(null);
  const [directSearch, setDirectSearch] = useState('');

  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  // Section refs
  const sectionRefs = useRef<Record<SettingsSection, HTMLElement | null>>({
    openrouter: null, direct: null, oauth: null, preferences: null, data: null, danger: null,
  });

  // Debounced slider
  const [localQpg, setLocalQpg] = useState(settings.questionsPerGeneration);
  const sliderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);
  const handleSliderChange = useCallback((val: number | readonly number[]) => {
    const v = Array.isArray(val) ? val[0] : val;
    setLocalQpg(v);
    if (sliderTimerRef.current) clearTimeout(sliderTimerRef.current);
    sliderTimerRef.current = setTimeout(() => onUpdate({ questionsPerGeneration: v }), 500);
  }, [onUpdate]);

  useEffect(() => { setLocalQpg(settings.questionsPerGeneration); }, [settings.questionsPerGeneration]);
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (sliderTimerRef.current) clearTimeout(sliderTimerRef.current);
    };
  }, []);

  const filteredOpenRouterModels = useMemo(() => {
    if (!openRouterSearch.trim()) return openRouterModels;
    const q = openRouterSearch.toLowerCase();
    return openRouterModels.filter(m => m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q));
  }, [openRouterModels, openRouterSearch]);

  const filteredDirectModels = useMemo(() => {
    if (!directSearch.trim()) return directModels;
    const q = directSearch.toLowerCase();
    return directModels.filter(m => m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q));
  }, [directModels, directSearch]);

  const activeMethod = settings.provider?.method ?? null;

  const lastOpenRouterKeyRef = useRef('');
  const lastDirectKeyRef = useRef('');
  const lastDirectProviderRef = useRef<DirectProvider>(directProvider);

  const cleanKey = (key: string) => key.replace(/\s+/g, '');

  const handleFetchOpenRouterModels = async () => {
    if (!openRouterKey.trim()) return;
    const cleaned = cleanKey(openRouterKey);
    const forceRefresh = cleaned !== lastOpenRouterKeyRef.current;
    lastOpenRouterKeyRef.current = cleaned;
    setOpenRouterLoading(true); setOpenRouterError(null);
    try {
      const models = await fetchOpenRouterModels(cleaned, forceRefresh);
      if (!isMountedRef.current) return;
      setOpenRouterModels(models);
      if (models.length > 0 && !openRouterModel) setOpenRouterModel(models[0].id);
    } catch {
      if (!isMountedRef.current) return;
      setOpenRouterError(t('settings.modelFetchError', lang));
    } finally {
      if (isMountedRef.current) setOpenRouterLoading(false);
    }
  };

  const handleFetchDirectModels = async () => {
    if (!directKey.trim()) return;
    const cleaned = cleanKey(directKey);
    const forceRefresh = cleaned !== lastDirectKeyRef.current || directProvider !== lastDirectProviderRef.current;
    lastDirectKeyRef.current = cleaned;
    lastDirectProviderRef.current = directProvider;
    setDirectLoading(true); setDirectError(null);
    try {
      const models = await fetchDirectModels(directProvider, cleaned, forceRefresh);
      if (!isMountedRef.current) return;
      setDirectModels(models);
      if (models.length > 0 && !directModel) setDirectModel(models[0].id);
    } catch {
      if (!isMountedRef.current) return;
      setDirectError(t('settings.modelFetchError', lang));
    } finally {
      if (isMountedRef.current) setDirectLoading(false);
    }
  };

  const saveOpenRouter = () => {
    if (!openRouterKey.trim() || !openRouterModel) return;
    const config: ProviderConfig = { method: 'openrouter', apiKey: cleanKey(openRouterKey), model: openRouterModel };
    onUpdate({ provider: config });
    toast.success(t('settings.openrouterConnectedToast', lang));
  };

  const saveDirect = () => {
    if (!directKey.trim() || !directModel) return;
    const config: ProviderConfig = { method: 'direct', provider: directProvider, apiKey: cleanKey(directKey), model: directModel };
    onUpdate({ provider: config });
    toast.success(t('settings.providerConnectedToast', lang));
  };

  const handleClearAll = () => {
    clearAllData();
    try {
      localStorage.removeItem('studygrind_onboarding_done');
      localStorage.removeItem('studygrind_active_session');
    } catch {
      window.dispatchEvent(new CustomEvent('studygrind:storage-error', {
        detail: { message: 'Unable to clear all local data.' },
      }));
    }
    setClearDialogOpen(false);
    window.location.reload();
  };

  const scrollToSection = (section: SettingsSection) => {
    setActiveSection(section);
    sectionRefs.current[section]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const NAV_SECTIONS: { group: string; items: { key: SettingsSection; label: string; icon: typeof Key }[] }[] = [
    {
      group: lang === 'it' ? 'CONNESSIONE' : 'CONNECTION',
      items: [
        { key: 'openrouter', label: t('settings.openrouter', lang), icon: Key },
        { key: 'direct', label: t('settings.directKey', lang), icon: Key },
        { key: 'oauth', label: t('settings.oauth', lang), icon: Shield },
      ],
    },
    {
      group: lang === 'it' ? 'PREFERENZE' : 'PREFERENCES',
      items: [
        { key: 'preferences', label: t('settings.preferences', lang), icon: Globe },
      ],
    },
    {
      group: lang === 'it' ? 'DATI' : 'DATA',
      items: [
        { key: 'data', label: t('settings.dataManagement', lang), icon: Database },
        { key: 'danger', label: t('settings.clearAllData', lang), icon: Trash2 },
      ],
    },
  ];

  return (
    <div className="animate-fade-in-up space-y-6">
      {/* ── Header ── */}
      <div>
        <h1 className="text-[28px] font-bold tracking-[-0.025em]">{t('settings.title', lang)}</h1>
        <p className="mt-1 text-base text-muted-foreground">{t('settings.subtitle', lang)}</p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[220px_minmax(0,1fr)]">
        {/* ── Left nav ── */}
        <aside className="space-y-1 xl:sticky xl:top-8 self-start">
          {NAV_SECTIONS.map(({ group, items }) => (
            <div key={group}>
              <p className="text-tertiary px-3 pt-4 pb-2">{group}</p>
              {items.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => scrollToSection(key)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all duration-150 ${
                    activeSection === key
                      ? 'bg-[rgba(99,102,241,0.08)] text-foreground font-medium'
                      : 'text-muted-foreground hover:bg-[rgba(255,255,255,0.04)] hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                  <span className="truncate">{label}</span>
                  {key === 'openrouter' && activeMethod === 'openrouter' && (
                    <span className="ml-auto h-2 w-2 rounded-full bg-[#34d399]" />
                  )}
                  {key === 'direct' && activeMethod === 'direct' && (
                    <span className="ml-auto h-2 w-2 rounded-full bg-[#34d399]" />
                  )}
                </button>
              ))}
            </div>
          ))}
        </aside>

        {/* ── Right content ── */}
        <div className="space-y-5">
          {/* Info banner */}
          <div className="flex items-start gap-3 rounded-xl border-l-[3px] border-[#60a5fa] bg-[rgba(96,165,250,0.06)] px-4 py-3">
            <Info className="h-4 w-4 mt-0.5 text-[#60a5fa] shrink-0" />
            <p className="text-sm text-muted-foreground">
              {lang === 'it'
                ? 'I dati sono salvati localmente nel browser. Nessun dato viene inviato ai nostri server.'
                : 'Data is stored locally in your browser. Nothing is sent to our servers.'}
            </p>
          </div>

          {/* OpenRouter */}
          <section ref={el => { sectionRefs.current.openrouter = el; }} className="scroll-mt-8">
            <Card>
              <CardContent className="space-y-5 px-6 py-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold tracking-[-0.02em]">{t('settings.openrouter', lang)}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{t('settings.openrouterDesc', lang)}</p>
                  </div>
                  {activeMethod === 'openrouter' && (
                    <Badge className="sg-btn-accent border-0 text-white gap-1"><Check className="h-3 w-3" /> {t('settings.connected', lang)}</Badge>
                  )}
                </div>
                <form className="space-y-4" onSubmit={e => { e.preventDefault(); saveOpenRouter(); }}>
                  <div className="space-y-2">
                    <Label>{t('settings.apiKey', lang)}</Label>
                    <div className="flex gap-2">
                      <Input type="password" value={openRouterKey} onChange={e => setOpenRouterKey(e.target.value)} placeholder="sk-or-..." className="flex-1" />
                      <Button type="button" variant="outline" size="icon" onClick={handleFetchOpenRouterModels} disabled={!openRouterKey.trim() || openRouterLoading} title={t('settings.fetchModels', lang)} aria-label={t('settings.fetchModels', lang)}>
                        {openRouterLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  {openRouterError && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>{t('settings.modelsUnavailable', lang)}</AlertTitle>
                      <AlertDescription>{openRouterError}</AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-2">
                    <Label>{t('settings.model', lang)}</Label>
                    {openRouterModels.length > 0 ? (
                      <>
                        <Input value={openRouterSearch} onChange={e => setOpenRouterSearch(e.target.value)} placeholder={t('settings.searchModel', lang)} className="mb-2" />
                        <Select value={openRouterModel} onValueChange={(v: string | null) => { if (v) { setOpenRouterModel(v); setOpenRouterSearch(''); } }}>
                          <SelectTrigger><SelectValue placeholder={t('settings.selectModel', lang)} /></SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            {filteredOpenRouterModels.map(m => (<SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>))}
                            {filteredOpenRouterModels.length === 0 && (<div className="px-3 py-2 text-sm text-muted-foreground">{t('settings.noResults', lang)}</div>)}
                          </SelectContent>
                        </Select>
                      </>
                    ) : (
                      <Input value={openRouterModel} onChange={e => setOpenRouterModel(e.target.value)} placeholder="openai/gpt-4o-mini" />
                    )}
                    {openRouterModels.length === 0 && openRouterKey.trim() && (
                      <p className="text-xs text-muted-foreground">{t('settings.noModels', lang)}</p>
                    )}
                  </div>
                  <Button variant="accent" type="submit" disabled={!openRouterKey.trim() || !openRouterModel || openRouterLoading}>
                    {activeMethod === 'openrouter' ? t('settings.update', lang) : t('settings.connect', lang)}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </section>

          {/* Direct API */}
          <section ref={el => { sectionRefs.current.direct = el; }} className="scroll-mt-8">
            <Card>
              <CardContent className="space-y-5 px-6 py-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold tracking-[-0.02em]">{t('settings.directKey', lang)}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{t('settings.directKeyDesc', lang)}</p>
                  </div>
                  {activeMethod === 'direct' && (
                    <Badge className="sg-btn-accent border-0 text-white gap-1"><Check className="h-3 w-3" /> {t('settings.connected', lang)}</Badge>
                  )}
                </div>
                <form className="space-y-4" onSubmit={e => { e.preventDefault(); saveDirect(); }}>
                  <div className="space-y-2">
                    <Label>{t('settings.provider', lang)}</Label>
                    <Select value={directProvider} onValueChange={(v: string | null) => {
                      if (v !== 'openai' && v !== 'anthropic' && v !== 'google') return;
                      setDirectProvider(v); setDirectModel(''); setDirectModels([]);
                    }}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="openai">OpenAI</SelectItem>
                        <SelectItem value="anthropic">Anthropic</SelectItem>
                        <SelectItem value="google">Google</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('settings.apiKey', lang)}</Label>
                    <div className="flex gap-2">
                      <Input type="password" value={directKey} onChange={e => setDirectKey(e.target.value)} placeholder="sk-..." className="flex-1" />
                      <Button type="button" variant="outline" size="icon" onClick={handleFetchDirectModels} disabled={!directKey.trim() || directLoading} title={t('settings.fetchModels', lang)} aria-label={t('settings.fetchModels', lang)}>
                        {directLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  {directError && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>{t('settings.modelsUnavailable', lang)}</AlertTitle>
                      <AlertDescription>{directError}</AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-2">
                    <Label>{t('settings.model', lang)}</Label>
                    {directModels.length > 0 ? (
                      <>
                        <Input value={directSearch} onChange={e => setDirectSearch(e.target.value)} placeholder={t('settings.searchModel', lang)} className="mb-2" />
                        <Select value={directModel} onValueChange={(v: string | null) => { if (v) { setDirectModel(v); setDirectSearch(''); } }}>
                          <SelectTrigger><SelectValue placeholder={t('settings.selectModel', lang)} /></SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            {filteredDirectModels.map(m => (<SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </>
                    ) : (
                      <Input value={directModel} onChange={e => setDirectModel(e.target.value)} placeholder="gpt-4o-mini" />
                    )}
                  </div>
                  <Button variant="accent" type="submit" disabled={!directKey.trim() || !directModel || directLoading}>
                    {activeMethod === 'direct' ? t('settings.update', lang) : t('settings.connect', lang)}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </section>

          {/* OAuth */}
          <section ref={el => { sectionRefs.current.oauth = el; }} className="scroll-mt-8">
            <Card className="opacity-60">
              <CardContent className="space-y-4 px-6 py-6">
                <div>
                  <h2 className="text-xl font-bold tracking-[-0.02em]">{t('settings.oauth', lang)}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{t('settings.oauthDesc', lang)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" disabled>{t('settings.signInWith', lang)} OpenAI</Button>
                  <Button variant="outline" disabled>{t('settings.signInWith', lang)} Google</Button>
                  <Button variant="outline" disabled>{t('settings.signInWith', lang)} Claude</Button>
                </div>
                <p className="text-xs text-muted-foreground">{t('settings.oauthConfigure', lang)}</p>
              </CardContent>
            </Card>
          </section>

          {/* Preferences */}
          <section ref={el => { sectionRefs.current.preferences = el; }} className="scroll-mt-8">
            <Card>
              <CardContent className="space-y-6 px-6 py-6">
                <h2 className="text-xl font-bold tracking-[-0.02em]">{t('settings.preferences', lang)}</h2>

                {/* Language + Theme */}
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-[rgba(255,255,255,0.03)] p-4">
                    <div>
                      <Label className="font-semibold">{t('settings.language', lang)}</Label>
                      <p className="text-xs leading-5 text-muted-foreground mt-1">{t('settings.languageDescLong', lang)}</p>
                    </div>
                    <Select value={settings.language} onValueChange={(v: string | null) => {
                      if (v !== 'it' && v !== 'en') return;
                      onUpdate({ language: v });
                    }}>
                      <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="it">Italiano</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-[rgba(255,255,255,0.03)] p-4">
                    <div>
                      <Label className="flex items-center gap-2 font-semibold"><Palette className="h-4 w-4" /> {t('settings.theme', lang)}</Label>
                      <p className="text-xs leading-5 text-muted-foreground mt-1">{t('settings.themeDesc', lang)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{t('settings.dark', lang)}</span>
                      <Switch checked={settings.theme === 'light'} onCheckedChange={checked => onUpdate({ theme: checked ? 'light' : 'dark' })} />
                      <span className="text-sm text-muted-foreground">{t('settings.light', lang)}</span>
                    </div>
                  </div>
                </div>

                {/* Questions per generation */}
                <div className="rounded-xl border border-border bg-[rgba(255,255,255,0.03)] p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="font-semibold">{t('settings.questionsPerGen', lang)}</Label>
                      <span className="text-sm font-bold tabular-nums text-primary">{localQpg}</span>
                    </div>
                    <Slider value={[localQpg]} onValueChange={handleSliderChange} min={10} max={30} step={1} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Data management */}
          <section ref={el => { sectionRefs.current.data = el; }} className="scroll-mt-8">
            <ExportImport language={lang} />
          </section>

          {/* Danger zone */}
          <section ref={el => { sectionRefs.current.danger = el; }} className="scroll-mt-8">
            <Card className="border-[rgba(248,113,113,0.25)]">
              <CardContent className="space-y-4 px-6 py-6">
                <h2 className="text-xl font-bold tracking-[-0.02em] text-destructive">{t('settings.clearAllData', lang)}</h2>
                <p className="text-sm leading-6 text-muted-foreground">{t('settings.dangerDesc', lang)}</p>
                <Button variant="destructive" className="w-full gap-2" onClick={() => setClearDialogOpen(true)}>
                  <Trash2 className="h-4 w-4" /> {t('settings.clearAllData', lang)}
                </Button>
                <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t('settings.clearConfirmTitle', lang)}</DialogTitle>
                      <DialogDescription>{t('settings.clearConfirmDesc', lang)}</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setClearDialogOpen(false)}>{t('common.cancel', lang)}</Button>
                      <Button variant="destructive" onClick={handleClearAll}>{t('settings.deleteEverything', lang)}</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
