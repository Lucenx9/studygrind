import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Brain, Sparkles, ArrowRight, Check } from 'lucide-react';
import { t, type Language } from '@/lib/i18n';

interface WelcomeWizardProps {
  language: Language;
  hasProvider: boolean;
  onGoToSettings: () => void;
  onGoToUpload: () => void;
  onDismiss: () => void;
}

const STEPS = [
  {
    icon: Upload,
    titleKey: 'onboarding.step1Title' as const,
    descKey: 'onboarding.step1Desc' as const,
    color: 'text-blue-500',
  },
  {
    icon: Brain,
    titleKey: 'onboarding.step2Title' as const,
    descKey: 'onboarding.step2Desc' as const,
    color: 'text-green-500',
  },
  {
    icon: Sparkles,
    titleKey: 'onboarding.step3Title' as const,
    descKey: 'onboarding.step3Desc' as const,
    color: 'text-purple-500',
  },
];

export function WelcomeWizard({ language: lang, hasProvider, onGoToSettings, onGoToUpload, onDismiss }: WelcomeWizardProps) {
  const [step, setStep] = useState(0);

  if (step >= STEPS.length) {
    // Final step: action
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Card className="w-full max-w-2xl animate-fade-in-up text-center">
          <CardContent className="flex flex-col items-center gap-6 px-6 py-10 sm:px-10">
        <div className="flex h-16 w-16 items-center justify-center rounded-[28px] bg-green-500/10">
          <Check className="h-8 w-8 text-green-500" />
        </div>
        <h2 className="text-3xl font-semibold tracking-[-0.03em]">
          {t('onboarding.readyTitle', lang)}
        </h2>
        <p className="max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
          {!hasProvider
            ? t('onboarding.readyDescWithoutProvider', lang)
            : t('onboarding.readyDescWithProvider', lang)
          }
        </p>
        <div className="grid w-full gap-3 sm:max-w-md sm:grid-cols-2">
          {!hasProvider ? (
            <Button onClick={() => { onDismiss(); onGoToSettings(); }} size="lg" className="gap-2">
              {t('onboarding.configureAi', lang)} <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={() => { onDismiss(); onGoToUpload(); }} size="lg" className="gap-2">
              {t('onboarding.uploadNotes', lang)} <ArrowRight className="h-4 w-4" />
            </Button>
          )}
          <Button variant="outline" onClick={onDismiss}>
            {t('onboarding.later', lang)}
          </Button>
        </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const current = STEPS[step];
  const Icon = current.icon;

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-4xl space-y-8 text-center">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-3 rounded-full border border-border/70 bg-background/60 px-5 py-3 shadow-[0_18px_44px_-36px_rgba(15,23,42,0.7)]">
            <img src="/study/logo.svg" alt="" className="h-8 w-8" aria-hidden="true" />
            <span className="text-2xl font-semibold tracking-[-0.03em]">StudyGrind</span>
          </div>
          <p className="mx-auto max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">{t('onboarding.subtitle', lang)}</p>
        </div>

        <Card className="mx-auto w-full max-w-xl animate-fade-in-up" key={step}>
          <CardContent className="space-y-5 px-6 py-8 text-center sm:px-8">
            <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-secondary ${current.color}`}>
              <Icon className="h-8 w-8" />
            </div>
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                0{step + 1} / 0{STEPS.length}
              </p>
              <h3 className="text-2xl font-semibold tracking-[-0.03em]">{t(current.titleKey, lang)}</h3>
              <p className="text-sm leading-7 text-muted-foreground sm:text-base">{t(current.descKey, lang)}</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center gap-2">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === step ? 'w-8 bg-primary' : 'w-2 bg-muted-foreground/30'
              }`}
            />
          ))}
        </div>

        <div className="flex justify-center gap-3">
          <Button onClick={() => setStep(s => s + 1)} size="lg" className="gap-2">
            {step < STEPS.length - 1 ? t('onboarding.next', lang) : t('onboarding.getStarted', lang)}
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={onDismiss}>
            {t('onboarding.skip', lang)}
          </Button>
        </div>
      </div>
    </div>
  );
}
