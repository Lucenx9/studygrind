import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { GraduationCap, Upload, Brain, Sparkles, ArrowRight, Check } from 'lucide-react';
import type { Language } from '@/lib/i18n';

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
    titleIt: 'Incolla i tuoi appunti',
    titleEn: 'Paste your notes',
    descIt: 'Incolla appunti di lezione, carica un PDF, o scrivi direttamente. L\'AI genera domande automaticamente.',
    descEn: 'Paste lecture notes, upload a PDF, or type directly. AI generates quiz questions automatically.',
    color: 'text-blue-500',
  },
  {
    icon: Brain,
    titleIt: 'Ripassa con FSRS',
    titleEn: 'Review with FSRS',
    descIt: 'L\'algoritmo FSRS (lo stesso di Anki) schedula ogni domanda all\'intervallo ottimale. Niente è mai dimenticato.',
    descEn: 'The FSRS algorithm (same as Anki) schedules each question at the optimal interval. Nothing is ever forgotten.',
    color: 'text-green-500',
  },
  {
    icon: Sparkles,
    titleIt: 'Tutor Socratico AI',
    titleEn: 'AI Socratic Tutor',
    descIt: 'Non hai capito una domanda? Il tutor AI ti guida a ragionare, senza darti la risposta direttamente.',
    descEn: "Didn't understand a question? The AI tutor guides your thinking without giving the answer directly.",
    color: 'text-purple-500',
  },
];

export function WelcomeWizard({ language: lang, hasProvider, onGoToSettings, onGoToUpload, onDismiss }: WelcomeWizardProps) {
  const [step, setStep] = useState(0);

  if (step >= STEPS.length) {
    // Final step: action
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 text-center animate-fade-in-up">
        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
          <Check className="h-8 w-8 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">
          {lang === 'it' ? 'Tutto pronto!' : "You're all set!"}
        </h2>
        <p className="text-muted-foreground max-w-md">
          {!hasProvider
            ? (lang === 'it' ? 'Configura un provider AI nelle impostazioni, poi carica i tuoi primi appunti.' : 'Configure an AI provider in settings, then upload your first notes.')
            : (lang === 'it' ? 'Carica i tuoi appunti per generare le prime domande.' : 'Upload your notes to generate your first questions.')
          }
        </p>
        <div className="flex gap-3">
          {!hasProvider ? (
            <Button onClick={() => { onDismiss(); onGoToSettings(); }} size="lg" className="rounded-2xl h-12 text-base font-semibold gap-2">
              {lang === 'it' ? 'Configura AI' : 'Configure AI'} <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={() => { onDismiss(); onGoToUpload(); }} size="lg" className="rounded-2xl h-12 text-base font-semibold gap-2">
              {lang === 'it' ? 'Carica appunti' : 'Upload notes'} <ArrowRight className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" onClick={onDismiss}>
            {lang === 'it' ? 'Dopo' : 'Later'}
          </Button>
        </div>
      </div>
    );
  }

  const current = STEPS[step];
  const Icon = current.icon;

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8 text-center">
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <GraduationCap className="h-10 w-10 text-primary" />
        <span className="text-2xl font-bold tracking-tight">StudyGrind</span>
      </div>

      {/* Step card */}
      <Card className="rounded-2xl max-w-md w-full animate-fade-in-up" key={step}>
        <CardContent className="pt-8 pb-8 space-y-4 text-center">
          <div className={`w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mx-auto ${current.color}`}>
            <Icon className="h-7 w-7" />
          </div>
          <h3 className="text-xl font-semibold">
            {lang === 'it' ? current.titleIt : current.titleEn}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {lang === 'it' ? current.descIt : current.descEn}
          </p>
        </CardContent>
      </Card>

      {/* Step dots */}
      <div className="flex gap-2">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === step ? 'w-6 bg-primary' : 'w-2 bg-muted-foreground/30'
            }`}
          />
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={() => setStep(s => s + 1)} size="lg" className="rounded-2xl h-12 text-base font-semibold gap-2">
          {step < STEPS.length - 1
            ? (lang === 'it' ? 'Avanti' : 'Next')
            : (lang === 'it' ? 'Inizia' : 'Get started')
          }
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Button variant="ghost" onClick={onDismiss}>
          {lang === 'it' ? 'Salta' : 'Skip'}
        </Button>
      </div>
    </div>
  );
}
