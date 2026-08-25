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

export const speakText = (text: string, onStart?: () => void, onEnd?: () => void) => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const cleaned = cleanTextForSpeech(text);
  if (!cleaned) {
    return;
  }

  const utterance = new SpeechSynthesisUtterance(cleaned);
  
  const bestVoice = getBestArabicVoice();
  if (bestVoice) {
    utterance.voice = bestVoice;
  } else {
    utterance.lang = /[\u0600-\u06FF]/.test(cleaned) ? 'ar-EG' : 'en-US';
  }

  utterance.rate = 0.95;
  utterance.pitch = 1.0;

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
