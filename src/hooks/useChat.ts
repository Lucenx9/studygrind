import { useState, useCallback, useRef } from 'react';
import type { ChatMessage, ChatHistory, Question, Settings } from '@/lib/types';
import { getChatHistory, saveChatHistory } from '@/lib/storage';
import { chatCompletion } from '@/lib/ai';

const MAX_MESSAGES = 20;

interface ChatContext {
  question: Question;
  userAnswer: string;
  isCorrect: boolean;
  notes: string;
}

function buildSocraticSystemPrompt(
  ctx: ChatContext,
  language: 'it' | 'en',
): string {
  const correctAnswer = ctx.question.type === 'mcq'
    ? ctx.question.options[ctx.question.correct]
    : ctx.question.acceptableAnswers[0];

  const langLabel = language === 'it' ? 'Italian' : 'English';

  return `You are a Socratic study tutor. Your goal is to help the student UNDERSTAND, not to give them the answer. You must follow this escalation pattern strictly:

LEVEL 1 (first response): Ask the student what they already know about the concept. Ask a guiding question that leads them toward the answer. Do NOT explain yet.
Example: "What do you think is the role of [concept]? How does it relate to [related concept from their notes]?"

LEVEL 2 (if student still confused): Give a small hint. Break the problem into a simpler sub-question. Still do NOT give the full explanation.
Example: "Good thinking. Let me narrow it down — if [simpler scenario], what would happen? Think about [specific clue from notes]."

LEVEL 3 (if student still stuck after 2+ exchanges): Now give a clear, concise explanation. Connect it explicitly to their notes. Then ask a verification question to check understanding.
Example: "Here's what's happening: [explanation]. Does that connect to what your notes say about [related topic]? Can you explain it back to me in your own words?"

Rules:
- NEVER give the full answer in your first response. Always start with a question.
- Keep responses short (2-4 sentences max). Long explanations cause cognitive overload.
- Use the student's own notes as the primary source. Quote specific parts when relevant.
- If the student asks "just tell me the answer", acknowledge the frustration but gently redirect: "I get it — let me give you a hint that should click: [hint]"
- Respond in ${langLabel}.
- Be warm, patient, encouraging. Never condescending.

Context — the student's notes on this topic:
${ctx.notes}

The question they just answered:
${ctx.question.question}
Their answer was: ${ctx.userAnswer} (${ctx.isCorrect ? 'correct' : 'wrong'})
The correct answer is: ${correctAnswer}
The explanation is: ${ctx.question.explanation}`;
}

export function useChat(settings: Settings) {
  const [history, setHistory] = useState<ChatHistory | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  // Ref holds context but sendMessage captures a snapshot to avoid race conditions
  const contextRef = useRef<ChatContext | null>(null);

  const openChat = useCallback((
    question: Question,
    userAnswer: string,
    isCorrect: boolean,
    notes: string,
  ) => {
    contextRef.current = { question, userAnswer, isCorrect, notes };

    const existing = getChatHistory(question.id);
    if (existing) {
      setHistory(existing);
    } else {
      setHistory({
        questionId: question.id,
        topicId: question.topicId,
        messages: [],
        socraticLevel: 1,
      });
    }
    setIsOpen(true);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  const hasHistory = useCallback((questionId: string): boolean => {
    return getChatHistory(questionId) !== null;
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    // Snapshot context at call time to prevent race conditions
    const ctx = contextRef.current;
    if (!history || !ctx || !settings.provider) return;
    if (history.messages.length >= MAX_MESSAGES) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...history.messages, userMsg];
    const updatedHistory: ChatHistory = { ...history, messages: updatedMessages };
    setHistory(updatedHistory);
    setLoading(true);

    try {
      const systemPrompt = buildSocraticSystemPrompt(ctx, settings.language);

      const assistantCount = updatedMessages.filter(m => m.role === 'assistant').length;
      const level: 1 | 2 | 3 = assistantCount >= 2 ? 3 : assistantCount >= 1 ? 2 : 1;

      const llmMessages = [
        { role: 'system' as const, content: `${systemPrompt}\n\nCurrent escalation level: LEVEL ${level}. Follow the instructions for this level strictly.` },
        ...updatedMessages.map(m => ({
          role: m.role as 'user' | 'system',
          content: m.content,
        })),
      ];

      // Use the snapshotted provider, not settings.provider (which could change)
      const response = await chatCompletion(settings.provider, llmMessages);

      const isQuestion = response.trim().endsWith('?');

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
        isQuestion,
      };

      const finalHistory: ChatHistory = {
        ...updatedHistory,
        messages: [...updatedMessages, assistantMsg],
        socraticLevel: level,
      };

      setHistory(finalHistory);
      saveChatHistory(finalHistory);
    } catch (err) {
      const errorMsg: ChatMessage = {
        role: 'assistant',
        content: `Error: ${err instanceof Error ? err.message : 'Failed to get response'}`,
        timestamp: new Date().toISOString(),
      };
      const errorHistory: ChatHistory = {
        ...updatedHistory,
        messages: [...updatedMessages, errorMsg],
      };
      setHistory(errorHistory);
    } finally {
      setLoading(false);
    }
  }, [history, settings]);

  return {
    history,
    isOpen,
    loading,
    openChat,
    closeChat,
    sendMessage,
    hasHistory,
    canSendMore: (history?.messages.length ?? 0) < MAX_MESSAGES,
  };
}
