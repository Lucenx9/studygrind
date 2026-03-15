import { useMemo, useState, useEffect } from 'react';
import { getQuestions, getSessions, getActivities, getTopics } from '@/lib/storage';
import { getReviewForecast, State } from '@/lib/fsrs';
import type { Topic } from '@/lib/types';
import { toDateKey } from '@/lib/utils';

interface TopicStats {
  topic: Topic;
  total: number;
  byState: Record<string, number>;
  accuracy: number;
  againCount: number;
}

export function useDashboard() {
  // Re-compute when storage changes (e.g., after a review session)
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const handler = () => setTick(t => t + 1);
    window.addEventListener('studygrind:data-changed', handler);
    return () => window.removeEventListener('studygrind:data-changed', handler);
  }, []);

  return useMemo(() => {
    void tick; // dependency to trigger recomputation
    const topics = getTopics();
    const questions = getQuestions();
    const sessions = getSessions();
    const activities = getActivities();

    // Today's summary
    const today = toDateKey(new Date());
    const todaySessions = sessions.filter(s => s.date.startsWith(today));
    const todayReviewed = todaySessions.reduce((sum, s) => sum + s.totalQuestions, 0);
    const todayCorrect = todaySessions.reduce((sum, s) => sum + s.correctAnswers, 0);
    const todayAccuracy = todayReviewed > 0 ? todayCorrect / todayReviewed : 0;
    const todayDuration = todaySessions.reduce((sum, s) => sum + s.durationSeconds, 0);

    // Per-topic stats
    const topicStats: TopicStats[] = topics.map(topic => {
      const topicQs = questions.filter(q => q.topicId === topic.id);
      const byState: Record<string, number> = {
        [State.New]: 0,
        [State.Learning]: 0,
        [State.Review]: 0,
        [State.Relearning]: 0,
      };
      for (const q of topicQs) {
        const stateKey = String(q.fsrsCard.state);
        byState[stateKey] = (byState[stateKey] ?? 0) + 1;
      }

      const reviewed = topicQs.filter(q => q.timesReviewed > 0);
      const totalCorrect = reviewed.reduce((sum, q) => sum + q.timesCorrect, 0);
      const totalReviews = reviewed.reduce((sum, q) => sum + q.timesReviewed, 0);

      // Count "Again" ratings for this topic from sessions
      const topicQIds = new Set(topicQs.map(q => q.id));
      const againCount = sessions.reduce((sum, s) =>
        sum + s.ratings.filter(r => topicQIds.has(r.questionId) && r.rating === 1).length, 0);

      return {
        topic,
        total: topicQs.length,
        byState,
        accuracy: totalReviews > 0 ? totalCorrect / totalReviews : 0,
        againCount,
      };
    });

    // Overall stats
    const totalQuestions = questions.length;
    const totalReviewed = questions.filter(q => q.timesReviewed > 0);
    const overallAccuracy = totalReviewed.length > 0
      ? totalReviewed.reduce((sum, q) => sum + q.timesCorrect, 0) /
        totalReviewed.reduce((sum, q) => sum + q.timesReviewed, 0)
      : 0;

    // Study streak
    const sortedDates = [...new Set(activities.map(a => a.date))].sort().reverse();
    let streak = 0;
    const d = new Date();
    for (const dateStr of sortedDates) {
      const expected = toDateKey(d);
      if (dateStr === expected) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }

    // Weakest topics (sorted by accuracy, then by again count)
    const weakest = [...topicStats]
      .filter(t => t.total > 0)
      .sort((a, b) => a.accuracy - b.accuracy || b.againCount - a.againCount);

    // Upcoming reviews forecast (7 days)
    const forecast = getReviewForecast(questions, 7);

    return {
      todayReviewed,
      todayAccuracy,
      todayDuration,
      topicStats,
      totalQuestions,
      overallAccuracy,
      streak,
      weakest,
      forecast,
      activities,
    };
  }, [tick]);
}
