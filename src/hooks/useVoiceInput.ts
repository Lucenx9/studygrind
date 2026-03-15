import { useState, useCallback, useRef, useEffect } from 'react';

type VoiceState = 'idle' | 'listening' | 'processing';

interface SpeechRecognitionAlternative {
  transcript: string;
}

interface SpeechRecognitionResult {
  0: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

interface BrowserSpeechRecognition {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => BrowserSpeechRecognition;
    webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
  }
}

export function useVoiceInput(language: 'it' | 'en') {
  const [state, setState] = useState<VoiceState>('idle');
  const [interim, setInterim] = useState('');
  const recognitionRef = useRef<ReturnType<typeof createRecognition> | null>(null);

  const isSupported = typeof window !== 'undefined' && (
    'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
  );

  const startListening = useCallback((onResult: (transcript: string) => void) => {
    if (!isSupported) return;

    recognitionRef.current?.stop();
    const recognition = createRecognition();
    if (!recognition) return;

    recognition.lang = language === 'it' ? 'it-IT' : 'en-US';
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognitionRef.current = recognition;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const results = event.results;
      const last = results[results.length - 1];
      const transcript = last[0].transcript;

      if (last.isFinal) {
        setState('processing');
        setInterim('');
        onResult(transcript);
        setState('idle');
      } else {
        setInterim(transcript);
      }
    };

    recognition.onerror = () => {
      recognitionRef.current = null;
      setState('idle');
      setInterim('');
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      setState('idle');
      setInterim('');
    };

    setState('listening');
    recognition.start();
  }, [language, isSupported]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setState('idle');
    setInterim('');
  }, []);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
    };
  }, []);

  return {
    state,
    interim,
    isSupported,
    startListening,
    stopListening,
  };
}

function createRecognition(): BrowserSpeechRecognition | null {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return null;
  return new SpeechRecognition();
}
