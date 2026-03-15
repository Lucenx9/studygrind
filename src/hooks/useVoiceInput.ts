import { useState, useCallback, useRef, useEffect } from 'react';

type VoiceState = 'idle' | 'listening' | 'processing';

// Extend Window for webkit prefix
interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createRecognition(): any | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const W = window as any;
  const SpeechRecognition = W.SpeechRecognition || W.webkitSpeechRecognition;
  if (!SpeechRecognition) return null;
  return new SpeechRecognition();
}
