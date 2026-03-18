import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDashboard } from '@/hooks/useDashboard';
import { getDueQuestions } from '@/lib/fsrs';
import { t, type Language } from '@/lib/i18n';
import { getQuestions, getSessions } from '@/lib/storage';
import { toDateKey } from '@/lib/utils';
import {
  Activity,
  BarChart3,
  BookOpenText,
  Brain,
  CalendarDays,
  Clock3,
  Flame,
  Play,
  Sparkles,
  Target,
  Upload,
} from 'lucide-react';

type DashboardNavPage = 'review' | 'study' | 'upload';

interface DashboardPageProps {
  language: Language;
  onNavigate?: (page: DashboardNavPage) => void;
}

interface ActivityPoint {
  date: string;
  count: number;
  label: string;
  isToday: boolean;
}

interface SummaryBucket {
  key: string;
  emoji: string;
  label: string;
  count: number;
  percent: number;
  className: string;
  barClassName: string;
}

function ActivityChart({
  entries,
  average,
  dailyGoal,
  streak,
  language,
}: {
  entries: ActivityPoint[];
  average: string;
  dailyGoal: number;
  streak: number;
  language: Language;
}) {
  const max = Math.max(...entries.map((entry) => entry.count), dailyGoal, 1);

  return (
    <div className="space-y-5">
      <div className="flex h-60 items-end gap-3">
        {entries.map((entry, index) => {
          const height = entry.count > 0 ? Math.max((entry.count / max) * 100, 10) : 0;
          return (
            <div key={entry.date} className="flex flex-1 flex-col items-center gap-3">
              <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                {entry.count > 0 ? entry.count : ''}
              </span>
              <div className="relative flex h-44 w-full items-end justify-center rounded-[18px] border border-[color:var(--sg-border-1)] bg-[color:var(--sg-surface-2)]/70 px-1.5 pb-1.5 pt-4">
                <div className="absolute inset-x-1.5 top-1/2 h-px border-t border-dashed border-[color:var(--sg-border-1)] opacity-60" />
                <div className="absolute inset-x-1.5 top-1/4 h-px border-t border-dashed border-[color:var(--sg-border-1)] opacity-35" />
                {height > 0 ? (
                  <div
                    className={`w-full rounded-[14px] bg-[linear-gradient(180deg,#8b5cf6_0%,#6366f1_100%)] shadow-[0_14px_30px_-18px_rgba(99,102,241,0.72)] transition-[height,filter,transform] duration-700 ease-out ${
                      entry.isToday ? 'animate-pulse-glow' : ''
                    }`}
                    style={{ height: `${height}%`, animationDelay: `${index * 50}ms` }}
                  />
                ) : (
                  <div className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[color:var(--sg-border-2)]" />
                )}
              </div>
              <div className="text-center">
                <p className={`text-[11px] font-semibold uppercase tracking-[0.05em] ${entry.isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                  {entry.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-[color:var(--sg-border-1)] bg-[color:var(--sg-surface-2)] px-4 py-3">
          <p className="text-tertiary">{language === 'it' ? 'Media giornaliera' : 'Daily average'}</p>
          <p className="mt-2 text-lg font-semibold tabular-nums">{average} cards</p>
        </div>
        <div className="rounded-2xl border border-[color:var(--sg-border-1)] bg-[color:var(--sg-surface-2)] px-4 py-3">
          <p className="text-tertiary">{language === 'it' ? 'Obiettivo giornaliero' : 'Daily goal'}</p>
          <p className="mt-2 text-lg font-semibold tabular-nums">{dailyGoal}</p>
        </div>
        <div className="rounded-2xl border border-[color:var(--sg-border-1)] bg-[color:var(--sg-surface-2)] px-4 py-3">
          <p className="text-tertiary">{language === 'it' ? 'Serie attuale' : 'Current streak'}</p>
          <p className="mt-2 text-lg font-semibold tabular-nums">{streak} {language === 'it' ? 'giorni' : 'days'}</p>
        </div>
      </div>
    </div>
  );
}

function Heatmap({
  language,
  cells,
  daysStudied,
  bestStreak,
}: {
  language: Language;
  cells: { date: string; count: number }[][];
  daysStudied: number;
  bestStreak: number;
}) {
  const intensityClasses = [
    'bg-[color:var(--sg-heat-0)]',
    'bg-[color:var(--sg-heat-1)]',
    'bg-[color:var(--sg-heat-2)]',
    'bg-[color:var(--sg-heat-3)]',
    'bg-[color:var(--sg-heat-4)]',
  ];
  const maxCount = Math.max(...cells.flat().map((cell) => cell.count), 1);
  const weekdayLabels = language === 'it' ? ['L', 'M', 'M', 'G', 'V', 'S', 'D'] : ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px]">
      <div className="min-h-[140px] overflow-x-auto">
        <div className="flex min-w-max gap-[5px]">
          <div className="mr-1 flex flex-col gap-[5px] pt-[22px]">
            {weekdayLabels.map((label) => (
              <div key={label} className="flex h-4 w-4 items-center justify-end text-[11px] text-muted-foreground">
                {label}
              </div>
            ))}
          </div>
          {cells.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-[5px]">
              {week.map((cell) => {
                const intensity = cell.count > 0 ? Math.ceil((cell.count / maxCount) * 4) : 0;
                return (
                  <div
                    key={cell.date}
                    className={`h-4 w-4 rounded-[4px] border border-[color:var(--sg-border-1)] ${intensityClasses[intensity]}`}
                    title={`${cell.date}: ${cell.count} ${t('dash.questionsWord', language)}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-3 self-end">
        <div className="rounded-2xl border border-[color:var(--sg-border-1)] bg-[color:var(--sg-surface-2)] px-4 py-3">
          <p className="text-tertiary">{language === 'it' ? 'Giorni studiati' : 'Days studied'}</p>
          <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] tabular-nums">{daysStudied}</p>
        </div>
        <div className="rounded-2xl border border-[color:var(--sg-border-1)] bg-[color:var(--sg-surface-2)] px-4 py-3">
          <p className="text-tertiary">{language === 'it' ? 'Miglior serie' : 'Best streak'}</p>
          <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] tabular-nums">{bestStreak}</p>
        </div>
      </div>
    </div>
  );
}

export function DashboardPage({ language: lang, onNavigate }: DashboardPageProps) {
  const dash = useDashboard();
  const questions = getQuestions();
  const sessions = getSessions();
  const dueQuestions = getDueQuestions(questions);
  const dueCount = dueQuestions.length;
  const dueByTopic = new Map<string, number>();

  dueQuestions.forEach((question) => {
    dueByTopic.set(question.topicId, (dueByTopic.get(question.topicId) ?? 0) + 1);
  });

  const greeting = (() => {
    const hour = new Date().getHours();
    const key = hour < 12 ? 'dash.morning' : hour < 18 ? 'dash.afternoon' : 'dash.evening';
    const base = t(key, lang);
    return dueCount > 0
      ? `${base} — ${dueCount} ${t('dash.questionsInQueue', lang)}`
      : `${base} — ${t('dash.allCaughtUpShort', lang)}`;
  })();

  const last7Activity = getLastSevenDaysActivity(dash.activities, lang);
  const weeklyAverage = last7Activity.length > 0
    ? (last7Activity.reduce((sum, entry) => sum + entry.count, 0) / last7Activity.length).toFixed(1)
    : '0.0';
  const dailyGoal = Math.max(15, Math.ceil(Number(weeklyAverage) / 5) * 5 || 15);
  const completionRate = dailyGoal > 0 ? Math.min(Math.round((dash.todayReviewed / dailyGoal) * 100), 100) : 0;
  const weeklyBuckets = getWeeklySummaryBuckets(sessions, lang);
  const totalWeeklyBucketCount = weeklyBuckets.reduce((sum, item) => sum + item.count, 0);
  const heatmapData = getHeatmapData(dash.activities);
  const totalUpcoming = Array.from(dash.forecast.values()).reduce((sum, count) => sum + count, 0);

  const statItems = [
    {
      key: 'reviewed',
      label: t('dash.reviewedToday', lang),
      value: String(dash.todayReviewed),
      icon: Target,
      iconClass: 'bg-[rgba(99,102,241,0.12)] text-[#818cf8]',
      valueClass: 'text-[#818cf8]',
      borderClass: 'border-l-[3px] border-l-[#818cf8]',
    },
    {
      key: 'accuracy',
      label: t('dash.accuracy', lang),
      value: `${Math.round(dash.todayAccuracy * 100)}%`,
      icon: Sparkles,
      iconClass: 'bg-[rgba(52,211,153,0.12)] text-[#34d399]',
      valueClass: 'text-[#34d399]',
      borderClass: 'border-l-[3px] border-l-[#34d399]',
    },
    {
      key: 'time',
      label: t('dash.timeSpent', lang),
      value: `${Math.max(1, Math.round(dash.todayDuration / 60))}m`,
      icon: Clock3,
      iconClass: 'bg-[rgba(139,92,246,0.12)] text-[#c084fc]',
      valueClass: 'text-[#c084fc]',
      borderClass: 'border-l-[3px] border-l-[#c084fc]',
    },
    {
      key: 'streak',
      label: t('dash.dayStreak', lang),
      value: String(dash.streak),
      icon: Flame,
      iconClass: 'bg-[rgba(251,191,36,0.12)] text-[#fbbf24]',
      valueClass: 'text-[#fbbf24]',
      borderClass: 'border-l-[3px] border-l-[#fbbf24]',
    },
  ];

  return (
    <div className="sg-page-enter space-y-8">
      <section className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--sg-border-1)] bg-[color:var(--sg-surface-2)] px-3 py-1.5 text-[12px] font-medium text-muted-foreground">
            <Activity className="h-3.5 w-3.5 text-primary" />
            {t('dash.subtitle', lang)}
          </div>
          <div className="space-y-2">
            <h1 className="sg-h1">{lang === 'it' ? 'Dashboard' : t('dash.title', lang)}</h1>
            <p className="sg-subtitle">{greeting}</p>
          </div>
        </div>

        {onNavigate && (
          <Button variant="accent" size="lg" onClick={() => onNavigate('review')} className="h-14 gap-3 rounded-2xl px-6 text-base shadow-[0_24px_48px_-24px_rgba(99,102,241,0.9)]">
            <Play className="h-5 w-5" />
            {lang === 'it' ? 'Inizia ripasso' : 'Start Review'}
            <span className="inline-flex min-w-[30px] items-center justify-center rounded-full border border-white/18 bg-white/15 px-2.5 py-1 text-xs font-bold tabular-nums text-white">
              {dueCount}
            </span>
          </Button>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statItems.map(({ key, label, value, icon: Icon, iconClass, valueClass, borderClass }) => (
          <Card key={key} className={`sg-hover-card overflow-hidden ${borderClass}`}>
            <CardContent className="flex items-center gap-4 px-5 py-5">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconClass}`}>
                <Icon className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <div className="min-w-0">
                <p className={`text-[1.9rem] font-bold tracking-[-0.04em] tabular-nums ${valueClass}`}>{value}</p>
                <p className="mt-1 text-tertiary">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      {dash.totalQuestions === 0 && onNavigate ? (
        <Card className="overflow-hidden border-[rgba(99,102,241,0.14)] bg-[linear-gradient(135deg,rgba(99,102,241,0.12),rgba(139,92,246,0.04))]">
          <CardContent className="grid gap-6 px-6 py-7 lg:grid-cols-[minmax(0,1fr)_240px] lg:items-center">
            <div className="space-y-4">
              <Badge variant="secondary" className="w-fit">
                {t('dash.startJourney', lang)}
              </Badge>
              <div className="space-y-2">
                <h2 className="text-[1.8rem] font-semibold tracking-[-0.03em]">{t('dash.startJourney', lang)}</h2>
                <p className="max-w-2xl text-sm leading-7 text-muted-foreground">{t('dash.startJourneyDesc', lang)}</p>
              </div>
              <Button variant="accent" size="lg" className="gap-2.5" onClick={() => onNavigate('upload')}>
                <Upload className="h-4 w-4" />
                {t('dash.uploadCta', lang)}
              </Button>
            </div>
            <div className="rounded-[24px] border border-[color:var(--sg-border-1)] bg-[color:var(--sg-surface-2)] p-5">
              <p className="text-tertiary">{lang === 'it' ? 'Pronto per iniziare' : 'Ready to start'}</p>
              <p className="mt-3 text-4xl font-bold tracking-[-0.05em] tabular-nums">0</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {lang === 'it' ? 'Appunti caricati e carte create appariranno qui.' : 'Uploaded notes and generated cards will appear here.'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <section className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.9fr)]">
            <Card>
              <CardHeader className="border-b pb-5">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  {lang === 'it' ? 'Attività ultimi 7 giorni' : 'Activity in the last 7 days'}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ActivityChart
                  entries={last7Activity}
                  average={weeklyAverage}
                  dailyGoal={dailyGoal}
                  streak={dash.streak}
                  language={lang}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-b pb-5">
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-primary" />
                  {lang === 'it' ? 'Riepilogo settimanale' : 'Weekly summary'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 pt-6">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-[color:var(--sg-border-1)] bg-[color:var(--sg-surface-2)] px-4 py-3">
                    <p className="text-tertiary">{lang === 'it' ? 'Completamento goal' : 'Goal completion'}</p>
                    <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] tabular-nums">{completionRate}%</p>
                  </div>
                  <div className="rounded-2xl border border-[color:var(--sg-border-1)] bg-[color:var(--sg-surface-2)] px-4 py-3">
                    <p className="text-tertiary">{lang === 'it' ? 'Ripassi in arrivo' : 'Upcoming reviews'}</p>
                    <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] tabular-nums">{totalUpcoming}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {weeklyBuckets.map((bucket) => (
                    <div key={bucket.key} className="space-y-2">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className={`inline-flex items-center gap-2 font-medium ${bucket.className}`}>
                          <span aria-hidden="true">{bucket.emoji}</span>
                          {bucket.label}
                        </span>
                        <span className="tabular-nums text-muted-foreground">
                          {bucket.percent}%{totalWeeklyBucketCount > 0 ? ` · ${bucket.count}` : ''}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-[color:var(--sg-surface-2)]">
                        <div className={`h-full rounded-full ${bucket.barClassName}`} style={{ width: `${bucket.percent}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <Card>
              <CardHeader className="border-b pb-5">
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  {t('dash.upcomingReviews', lang)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 pt-6">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
                  {Array.from(dash.forecast.entries()).slice(0, 7).map(([date, count]) => {
                    const day = parseDateKey(date);
                    const isToday = date === toDateKey(new Date());
                    return (
                      <div
                        key={date}
                        className={`rounded-2xl border px-3 py-4 text-center transition-all duration-200 ${
                          isToday
                            ? 'border-[rgba(99,102,241,0.18)] ring-1 ring-primary/30 bg-[linear-gradient(180deg,rgba(99,102,241,0.18),rgba(139,92,246,0.08))] animate-pulse-glow'
                            : 'border-[color:var(--sg-border-1)] bg-[color:var(--sg-surface-2)]'
                        }`}
                      >
                        <p className={`text-[11px] font-semibold uppercase tracking-[0.05em] ${isToday ? 'text-primary-foreground/70' : 'text-tertiary'}`}>
                          {isToday ? t('dash.today', lang) : formatWeekday(day, lang)}
                        </p>
                        <p className={`mt-2 text-2xl font-semibold tracking-[-0.04em] tabular-nums ${isToday ? 'text-primary-foreground' : 'text-foreground'}`}>
                          {count}
                        </p>
                        <div className="mt-2 flex items-center justify-center gap-1">
                          <span className={`h-1.5 w-1.5 rounded-full ${count > 0 ? (isToday ? 'bg-primary-foreground/80' : 'bg-primary') : 'bg-transparent'}`} />
                          <span className={`text-[11px] ${isToday ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                            {lang === 'it' ? 'domande' : 'cards'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="rounded-[18px] border border-[color:var(--sg-border-1)] bg-[color:var(--sg-surface-2)] px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-tertiary">{lang === 'it' ? 'Prossimi 7 giorni' : 'Next 7 days'}</p>
                      <p className="mt-1 text-lg font-semibold tabular-nums">{totalUpcoming} {lang === 'it' ? 'ripassi previsti' : 'reviews scheduled'}</p>
                    </div>
                    {onNavigate && (
                      <Button variant="outline" size="sm" onClick={() => onNavigate('review')}>
                        {lang === 'it' ? 'Apri coda' : 'Open queue'}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-b pb-5">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  {lang === 'it' ? 'History' : 'History'}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <Heatmap
                  language={lang}
                  cells={heatmapData.weeks}
                  daysStudied={heatmapData.daysStudied}
                  bestStreak={heatmapData.bestStreak}
                />
              </CardContent>
            </Card>
          </section>

          {dash.topicStats.length > 0 && (
            <section>
              <Card>
                <CardHeader className="border-b pb-5">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <BookOpenText className="h-4 w-4 text-primary" />
                      {lang === 'it' ? 'Deck attivi' : 'Active decks'}
                    </CardTitle>
                    <div className="hidden items-center gap-3 text-tertiary lg:grid lg:grid-cols-[minmax(0,1.6fr)_90px_80px_180px_120px] lg:text-right">
                      <span className="text-left">{lang === 'it' ? 'Nome' : 'Name'}</span>
                      <span>{lang === 'it' ? 'Due' : 'Due'}</span>
                      <span>{lang === 'it' ? 'Carte' : 'Cards'}</span>
                      <span>{lang === 'it' ? 'Progress' : 'Progress'}</span>
                      <span>{lang === 'it' ? 'Practice' : 'Practice'}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-5">
                  {dash.topicStats
                    .slice()
                    .sort((a, b) => (dueByTopic.get(b.topic.id) ?? 0) - (dueByTopic.get(a.topic.id) ?? 0) || b.total - a.total)
                    .map(({ topic, total, accuracy }) => {
                      const topicQuestions = questions.filter((question) => question.topicId === topic.id);
                      const reviewedCount = topicQuestions.filter((question) => question.timesReviewed > 0).length;
                      const progress = total > 0 ? Math.round((reviewedCount / total) * 100) : 0;
                      const due = dueByTopic.get(topic.id) ?? 0;

                      return (
                        <div key={topic.id} className="grid gap-3 rounded-[18px] border border-[color:var(--sg-border-1)] bg-[color:var(--sg-surface-2)] px-4 py-4 lg:grid-cols-[minmax(0,1.6fr)_90px_80px_180px_120px] lg:items-center">
                          <div className="min-w-0">
                            <p className="truncate text-base font-semibold">{topic.name}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {Math.round(accuracy * 100)}% {t('dash.accuracy', lang).toLowerCase()}
                            </p>
                          </div>
                          <div className="flex items-center justify-between gap-2 lg:block lg:text-right">
                            <span className="text-tertiary lg:hidden">{lang === 'it' ? 'Due' : 'Due'}</span>
                            <span className="text-base font-semibold tabular-nums">{due}</span>
                          </div>
                          <div className="flex items-center justify-between gap-2 lg:block lg:text-right">
                            <span className="text-tertiary lg:hidden">{lang === 'it' ? 'Carte' : 'Cards'}</span>
                            <span className="text-base font-semibold tabular-nums">{total}</span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-tertiary lg:hidden">{lang === 'it' ? 'Progress' : 'Progress'}</span>
                              <span className="ml-auto text-xs font-semibold tabular-nums text-emerald-400">{progress}%</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-[color:var(--sg-surface-3)]">
                              <div className="h-full rounded-full bg-[linear-gradient(90deg,#34d399,#10b981)] transition-[width] duration-700" style={{ width: `${progress}%` }} />
                            </div>
                          </div>
                          {onNavigate ? (
                            <Button variant="outline" size="sm" className="w-full lg:justify-self-end" onClick={() => onNavigate('study')}>
                              {lang === 'it' ? 'Practice' : 'Practice'}
                            </Button>
                          ) : (
                            <div />
                          )}
                        </div>
                      );
                    })}
                </CardContent>
              </Card>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function getLastSevenDaysActivity(
  activities: { date: string; questionsReviewed: number }[],
  language: Language,
): ActivityPoint[] {
  const activityMap = new Map(activities.map((activity) => [activity.date, activity.questionsReviewed]));
  const today = new Date();
  const result: ActivityPoint[] = [];

  for (let offset = 6; offset >= 0; offset -= 1) {
    const day = new Date(today);
    day.setDate(today.getDate() - offset);
    const date = toDateKey(day);
    result.push({
      date,
      count: activityMap.get(date) ?? 0,
      label: offset === 0 ? (language === 'it' ? 'Oggi' : 'Today') : formatWeekday(day, language),
      isToday: offset === 0,
    });
  }

  return result;
}

function getWeeklySummaryBuckets(
  sessions: ReturnType<typeof getSessions>,
  language: Language,
): SummaryBucket[] {
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - 6);

  let skipped = 0;
  let forgot = 0;
  let partial = 0;
  let effort = 0;
  let easy = 0;

  sessions
    .filter((session) => parseDateKey(toDateKey(new Date(session.date))) >= parseDateKey(toDateKey(cutoff)))
    .forEach((session) => {
      skipped += Math.max(session.totalQuestions - session.ratings.length, 0);
      session.ratings.forEach((rating) => {
        if (rating.rating === 1) forgot += 1;
        if (rating.rating === 2) partial += 1;
        if (rating.rating === 3) effort += 1;
        if (rating.rating === 4) easy += 1;
      });
    });

  const items = [
    {
      key: 'skipped',
      emoji: '⏭️',
      label: language === 'it' ? 'Skip' : 'Skipped',
      count: skipped,
      className: 'text-muted-foreground',
      barClassName: 'bg-[linear-gradient(90deg,rgba(255,255,255,0.18),rgba(255,255,255,0.28))]',
    },
    {
      key: 'forgot',
      emoji: '😵',
      label: language === 'it' ? 'Dimenticate' : 'Forgot',
      count: forgot,
      className: 'text-rose-400',
      barClassName: 'bg-[linear-gradient(90deg,#fb7185,#f43f5e)]',
    },
    {
      key: 'partial',
      emoji: '🤔',
      label: language === 'it' ? 'Parziali' : 'Partially recalled',
      count: partial,
      className: 'text-amber-400',
      barClassName: 'bg-[linear-gradient(90deg,#fbbf24,#f59e0b)]',
    },
    {
      key: 'effort',
      emoji: '💪',
      label: language === 'it' ? 'Con fatica' : 'With effort',
      count: effort,
      className: 'text-sky-400',
      barClassName: 'bg-[linear-gradient(90deg,#60a5fa,#3b82f6)]',
    },
    {
      key: 'easy',
      emoji: '✨',
      label: language === 'it' ? 'Facili' : 'Easy recall',
      count: easy,
      className: 'text-emerald-400',
      barClassName: 'bg-[linear-gradient(90deg,#34d399,#10b981)]',
    },
  ];

  const total = items.reduce((sum, item) => sum + item.count, 0);
  return items.map((item) => ({
    ...item,
    percent: total > 0 ? Math.round((item.count / total) * 100) : 0,
  }));
}

function getHeatmapData(activities: { date: string; questionsReviewed: number }[]) {
  const activityMap = new Map(activities.map((activity) => [activity.date, activity.questionsReviewed]));
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - 83);

  while (start.getDay() !== 1) {
    start.setDate(start.getDate() - 1);
  }

  const cells: { date: string; count: number }[] = [];
  const cursor = new Date(start);

  while (cursor <= today) {
    const date = toDateKey(cursor);
    cells.push({ date, count: activityMap.get(date) ?? 0 });
    cursor.setDate(cursor.getDate() + 1);
  }

  const weeks: { date: string; count: number }[][] = [];
  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7));
  }

  const activeDates = new Set(activities.filter((activity) => activity.questionsReviewed > 0).map((activity) => activity.date));
  let bestStreak = 0;
  let currentStreak = 0;

  Array.from(activeDates)
    .sort()
    .forEach((date, index, sorted) => {
      if (index === 0) {
        currentStreak = 1;
        bestStreak = 1;
        return;
      }

      const previous = parseDateKey(sorted[index - 1]);
      previous.setDate(previous.getDate() + 1);
      currentStreak = toDateKey(previous) === date ? currentStreak + 1 : 1;
      bestStreak = Math.max(bestStreak, currentStreak);
    });

  return {
    weeks,
    daysStudied: activeDates.size,
    bestStreak,
  };
}

function formatWeekday(date: Date, language: Language) {
  return date.toLocaleDateString(language === 'it' ? 'it-IT' : 'en-US', {
    weekday: 'short',
  });
}

function parseDateKey(date: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day);
}
