import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  Server,
  Code,
  Terminal,
  Globe,
  ScanText,
  Zap,
  Cpu,
  ChevronRight,
  ShieldCheck,
  Layers,
  Smile,
  Activity,
  ChevronDown,
  ChevronUp,
  Database,
  Brain,
  Mic,
  Search,
  CheckCircle2,
  Wrench,
  MessageSquare,
  Flame,
  Sliders,
  Sparkle,
  Radio,
  Share2,
  HardDrive
} from 'lucide-react';
import { Session, Provider, AppSettings } from '../../types';
import { MODELS } from '../../services/aiService';
import { PremiumAvatar } from '../PremiumAvatar';
import { BEHAVIOR_CONFIGS, AgentBehaviorState, EXPRESSIONS, STATES } from '../../bot';

interface WelcomeViewProps {
  sessions: Session[];
  activeProvider: Provider;
  settings: AppSettings;
  onStartNewChat: () => void;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onQuickPrompt?: (prompt: string) => void;
  onOpenProviderPicker: () => void;
  onOpenModelPicker: () => void;
}

interface CapabilityItem {
  id: string;
  title: string;
  titleEn: string;
  category: 'code' | 'data' | 'web' | 'ai' | 'hardware' | 'memory';
  categoryLabel: string;
  desc: string;
  detailedDesc: string;
  features: string[];
  tools: string[];
  exampleScenario: string;
  prompt: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  iconBg: string;
  iconColor: string;
}

