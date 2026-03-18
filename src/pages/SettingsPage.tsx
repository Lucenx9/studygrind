import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ExportImport } from '@/components/settings/ExportImport';
import { fetchDirectModels, fetchOpenRouterModels, type ModelInfo } from '@/lib/models';
import { clearAllData } from '@/lib/storage';
import { t } from '@/lib/i18n';
import type { DirectProvider, ProviderConfig, Settings } from '@/lib/types';
import { cn } from '@/lib/utils';
import { AlertTriangle, Check, Database, Eye, EyeOff, Info, Key, Loader2, Palette, RefreshCw, Search, Shield, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface SettingsPageProps {
  settings: Settings;
  onUpdate: (partial: Partial<Settings>) => void;
}

type SettingsSection = 'openrouter' | 'direct' | 'oauth' | 'preferences' | 'data' | 'danger';

export function SettingsPage({ settings, onUpdate }: SettingsPageProps) {
  const lang = settings.language;
  const [activeSection, setActiveSection] = useState<SettingsSection>('openrouter');
  const [navSearch, setNavSearch] = useState('');

  const [openRouterKey, setOpenRouterKey] = useState(settings.provider?.method === 'openrouter' ? settings.provider.apiKey : '');
  const [openRouterModel, setOpenRouterModel] = useState(settings.provider?.method === 'openrouter' ? settings.provider.model : 'openai/gpt-4o-mini');
  const [openRouterModels, setOpenRouterModels] = useState<ModelInfo[]>([]);
  const [openRouterLoading, setOpenRouterLoading] = useState(false);
  const [openRouterError, setOpenRouterError] = useState<string | null>(null);
  const [openRouterSearch, setOpenRouterSearch] = useState('');
  const [showOpenRouterKey, setShowOpenRouterKey] = useState(false);

  const [directProvider, setDirectProvider] = useState<DirectProvider>(settings.provider?.method === 'direct' ? settings.provider.provider : 'openai');
  const [directKey, setDirectKey] = useState(settings.provider?.method === 'direct' ? settings.provider.apiKey : '');
  const [directModel, setDirectModel] = useState(settings.provider?.method === 'direct' ? settings.provider.model : 'gpt-4o-mini');
  const [directModels, setDirectModels] = useState<ModelInfo[]>([]);
  const [directLoading, setDirectLoading] = useState(false);
  const [directError, setDirectError] = useState<string | null>(null);
  const [directSearch, setDirectSearch] = useState('');
  const [showDirectKey, setShowDirectKey] = useState(false);

  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [localQpg, setLocalQpg] = useState(settings.questionsPerGeneration);
  const sliderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  const sectionRefs = useRef<Record<SettingsSection, HTMLElement | null>>({
    openrouter: null,
    direct: null,
    oauth: null,
    preferences: null,
    data: null,
    danger: null,
  });

  useEffect(() => { setLocalQpg(settings.questionsPerGeneration); }, [settings.questionsPerGeneration]);
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (sliderTimerRef.current) clearTimeout(sliderTimerRef.current);
    };
  }, []);

  const handleSliderChange = useCallback((value: number | readonly number[]) => {
    const nextValue = Array.isArray(value) ? value[0] : value;
    setLocalQpg(nextValue);
    if (sliderTimerRef.current) clearTimeout(sliderTimerRef.current);
    sliderTimerRef.current = setTimeout(() => onUpdate({ questionsPerGeneration: nextValue }), 500);
  }, [onUpdate]);

  const filteredOpenRouterModels = useMemo(() => {
    if (!openRouterSearch.trim()) return openRouterModels;
    const query = openRouterSearch.toLowerCase();
    return openRouterModels.filter((model) => model.name.toLowerCase().includes(query) || model.id.toLowerCase().includes(query));
  }, [openRouterModels, openRouterSearch]);

  const filteredDirectModels = useMemo(() => {
    if (!directSearch.trim()) return directModels;
    const query = directSearch.toLowerCase();
    return directModels.filter((model) => model.name.toLowerCase().includes(query) || model.id.toLowerCase().includes(query));
  }, [directModels, directSearch]);

  const cleanKey = (key: string) => key.replace(/\s+/g, '');
  const activeMethod = settings.provider?.method ?? null;
  const lastOpenRouterKeyRef = useRef('');
  const lastDirectKeyRef = useRef('');
  const lastDirectProviderRef = useRef<DirectProvider>(directProvider);

  const handleFetchOpenRouterModels = async () => {
    if (!openRouterKey.trim()) return;
    const cleaned = cleanKey(openRouterKey);
    const forceRefresh = cleaned !== lastOpenRouterKeyRef.current;
    lastOpenRouterKeyRef.current = cleaned;
    setOpenRouterLoading(true);
    setOpenRouterError(null);
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
    setDirectLoading(true);
    setDirectError(null);
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

  const navSections = [
    {
      group: lang === 'it' ? 'CONNESSIONE' : 'CONNECTION',
      items: [
        { key: 'openrouter' as const, label: t('settings.openrouter', lang), icon: Key },
        { key: 'direct' as const, label: t('settings.directKey', lang), icon: Key },
        { key: 'oauth' as const, label: t('settings.oauth', lang), icon: Shield },
      ],
    },
    {
      group: lang === 'it' ? 'PREFERENZE' : 'PREFERENCES',
      items: [
        { key: 'preferences' as const, label: t('settings.preferences', lang), icon: Palette },
      ],
    },
    {
      group: lang === 'it' ? 'DATI' : 'DATA',
      items: [
        { key: 'data' as const, label: t('settings.dataManagement', lang), icon: Database },
        { key: 'danger' as const, label: t('settings.clearAllData', lang), icon: Trash2 },
      ],
    },
  ];

  const filteredNavSections = navSections
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.label.toLowerCase().includes(navSearch.trim().toLowerCase())),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="sg-page-enter space-y-6">
      <div className="space-y-2">
        <h1 className="sg-h1">{t('settings.title', lang)}</h1>
        <p className="sg-subtitle">{t('settings.subtitle', lang)}</p>
      </div>

      <div className="rounded-[28px] border border-[color:var(--sg-border-1)] bg-[color:var(--sg-surface-overlay)] p-3 shadow-[var(--sg-overlay-shadow)] backdrop-blur-2xl lg:p-4 xl:max-h-[80vh] xl:overflow-hidden">
        <div className="grid gap-4 xl:min-h-[calc(80vh-2rem)] xl:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="self-start rounded-[24px] border border-[color:var(--sg-border-1)] bg-[color:var(--sg-surface-1)] p-4 xl:max-h-[calc(80vh-2rem)] xl:overflow-y-auto">
            <div className="space-y-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={navSearch}
                  onChange={(event) => setNavSearch(event.target.value)}
                  placeholder={lang === 'it' ? 'Cerca impostazioni...' : 'Search settings...'}
                  className="pl-10"
                />
              </div>

              {filteredNavSections.length > 0 ? filteredNavSections.map((group) => (
                <div key={group.group} className="space-y-1">
                  <p className="px-3 py-1 text-tertiary">{group.group}</p>
                  {group.items.map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => scrollToSection(key)}
                      className={cn(
                        'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-all',
                        activeSection === key
                          ? 'bg-[rgba(99,102,241,0.1)] text-foreground'
                          : 'text-muted-foreground hover:bg-[color:var(--sg-surface-2)] hover:text-foreground',
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                      <span className="truncate">{label}</span>
                      {((key === 'openrouter' && activeMethod === 'openrouter') || (key === 'direct' && activeMethod === 'direct')) && (
                        <span className="ml-auto h-2 w-2 rounded-full bg-[#34d399]" />
                      )}
                    </button>
                  ))}
                </div>
              )) : (
                <p className="text-sm text-muted-foreground">{lang === 'it' ? 'Nessuna sezione trovata.' : 'No matching sections.'}</p>
              )}
            </div>
          </aside>

          <div className="space-y-5 xl:max-h-[calc(80vh-2rem)] xl:overflow-y-auto xl:pr-1">
            <Alert>
              <Info className="h-4 w-4 text-[#60a5fa]" />
              <AlertTitle>{lang === 'it' ? 'Privacy locale' : 'Local privacy'}</AlertTitle>
              <AlertDescription>
                {lang === 'it'
                  ? 'I dati restano nel browser. Le richieste al modello partono solo verso il provider che colleghi qui.'
                  : 'Your data stays in the browser. Model requests only go to the provider you connect here.'}
              </AlertDescription>
            </Alert>

            <section ref={(element) => { sectionRefs.current.openrouter = element; }} className="scroll-mt-8">
              <Card>
                <CardContent className="space-y-5 px-6 py-6">
                  <SectionHeader
                    title={t('settings.openrouter', lang)}
                    description={t('settings.openrouterDesc', lang)}
                    badge={activeMethod === 'openrouter' ? <ConnectedBadge label={t('settings.connected', lang)} /> : null}
                  />

                  <SettingsRow title={t('settings.apiKey', lang)} description={lang === 'it' ? 'Usa una singola chiave per accedere a più modelli da un unico endpoint.' : 'Use one key to access multiple models from a single endpoint.'}>
                    <div className="flex w-full gap-2">
                      <Input
                        type={showOpenRouterKey ? 'text' : 'password'}
                        value={openRouterKey}
                        onChange={(event) => setOpenRouterKey(event.target.value)}
                        placeholder="sk-or-..."
                        className="flex-1"
                      />
                      <Button type="button" variant="outline" size="icon-sm" onClick={() => setShowOpenRouterKey((value) => !value)} aria-label={lang === 'it' ? 'Mostra chiave' : 'Show key'}>
                        {showOpenRouterKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button type="button" variant="outline" size="icon-sm" onClick={handleFetchOpenRouterModels} disabled={!openRouterKey.trim() || openRouterLoading} aria-label={t('settings.fetchModels', lang)}>
                        {openRouterLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                      </Button>
                    </div>
                  </SettingsRow>

                  {openRouterError && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>{t('settings.modelsUnavailable', lang)}</AlertTitle>
                      <AlertDescription>{openRouterError}</AlertDescription>
                    </Alert>
                  )}

                  <SettingsRow title={t('settings.model', lang)} description={lang === 'it' ? 'Cerca, seleziona o inserisci manualmente il modello da usare.' : 'Search, pick, or manually enter the model you want to use.'}>
                    <div className="w-full space-y-2">
                      {openRouterModels.length > 0 ? (
                        <>
                          <Input value={openRouterSearch} onChange={(event) => setOpenRouterSearch(event.target.value)} placeholder={t('settings.searchModel', lang)} />
                          <Select value={openRouterModel} onValueChange={(value: string | null) => { if (value) { setOpenRouterModel(value); setOpenRouterSearch(''); } }}>
                            <SelectTrigger className="w-full"><SelectValue placeholder={t('settings.selectModel', lang)} /></SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                              {filteredOpenRouterModels.map((model) => (
                                <SelectItem key={model.id} value={model.id}>{model.name}</SelectItem>
                              ))}
                              {filteredOpenRouterModels.length === 0 && (
                                <div className="px-3 py-2 text-sm text-muted-foreground">{t('settings.noResults', lang)}</div>
                              )}
                            </SelectContent>
                          </Select>
                        </>
                      ) : (
                        <Input value={openRouterModel} onChange={(event) => setOpenRouterModel(event.target.value)} placeholder="openai/gpt-4o-mini" />
                      )}
                    </div>
                  </SettingsRow>

                  <div className="flex justify-end">
                    <Button variant="accent" onClick={saveOpenRouter} disabled={!openRouterKey.trim() || !openRouterModel || openRouterLoading}>
                      {activeMethod === 'openrouter' ? t('settings.update', lang) : t('settings.connect', lang)}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section ref={(element) => { sectionRefs.current.direct = element; }} className="scroll-mt-8">
              <Card>
                <CardContent className="space-y-5 px-6 py-6">
                  <SectionHeader
                    title={t('settings.directKey', lang)}
                    description={t('settings.directKeyDesc', lang)}
                    badge={activeMethod === 'direct' ? <ConnectedBadge label={t('settings.connected', lang)} /> : null}
                  />

                  <SettingsRow title={t('settings.provider', lang)} description={lang === 'it' ? 'Scegli il provider diretto da collegare con la tua chiave personale.' : 'Choose the direct provider you want to connect with your own key.'}>
                    <div className="grid w-full gap-2 sm:grid-cols-3">
                      {([
                        { key: 'openai', label: 'OpenAI' },
                        { key: 'anthropic', label: 'Anthropic' },
                        { key: 'google', label: 'Google' },
                      ] satisfies { key: DirectProvider; label: string }[]).map((provider) => (
                        <button
                          key={provider.key}
                          type="button"
                          onClick={() => {
                            setDirectProvider(provider.key);
                            setDirectModel('');
                            setDirectModels([]);
                          }}
                          className={cn(
                            'flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-medium transition-all',
                            directProvider === provider.key
                              ? 'border-[rgba(99,102,241,0.24)] bg-[rgba(99,102,241,0.08)] text-foreground shadow-[0_8px_24px_-16px_rgba(99,102,241,0.4)]'
                              : 'border-[color:var(--sg-border-1)] bg-[color:var(--sg-surface-2)] text-muted-foreground hover:text-foreground',
                          )}
                        >
                          <span>{provider.label}</span>
                          {directProvider === provider.key && <Check className="h-4 w-4 text-primary" />}
                        </button>
                      ))}
                    </div>
                  </SettingsRow>

                  <SettingsRow title={t('settings.apiKey', lang)} description={lang === 'it' ? 'La chiave resta locale nel browser e viene usata solo per interrogare il provider selezionato.' : 'The key stays local in the browser and is only used to call the selected provider.'}>
                    <div className="flex w-full gap-2">
                      <Input
                        type={showDirectKey ? 'text' : 'password'}
                        value={directKey}
                        onChange={(event) => setDirectKey(event.target.value)}
                        placeholder="sk-..."
                        className="flex-1"
                      />
                      <Button type="button" variant="outline" size="icon-sm" onClick={() => setShowDirectKey((value) => !value)} aria-label={lang === 'it' ? 'Mostra chiave' : 'Show key'}>
                        {showDirectKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button type="button" variant="outline" size="icon-sm" onClick={handleFetchDirectModels} disabled={!directKey.trim() || directLoading} aria-label={t('settings.fetchModels', lang)}>
                        {directLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                      </Button>
                    </div>
                  </SettingsRow>

                  {directError && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>{t('settings.modelsUnavailable', lang)}</AlertTitle>
                      <AlertDescription>{directError}</AlertDescription>
                    </Alert>
                  )}

                  <SettingsRow title={t('settings.model', lang)} description={lang === 'it' ? 'Se il provider espone una lista modelli, puoi filtrarla qui prima di selezionare.' : 'If the provider exposes a model list, you can filter it here before selecting.'}>
                    <div className="w-full space-y-2">
                      {directModels.length > 0 ? (
                        <>
                          <Input value={directSearch} onChange={(event) => setDirectSearch(event.target.value)} placeholder={t('settings.searchModel', lang)} />
                          <Select value={directModel} onValueChange={(value: string | null) => { if (value) { setDirectModel(value); setDirectSearch(''); } }}>
                            <SelectTrigger className="w-full"><SelectValue placeholder={t('settings.selectModel', lang)} /></SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                              {filteredDirectModels.map((model) => (
                                <SelectItem key={model.id} value={model.id}>{model.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </>
                      ) : (
                        <Input value={directModel} onChange={(event) => setDirectModel(event.target.value)} placeholder="gpt-4o-mini" />
                      )}
                    </div>
                  </SettingsRow>

                  <div className="flex justify-end">
                    <Button variant="accent" onClick={saveDirect} disabled={!directKey.trim() || !directModel || directLoading}>
                      {activeMethod === 'direct' ? t('settings.update', lang) : t('settings.connect', lang)}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section ref={(element) => { sectionRefs.current.oauth = element; }} className="scroll-mt-8">
              <Card className="opacity-85">
                <CardContent className="space-y-5 px-6 py-6">
                  <SectionHeader title={t('settings.oauth', lang)} description={t('settings.oauthDesc', lang)} />
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" disabled>{t('settings.signInWith', lang)} OpenAI</Button>
                    <Button variant="outline" disabled>{t('settings.signInWith', lang)} Google</Button>
                    <Button variant="outline" disabled>{t('settings.signInWith', lang)} Claude</Button>
                  </div>
                  <p className="text-sm text-muted-foreground">{t('settings.oauthConfigure', lang)}</p>
                </CardContent>
              </Card>
            </section>

            <section ref={(element) => { sectionRefs.current.preferences = element; }} className="scroll-mt-8">
              <Card>
                <CardContent className="space-y-5 px-6 py-6">
                  <SectionHeader title={t('settings.preferences', lang)} description={lang === 'it' ? 'Lingua, tema e ritmo di generazione delle nuove domande.' : 'Language, theme, and cadence for generating new questions.'} />

                  <SettingsRow title={t('settings.language', lang)} description={t('settings.languageDescLong', lang)}>
                    <Select value={settings.language} onValueChange={(value: string | null) => {
                      if (value !== 'it' && value !== 'en') return;
                      onUpdate({ language: value });
                    }}>
                      <SelectTrigger className="w-full sm:w-[180px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="it">Italiano</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </SettingsRow>

                  <SettingsRow title={t('settings.theme', lang)} description={t('settings.themeDesc', lang)}>
                    <div className="grid w-full gap-2 sm:grid-cols-2">
                      {([
                        { key: 'dark' as const, label: t('settings.dark', lang) },
                        { key: 'light' as const, label: t('settings.light', lang) },
                      ]).map((theme) => (
                        <button
                          key={theme.key}
                          type="button"
                          onClick={() => onUpdate({ theme: theme.key })}
                          className={cn(
                            'flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-medium transition-all',
                            settings.theme === theme.key
                              ? 'border-[rgba(99,102,241,0.24)] bg-[rgba(99,102,241,0.08)] text-foreground'
                              : 'border-[color:var(--sg-border-1)] bg-[color:var(--sg-surface-2)] text-muted-foreground hover:text-foreground',
                          )}
                        >
                          <span>{theme.label}</span>
                          {settings.theme === theme.key && <Check className="h-4 w-4 text-primary" />}
                        </button>
                      ))}
                    </div>
                  </SettingsRow>

                  <SettingsRow title={t('settings.questionsPerGen', lang)} description={lang === 'it' ? 'Determina quante domande provare a generare in ogni richiesta.' : 'Sets how many questions the model should attempt per generation request.'}>
                    <div className="w-full max-w-[320px] space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-muted-foreground">{lang === 'it' ? 'Valore attuale' : 'Current value'}</span>
                        <span className="text-sm font-bold tabular-nums text-primary">{localQpg}</span>
                      </div>
                      <Slider value={[localQpg]} onValueChange={handleSliderChange} min={10} max={30} step={1} />
                      <div className="flex justify-between text-[11px] text-muted-foreground">
                        <span>10</span>
                        <span>30</span>
                      </div>
                    </div>
                  </SettingsRow>
                </CardContent>
              </Card>
            </section>

            <section ref={(element) => { sectionRefs.current.data = element; }} className="scroll-mt-8">
              <ExportImport language={lang} />
            </section>

            <section ref={(element) => { sectionRefs.current.danger = element; }} className="scroll-mt-8">
              <Card className="border-[rgba(248,113,113,0.25)]">
                <CardContent className="space-y-5 px-6 py-6">
                  <SectionHeader title={t('settings.clearAllData', lang)} description={t('settings.dangerDesc', lang)} titleClassName="text-destructive" />
                  <div className="flex justify-end">
                    <Button variant="destructive" className="gap-2" onClick={() => setClearDialogOpen(true)}>
                      <Trash2 className="h-4 w-4" />
                      {t('settings.clearAllData', lang)}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </section>
          </div>
        </div>
      </div>

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
    </div>
  );
}

function ConnectedBadge({ label }: { label: string }) {
  return (
    <Badge className="gap-1">
      <Check className="h-3 w-3" />
      {label}
    </Badge>
  );
}

function SectionHeader({
  title,
  description,
  badge,
  titleClassName,
}: {
  title: string;
  description: string;
  badge?: ReactNode;
  titleClassName?: string;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1">
        <h2 className={cn('text-xl font-bold tracking-[-0.02em]', titleClassName)}>{title}</h2>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      {badge}
    </div>
  );
}

function SettingsRow({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-[color:var(--sg-border-1)] pb-5 last:border-b-0 last:pb-0 lg:flex-row lg:items-start lg:justify-between">
      <div className="max-w-[320px] space-y-1">
        <p className="font-semibold">{title}</p>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      <div className="w-full lg:max-w-[420px]">{children}</div>
    </div>
  );
}
