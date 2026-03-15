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
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">{t('dash.title', lang)}</h1>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        <Card className="rounded-2xl">
          <CardContent className="pt-5 pb-5 text-center">
            <Target className="h-6 w-6 mx-auto mb-2 text-blue-500" />
            <p className="text-3xl font-bold">{dash.todayReviewed}</p>
            <p className="text-xs text-muted-foreground mt-1">{t('dash.reviewedToday', lang)}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="pt-5 pb-5 text-center">
            <Target className="h-6 w-6 mx-auto mb-2 text-green-500" />
            <p className="text-3xl font-bold">{Math.round(dash.todayAccuracy * 100)}%</p>
            <p className="text-xs text-muted-foreground mt-1">{t('dash.accuracy', lang)}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="pt-5 pb-5 text-center">
            <Clock className="h-6 w-6 mx-auto mb-2 text-purple-500" />
            <p className="text-3xl font-bold">{Math.round(dash.todayDuration / 60)}m</p>
            <p className="text-xs text-muted-foreground mt-1">{t('dash.timeSpent', lang)}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="pt-5 pb-5 text-center">
            <Flame className="h-6 w-6 mx-auto mb-2 text-orange-500" />
            <p className="text-3xl font-bold">{dash.streak}</p>
            <p className="text-xs text-muted-foreground mt-1">{t('dash.dayStreak', lang)}</p>
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
                    <Badge variant="secondary">{total} Qs</Badge>
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
              const isToday = date === new Date().toISOString().split('T')[0];
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
          <CardHeader><CardTitle className="text-base">{t('dash.studyActivity', lang)}</CardTitle></CardHeader>
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
                  const dateStr = d.toISOString().split('T')[0];
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
        <div className="text-center py-16 text-muted-foreground">
          <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-20" />
          <p className="text-lg">{t('dash.noData', lang)}</p>
        </div>
      )}
    </div>
  );
}
