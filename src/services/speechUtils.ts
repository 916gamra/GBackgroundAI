export const cleanTextForSpeech = (rawText: string): string => {
  // 1. Remove all code blocks with their content
  let cleanedText = rawText.replace(/```[\s\S]*?```/g, '');
  
  // 2. Remove inline code ticks
  cleanedText = cleanedText.replace(/`([^`]+)`/g, '$1');
  
  // 3. Remove markdown bold asterisks
  cleanedText = cleanedText.replace(/\*\*([^*]+)\*\*/g, '$1');
  
  // 4. Remove markdown headers #
  cleanedText = cleanedText.replace(/#{1,6}\s+/g, '');

  return cleanedText.trim();
};

export const getBestArabicVoice = (): SpeechSynthesisVoice | null => {
  if (typeof window === 'undefined') return null;
  
  const voices = window.speechSynthesis.getVoices();
  
  // Search for Microsoft, Google, or Natural Arabic voices
  const premiumArabicVoice = voices.find(voice => 
    voice.lang.startsWith('ar') && 
    (voice.name.includes('Natural') || voice.name.includes('Google') || voice.name.includes('Microsoft'))
  );
  
  return premiumArabicVoice || voices.find(voice => voice.lang.startsWith('ar')) || voices[0] || null;
};

export interface SpeakOptions {
  /** Exact SpeechSynthesis voice name (from Settings -> Voice); falls back to the best Arabic voice. */
  voiceName?: string;
  rate?: number;
  pitch?: number;
  lang?: string;
}

/** Resolve the requested voice once per call; Chrome only exposes names after voiceschanged. */
export const findVoiceByName = (name?: string): SpeechSynthesisVoice | null => {
  if (typeof window === 'undefined' || !window.speechSynthesis || !name) return null;
  const voices = window.speechSynthesis.getVoices();
  const target = name.toLowerCase();
  return (
    voices.find(v => v.name.toLowerCase() === target) ||
    voices.find(v => v.name.toLowerCase().includes(target)) ||
    null
  );
};

export const listVoices = (): SpeechSynthesisVoice[] => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return [];
  return window.speechSynthesis.getVoices();
};

export const speakText = (
  text: string,
  onStart?: () => void,
  onEnd?: () => void,
  options: SpeakOptions = {}
) => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const cleaned = cleanTextForSpeech(text);
  if (!cleaned) {
    return;
  }

  const utterance = new SpeechSynthesisUtterance(cleaned);

  const chosen = findVoiceByName(options.voiceName) || getBestArabicVoice();
  if (chosen) {
    utterance.voice = chosen;
  } else {
    utterance.lang = options.lang || (/[\u0600-\u06FF]/.test(cleaned) ? 'ar-EG' : 'en-US');
  }

  // rate outside [0.1, 10] throws / silently breaks on some engines
  utterance.rate = Math.min(10, Math.max(0.1, options.rate ?? 0.95));
  utterance.pitch = Math.min(2, Math.max(0, options.pitch ?? 1.0));

  if (onStart) utterance.onstart = onStart;
  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
  }

  window.speechSynthesis.speak(utterance);
};

export const stopSpeech = () => {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
};
