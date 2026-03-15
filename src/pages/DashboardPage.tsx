import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useDashboard } from '@/hooks/useDashboard';
import { State } from '@/lib/fsrs';
import { t, type Language } from '@/lib/i18n';
import { BarChart3, Flame, Target, Clock, Calendar, TrendingDown } from 'lucide-react';

interface DashboardPageProps {
  language: Language;
}

export function DashboardPage({ language: lang }: DashboardPageProps) {
  const dash = useDashboard();

  const STATE_LABELS: Record<string, { label: string; color: string }> = {
    [State.New]: { label: t('state.new', lang), color: 'bg-gray-400' },
    [State.Learning]: { label: t('state.learning', lang), color: 'bg-blue-500' },
    [State.Review]: { label: t('state.review', lang), color: 'bg-green-500' },
    [State.Relearning]: { label: t('state.relearning', lang), color: 'bg-orange-500' },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">{t('dash.title', lang)}</h1>
      </div>

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        <Card><CardContent className="pt-4 text-center"><Target className="h-5 w-5 mx-auto mb-1 text-blue-500" /><p className="text-2xl font-bold">{dash.todayReviewed}</p><p className="text-xs text-muted-foreground">{t('dash.reviewedToday', lang)}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Target className="h-5 w-5 mx-auto mb-1 text-green-500" /><p className="text-2xl font-bold">{Math.round(dash.todayAccuracy * 100)}%</p><p className="text-xs text-muted-foreground">{t('dash.accuracy', lang)}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Clock className="h-5 w-5 mx-auto mb-1 text-purple-500" /><p className="text-2xl font-bold">{Math.round(dash.todayDuration / 60)}m</p><p className="text-xs text-muted-foreground">{t('dash.timeSpent', lang)}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Flame className="h-5 w-5 mx-auto mb-1 text-orange-500" /><p className="text-2xl font-bold">{dash.streak}</p><p className="text-xs text-muted-foreground">{t('dash.dayStreak', lang)}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">{t('dash.overallProgress', lang)}</CardTitle></CardHeader>
        <CardContent className="flex items-center gap-6">
          <div><p className="text-3xl font-bold">{dash.totalQuestions}</p><p className="text-xs text-muted-foreground">{t('dash.totalQuestions', lang)}</p></div>
          <div><p className="text-3xl font-bold">{Math.round(dash.overallAccuracy * 100)}%</p><p className="text-xs text-muted-foreground">{t('dash.overallAccuracy', lang)}</p></div>
        </CardContent>
      </Card>

      {dash.topicStats.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">{t('dash.topics', lang)}</h2>
          <div className="grid gap-3">
            {dash.topicStats.map(({ topic, total, byState, accuracy }) => (
              <Card key={topic.id}>
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium truncate">{topic.name}</p>
                    <Badge variant="secondary">{total} Qs</Badge>
                  </div>
                  <div className="flex h-2 rounded-full overflow-hidden bg-secondary">
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
                        <div key={state} className="flex items-center gap-1"><div className={`h-2 w-2 rounded-full ${color}`} />{label}: {count}</div>
                      ) : null;
                    })}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{t('dash.accuracy', lang)}:</span>
                    <Progress value={accuracy * 100} className="flex-1 h-1.5" />
                    <span className="text-xs font-medium">{Math.round(accuracy * 100)}%</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {dash.weakest.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingDown className="h-4 w-4 text-red-500" />{t('dash.weakestAreas', lang)}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
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

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Calendar className="h-4 w-4 text-blue-500" />{t('dash.upcomingReviews', lang)}</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {Array.from(dash.forecast.entries()).map(([date, count]) => {
              const d = new Date(date);
              const isToday = date === new Date().toISOString().split('T')[0];
              return (
                <div key={date} className="text-center min-w-[60px]">
                  <p className="text-xs text-muted-foreground">{isToday ? t('dash.today', lang) : d.toLocaleDateString(lang === 'it' ? 'it-IT' : 'en-US', { weekday: 'short' })}</p>
                  <p className={`text-lg font-bold ${count > 0 ? '' : 'text-muted-foreground'}`}>{count}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {dash.activities.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">{t('dash.studyActivity', lang)}</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              {(() => {
                // Build 91-day grid aligned to weeks (7 rows = Mon-Sun)
                const actMap = new Map(dash.activities.map(a => [a.date, a.questionsReviewed]));
                const today = new Date();
                // Go back to fill complete weeks (align to Monday)
                const endDay = new Date(today);
                const startDay = new Date(today);
                startDay.setDate(startDay.getDate() - 90);
                // Align start to Monday
                while (startDay.getDay() !== 1) startDay.setDate(startDay.getDate() - 1);

                const days: { date: string; count: number; dayOfWeek: number }[] = [];
                const d = new Date(startDay);
                while (d <= endDay) {
                  const dateStr = d.toISOString().split('T')[0];
                  days.push({ date: dateStr, count: actMap.get(dateStr) ?? 0, dayOfWeek: d.getDay() });
                  d.setDate(d.getDate() + 1);
                }

                const maxCount = Math.max(...days.map(x => x.count), 1);
                const colors = ['bg-secondary', 'bg-green-200 dark:bg-green-900', 'bg-green-400 dark:bg-green-700', 'bg-green-500 dark:bg-green-600', 'bg-green-700 dark:bg-green-500'];
                const weekLabels = lang === 'it' ? ['L', 'M', 'M', 'G', 'V', 'S', 'D'] : ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

                // Group into columns (weeks)
                const weeks: typeof days[] = [];
                for (let i = 0; i < days.length; i += 7) {
                  weeks.push(days.slice(i, i + 7));
                }

                return (
                  <div className="flex gap-0.5">
                    {/* Day labels */}
                    <div className="flex flex-col gap-0.5 mr-1">
                      {weekLabels.map((l, i) => (
                        <div key={i} className="h-3.5 w-4 text-[9px] text-muted-foreground flex items-center">{i % 2 === 0 ? l : ''}</div>
                      ))}
                    </div>
                    {/* Week columns */}
                    {weeks.map((week, wi) => (
                      <div key={wi} className="flex flex-col gap-0.5">
                        {week.map(({ date, count }) => {
                          const intensity = count > 0 ? Math.ceil((count / maxCount) * 4) : 0;
                          return (
                            <div
                              key={date}
                              className={`h-3.5 w-3.5 rounded-sm ${colors[intensity]}`}
                              title={`${date}: ${count} ${lang === 'it' ? 'domande' : 'questions'}`}
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
        <div className="text-center py-12 text-muted-foreground">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>{t('dash.noData', lang)}</p>
        </div>
      )}
    </div>
  );
}
