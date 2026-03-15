import { useState, useCallback } from 'react';
import { v4 as uuid } from 'uuid';
import type { Topic } from '@/lib/types';
import { getTopics, saveTopic, deleteTopic as deleteTopicStorage } from '@/lib/storage';

export function useTopics() {
  const [topics, setTopics] = useState<Topic[]>(getTopics);

  const refresh = useCallback(() => {
    setTopics(getTopics());
  }, []);

  const addTopic = useCallback((name: string, notes: string, customInstructions?: string) => {
    const topic: Topic = {
      id: uuid(),
      name,
      notes,
      customInstructions,
      createdAt: new Date().toISOString(),
      questionCount: 0,
    };
    if (saveTopic(topic)) {
      refresh();
    }
    return topic;
  }, [refresh]);

  const updateTopic = useCallback((topic: Topic) => {
    if (saveTopic(topic)) {
      refresh();
    }
  }, [refresh]);

  const removeTopic = useCallback((topicId: string) => {
    if (deleteTopicStorage(topicId)) {
      refresh();
    }
  }, [refresh]);

  return { topics, addTopic, updateTopic, removeTopic, refresh };
}
