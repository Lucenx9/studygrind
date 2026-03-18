import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useDashboard } from '@/hooks/useDashboard';
import { State, getDueQuestions } from '@/lib/fsrs';
import { t, type Language } from '@/lib/i18n';
import { BarChart3, Flame, Target, Clock, Calendar, TrendingDown, ArrowRight, AlertTriangle, Upload, Play } from 'lucide-react';
import { getQuestions } from '@/lib/storage';
import { toDateKey } from '@/lib/utils';

interface DashboardPageProps {
  language: Language;
  onNavigate?: (page: 'review' | 'upload') => void;
}

/** Simple CSS bar chart — no dependencies */
function ActivityChart({ data, language }: { data: Map<string, number>; language: Language }) {
  const entries = Array.from(data.entries()).slice(0, 7);
  const max = Math.max(...entries.map(([, v]) => v), 1);
  const avg = entries.length > 0
    ? (entries.reduce((s, [, v]) => s + v, 0) / entries.length).toFixed(1)
    : '0';
  const todayKey = toDateKey(new Date());

  return (
    <div>
      <div className="flex items-end gap-2 h-36">
        {entries.map(([date, count]) => {
          const pct = Math.max((count / max) * 100, count > 0 ? 8 : 2);
          const isToday = date === todayKey;
          const d = parseDateKey(date);
          const dayLabel = isToday
            ? (language === 'it' ? 'Oggi' : 'Today')
            : d.toLocaleDateString(language === 'it' ? 'it-IT' : 'en-US', { weekday: 'short' });
          return (
            <div key={date} className="flex flex-1 flex-col items-center gap-2">
              <span className="text-xs font-semibold tabular-nums text-muted-foreground">{count || ''}</span>
              <div className="w-full flex flex-col justify-end" style={{ height: '100px' }}>
                <div
                  className="w-full rounded-t-md transition-all duration-600 animate-progress-fill"
                  style={{
                    height: `${pct}%`,
                    background: isToday
                      ? 'linear-gradient(to top, #6366f1, #8b5cf6)'
                      : 'linear-gradient(to top, rgba(99,102,241,0.4), rgba(139,92,246,0.4))',
                  }}
                />
              </div>
              <span className={`text-[11px] font-medium ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                {dayLabel}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>{language === 'it' ? 'Media' : 'Average'}: {avg} cards</span>
      </div>
    </div>
  );
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

  const greeting = (() => {
    const h = new Date().getHours();
    const timeKey = h < 12 ? 'dash.morning' : h < 18 ? 'dash.afternoon' : 'dash.evening';
    const time = t(timeKey, lang);
    return dueCount > 0
      ? `${time} — ${dueCount} ${t('dash.questionsInQueue', lang)}`
      : `${time} — ${t('dash.allCaughtUpShort', lang)}`;
  })();

  const statItems = [
    {
      key: 'today-reviewed',
      icon: Target,
      value: String(dash.todayReviewed),
      label: t('dash.reviewedToday', lang),
      iconBg: 'bg-[rgba(99,102,241,0.12)]',
      iconColor: 'text-[#6366f1]',
    },
    {
      key: 'today-accuracy',
      icon: Target,
      value: `${Math.round(dash.todayAccuracy * 100)}%`,
      label: t('dash.accuracy', lang),
      iconBg: 'bg-[rgba(52,211,153,0.12)]',
      iconColor: 'text-[#34d399]',
    },
    {
      key: 'today-time',
      icon: Clock,
      value: `${Math.round(dash.todayDuration / 60)}m`,
      label: t('dash.timeSpent', lang),
      iconBg: 'bg-[rgba(139,92,246,0.12)]',
      iconColor: 'text-[#8b5cf6]',
    },
    {
      key: 'streak',
      icon: Flame,
      value: String(dash.streak),
      label: t('dash.dayStreak', lang),
      iconBg: 'bg-[rgba(251,191,36,0.12)]',
      iconColor: 'text-[#fbbf24]',
    },
  ];

  return (
    <div className="animate-fade-in-up space-y-8">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-[28px] font-bold tracking-[-0.025em]">{t('dash.title', lang)}</h1>
          <p className="mt-1 text-base text-muted-foreground">{greeting}</p>
        </div>
        {dueCount > 0 && onNavigate && (
          <Button variant="accent" onClick={() => onNavigate('review')} size="lg" className="gap-2.5">
            <Play className="h-4 w-4" />
            {t('dash.start', lang)}
            <Badge className="ml-1 sg-btn-accent border-0 text-white text-[11px] px-2 py-0.5">{dueCount}</Badge>
          </Button>
        )}
      </div>

      {/* ── Stat cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statItems.map(({ key, icon: Icon, value, label, iconBg, iconColor }) => (
          <Card key={key} className="group/stat cursor-default transition-all duration-200 hover:scale-[1.005] hover:border-[rgba(255,255,255,0.12)]">
            <CardContent className="flex items-center gap-4 px-5 py-5">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
                <Icon className={`h-5 w-5 ${iconColor}`} strokeWidth={1.5} />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold tracking-[-0.03em] tabular-nums">{value}</p>
                <p className="text-tertiary mt-0.5">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Activity chart + Upcoming reviews ── */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,380px)]">
        {/* Bar chart */}
        {dash.forecast.size > 0 && (
          <Card>
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <BarChart3 className="h-4 w-4 text-primary" />
                {lang === 'it' ? 'Attività ultimi 7 giorni' : 'Activity — Last 7 Days'}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <ActivityChart data={dash.forecast} language={lang} />
            </CardContent>
          </Card>
        )}

        {/* Upcoming reviews pills */}
        <Card>
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Calendar className="h-4 w-4 text-primary" />
              {t('dash.upcomingReviews', lang)}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="flex flex-wrap gap-2">
              {Array.from(dash.forecast.entries()).map(([date, count]) => {
                const d = parseDateKey(date);
                const isToday = date === todayKey;
                return (
                  <div
                    key={date}
                    className={`min-w-[72px] rounded-xl border px-3 py-3 text-center transition-all duration-200 ${
                      isToday
                        ? 'border-primary/30 bg-[rgba(99,102,241,0.1)] animate-pulse-glow'
                        : 'border-border bg-[rgba(255,255,255,0.03)]'
                    }`}
                  >
                    <p className={`text-tertiary ${isToday ? '!text-primary' : ''}`}>
                      {isToday ? t('dash.today', lang) : d.toLocaleDateString(lang === 'it' ? 'it-IT' : 'en-US', { weekday: 'short' })}
                    </p>
                    <p className={`mt-1.5 text-xl font-bold tracking-[-0.04em] tabular-nums ${isToday ? 'text-primary' : 'text-foreground'}`}>
                      {count}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Hero card: Due queue or empty state ── */}
      {dueCount > 0 && onNavigate ? (
        <Card className="border-primary/15 bg-gradient-to-br from-[rgba(99,102,241,0.06)] via-transparent to-transparent">
          <CardContent className="flex flex-col gap-6 px-6 py-6 sm:px-7 sm:py-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-3">
                <Badge variant="secondary" className="bg-[rgba(99,102,241,0.1)] text-primary border-0">
                  {t('review.queueReady', lang)}
                </Badge>
                <p className="text-5xl font-bold tracking-[-0.05em] tabular-nums sm:text-6xl">{dueCount}</p>
                <p className="text-sm text-muted-foreground">{t('dash.questionsDue', lang)}</p>
              </div>
              {dash.weakest.length > 0 && dash.weakest[0].accuracy < 0.6 && (
                <div className="rounded-xl border border-[rgba(251,191,36,0.2)] bg-[rgba(251,191,36,0.06)] px-4 py-3 text-sm">
                  <div className="flex items-center gap-2 text-[#fbbf24]">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium text-foreground">{dash.weakest[0].topic.name}</span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    {t('dash.topicNeedsAttention', lang).replace('{topic}', dash.weakest[0].topic.name)}
                  </p>
                </div>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: t('dash.overallProgress', lang), value: dash.totalQuestions, sub: t('dash.totalQuestions', lang) },
                { label: t('dash.accuracy', lang), value: `${Math.round(dash.overallAccuracy * 100)}%`, sub: t('dash.overallAccuracy', lang) },
                { label: t('dash.upcomingReviews', lang), value: Array.from(dash.forecast.values()).reduce((sum, count) => sum + count, 0), sub: `7 ${t('dash.questionsWord', lang)}` },
              ].map(({ label, value, sub }) => (
                <div key={label} className="rounded-xl border border-border bg-[rgba(255,255,255,0.03)] px-4 py-4">
                  <p className="text-tertiary">{label}</p>
                  <p className="mt-2 text-2xl font-bold tracking-[-0.03em] tabular-nums">{value}</p>
                  <p className="text-xs text-muted-foreground">{sub}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : dash.totalQuestions === 0 && onNavigate ? (
        <Card className="border-primary/15 bg-gradient-to-br from-[rgba(99,102,241,0.06)] via-transparent to-transparent">
          <CardContent className="flex flex-col gap-6 px-6 py-6 sm:px-7 sm:py-7">
            <Badge variant="secondary" className="w-fit bg-[rgba(99,102,241,0.1)] text-primary border-0">
              {t('dash.startJourney', lang)}
            </Badge>
            <div className="space-y-2">
              <p className="text-3xl font-bold tracking-[-0.04em]">{t('dash.startJourney', lang)}</p>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{t('dash.startJourneyDesc', lang)}</p>
            </div>
            <Button variant="accent" onClick={() => onNavigate('upload')} size="lg" className="w-fit gap-2">
              <Upload className="h-4 w-4" /> {t('dash.uploadCta', lang)}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {/* ── Weakest areas ── */}
      {dash.weakest.length > 0 && (
        <Card>
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <TrendingDown className="h-4 w-4 text-destructive" />
              {t('dash.weakestAreas', lang)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-5">
            {dash.weakest.slice(0, 4).map(({ topic, accuracy, againCount }) => (
              <div key={topic.id} className="rounded-xl border border-border bg-[rgba(255,255,255,0.03)] px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate font-medium">{topic.name}</span>
                  <span className="text-xs text-muted-foreground">{Math.round(accuracy * 100)}% {t('dash.acc', lang)}</span>
                </div>
                {againCount > 0 && (
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-tertiary">{t('dash.forgot', lang)}</span>
                    <Badge variant="destructive" className="text-[11px]">{againCount}</Badge>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── Topic stats ── */}
      {dash.topicStats.length > 0 && (
        <Card>
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-lg font-semibold">{t('dash.topics', lang)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            {dash.topicStats.map(({ topic, total, byState, accuracy }) => (
              <div key={topic.id} className="rounded-xl border border-border bg-[rgba(255,255,255,0.03)] px-4 py-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <p className="truncate font-semibold">{topic.name}</p>
                      <Badge variant="secondary">{total} {t('dash.questionsShort', lang)}</Badge>
                    </div>
                    <div className="mt-3 flex h-1.5 overflow-hidden rounded-full bg-muted">
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
                        <span className="text-tertiary">{t('dash.accuracy', lang)}</span>
                        <span className="text-xs font-semibold">{Math.round(accuracy * 100)}%</span>
                      </div>
                      <Progress value={accuracy * 100} className="mt-2 h-1.5" />
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

      {/* ── Heatmap ── */}
      {dash.activities.length > 0 && (
        <Card>
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-lg font-semibold">
              {lang === 'it' ? 'Attività di studio' : 'Study Activity'}
              <span className="ml-2 text-sm font-normal text-muted-foreground">— {t('dash.last90Days', lang)}</span>
            </CardTitle>
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
                const totalReviewed = days.reduce((sum, x) => sum + x.count, 0);
                const daysStudied = days.filter(x => x.count > 0).length;

                /* Accent-based heatmap colors: transparent → full accent */
                const colors = [
                  'bg-[rgba(255,255,255,0.03)]',
                  'bg-[rgba(99,102,241,0.15)]',
                  'bg-[rgba(99,102,241,0.3)]',
                  'bg-[rgba(99,102,241,0.5)]',
                  'bg-[rgba(99,102,241,0.75)]',
                ];

                const weekLabels = lang === 'it'
                  ? ['L', 'Ma', 'Me', 'G', 'V', 'S', 'D']
                  : ['M', 'Tu', 'W', 'Th', 'F', 'Sa', 'Su'];

                const weeks: typeof days[] = [];
                for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

                const heatmapLabel = lang === 'it'
                  ? `Attività degli ultimi 90 giorni: ${totalReviewed} domande revisionate`
                  : `Study activity over the last 90 days: ${totalReviewed} questions reviewed`;

                return (
                  <div className="flex gap-6">
                    <div role="img" aria-label={heatmapLabel} className="flex gap-[4px]">
                      <div className="mr-2 flex flex-col gap-[4px]" aria-hidden="true">
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
                                className={`h-3.5 w-3.5 rounded-[3px] ${colors[intensity]} transition-colors`}
                                title={`${date}: ${count} ${t('dash.questionsWord', lang)}`}
                              />
                            );
                          })}
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-col justify-end gap-2 text-xs text-muted-foreground">
                      <div>
                        <p className="text-tertiary">{lang === 'it' ? 'Giorni di studio' : 'Days studied'}</p>
                        <p className="text-lg font-bold text-foreground">{daysStudied}</p>
                      </div>
                      <div>
                        <p className="text-tertiary">{lang === 'it' ? 'Miglior serie' : 'Best streak'}</p>
                        <p className="text-lg font-bold text-foreground">{dash.streak} {lang === 'it' ? 'giorni' : 'days'}</p>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── True empty state ── */}
      {dash.totalQuestions === 0 && !onNavigate && (
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