export const WelcomeView: React.FC<WelcomeViewProps> = ({
  activeProvider,
  settings,
  onStartNewChat,
  onQuickPrompt,
  onOpenProviderPicker,
  onOpenModelPicker
}) => {
  const allModelsMap: Record<string, any> = { ...MODELS, ...(settings.customModels || {}) };
  const currentModelName = settings.mod === 'auto'
    ? 'توجيه تلقائي (Auto Router)'
    : allModelsMap[settings.mod]?.name || settings.mod;

  const isWorking = !activeProvider || activeProvider.status !== 'error';

  // Avatar Studio Test State
  const [selectedBehavior, setSelectedBehavior] = useState<AgentBehaviorState>('idle');
  const [customExpr, setCustomExpr] = useState<string | null>(null);
  const [customAnim, setCustomAnim] = useState<string | null>(null);
  const [showAvatarLab, setShowAvatarLab] = useState(false);

  // Capability cards state
  const [expandedCapabilityId, setExpandedCapabilityId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const capabilities: CapabilityItem[] = [
    {
      id: 'applet',
      title: 'بناء وتطوير تطبيقات الويب الحية',
      titleEn: 'Interactive Web Apps & UI Sandbox',
      category: 'code',
      categoryLabel: 'تطبيقات وواجهات',
      desc: 'صياغة تطبيقات HTML5 و Tailwind CSS تفاعلية مع معاينة فورية بساندبوكس آمن.',
      detailedDesc: 'يمتلك الوكيل القدرة على صياغة وبناء تطبيقات ويب كاملة من صفحة واحدة مع مؤثرات حركية، ربط بياني بالـ Chart.js، واجهات مستخدم One UI عصرية، ومعاينة حية فورية دون مغادرة المحادثة.',
      features: [
        'معاينة حية فورية داخل بيئة Iframe معزولة',
        'تضمين مكتبات Tailwind CSS و Chart.js و Lucide',
        'إمكانية تصدير الشيفرة وتنزيل ملفات الـ HTML جاهزة',
        'تصميمات متجاوبة بالكامل لشاشات الهواتف والحواسب'
      ],
      tools: ['render_applet', 'generate_chart', 'create_project_file'],
      exampleScenario: 'بناء لوحة تحكم لإدارة المهام مع رسوم بيانية وتخزين محلي للبيانات.',
      prompt: 'Build a modern, interactive single-page web app in HTML with Tailwind CSS and Chart.js widgets for tracking daily tasks and productivity stats.',
      icon: Code,
      iconBg: 'bg-sky-500/15',
      iconColor: 'text-sky-400'
    },
    {
      id: 'python',
      title: 'محرك بايثون وتحليل البيانات الرياضية',
      titleEn: 'Python Sandbox & Numerical Data',
      category: 'data',
      categoryLabel: 'حوسبة وتحليل',
      desc: 'تنفيذ كود بايثون وحساب المعادلات الرياضية ومعالجة المصفوفات والإحصائيات.',
      detailedDesc: 'تشغيل شيفرات بايثون الرياضية والإحصائية داخل بيئة آمنة للقيام بالعمليات الحسابية عالية الدقة، معالجة الجداول وتحليل المتسلسلات وتوليد النتائج الخوارزمية لمنع أخطاء الهلوسة الرقمية.',
      features: [
        'معالجة المتتاليات والخوارزميات الرياضية والفيزيائية',
        'حساب المؤشرات الإحصائية ومصفوفات الارتباط',
        'تجزئة البيانات والتحقق من الجداول وملفات JSON',
        'دقة رقمية عالية بدون هلوسة لنتائج العمليات الحسابية'
      ],
      tools: ['python_runner', 'calculate_expression', 'analyze_dataset'],
      exampleScenario: 'حساب أول 50 رقماً في متتالية فيبوناتشي وحساب نسبة التقارب الذهبي.',
      prompt: 'Run Python to compute the first 30 Fibonacci numbers, calculate their golden ratio convergences, and print summary statistics.',
      icon: Terminal,
      iconBg: 'bg-amber-500/15',
      iconColor: 'text-amber-400'
    },
    {
      id: 'search',
      title: 'البحث المباشر والتقصي على الويب',
      titleEn: 'Live Web Research & Grounding',
      category: 'web',
      categoryLabel: 'بحث واستكشاف',
      desc: 'البحث الحي في محركات البحث وموسوعة ويكيبيديا لجلب أحدث البيانات والمعلومات.',
      detailedDesc: 'إمكانية تصفح شبكة الإنترنت فورياً وجلب الحقائق الحديثة، الأخبار التقنية، ملخصات المقالات، وتوثيق الإجابات بمصادر وروابط موثوقة لمواكبة أحدث التطورات العالمية في الوقت الفعلي.',
      features: [
        'بحث حي عبر محرك البحث Google / Serper',
        'استخلاص الحقائق والبيانات من ويكيبيديا بعدة لغات',
        'جلب وتلخيص صفحات الويب والمقالات التقنية',
        'إسناد المعرفة بمصادر واقتباسات مؤكدة'
      ],
      tools: ['webSearch', 'wikiSearch', 'fetchURL'],
      exampleScenario: 'استكشاف أحدث ما تم نشره حول معمارية نماذج الذكاء الاصطناعي لعام 2026.',
      prompt: 'Search the web for recent 2026 developments in quantum computing and AI LLM architectures, then summarize the key breakthroughs.',
      icon: Globe,
      iconBg: 'bg-emerald-500/15',
      iconColor: 'text-emerald-400'
    },
    {
      id: 'image',
      title: 'استوديو توليد وتعديل الصور بالذكاء الاصطناعي',
      titleEn: 'AI Multimodal Image Studio',
      category: 'ai',
      categoryLabel: 'فن وبصريات',
      desc: 'إنشاء صور ورسومات فنية وواجهات ثلاثية الأبعاد بدقة فائقة مباشرة داخل المحادثة.',
      detailedDesc: 'توليد أفكار بصرية، نماذج UI أولية، رسومات رقمية، وصور واقعية أو ثلاثية الأبعاد بدقة عالية مع خيارات التحكم بالأسلوب الفني والألوان ونسب الأبعاد المناسبة للمشروع.',
      features: [
        'توليد صور واقعية وثلاثية الأبعاد بدقة فائقة',
        'خيارات أسلوبية متعددة (Photorealistic, Anime, 3D Render)',
        'تحسين تلقائي لأوصاف الصور (Prompt Enhancement)',
        'عرض وتنزيل الصور مباشرة من المحادثة'
      ],
      tools: ['generate_image', 'render_applet', 'media_preview'],
      exampleScenario: 'توليد تصميم تخيلي لمكتب عمل مستقبلي بإضاءة نيون سيان وشاشات هولوجرام.',
      prompt: 'Generate an AI image of a futuristic workspace with glowing holographic displays and neon cyan lighting in photorealistic 8k style.',
      icon: ScanText,
      iconBg: 'bg-purple-500/15',
      iconColor: 'text-purple-400'
    },
    {
      id: 'modbus',
      title: 'التحكم الصناعي وأجهزة Modbus & IoT',
      titleEn: 'Industrial Modbus PLC Controller',
      category: 'hardware',
      categoryLabel: 'أجهزة وصناعة',
      desc: 'قراءة وكتابة سجلات PLC الصناعية وفك تشفير قياسات Float32 والتحكم بالمعدات.',
      detailedDesc: 'دعم بروتوكولات الأتمتة الصناعية (Modbus TCP/RTU) لقراءة سجلات المراقبة والتحكم، فك تشفير إشارات الحساسات ودرجات الحرارة والضغط مع محاكي داخلي للاختبار.',
      features: [
        'قراءة وكتابة سجلات Coils و Holding Registers',
        'فك تشفير صيغ الأعداد Float32 BE/LE و Int32 و ASCII',
        'محاكي PLC مدمج للاختبارات التشخيصية والتعليمية',
        'مراقبة الحساسات وتوليد تقارير القياسات الفنية'
      ],
      tools: ['modbus_controller', 'telemetry_reader', 'device_diagnostics'],
      exampleScenario: 'قراءة 4 سجلات حرارة من خادم PLC عبر منفذ 40001 وفك تشفيرها.',
      prompt: 'Use modbus_controller to read 4 holding registers from PLC host 127.0.0.1 at address 40001 with float32_be decoding.',
      icon: Cpu,
      iconBg: 'bg-orange-500/15',
      iconColor: 'text-orange-400'
    },
    {
      id: 'audit',
      title: 'فحص أمان الشيفرة والتحليل البنيوي (AST)',
      titleEn: 'Code Security & Static AST Audit',
      category: 'code',
      categoryLabel: 'أمان وبرمجة',
      desc: 'فحص الشيفرات البرمجية للكشف عن الثغرات الأمنية وتسريب المفاتيح وقياس التعقيد.',
      detailedDesc: 'إجراء مراجعة عميقة للكود المصدري عبر شجرة الإعراب المجردة (AST)، الكشف عن الثغرات الأمنية الشائعة وتسريب مفاتيح API، قياس التعقيد الدوري واقتراح تحسينات هيكلية احترافية.',
      features: [
        'كشف الثغرات وتسريب المفاتيح والرموز الحساسة',
        'حساب التعقيد البنيوي ونقاط الاختناق في الكود',
        'اقتراح إعادة هيكلة احترافية (Refactoring Suggestions)',
        'توافق مع معايير الأمان لأطر العمل الحديثة'
      ],
      tools: ['audit_project_security', 'inspect_ast_tree', 'patch_file_content'],
      exampleScenario: 'فحص ملفات المشروع بحثاً عن ثغرات أمنية وتقديم تقرير مفصل للتحسين.',
      prompt: 'Analyze my project files for potential security leaks, hardcoded credentials, and cyclomatic complexity.',
      icon: ShieldCheck,
      iconBg: 'bg-rose-500/15',
      iconColor: 'text-rose-400'
    },
    {
      id: 'memory',
      title: 'الذاكرة المستدامة وتخزين الحقائق عبر الجلسات',
      titleEn: 'Long-Term Memory & Vector Facts',
      category: 'memory',
      categoryLabel: 'ذاكرة ومعرفة',
      desc: 'حفظ واسترجاع تفضيلات المستخدم وسياق المشاريع عبر جلسات العمل المختلفة.',
      detailedDesc: 'محرك ذاكرة ذكي يسمح بتسجيل المعلومات المحورية، إعدادات المستخدم، والحقائق التقنية وتضمينها تلقائياً في سياق المحادثات المستقبلية لضمان استمرارية تجربة العمل بدون الحاجة لإعادة التوجيه.',
      features: [
        'تخزين واسترجاع الأزواج (Key-Value) في الذاكرة المحلية',
        'استدعاء تلقائي للحقائق عند الحاجة إليها في المحادثة',
        'حفظ أهداف وسياق المشاريع الكبيرة',
        'خصوصية كاملة مع تخزين محلي على جهازك'
      ],
      tools: ['remember_fact', 'recall_fact', 'list_memories'],
      exampleScenario: 'تذكر معايير التنسيق المفضلة وقواعد كتابة الكود عبر جميع المحادثات.',
      prompt: 'Remember that my preferred stack is React 18 with TypeScript, Tailwind CSS, and Lucide icons.',
      icon: Database,
      iconBg: 'bg-indigo-500/15',
      iconColor: 'text-indigo-400'
    },
    {
      id: 'multiagent',
      title: 'التفكير الذاتي والتخطيط متعدد الوكلاء',
      titleEn: 'Autonomous Reflection & Consensus',
      category: 'ai',
      categoryLabel: 'ذكاء ذاتي',
      desc: 'تقسيم المهام المعقدة، التفكير المتسلسل، والتأكد من صحة النتائج عبر التنسيق الذاتي.',
      detailedDesc: 'القدرة على تفكيك المشاكل البرمجية والتحليلية الكبيرة إلى خطوات تنفيذية منظمة، فحص المخرجات ذاتياً للتأكد من خلوها من الأخطاء، واتخاذ القرارات الذكية بناءً على إجماع الخبراء الافتراضيين.',
      features: [
        'تفكيك المشاكل المعقدة إلى مهام فرعية متسلسلة',
        'مراجعة وتدقيق المخرجات ذاتياً قبل تسليمها للمستخدم',
        'تتبع الأهداف متعددة المراحل وضمان الوصول للنتيجة',
        'محاكاة نقاشات الخبراء للوصول إلى أفضل حل برمجي'
      ],
      tools: ['spawn_subagent_task', 'reflect_on_goal', 'evaluate_consensus'],
      exampleScenario: 'تخطيط وتنسيق مشروع برمجيات متكامل مع خطة زمنية ومراحل تسليم.',
      prompt: 'Decompose the architecture of a full-stack real-time collaboration app into structured sub-tasks.',
      icon: Brain,
      iconBg: 'bg-pink-500/15',
      iconColor: 'text-pink-400'
    },
    {
      id: 'voice',
      title: 'توليف الأصوات الحية ومعالجة الكلام',
      titleEn: 'Live Voice Synthesis & Speech Audio',
      category: 'ai',
      categoryLabel: 'صوتيات',
      desc: 'قراءة الردود صوتياً بجودة عالية مع دعم أصوات متعددة وتحويل النص إلى كلام.',
      detailedDesc: 'محرك متقدم لتحويل النصوص إلى كلام منطوق باستخدام واجهة Web Speech API وأصوات الذكاء الاصطناعي عالية النقاء لدعم التفاعل الصوتي الحي والمسموع.',
      features: [
        'توليف صوتي فوري متعدد اللغات (عربي وإنجليزي وغيرها)',
        'التحكم في سرعة النطق والنبرة ونقاء الصوت',
        'إمكانية الاستماع للإجابات والتعليمات البرمجية صوتياً',
        'لا يتطلب اشتراكات إضافية ويعمل مباشرة من المتصفح'
      ],
      tools: ['speak_text', 'configure_voice', 'audio_streamer'],
      exampleScenario: 'قراءة التقرير الصباحي أو ملخص البيانات بصوت نقي وطبيعي.',
      prompt: 'Speak this welcome message and explain the core features in natural Arabic speech.',
      icon: Mic,
      iconBg: 'bg-teal-500/15',
      iconColor: 'text-teal-400'
    },
    {
      id: 'automation',
      title: 'سير العمل والأتمتة والربط البرمجي',
      titleEn: 'Workflow Automation & Webhooks',
      category: 'web',
      categoryLabel: 'أتمتة وتكامل',
      desc: 'تنفيذ سيناريوهات الربط التلقائي وإرسال إشعارات وتنبيهات الويب عبر الـ Webhooks.',
      detailedDesc: 'ربط المحادثات وتطبيقات الوكيل بخدمات الويب والـ Webhooks التلقائية لإرسال إشعارات، تحديث قواعد البيانات، وتنفيذ عمليات آلية مبرمجة عند وقوع أحداث محددة.',
      features: [
        'إرسال واستقبال طلبات الـ HTTP Webhooks المخصصة',
        'بناء سيناريوهات تفاعلية متعددة الخطوات',
        'تكاملات مع منصات الأتمتة والسحابة',
        'سجلات تتبع دقيقة لكل عملية تنفيذ وأخطائها'
      ],
      tools: ['dispatch_webhook', 'execute_automation_pipeline', 'sync_records'],
      exampleScenario: 'إرسال ملخص المحادثة أو نتائج الاختبار إلى نقطة نهاية Webhook مخصصة.',
      prompt: 'Dispatch a webhook payload with current project metrics and execution status.',
      icon: Zap,
      iconBg: 'bg-violet-500/15',
      iconColor: 'text-violet-400'
    }
  ];

  const categories = [
    { id: 'all', label: 'الكل', icon: Flame },
    { id: 'code', label: 'البرمجة', icon: Code },
    { id: 'data', label: 'البيانات', icon: Terminal },
    { id: 'ai', label: 'الذكاء', icon: Brain },
    { id: 'web', label: 'الويب', icon: Globe },
    { id: 'hardware', label: 'الأجهزة', icon: Cpu },
    { id: 'memory', label: 'الذاكرة', icon: Database }
  ];

  const filteredCapabilities = capabilities.filter(cap => {
    const matchesCategory = selectedCategory === 'all' || cap.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      cap.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cap.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cap.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cap.features.some(f => f.toLowerCase().includes(searchQuery.toLowerCase())) ||
      cap.tools.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const toggleCapability = (id: string) => {
    setExpandedCapabilityId(prev => (prev === id ? null : id));
  };

  const behaviorKeys: AgentBehaviorState[] = ['idle', 'thinking', 'speaking', 'analyzing', 'success', 'error', 'listening', 'waiting'];

  return (
    <div
      className="h-full w-full max-w-xl mx-auto flex flex-col justify-start items-stretch px-4 py-4 sm:py-6 select-none animate-fadeIn overflow-y-auto custom-scrollbar gap-5 pb-32"
      dir="rtl"
    >
      {/* ============================================================ */}
      {/* 1. SAMSUNG ONE UI VIEWING AREA (Top Large Header & Avatar) */}
      {/* ============================================================ */}
      <div className="flex flex-col items-center text-center pt-2 sm:pt-4">
        {/* Galaxy Avatar with One UI Squircle & Glow */}
        <div className="relative mb-3.5 group cursor-pointer">
          <div className="absolute -inset-2 bg-gradient-to-tr from-[var(--accent)] to-purple-600 rounded-[32px] blur-xl opacity-30 group-hover:opacity-60 transition duration-500" />
          <PremiumAvatar
            behaviorState={selectedBehavior}
            expression={customExpr || undefined}
            animState={customAnim || undefined}
            interactive={true}
            className="w-20 h-20 sm:w-24 sm:h-24 !rounded-[28px] shadow-2xl relative z-10 border border-white/10"
          />
          <div className="absolute -bottom-1 -right-1 z-20 w-6 h-6 rounded-full bg-[#121217] border-2 border-[#1e1e26] flex items-center justify-center shadow-md">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
          </div>
        </div>

        {/* Samsung Large Header Typography */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight font-sans">
          G-Background <span className="text-[var(--accent)]">AI</span>
        </h1>
        <p className="text-xs sm:text-[13px] text-[#9ca3af] max-w-xs mx-auto leading-relaxed mt-1 font-sans font-medium">
          مساعدك البرمجي الذكي • One UI Architecture
        </p>

        {/* One UI Status Pill */}
        <div className="flex items-center gap-2 mt-2 px-3 py-1 rounded-full bg-[#181820] border border-[#272732] text-[11px] text-[#a1a1aa] shadow-inner font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{BEHAVIOR_CONFIGS[selectedBehavior]?.labelAr}</span>
          <span className="text-[#52525b]">•</span>
          <span className="text-xs text-[var(--accent)] font-semibold">{BEHAVIOR_CONFIGS[selectedBehavior]?.labelEn}</span>
        </div>

        {/* Avatar Behavior Quick Toggles (One UI Pills Slider) */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3 max-w-md px-1">
          {behaviorKeys.map(bKey => {
            const cfg = BEHAVIOR_CONFIGS[bKey];
            const isSelected = selectedBehavior === bKey && !customExpr;
            return (
              <button
                key={bKey}
                onClick={() => {
                  setSelectedBehavior(bKey);
                  setCustomExpr(null);
                  setCustomAnim(null);
                }}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-[var(--accent)] border-[var(--accent)] text-white shadow-md shadow-[var(--accent-light)]'
                    : 'bg-[#16161c] border-[#262630] text-[#9ca3af] hover:text-white hover:border-[#383848] active:scale-95'
                }`}
              >
                {cfg.labelAr}
              </button>
            );
          })}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. SAMSUNG ONE UI GROUPED SETTINGS CARD (Engine & Model)     */}
      {/* ============================================================ */}
      <div className="w-full flex flex-col gap-1.5">
        <span className="text-[11px] font-bold text-[#8e8e98] px-3 uppercase tracking-wider">
          إعدادات المحرك والنظام
        </span>

        <div className="w-full rounded-[26px] bg-[#16161d] border border-[#252530] shadow-xl overflow-hidden divide-y divide-[#22222c]">
          
          {/* Row 1: AI Provider */}
          <button
            onClick={onOpenProviderPicker}
            className="w-full flex items-center justify-between p-3.5 sm:p-4 hover:bg-[#1c1c24] active:bg-[#20202a] transition-all cursor-pointer text-right group"
            title="اضغط لاختيار مزود الخدمة"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-[18px] bg-[var(--accent-light)] border border-[var(--accent)]/30 flex items-center justify-center text-[var(--accent)] shrink-0 shadow-sm">
                <Server size={18} />
              </div>
              <div className="min-w-0">
                <div className="text-[10.5px] uppercase font-semibold text-[#8e8e98] tracking-wider">
                  مزود الخدمة (AI Provider)
                </div>
                <div className="font-bold text-xs sm:text-sm text-white truncate group-hover:text-[var(--accent)] transition-colors">
                  {activeProvider?.name || 'اختر المزود'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[#71717a] shrink-0">
              <span className="text-[11px] text-emerald-400 font-mono hidden sm:inline">متصل</span>
              <ChevronRight size={18} className="rotate-180 text-[#71717a] group-hover:text-white transition-colors" />
            </div>
          </button>

          {/* Row 2: Active Model */}
          <button
            onClick={onOpenModelPicker}
            className="w-full flex items-center justify-between p-3.5 sm:p-4 hover:bg-[#1c1c24] active:bg-[#20202a] transition-all cursor-pointer text-right group"
            title="اضغط لاختيار النموذج النشط"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-[18px] bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 shadow-sm">
                <Cpu size={18} />
              </div>
              <div className="min-w-0">
                <div className="text-[10.5px] uppercase font-semibold text-[#8e8e98] tracking-wider flex items-center gap-1.5">
                  <span>النموذج النشط (Active Model)</span>
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${isWorking ? 'bg-emerald-400 shadow-[0_0_6px_#10b981]' : 'bg-rose-500'}`}
                  />
                </div>
                <div className="font-bold text-xs sm:text-sm font-mono text-emerald-400 truncate">
                  {currentModelName}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[#71717a] shrink-0">
              <span className="text-[10.5px] px-2 py-0.5 rounded-full bg-[#1b1b24] border border-[#2b2b38] text-[#9ca3af] font-mono">
                تغيير
              </span>
              <ChevronRight size={18} className="rotate-180 text-[#71717a] group-hover:text-white transition-colors" />
            </div>
          </button>

          {/* Row 3: Prominent One UI Primary Button inside the Card */}
          <div className="p-3 bg-[#131319]/80">
            <button
              onClick={onStartNewChat}
              className="w-full py-3.5 px-4 rounded-[20px] bg-[var(--accent)] hover:bg-[var(--accent-hover)] active:scale-[0.98] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[var(--accent-light)] transition-all cursor-pointer"
            >
              <Plus size={18} />
              <span>بدء محادثة جديدة</span>
            </button>
          </div>

        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. AVATAR EMOTION LAB (One UI Collapsible Feature Card)      */}
      {/* ============================================================ */}
      <div className="w-full rounded-[24px] bg-[#16161d] border border-[#252530] p-3.5 shadow-lg flex flex-col gap-2">
        <div
          onClick={() => setShowAvatarLab(prev => !prev)}
          className="flex items-center justify-between cursor-pointer select-none text-xs font-bold text-white hover:text-[var(--accent)] transition-colors p-1"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-pink-500/15 flex items-center justify-center text-pink-400">
              <Smile size={15} />
            </div>
            <span className="text-xs sm:text-[13px] font-bold">مختبر تعابير وحركات الوكيل (Avatar Lab)</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-[#71717a]">
            <span>{showAvatarLab ? 'إخفاء' : 'تخصيص'}</span>
            {showAvatarLab ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </div>
        </div>

        {showAvatarLab && (
          <div className="pt-3 flex flex-col gap-3 animate-fadeIn border-t border-[#23232e] mt-1">
            {/* Expressions grid */}
            <div>
              <div className="text-[10px] uppercase font-bold text-[#8e8e98] tracking-wider mb-2 flex items-center gap-1.5">
                <Smile size={12} className="text-pink-400" />
                <span>التعابير والمشاعر المباشرة:</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                {EXPRESSIONS.map(expr => (
                  <button
                    key={expr.id}
                    onClick={() => setCustomExpr(expr.id)}
                    className={`px-2 py-1.5 rounded-xl text-[11px] font-mono text-center border transition-all cursor-pointer truncate ${
                      customExpr === expr.id
                        ? 'bg-purple-600 border-purple-400 text-white font-bold shadow-md'
                        : 'bg-[#1a1a22] border-[#282834] text-[#a1a1aa] hover:text-white hover:border-[var(--accent)]/50'
                    }`}
                  >
                    {expr.id}
                  </button>
                ))}
              </div>
            </div>

            {/* Animation States */}
            <div>
              <div className="text-[10px] uppercase font-bold text-[#8e8e98] tracking-wider mb-2 flex items-center gap-1.5">
                <Activity size={12} className="text-cyan-400" />
                <span>حالات الحركة الديناميكية:</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {STATES.map(st => (
                  <button
                    key={st.id}
                    onClick={() => setCustomAnim(st.id)}
                    className={`px-2 py-1.5 rounded-xl text-[11px] font-mono text-center border transition-all cursor-pointer truncate ${
                      customAnim === st.id
                        ? 'bg-cyan-600 border-cyan-400 text-white font-bold shadow-md'
                        : 'bg-[#1a1a22] border-[#282834] text-[#a1a1aa] hover:text-white hover:border-[var(--accent)]/50'
                    }`}
                  >
                    {st.id}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* 4. SAMSUNG ONE UI CAPABILITIES & FEATURES LIST               */}
      {/* ============================================================ */}
      <div className="w-full flex flex-col gap-3">
        
        {/* Section Header */}
        <div className="flex items-center justify-between px-2 pt-1">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-[var(--accent)]" />
            <h2 className="text-xs sm:text-[13px] font-bold text-white uppercase tracking-wider">
              قدرات وإمكانيات الوكيل
            </h2>
          </div>
          <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-[#181820] border border-[#272732] text-[var(--accent)] font-bold">
            {capabilities.length} قدرات
          </span>
        </div>

        {/* Samsung One UI Search Bar */}
        <div className="relative flex items-center">
          <Search size={16} className="absolute right-3.5 text-[#71717a] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="ابحث في القدرات أو الأدوات البرمجية..."
            className="w-full bg-[#16161d] border border-[#262632] focus:border-[var(--accent)] rounded-[20px] pr-10 pl-4 py-2.5 text-xs text-white placeholder-[#71717a] outline-none shadow-inner transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-3 text-[10.5px] text-[#a1a1aa] hover:text-white px-2 py-0.5 rounded-full bg-[#22222d] cursor-pointer"
            >
              مسح
            </button>
          )}
        </div>

        {/* Samsung One UI Category Horizontal Pill Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar no-scrollbar">
          {categories.map(cat => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11.5px] font-medium whitespace-nowrap transition-all cursor-pointer border shrink-0 ${
                  isSelected
                    ? 'bg-[var(--accent)] border-[var(--accent)] text-white shadow-md shadow-[var(--accent-light)]'
                    : 'bg-[#16161d] border-[#262632] text-[#9ca3af] hover:text-white hover:border-[#383848] active:scale-95'
                }`}
              >
                <Icon size={13} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Grouped One UI List Container for Capabilities */}
        <div className="w-full rounded-[26px] bg-[#16161d] border border-[#252530] shadow-xl overflow-hidden divide-y divide-[#22222c]">
          {filteredCapabilities.map(cap => {
            const Icon = cap.icon;
            const isExpanded = expandedCapabilityId === cap.id;

            return (
              <div key={cap.id} className="transition-colors">
                
                {/* Header Row: Samsung One UI List Item */}
                <div
                  onClick={() => toggleCapability(cap.id)}
                  className={`p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer select-none transition-all ${
                    isExpanded ? 'bg-[#1a1a24]' : 'hover:bg-[#1a1a22] active:bg-[#1e1e28]'
                  }`}
                  title="اضغط لعرض تفاصيل القدرة"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Samsung Squircle Icon */}
                    <div className={`w-11 h-11 rounded-[18px] ${cap.iconBg} ${cap.iconColor} border border-white/5 flex items-center justify-center shrink-0 shadow-sm`}>
                      <Icon size={20} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs sm:text-sm text-white hover:text-[var(--accent)] transition-colors truncate">
                          {cap.title}
                        </span>
                        <span className="text-[9.5px] font-mono px-2 py-0.5 rounded-full bg-[#1e1e28] text-[#9ca3af] border border-[#2c2c3a] shrink-0">
                          {cap.categoryLabel}
                        </span>
                      </div>
                      <p className="text-[11px] sm:text-xs text-[#8e8e98] line-clamp-1 mt-0.5 leading-relaxed font-sans">
                        {cap.desc}
                      </p>
                    </div>
                  </div>

                  {/* Accordion Arrow Indicator */}
                  <div className="flex items-center gap-1 shrink-0">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                        isExpanded
                          ? 'bg-[var(--accent)] text-white rotate-180 shadow-md'
                          : 'bg-[#1e1e28] text-[#8e8e98]'
                      }`}
                    >
                      <ChevronDown size={15} />
                    </div>
                  </div>
                </div>

                {/* Expanded One UI Detail Panel */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-3 bg-[#131319] flex flex-col gap-3.5 animate-fadeIn border-t border-[#22222d]">
                    
                    {/* English Subtitle */}
                    <div className="flex items-center justify-between text-[11px] text-[#71717a] font-mono">
                      <span>{cap.titleEn}</span>
                      <span className="text-emerald-400 font-semibold">مستوى التشغيل: تلقائي بالكامل</span>
                    </div>

                    {/* Description Box */}
                    <div className="p-3.5 rounded-[18px] bg-[#181822] border border-[#272734] text-xs text-[#d1d5db] leading-relaxed font-sans shadow-inner">
                      {cap.detailedDesc}
                    </div>

                    {/* Features List */}
                    <div>
                      <div className="text-[10.5px] uppercase font-bold text-[#9ca3af] tracking-wider mb-2 flex items-center gap-1.5">
                        <CheckCircle2 size={13} className="text-emerald-400" />
                        <span>أبرز المميزات والخصائص المدعومة:</span>
                      </div>
                      <div className="grid grid-cols-1 gap-1.5">
                        {cap.features.map((feat, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-2.5 text-[11.5px] text-[#cbd5e1] bg-[#181822] p-2.5 rounded-xl border border-[#242430]"
                          >
                            <span className="text-[var(--accent)] font-bold mt-0.5">•</span>
                            <span className="leading-tight">{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tools involved */}
                    <div>
                      <div className="text-[10.5px] uppercase font-bold text-[#9ca3af] tracking-wider mb-1.5 flex items-center gap-1.5">
                        <Wrench size={13} className="text-[var(--accent)]" />
                        <span>الأدوات البرمجية المرتبطة (Agent Tools):</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {cap.tools.map((toolName, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-lg bg-[#1c1c28] border border-[#2d2d3e] text-[11px] font-mono text-[var(--accent)]"
                          >
                            {toolName}()
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Practical Scenario */}
                    <div className="p-3 rounded-[18px] bg-purple-500/10 border border-purple-500/25 flex flex-col gap-1 shadow-sm">
                      <div className="text-[10.5px] font-bold text-purple-300 flex items-center gap-1.5">
                        <Sparkle size={12} />
                        <span>سيناريو استخدام عملي:</span>
                      </div>
                      <p className="text-[11.5px] text-[#e2e8f0] leading-relaxed">
                        {cap.exampleScenario}
                      </p>
                    </div>

                    {/* Explicit Action Button */}
                    {onQuickPrompt && (
                      <div className="pt-1">
                        <button
                          onClick={() => onQuickPrompt(cap.prompt)}
                          className="w-full py-2.5 px-3.5 rounded-[16px] bg-[#1e1e2a] hover:bg-[var(--accent)] text-[#e2e8f0] hover:text-white border border-[#2e2e40] hover:border-[var(--accent)] transition-all text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.98]"
                        >
                          <MessageSquare size={14} />
                          <span>تجربة هذه القدرة في محادثة جديدة</span>
                        </button>
                      </div>
                    )}

                  </div>
                )}

              </div>
            );
          })}

          {filteredCapabilities.length === 0 && (
            <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
              <Search size={26} className="text-[#52525b]" />
              <p className="text-xs text-[#a1a1aa]">لم يتم العثور على قدرات تطابق بحثك</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="text-[11px] text-[var(--accent)] underline cursor-pointer"
              >
                إعادة ضبط عوامل التصفية
              </button>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
