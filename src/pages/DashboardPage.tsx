import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useDashboard } from '@/hooks/useDashboard';
import { State, getDueQuestions } from '@/lib/fsrs';
import { t, type Language } from '@/lib/i18n';
import { BarChart3, Flame, Target, Clock, Calendar, TrendingDown, ArrowRight, AlertTriangle, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getQuestions } from '@/lib/storage';
import { toDateKey } from '@/lib/utils';

interface DashboardPageProps {
  language: Language;
  onNavigate?: (page: 'review' | 'upload') => void;
}

export function DashboardPage({ language: lang, onNavigate }: DashboardPageProps) {
  const dash = useDashboard();
  const dueCount = getDueQuestions(getQuestions()).length;
  const todayKey = toDateKey(new Date());

  const STATE_LABELS: Record<string, { label: string; color: string }> = {
    [State.New]: { label: t('state.new', lang), color: 'bg-slate-400' },
    [State.Learning]: { label: t('state.learning', lang), color: 'bg-sky-500' },
    [State.Review]: { label: t('state.review', lang), color: 'bg-emerald-500' },
    [State.Relearning]: { label: t('state.relearning', lang), color: 'bg-amber-500' },
  };

  const statItems = [
    {
      key: 'today-reviewed',
      icon: Target,
      value: String(dash.todayReviewed),
      label: t('dash.reviewedToday', lang),
      tone: 'bg-sky-500/10 text-sky-500',
    },
    {
      key: 'today-accuracy',
      icon: Target,
      value: `${Math.round(dash.todayAccuracy * 100)}%`,
      label: t('dash.accuracy', lang),
      tone: 'bg-emerald-500/10 text-emerald-500',
    },
    {
      key: 'today-time',
      icon: Clock,
      value: `${Math.round(dash.todayDuration / 60)}m`,
      label: t('dash.timeSpent', lang),
      tone: 'bg-violet-500/10 text-violet-500',
    },
    {
      key: 'streak',
      icon: Flame,
      value: String(dash.streak),
      label: t('dash.dayStreak', lang),
      tone: 'bg-amber-500/10 text-amber-500',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-primary/10 text-primary">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-[-0.03em]">{t('dash.title', lang)}</h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">{t('dash.subtitle', lang)}</p>
          </div>
        </div>
        {dueCount > 0 && onNavigate && (
          <Button onClick={() => onNavigate('review')} size="lg" className="w-full gap-2 lg:w-auto">
            {t('dash.start', lang)} <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_360px]">
        {onNavigate && dueCount > 0 ? (
          <Card className="border-primary/15 bg-gradient-to-br from-primary/8 via-card/98 to-card/95">
            <CardContent className="flex h-full flex-col justify-between gap-8 px-6 py-6 sm:px-7 sm:py-7">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-3">
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    {t('review.queueReady', lang)}
                  </Badge>
                  <div className="space-y-2">
                    <p className="text-5xl font-semibold tracking-[-0.05em] text-foreground sm:text-6xl">{dueCount}</p>
                    <p className="text-sm font-medium text-muted-foreground">{t('dash.questionsDue', lang)}</p>
                    <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{t('review.queueHint', lang)}</p>
                  </div>
                </div>
                {dash.weakest.length > 0 && dash.weakest[0].accuracy < 0.6 && (
                  <div className="rounded-[18px] border border-amber-500/20 bg-amber-500/8 px-4 py-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2 text-amber-500">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-medium text-foreground">{dash.weakest[0].topic.name}</span>
                    </div>
                    <p className="mt-2 text-xs leading-5">
                      {t('dash.topicNeedsAttention', lang).replace('{topic}', dash.weakest[0].topic.name)}
                    </p>
                  </div>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-[18px] border border-border/60 bg-background/55 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t('dash.overallProgress', lang)}</p>
                  <p className="mt-3 text-2xl font-semibold tracking-[-0.03em]">{dash.totalQuestions}</p>
                  <p className="text-xs text-muted-foreground">{t('dash.totalQuestions', lang)}</p>
                </div>
                <div className="rounded-[18px] border border-border/60 bg-background/55 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t('dash.accuracy', lang)}</p>
                  <p className="mt-3 text-2xl font-semibold tracking-[-0.03em]">{Math.round(dash.overallAccuracy * 100)}%</p>
                  <p className="text-xs text-muted-foreground">{t('dash.overallAccuracy', lang)}</p>
                </div>
                <div className="rounded-[18px] border border-border/60 bg-background/55 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t('dash.upcomingReviews', lang)}</p>
                  <p className="mt-3 text-2xl font-semibold tracking-[-0.03em]">
                    {Array.from(dash.forecast.values()).reduce((sum, count) => sum + count, 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">7 {t('dash.questionsWord', lang)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-primary/15 bg-gradient-to-br from-primary/8 via-card/98 to-card/95">
            <CardContent className="flex h-full flex-col justify-between gap-8 px-6 py-6 sm:px-7 sm:py-7">
              <div className="space-y-3">
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  {t('dash.startJourney', lang)}
                </Badge>
                <div className="space-y-2">
                  <p className="text-3xl font-semibold tracking-[-0.04em] text-foreground">{t('dash.startJourney', lang)}</p>
                  <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{t('dash.startJourneyDesc', lang)}</p>
                </div>
              </div>

              {onNavigate && (
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <div className="rounded-[18px] border border-border/60 bg-background/55 px-4 py-4 text-sm leading-6 text-muted-foreground">
                    {t('upload.subtitle', lang)}
                  </div>
                  <Button onClick={() => onNavigate('upload')} size="lg" className="gap-2">
                    <Upload className="h-4 w-4" /> {t('dash.uploadCta', lang)}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-sm uppercase tracking-[0.16em] text-muted-foreground">{t('dash.today', lang)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-4">
            {statItems.map(({ key, icon: Icon, value, label, tone }) => (
              <div key={key} className="flex items-center gap-4 rounded-[18px] border border-border/55 bg-background/45 px-4 py-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-[14px] ${tone}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
                  <p className="mt-1 text-xl font-semibold tracking-[-0.03em]">{value}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(280px,360px)]">
        <Card>
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4 text-primary" />
              {t('dash.upcomingReviews', lang)}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {Array.from(dash.forecast.entries()).map(([date, count]) => {
                const d = parseDateKey(date);
                const isToday = date === todayKey;
                return (
                  <div
                    key={date}
                    className={`min-w-[78px] rounded-[18px] border px-3 py-3 text-center ${
                      isToday
                        ? 'border-primary/20 bg-primary/9'
                        : 'border-border/55 bg-background/45'
                    }`}
                  >
                    <p className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                      {isToday ? t('dash.today', lang) : d.toLocaleDateString(lang === 'it' ? 'it-IT' : 'en-US', { weekday: 'short' })}
                    </p>
                    <p className={`mt-2 text-2xl font-semibold tracking-[-0.04em] ${isToday ? 'text-primary' : 'text-foreground'}`}>
                      {count}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {dash.weakest.length > 0 && (
          <Card>
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingDown className="h-4 w-4 text-rose-500" />
                {t('dash.weakestAreas', lang)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-5">
              {dash.weakest.slice(0, 4).map(({ topic, accuracy, againCount }) => (
                <div key={topic.id} className="rounded-[18px] border border-border/55 bg-background/45 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate font-medium">{topic.name}</span>
                    <span className="text-xs text-muted-foreground">{Math.round(accuracy * 100)}% {t('dash.acc', lang)}</span>
                  </div>
                  {againCount > 0 && (
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{t('dash.forgot', lang)}</span>
                      <Badge variant="destructive" className="text-[11px]">{againCount}</Badge>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {dash.topicStats.length > 0 && (
        <Card>
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-base">{t('dash.topics', lang)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            {dash.topicStats.map(({ topic, total, byState, accuracy }) => (
              <div key={topic.id} className="rounded-[18px] border border-border/55 bg-background/45 px-4 py-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <p className="truncate font-semibold">{topic.name}</p>
                      <Badge variant="secondary">{total} {t('dash.questionsShort', lang)}</Badge>
                    </div>
                    <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-secondary">
                      {Object.entries(STATE_LABELS).map(([state, { color }]) => {
                        const count = byState[state] ?? 0;
                        const pct = total > 0 ? (count / total) * 100 : 0;
                        return pct > 0 ? <div key={state} className={color} style={{ width: `${pct}%` }} /> : null;
                      })}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:w-[360px]">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{t('dash.accuracy', lang)}</span>
                        <span className="text-xs font-semibold">{Math.round(accuracy * 100)}%</span>
                      </div>
                      <Progress value={accuracy * 100} className="mt-2 h-2" />
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      {Object.entries(STATE_LABELS).map(([state, { label, color }]) => {
                        const count = byState[state] ?? 0;
                        return count > 0 ? (
                          <div key={state} className="flex items-center gap-1.5">
                            <div className={`h-2.5 w-2.5 rounded-full ${color}`} />
                            <span>{label}: {count}</span>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {dash.activities.length > 0 && (
        <Card>
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-base">{t('dash.studyActivity', lang)}</CardTitle>
            <p className="text-sm text-muted-foreground">{t('dash.last90Days', lang)}</p>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="overflow-x-auto">
              {(() => {
                const actMap = new Map(dash.activities.map(a => [a.date, a.questionsReviewed]));
                const today = new Date();
                const endDay = new Date(today);
                const startDay = new Date(today);
                startDay.setDate(startDay.getDate() - 90);
                while (startDay.getDay() !== 1) startDay.setDate(startDay.getDate() - 1);

                const days: { date: string; count: number; dayOfWeek: number }[] = [];
                const d = new Date(startDay);
                while (d <= endDay) {
                  const dateStr = toDateKey(d);
                  days.push({ date: dateStr, count: actMap.get(dateStr) ?? 0, dayOfWeek: d.getDay() });
                  d.setDate(d.getDate() + 1);
                }

                const maxCount = Math.max(...days.map(x => x.count), 1);
                const colors = ['bg-secondary', 'bg-emerald-200/70 dark:bg-emerald-950', 'bg-emerald-400/75 dark:bg-emerald-700', 'bg-emerald-500 dark:bg-emerald-600', 'bg-emerald-700 dark:bg-emerald-500'];
                const weekLabels = lang === 'it'
                  ? ['L', 'Ma', 'Me', 'G', 'V', 'S', 'D']
                  : ['M', 'Tu', 'W', 'Th', 'F', 'Sa', 'Su'];

                const weeks: typeof days[] = [];
                for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

                return (
                  <div className="flex gap-[4px]">
                    <div className="mr-2 flex flex-col gap-[4px]">
                      {weekLabels.map((label, index) => (
                        <div key={index} className="flex h-3.5 w-5 items-center justify-end pr-0.5 text-[9px] text-muted-foreground">
                          {label}
                        </div>
                      ))}
                    </div>
                    {weeks.map((week, weekIndex) => (
                      <div key={weekIndex} className="flex flex-col gap-[4px]">
                        {week.map(({ date, count }) => {
                          const intensity = count > 0 ? Math.ceil((count / maxCount) * 4) : 0;
                          return (
                            <div
                              key={date}
                              className={`h-3.5 w-3.5 rounded-[4px] ${colors[intensity]}`}
                              title={`${date}: ${count} ${t('dash.questionsWord', lang)}`}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </CardContent>
        </Card>
      )}

      {dash.totalQuestions === 0 && (
        <Card className="border-dashed text-center">
          <CardContent className="px-6 py-10 text-muted-foreground">
            <BarChart3 className="mx-auto mb-4 h-14 w-14 opacity-20" />
            <p className="text-lg">{t('dash.noData', lang)}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function parseDateKey(date: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day);
}
