import { useState, useMemo } from 'react';
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
import { Settings as SettingsIcon, Key, Globe, Palette, Trash2, Check, Loader2, RefreshCw } from 'lucide-react';

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
      const models = await fetchOpenRouterModels(openRouterKey.trim());
      setOpenRouterModels(models);
      if (models.length > 0 && !openRouterModel) setOpenRouterModel(models[0].id);
    } catch (err) {
      setOpenRouterError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setOpenRouterLoading(false);
    }
  };

  // Fetch direct provider models
  const handleFetchDirectModels = async () => {
    if (!directKey.trim()) return;
    setDirectLoading(true);
    setDirectError(null);
    try {
      const models = await fetchDirectModels(directProvider, directKey.trim());
      setDirectModels(models);
      if (models.length > 0 && !directModel) setDirectModel(models[0].id);
    } catch (err) {
      setDirectError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setDirectLoading(false);
    }
  };

  const saveOpenRouter = () => {
    if (!openRouterKey.trim() || !openRouterModel) return;
    const config: ProviderConfig = { method: 'openrouter', apiKey: openRouterKey.trim(), model: openRouterModel };
    onUpdate({ provider: config });
  };

  const saveDirect = () => {
    if (!directKey.trim() || !directModel) return;
    const config: ProviderConfig = { method: 'direct', provider: directProvider, apiKey: directKey.trim(), model: directModel };
    onUpdate({ provider: config });
  };

  const handleClearAll = () => { clearAllData(); setClearDialogOpen(false); window.location.reload(); };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <SettingsIcon className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">{t('settings.title', lang)}</h1>
      </div>

      {/* OpenRouter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Key className="h-4 w-4" /> {t('settings.openrouter', lang)}
            {activeMethod === 'openrouter' && <Badge className="gap-1"><Check className="h-3 w-3" /> {t('settings.connected', lang)}</Badge>}
          </CardTitle>
          <CardDescription>{t('settings.openrouterDesc', lang)}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t('settings.apiKey', lang)}</Label>
            <div className="flex gap-2">
              <Input type="password" value={openRouterKey} onChange={e => setOpenRouterKey(e.target.value)} placeholder="sk-or-..." className="flex-1" />
              <Button variant="outline" size="icon" onClick={handleFetchOpenRouterModels} disabled={!openRouterKey.trim() || openRouterLoading} title={t('settings.fetchModels', lang)}>
                {openRouterLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          {openRouterError && <p className="text-sm text-destructive">{openRouterError}</p>}
          <div className="space-y-2">
            <Label>{t('settings.model', lang)}</Label>
            {openRouterModels.length > 0 ? (
              <>
                <Input
                  value={openRouterSearch}
                  onChange={e => setOpenRouterSearch(e.target.value)}
                  placeholder={lang === 'it' ? 'Cerca modello...' : 'Search model...'}
                  className="mb-2"
                />
                <Select value={openRouterModel} onValueChange={(v: string | null) => { if (v) { setOpenRouterModel(v); setOpenRouterSearch(''); } }}>
                  <SelectTrigger><SelectValue placeholder={t('settings.selectModel', lang)} /></SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {filteredOpenRouterModels.map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                    {filteredOpenRouterModels.length === 0 && (
                      <div className="px-3 py-2 text-sm text-muted-foreground">{lang === 'it' ? 'Nessun risultato' : 'No results'}</div>
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
          <Button onClick={saveOpenRouter} disabled={!openRouterKey.trim() || !openRouterModel}>
            {activeMethod === 'openrouter' ? t('settings.update', lang) : t('settings.connect', lang)}
          </Button>
        </CardContent>
      </Card>

      {/* Direct API Key */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Key className="h-4 w-4" /> {t('settings.directKey', lang)}
            {activeMethod === 'direct' && <Badge className="gap-1"><Check className="h-3 w-3" /> {t('settings.connected', lang)}</Badge>}
          </CardTitle>
          <CardDescription>{t('settings.directKeyDesc', lang)}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
              <Button variant="outline" size="icon" onClick={handleFetchDirectModels} disabled={!directKey.trim() || directLoading} title={t('settings.fetchModels', lang)}>
                {directLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          {directError && <p className="text-sm text-destructive">{directError}</p>}
          <div className="space-y-2">
            <Label>{t('settings.model', lang)}</Label>
            {directModels.length > 0 ? (
              <>
                <Input
                  value={directSearch}
                  onChange={e => setDirectSearch(e.target.value)}
                  placeholder={lang === 'it' ? 'Cerca modello...' : 'Search model...'}
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
          <Button onClick={saveDirect} disabled={!directKey.trim() || !directModel}>
            {activeMethod === 'direct' ? t('settings.update', lang) : t('settings.connect', lang)}
          </Button>
        </CardContent>
      </Card>

      {/* OAuth */}
      <Card className="opacity-60">
        <CardHeader>
          <CardTitle className="text-base">{t('settings.oauth', lang)}</CardTitle>
          <CardDescription>{t('settings.oauthDesc', lang)}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button variant="outline" disabled>{t('settings.signInWith', lang)} OpenAI</Button>
            <Button variant="outline" disabled>{t('settings.signInWith', lang)} Google</Button>
            <Button variant="outline" disabled>{t('settings.signInWith', lang)} Claude</Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">{t('settings.oauthConfigure', lang)}</p>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Globe className="h-4 w-4" /> {t('settings.preferences', lang)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label>{t('settings.language', lang)}</Label>
              <p className="text-xs text-muted-foreground">{t('settings.languageDesc', lang)}</p>
            </div>
            <Select value={settings.language} onValueChange={(v: string | null) => { if (v) onUpdate({ language: v as 'it' | 'en' }); }}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="it">Italiano</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2"><Palette className="h-4 w-4" /> {t('settings.theme', lang)}</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{t('settings.dark', lang)}</span>
              <Switch checked={settings.theme === 'light'} onCheckedChange={checked => onUpdate({ theme: checked ? 'light' : 'dark' })} />
              <span className="text-sm text-muted-foreground">{t('settings.light', lang)}</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>{t('settings.questionsPerGen', lang)}</Label>
              <span className="text-sm font-medium">{settings.questionsPerGeneration}</span>
            </div>
            <Slider value={[settings.questionsPerGeneration]} onValueChange={(val) => { const v = Array.isArray(val) ? val[0] : val; onUpdate({ questionsPerGeneration: v }); }} min={10} max={30} step={1} />
          </div>
        </CardContent>
      </Card>

      {/* Data management */}
      <ExportImport language={lang} />

      {/* Danger zone */}
      <Card className="border-destructive/30">
        <CardContent className="pt-6">
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
    </div>
  );
}
