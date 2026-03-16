import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { Settings as SettingsIcon, Key, Globe, Palette, Trash2, Check, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface SettingsPageProps {
  settings: Settings;
  onUpdate: (partial: Partial<Settings>) => void;
}

export function SettingsPage({ settings, onUpdate }: SettingsPageProps) {
  const lang = settings.language;

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
  const openRouterSectionRef = useRef<HTMLElement | null>(null);
  const directSectionRef = useRef<HTMLElement | null>(null);
  const oauthSectionRef = useRef<HTMLElement | null>(null);
  const preferencesSectionRef = useRef<HTMLElement | null>(null);
  const dataSectionRef = useRef<HTMLElement | null>(null);
  const dangerSectionRef = useRef<HTMLElement | null>(null);

  // Debounced slider: update UI immediately, persist after 500ms idle
  const [localQpg, setLocalQpg] = useState(settings.questionsPerGeneration);
  const sliderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);
  const handleSliderChange = useCallback((val: number | readonly number[]) => {
    const v = Array.isArray(val) ? val[0] : val;
    setLocalQpg(v);
    if (sliderTimerRef.current) clearTimeout(sliderTimerRef.current);
    sliderTimerRef.current = setTimeout(() => onUpdate({ questionsPerGeneration: v }), 500);
  }, [onUpdate]);

  useEffect(() => {
    setLocalQpg(settings.questionsPerGeneration);
  }, [settings.questionsPerGeneration]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (sliderTimerRef.current) {
        clearTimeout(sliderTimerRef.current);
      }
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

  // Fetch OpenRouter models
  const handleFetchOpenRouterModels = async () => {
    if (!openRouterKey.trim()) return;
    setOpenRouterLoading(true);
    setOpenRouterError(null);
    try {
      const models = await fetchOpenRouterModels(cleanKey(openRouterKey));
      if (!isMountedRef.current) return;
      setOpenRouterModels(models);
      if (models.length > 0 && !openRouterModel) setOpenRouterModel(models[0].id);
    } catch {
      if (!isMountedRef.current) return;
      setOpenRouterError(t('settings.modelFetchError', lang));
    } finally {
      if (isMountedRef.current) {
        setOpenRouterLoading(false);
      }
    }
  };

  // Fetch direct provider models
  const handleFetchDirectModels = async () => {
    if (!directKey.trim()) return;
    setDirectLoading(true);
    setDirectError(null);
    try {
      const models = await fetchDirectModels(directProvider, cleanKey(directKey));
      if (!isMountedRef.current) return;
      setDirectModels(models);
      if (models.length > 0 && !directModel) setDirectModel(models[0].id);
    } catch {
      if (!isMountedRef.current) return;
      setDirectError(t('settings.modelFetchError', lang));
    } finally {
      if (isMountedRef.current) {
        setDirectLoading(false);
      }
    }
  };

  // Strip all whitespace (including newlines from multi-line paste) from API keys
  const cleanKey = (key: string) => key.replace(/\s+/g, '');

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
    localStorage.removeItem('studygrind_onboarding_done');
    localStorage.removeItem('studygrind_active_session');
    setClearDialogOpen(false);
    window.location.reload();
  };

  const providerStatus = activeMethod === 'openrouter'
    ? t('settings.openrouter', lang)
    : activeMethod === 'direct'
      ? `${t('settings.directKey', lang)}`
      : t('upload.aiNeeded', lang);
  const themeLabel = settings.theme === 'light' ? t('settings.light', lang) : t('settings.dark', lang);
  const scrollToSection = (ref: { current: HTMLElement | null }) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-primary/10 text-primary">
            <SettingsIcon className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-[-0.03em]">{t('settings.title', lang)}</h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">{t('settings.subtitle', lang)}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-4 xl:sticky xl:top-8 self-start">
          <Card className="border-primary/15 bg-gradient-to-br from-primary/8 via-card/98 to-card/96">
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle className="text-base">{t('settings.title', lang)}</CardTitle>
              <CardDescription>{t('settings.subtitle', lang)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-5">
              <div className="rounded-[18px] border border-border/55 bg-background/45 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{t('settings.provider', lang)}</p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <span className="font-medium">{providerStatus}</span>
                  {activeMethod && (
                    <Badge className="gap-1">
                      <Check className="h-3 w-3" /> {t('settings.connected', lang)}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-[18px] border border-border/55 bg-background/45 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{t('settings.language', lang)}</p>
                  <p className="mt-2 font-medium">{settings.language === 'it' ? 'Italiano' : 'English'}</p>
                </div>
                <div className="rounded-[18px] border border-border/55 bg-background/45 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{t('settings.theme', lang)}</p>
                  <p className="mt-2 font-medium">{themeLabel}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card size="sm">
            <CardHeader className="border-b border-border/50 pb-3">
              <CardTitle className="text-sm uppercase tracking-[0.16em] text-muted-foreground">{t('settings.sections', lang)}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 pt-3">
              {[
                { label: t('settings.openrouter', lang), ref: openRouterSectionRef },
                { label: t('settings.directKey', lang), ref: directSectionRef },
                { label: t('settings.oauth', lang), ref: oauthSectionRef },
                { label: t('settings.preferences', lang), ref: preferencesSectionRef },
                { label: t('settings.dataManagement', lang), ref: dataSectionRef },
                { label: t('settings.clearAllData', lang), ref: dangerSectionRef },
              ].map(({ label, ref }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => scrollToSection(ref)}
                  className="flex w-full items-center justify-between rounded-[14px] px-3 py-2.5 text-left text-sm text-muted-foreground transition-colors hover:bg-accent/55 hover:text-foreground"
                >
                  <span>{label}</span>
                  <span className="text-xs text-muted-foreground">→</span>
                </button>
              ))}
            </CardContent>
          </Card>
        </aside>

        <div className="space-y-5">
          <section ref={openRouterSectionRef} className="scroll-mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Key className="h-4 w-4" /> {t('settings.openrouter', lang)}
                  {activeMethod === 'openrouter' && <Badge className="gap-1"><Check className="h-3 w-3" /> {t('settings.connected', lang)}</Badge>}
                </CardTitle>
                <CardDescription>{t('settings.openrouterDesc', lang)}</CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  className="space-y-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    saveOpenRouter();
                  }}
                >
                  <div className="space-y-2">
                    <Label>{t('settings.apiKey', lang)}</Label>
                    <div className="flex gap-2">
                      <Input type="password" value={openRouterKey} onChange={e => setOpenRouterKey(e.target.value)} placeholder="sk-or-..." className="flex-1" />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={handleFetchOpenRouterModels}
                        disabled={!openRouterKey.trim() || openRouterLoading}
                        title={t('settings.fetchModels', lang)}
                        aria-label={t('settings.fetchModels', lang)}
                      >
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
                        <Input
                          value={openRouterSearch}
                          onChange={e => setOpenRouterSearch(e.target.value)}
                          placeholder={t('settings.searchModel', lang)}
                          className="mb-2"
                        />
                        <Select value={openRouterModel} onValueChange={(v: string | null) => { if (v) { setOpenRouterModel(v); setOpenRouterSearch(''); } }}>
                          <SelectTrigger><SelectValue placeholder={t('settings.selectModel', lang)} /></SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            {filteredOpenRouterModels.map(m => (
                              <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                            ))}
                            {filteredOpenRouterModels.length === 0 && (
                              <div className="px-3 py-2 text-sm text-muted-foreground">{t('settings.noResults', lang)}</div>
                            )}
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
                  <Button type="submit" disabled={!openRouterKey.trim() || !openRouterModel || openRouterLoading}>
                    {activeMethod === 'openrouter' ? t('settings.update', lang) : t('settings.connect', lang)}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </section>

          <section ref={directSectionRef} className="scroll-mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Key className="h-4 w-4" /> {t('settings.directKey', lang)}
                  {activeMethod === 'direct' && <Badge className="gap-1"><Check className="h-3 w-3" /> {t('settings.connected', lang)}</Badge>}
                </CardTitle>
                <CardDescription>{t('settings.directKeyDesc', lang)}</CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  className="space-y-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    saveDirect();
                  }}
                >
                  <div className="space-y-2">
                    <Label>{t('settings.provider', lang)}</Label>
                    <Select value={directProvider} onValueChange={(v: string | null) => {
                      if (!v) return;
                      setDirectProvider(v as DirectProvider);
                      setDirectModel('');
                      setDirectModels([]);
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
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={handleFetchDirectModels}
                        disabled={!directKey.trim() || directLoading}
                        title={t('settings.fetchModels', lang)}
                        aria-label={t('settings.fetchModels', lang)}
                      >
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
                        <Input
                          value={directSearch}
                          onChange={e => setDirectSearch(e.target.value)}
                          placeholder={t('settings.searchModel', lang)}
                          className="mb-2"
                        />
                        <Select value={directModel} onValueChange={(v: string | null) => { if (v) { setDirectModel(v); setDirectSearch(''); } }}>
                          <SelectTrigger><SelectValue placeholder={t('settings.selectModel', lang)} /></SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            {filteredDirectModels.map(m => (
                              <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </>
                    ) : (
                      <Input value={directModel} onChange={e => setDirectModel(e.target.value)} placeholder="gpt-4o-mini" />
                    )}
                  </div>
                  <Button type="submit" disabled={!directKey.trim() || !directModel || directLoading}>
                    {activeMethod === 'direct' ? t('settings.update', lang) : t('settings.connect', lang)}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </section>

          <section ref={oauthSectionRef} className="scroll-mt-8">
            <Card className="opacity-80">
              <CardHeader>
                <CardTitle className="text-base">{t('settings.oauth', lang)}</CardTitle>
                <CardDescription>{t('settings.oauthDesc', lang)}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" disabled>{t('settings.signInWith', lang)} OpenAI</Button>
                  <Button variant="outline" disabled>{t('settings.signInWith', lang)} Google</Button>
                  <Button variant="outline" disabled>{t('settings.signInWith', lang)} Claude</Button>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">{t('settings.oauthConfigure', lang)}</p>
              </CardContent>
            </Card>
          </section>

          <section ref={preferencesSectionRef} className="scroll-mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Globe className="h-4 w-4" /> {t('settings.preferences', lang)}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-[18px] border border-border/55 bg-background/45 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <Label>{t('settings.language', lang)}</Label>
                        <p className="text-xs leading-5 text-muted-foreground">{t('settings.languageDescLong', lang)}</p>
                      </div>
                      <Select value={settings.language} onValueChange={(v: string | null) => { if (v) onUpdate({ language: v as 'it' | 'en' }); }}>
                        <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="it">Italiano</SelectItem>
                          <SelectItem value="en">English</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="rounded-[18px] border border-border/55 bg-background/45 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <Label className="flex items-center gap-2"><Palette className="h-4 w-4" /> {t('settings.theme', lang)}</Label>
                        <p className="text-xs leading-5 text-muted-foreground">{t('settings.themeDesc', lang)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{t('settings.dark', lang)}</span>
                        <Switch checked={settings.theme === 'light'} onCheckedChange={checked => onUpdate({ theme: checked ? 'light' : 'dark' })} />
                        <span className="text-sm text-muted-foreground">{t('settings.light', lang)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-[18px] border border-border/55 bg-background/45 p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>{t('settings.questionsPerGen', lang)}</Label>
                      <span className="text-sm font-medium">{localQpg}</span>
                    </div>
                    <Slider value={[localQpg]} onValueChange={handleSliderChange} min={10} max={30} step={1} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <section ref={dataSectionRef} className="scroll-mt-8">
            <ExportImport language={lang} />
          </section>

          <section ref={dangerSectionRef} className="scroll-mt-8">
            <Card className="border-destructive/25">
              <CardContent className="space-y-4 pt-6">
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
