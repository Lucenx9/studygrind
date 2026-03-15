import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useDashboard } from '@/hooks/useDashboard';
import { State } from '@/lib/fsrs';
import { t, type Language } from '@/lib/i18n';
import { BarChart3, Flame, Target, Clock, Calendar, TrendingDown, ArrowRight, AlertTriangle, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getDueQuestions } from '@/lib/fsrs';
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
    [State.New]: { label: t('state.new', lang), color: 'bg-gray-400' },
    [State.Learning]: { label: t('state.learning', lang), color: 'bg-blue-500' },
    [State.Review]: { label: t('state.review', lang), color: 'bg-green-500' },
    [State.Relearning]: { label: t('state.relearning', lang), color: 'bg-orange-500' },
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/12 text-primary">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-[-0.03em]">{t('dash.title', lang)}</h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">{t('dash.subtitle', lang)}</p>
          </div>
        </div>
      </div>

      {/* Actionable hero */}
      {onNavigate && dueCount > 0 && (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/12 via-card/96 to-card/92">
          <CardContent className="flex flex-col gap-5 px-6 py-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <p className="text-4xl font-semibold tracking-[-0.04em] text-primary">{dueCount}</p>
              <p className="text-sm font-medium text-muted-foreground">{t('dash.questionsDue', lang)}</p>
              {dash.weakest.length > 0 && dash.weakest[0].accuracy < 0.6 && (
                <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
                  {t('dash.topicNeedsAttention', lang).replace('{topic}', dash.weakest[0].topic.name)}
                </p>
              )}
            </div>
            <Button onClick={() => onNavigate('review')} size="lg" className="gap-2">
              {t('dash.start', lang)} <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {onNavigate && dash.totalQuestions === 0 && (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/12 via-card/96 to-card/92">
          <CardContent className="flex flex-col gap-5 px-6 py-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <p className="text-2xl font-semibold tracking-[-0.03em]">{t('dash.startJourney', lang)}</p>
              <p className="text-sm text-muted-foreground">{t('dash.startJourneyDesc', lang)}</p>
            </div>
            <Button onClick={() => onNavigate('upload')} size="lg" className="gap-2">
              <Upload className="h-4 w-4" /> {t('dash.uploadCta', lang)}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="space-y-4 px-5 py-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <p className="text-3xl font-semibold tracking-[-0.03em]">{dash.todayReviewed}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t('dash.reviewedToday', lang)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-4 px-5 py-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-green-500/10 text-green-500">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <p className="text-3xl font-semibold tracking-[-0.03em]">{Math.round(dash.todayAccuracy * 100)}%</p>
              <p className="mt-1 text-xs text-muted-foreground">{t('dash.accuracy', lang)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-4 px-5 py-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-500">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-3xl font-semibold tracking-[-0.03em]">{Math.round(dash.todayDuration / 60)}m</p>
              <p className="mt-1 text-xs text-muted-foreground">{t('dash.timeSpent', lang)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-4 px-5 py-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <p className="text-3xl font-semibold tracking-[-0.03em]">{dash.streak}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t('dash.dayStreak', lang)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overall progress */}
      <Card className="rounded-2xl">
        <CardHeader><CardTitle className="text-base">{t('dash.overallProgress', lang)}</CardTitle></CardHeader>
        <CardContent className="flex items-center gap-8">
          <div>
            <p className="text-3xl font-bold">{dash.totalQuestions}</p>
            <p className="text-xs text-muted-foreground">{t('dash.totalQuestions', lang)}</p>
          </div>
          <div>
            <p className="text-3xl font-bold">{Math.round(dash.overallAccuracy * 100)}%</p>
            <p className="text-xs text-muted-foreground">{t('dash.overallAccuracy', lang)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Topics */}
      {dash.topicStats.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">{t('dash.topics', lang)}</h2>
          <div className="grid gap-3">
            {dash.topicStats.map(({ topic, total, byState, accuracy }) => (
              <Card key={topic.id} className="rounded-2xl">
                <CardContent className="pt-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium truncate">{topic.name}</p>
                    <Badge variant="secondary">{total} {t('dash.questionsShort', lang)}</Badge>
                  </div>
                  {/* State bar - thicker */}
                  <div className="flex h-3 rounded-full overflow-hidden bg-secondary">
                    {Object.entries(STATE_LABELS).map(([state, { color }]) => {
                      const count = byState[state] ?? 0;
                      const pct = total > 0 ? (count / total) * 100 : 0;
                      return pct > 0 ? <div key={state} className={color} style={{ width: `${pct}%` }} /> : null;
                    })}
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {Object.entries(STATE_LABELS).map(([state, { label, color }]) => {
                      const count = byState[state] ?? 0;
                      return count > 0 ? (
                        <div key={state} className="flex items-center gap-1.5">
                          <div className={`h-2.5 w-2.5 rounded-full ${color}`} />
                          {label}: {count}
                        </div>
                      ) : null;
                    })}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{t('dash.accuracy', lang)}:</span>
                    <Progress value={accuracy * 100} className="flex-1 h-2" />
                    <span className="text-xs font-semibold">{Math.round(accuracy * 100)}%</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Weakest areas */}
      {dash.weakest.length > 0 && (
        <Card className="rounded-2xl">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingDown className="h-4 w-4 text-red-500" />{t('dash.weakestAreas', lang)}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {dash.weakest.slice(0, 3).map(({ topic, accuracy, againCount }) => (
              <div key={topic.id} className="flex items-center justify-between text-sm">
                <span className="truncate">{topic.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground">{Math.round(accuracy * 100)}% {t('dash.acc', lang)}</span>
                  {againCount > 0 && <Badge variant="destructive" className="text-xs">{againCount} {t('dash.forgot', lang)}</Badge>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Upcoming reviews - with today highlight */}
      <Card className="rounded-2xl">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" />{t('dash.upcomingReviews', lang)}</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {Array.from(dash.forecast.entries()).map(([date, count]) => {
              const d = new Date(date);
              const isToday = date === todayKey;
              return (
                <div key={date} className={`text-center min-w-[64px] rounded-xl py-3 px-2 ${isToday ? 'bg-primary/10' : ''}`}>
                  <p className={`text-xs font-medium ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                    {isToday ? t('dash.today', lang) : d.toLocaleDateString(lang === 'it' ? 'it-IT' : 'en-US', { weekday: 'short' })}
                  </p>
                  <p className={`text-xl font-bold mt-1 ${isToday ? 'text-primary' : count > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {count}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Activity heatmap */}
      {dash.activities.length > 0 && (
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">{t('dash.studyActivity', lang)}</CardTitle>
            <p className="text-sm text-muted-foreground">{t('dash.last90Days', lang)}</p>
          </CardHeader>
          <CardContent>
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
                const colors = ['bg-secondary', 'bg-green-200 dark:bg-green-900', 'bg-green-400 dark:bg-green-700', 'bg-green-500 dark:bg-green-600', 'bg-green-700 dark:bg-green-500'];
                // Show all 7 labels, abbreviated to single char
                const weekLabels = lang === 'it'
                  ? ['L', 'Ma', 'Me', 'G', 'V', 'S', 'D']
                  : ['M', 'Tu', 'W', 'Th', 'F', 'Sa', 'Su'];

                const weeks: typeof days[] = [];
                for (let i = 0; i < days.length; i += 7) {
                  weeks.push(days.slice(i, i + 7));
                }

                return (
                  <div className="flex gap-[3px]">
                    {/* Day labels - show all 7 */}
                    <div className="flex flex-col gap-[3px] mr-1.5">
                      {weekLabels.map((l, i) => (
                        <div key={i} className="h-3.5 w-5 text-[9px] text-muted-foreground flex items-center justify-end pr-0.5">{l}</div>
                      ))}
                    </div>
                    {/* Week columns */}
                    {weeks.map((week, wi) => (
                      <div key={wi} className="flex flex-col gap-[3px]">
                        {week.map(({ date, count }) => {
                          const intensity = count > 0 ? Math.ceil((count / maxCount) * 4) : 0;
                          return (
                            <div
                              key={date}
                              className={`h-3.5 w-3.5 rounded-[3px] ${colors[intensity]}`}
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
            <BarChart3 className="mx-auto mb-4 h-16 w-16 opacity-20" />
            <p className="text-lg">{t('dash.noData', lang)}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
