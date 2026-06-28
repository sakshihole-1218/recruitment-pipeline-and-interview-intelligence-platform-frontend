"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface SpeakOptions {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: () => void;
}

function getEnglishVoice(voices: SpeechSynthesisVoice[]) {
  return (
    voices.find((voice) => voice.lang.toLowerCase().startsWith("en")) ??
    voices[0] ??
    null
  );
}

export function useBrowserTextToSpeech() {
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const isSupported =
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    typeof window.SpeechSynthesisUtterance !== "undefined";

  useEffect(() => {
    if (!isSupported) {
      return;
    }

    const synth = window.speechSynthesis;

    const syncVoices = () => {
      setVoices(synth.getVoices());
    };

    syncVoices();
    synth.addEventListener("voiceschanged", syncVoices);

    return () => {
      synth.removeEventListener("voiceschanged", syncVoices);
      synth.cancel();
      utteranceRef.current = null;
      setIsSpeaking(false);
      setIsPaused(false);
    };
  }, [isSupported]);

  const stop = useCallback(() => {
    if (!isSupported) {
      return;
    }

    window.speechSynthesis.cancel();
    utteranceRef.current = null;
    setIsSpeaking(false);
    setIsPaused(false);
  }, [isSupported]);

  const pause = useCallback(() => {
    if (!isSupported || !window.speechSynthesis.speaking) {
      return;
    }

    window.speechSynthesis.pause();
    setIsPaused(true);
  }, [isSupported]);

  const resume = useCallback(() => {
    if (!isSupported || !window.speechSynthesis.paused) {
      return;
    }

    window.speechSynthesis.resume();
    setIsPaused(false);
    setIsSpeaking(true);
  }, [isSupported]);

  const speak = useCallback((text: string, options?: SpeakOptions) => {
    const trimmed = text.trim();

    if (!isSupported || !trimmed) {
      options?.onError?.();
      return;
    }

    stop();

    const utterance = new SpeechSynthesisUtterance(trimmed);
    const selectedVoice = getEnglishVoice(voices);

    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang;
    } else {
      utterance.lang = "en-US";
    }

    utterance.rate = 0.98;
    utterance.pitch = 1;
    utterance.onstart = () => {
      options?.onStart?.();
      setIsSpeaking(true);
      setIsPaused(false);
    };
    utterance.onpause = () => {
      setIsPaused(true);
    };
    utterance.onresume = () => {
      setIsSpeaking(true);
      setIsPaused(false);
    };
    utterance.onend = () => {
      utteranceRef.current = null;
      setIsSpeaking(false);
      setIsPaused(false);
      options?.onEnd?.();
    };
    utterance.onerror = () => {
      utteranceRef.current = null;
      setIsSpeaking(false);
      setIsPaused(false);
      options?.onError?.();
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [isSupported, stop, voices]);

  return {
    speak,
    stop,
    pause,
    resume,
    isSpeaking,
    isPaused,
    isSupported,
  };
}
