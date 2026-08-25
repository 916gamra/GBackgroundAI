import { EXPRESSIONS_MAP, EXPRESSIONS } from './expressions';
import { STATES_MAP, STATES } from './states';
import { BotExpression, BotState } from './types';

export type AgentBehaviorState =
  | 'idle'
  | 'waiting'
  | 'listening'
  | 'thinking'
  | 'analyzing'
  | 'speaking'
  | 'success'
  | 'error';

export interface BehaviorConfig {
  state: AgentBehaviorState;
  expressionId: string;
  animStateId: string;
  labelAr: string;
  labelEn: string;
  descriptionAr: string;
  glowColor: string;
  bodyFill: string;
  eyeColor: string;
}

export const BEHAVIOR_CONFIGS: Record<AgentBehaviorState, BehaviorConfig> = {
  idle: {
    state: 'idle',
    expressionId: 'serain',
    animStateId: 'float',
    labelAr: 'جاهز وفي الانتظار',
    labelEn: 'Ready & Waiting',
    descriptionAr: 'تنفس شاعري هادئ مع وميض طبيعي ونظرة يقظة',
    glowColor: 'var(--accent, #60a5fa)',
    bodyFill: '#0a0a0d',
    eyeColor: '#ffffff'
  },
  waiting: {
    state: 'waiting',
    expressionId: 'zen',
    animStateId: 'float',
    labelAr: 'في وضع السكون الهادئ',
    labelEn: 'Zen Standby',
    descriptionAr: 'حالة هدوء وتركيز في انتظار أوامر المستخدم',
    glowColor: 'var(--accent, #60a5fa)',
    bodyFill: '#090a0f',
    eyeColor: '#e0e7ff'
  },
  listening: {
    state: 'listening',
    expressionId: 'curieux',
    animStateId: 'pulse',
    labelAr: 'يستمع إليك باهتمام',
    labelEn: 'Actively Listening',
    descriptionAr: 'انتباه وتفاعل سريع عند كتابة المستخدم في شريط الإدخال',
    glowColor: 'var(--accent, #38bdf8)',
    bodyFill: '#081426',
    eyeColor: '#bae6fd'
  },
  thinking: {
    state: 'thinking',
    expressionId: 'vision',
    animStateId: 'bounce',
    labelAr: 'يفكر ويستنتج بعمق',
    labelEn: 'Deep Thinking & Reasoning',
    descriptionAr: 'قفزات إدراكية سريعة وتحليل المنطق وسلسلة الأفكار',
    glowColor: '#a855f7',
    bodyFill: '#140c24',
    eyeColor: '#e9d5ff'
  },
  analyzing: {
    state: 'analyzing',
    expressionId: 'robot',
    animStateId: 'bloom',
    labelAr: 'تحليل البيانات وتشغيل الأدوات',
    labelEn: 'Analyzing & Tool Execution',
    descriptionAr: 'نظرة إلكترونية متقدمة مع تفتح الجزيئات وتشغيل محركات البحث والأكواد',
    glowColor: '#06b6d4',
    bodyFill: '#071822',
    eyeColor: '#67e8f9'
  },
  speaking: {
    state: 'speaking',
    expressionId: 'joie',
    animStateId: 'heartbeat',
    labelAr: 'يكتب ويشرح الإجابة',
    labelEn: 'Writing & Streaming Response',
    descriptionAr: 'نبض تفاعلي وحيوي مستمر متزامن مع تدفق الكلمات والإجابة',
    glowColor: 'var(--accent, #3b82f6)',
    bodyFill: '#081730',
    eyeColor: '#ffffff'
  },
  success: {
    state: 'success',
    expressionId: 'clin',
    animStateId: 'bloom',
    labelAr: 'اكتملت الإجابة بنجاح',
    labelEn: 'Task Successfully Completed',
    descriptionAr: 'غمزة ذكية مبهجة مع تفتح دائري للتعبير عن إتمام المهمة',
    glowColor: '#10b981',
    bodyFill: '#061c14',
    eyeColor: '#a7f3d0'
  },
  error: {
    state: 'error',
    expressionId: 'inquiet',
    animStateId: 'shake',
    labelAr: 'تعذر الاتصال أو حدث خطأ',
    labelEn: 'Connection Error / Distressed',
    descriptionAr: 'ارتعاش متوتر مع عيون قلقة وتوهج تحذيري أحمر عند فشل الطلب',
    glowColor: '#f43f5e',
    bodyFill: '#260c12',
    eyeColor: '#fecdd3'
  }
};

/**
 * Resolves the dynamic agent behavior from operational state
 */
export function resolveAgentBehavior(params: {
  isBusy?: boolean;
  isStreaming?: boolean;
  isAgentRunning?: boolean;
  typingStatus?: string;
  hasError?: boolean;
  isSuccess?: boolean;
  isUserTyping?: boolean;
  overrideState?: AgentBehaviorState;
}): BehaviorConfig {
  if (params.overrideState && BEHAVIOR_CONFIGS[params.overrideState]) {
    return BEHAVIOR_CONFIGS[params.overrideState];
  }

  if (params.hasError) {
    return BEHAVIOR_CONFIGS.error;
  }

  if (params.isSuccess) {
    return BEHAVIOR_CONFIGS.success;
  }

  if (params.isAgentRunning || params.typingStatus?.toLowerCase().includes('tool') || params.typingStatus?.toLowerCase().includes('exec') || params.typingStatus?.toLowerCase().includes('search')) {
    return BEHAVIOR_CONFIGS.analyzing;
  }

  if (params.typingStatus?.toLowerCase().includes('think') || params.typingStatus?.toLowerCase().includes('reason')) {
    return BEHAVIOR_CONFIGS.thinking;
  }

  if (params.isStreaming || (params.isBusy && params.typingStatus)) {
    return BEHAVIOR_CONFIGS.speaking;
  }

  if (params.isBusy) {
    return BEHAVIOR_CONFIGS.thinking;
  }

  if (params.isUserTyping) {
    return BEHAVIOR_CONFIGS.listening;
  }

  return BEHAVIOR_CONFIGS.idle;
}

export { EXPRESSIONS, STATES };
