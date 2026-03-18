import { useState, useCallback, useRef, useEffect } from 'react';
import type { ChatMessage, ChatHistory, Question, Settings } from '@/lib/types';
import { t } from '@/lib/i18n';
import { getChatHistory, saveChatHistory } from '@/lib/storage';
import { chatCompletion, AiRequestError, TruncationError } from '@/lib/ai';

export const MAX_MESSAGES = 20;
export const WARN_THRESHOLD = 4;

interface ChatContext {
  question: Question;
  userAnswer: string;
  isCorrect: boolean;
  notes: string;
  topicName: string;
}

function buildSocraticSystemPrompt(
  ctx: ChatContext,
  language: 'it' | 'en',
): string {
  const correctAnswer = ctx.question.type === 'mcq'
    ? ctx.question.options[ctx.question.correct]
    : ctx.question.acceptableAnswers[0];

  const langLabel = language === 'it' ? 'Italian' : 'English';

  // Branch instructions based on whether the student answered correctly
  const outcomeStrategy = ctx.isCorrect
    ? `The student answered CORRECTLY. Your goal is to deepen understanding:
- Congratulate briefly (one short sentence, no excess praise).
- Then probe: ask WHY the correct answer works, or what would happen if a key condition changed.
- If MCQ: ask why they ruled out the most plausible distractor.
- Do NOT just repeat the explanation they already saw.`
    : `The student answered INCORRECTLY. Your goal is to guide them to the right answer:
- Do NOT reveal the correct answer. Keep it hidden until Level 3.
- Start by asking what reasoning led them to pick "${ctx.userAnswer}".
- Identify the specific misconception behind their wrong answer, then address it.
- If MCQ: their choice of distractor reveals what they misunderstand — target that.`;

  // MCQ-specific or Cloze-specific guidance
  const typeGuidance = ctx.question.type === 'mcq'
    ? `This is a multiple-choice question with options:
${ctx.question.options.map((opt, i) => `  ${String.fromCharCode(65 + i)}) ${opt}`).join('\n')}
The student picked: ${ctx.userAnswer}
Use the distractors to understand what the student might be confusing.`
    : `This is a fill-in-the-blank (cloze) question. The blank is "___".
The student wrote: "${ctx.userAnswer}"
Acceptable answers: ${ctx.question.acceptableAnswers.join(', ')}`;

  return `You are a Socratic study tutor helping a university student on the topic "${ctx.topicName}". Respond in ${langLabel}.

=== YOUR CORE RULES ===
- Ask exactly ONE question per response. Never stack multiple questions.
- Keep responses short: 2-3 sentences max. Brevity prevents cognitive overload.
- Be warm, patient, encouraging. Never condescending.
- NEVER reveal the correct answer or the explanation at Level 1 or 2. Keep that knowledge to yourself — use it only to craft better guiding questions.
- Do NOT trust the student's claims without verification. If they say "I know it's X because Y", check their reasoning against the facts before agreeing.
- Reference the student's own notes when possible. Quote specific phrases to ground your guidance.
- If the student asks "just tell me the answer" without effort, redirect: "I get it — let me give you a hint that should click: [hint based on their notes]". If they ask 3+ times without trying, zoom out: "What part of the hint is tripping you up?"

=== ESCALATION LEVELS ===
LEVEL 1 — Probe: Ask what they already know. One guiding question that targets the core concept.
LEVEL 2 — Hint: Break the problem into a simpler sub-question. Give a small clue from their notes. Still withhold the full answer.
LEVEL 3 — Explain: Give a clear, concise explanation grounded in their notes. Then ask ONE verification question to confirm understanding.

=== STUDENT OUTCOME ===
${outcomeStrategy}

=== QUESTION CONTEXT ===
${typeGuidance}

Question: ${ctx.question.question}

[HIDDEN — for your reasoning only, do NOT quote directly to the student]
Correct answer: ${correctAnswer}
Explanation: ${ctx.question.explanation}
[END HIDDEN]

=== STUDENT'S NOTES ON "${ctx.topicName}" ===
${ctx.notes}`;
}

export function useChat(settings: Settings) {
  const [history, setHistory] = useState<ChatHistory | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  // Ref holds context but sendMessage captures a snapshot to avoid race conditions
  const contextRef = useRef<ChatContext | null>(null);
  const activeChatIdRef = useRef<string | null>(null);
  const requestVersionRef = useRef(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      requestVersionRef.current += 1;
    };
  }, []);

  const openChat = useCallback((
    question: Question,
    userAnswer: string,
    isCorrect: boolean,
    notes: string,
    topicName: string,
  ) => {
    contextRef.current = { question, userAnswer, isCorrect, notes, topicName };
    activeChatIdRef.current = question.id;
    requestVersionRef.current += 1;
    setLoading(false);

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
    const currentHistory = history;
    const provider = settings.provider;
    if (!currentHistory || !ctx || !provider) return;
    if (currentHistory.messages.length >= MAX_MESSAGES) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...currentHistory.messages, userMsg];
    const updatedHistory: ChatHistory = { ...currentHistory, messages: updatedMessages };
    const chatId = currentHistory.questionId;
    const requestVersion = requestVersionRef.current + 1;

    requestVersionRef.current = requestVersion;
    setHistory(updatedHistory);
    setLoading(true);

    try {
      const systemPrompt = buildSocraticSystemPrompt(ctx, settings.language);

      // Escalation based on exchange pairs, not raw message count.
      // Each pair = 1 student message + 1 tutor response.
      // For correct answers: start at Level 2 (probe depth, not basics).
      const exchangeCount = updatedMessages.filter(m => m.role === 'assistant').length;
      let level: 1 | 2 | 3;
      if (ctx.isCorrect) {
        // Student got it right — skip Level 1 "what do you know", go straight to probing
        level = exchangeCount >= 2 ? 3 : 2;
      } else {
        level = exchangeCount >= 2 ? 3 : exchangeCount >= 1 ? 2 : 1;
      }

      const llmMessages = [
        { role: 'system' as const, content: `${systemPrompt}\n\nCurrent escalation level: LEVEL ${level}. Follow the instructions for this level strictly.` },
        ...updatedMessages.map(m => ({
          role: m.role,
          content: m.content,
        })),
      ];

      const response = await chatCompletion(provider, llmMessages);

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

      if (activeChatIdRef.current !== chatId || requestVersionRef.current !== requestVersion) {
        return;
      }
      if (!isMountedRef.current) return;

      setHistory(finalHistory);
      saveChatHistory(finalHistory);
    } catch (err) {
      const fallbackMessage = t('chat.replyError', settings.language);
      const detail =
        err instanceof TruncationError
          ? t('error.responseTruncated', settings.language)
          : err instanceof AiRequestError
            ? getAiErrorMessage(err, settings.language)
            : t('error.invalidResponse', settings.language);
      const errorMsg: ChatMessage = {
        role: 'assistant',
        content: `${fallbackMessage}\n\n${detail}`,
        timestamp: new Date().toISOString(),
      };
      const errorHistory: ChatHistory = {
        ...updatedHistory,
        messages: [...updatedMessages, errorMsg],
      };
      if (activeChatIdRef.current !== chatId || requestVersionRef.current !== requestVersion) {
        return;
      }
      if (!isMountedRef.current) return;
      setHistory(errorHistory);
      saveChatHistory(errorHistory);
    } finally {
      if (
        isMountedRef.current &&
        activeChatIdRef.current === chatId &&
        requestVersionRef.current === requestVersion
      ) {
        setLoading(false);
      }
    }
  }, [history, settings]);

  const messageCount = history?.messages.length ?? 0;

  return {
    history,
    isOpen,
    loading,
    openChat,
    closeChat,
    sendMessage,
    hasHistory,
    canSendMore: messageCount < MAX_MESSAGES,
    messagesRemaining: MAX_MESSAGES - messageCount,
  };
}

function getAiErrorMessage(error: AiRequestError, language: Settings['language']): string {
  switch (error.code) {
    case 'auth':
      return t('error.invalidCredentials', language);
    case 'rate_limit':
      return t('error.rateLimited', language);
    case 'server':
      return t('error.serverUnavailable', language);
    case 'timeout':
      return t('error.requestTimedOut', language);
    case 'network':
      return t('error.network', language);
    case 'request':
      return t('error.requestFailed', language);
    case 'invalid_response':
      return t('error.invalidResponse', language);
  }
}
