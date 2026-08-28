# 📘 GBackgroundAI — Developer & Architecture Guide (Beast v15)
> **دليل المطورين والمهندسين الشامل لتطبيق GBackgroundAI — نواة الوحش v14**
> *Capricorn ♑ Mountain Builder Engine | Dexie.js GSoul Persistence | Modbus PLC & Termux Hardware Bridge | Samsung One UI 6/7 Optimization*

---

## 🌟 1. نظرة عامة على النظام (System Overview)

تطبيق **GBackgroundAI (Beast v14)** هو منصة ذكاء اصطناعي ذاتية التشغيل وموجهة بالمهام (Autonomous Agentic Platform) تجمع بين قوة نماذج الاستدلال الكبرى (LLMs)، وبيئة تنفيذ حية للأكواد داخل المتصفح (Pyodide Python 3 & Web Worker Sandbox)، ونظام ذاكرة مستمر متعدد الطبقات (**GSoulEngine** مبني على Dexie.js و IndexedDB)، وربط مع العتاد الصناعي (**Modbus TCP/RTU**) والهواتف الذكية (**Termux Android Bridge**).

### 🎯 هوية الكيان والشخصية (Persona Architecture)
* **البرج والسمات:** برج الجدي ♑ (Capricorn) — انضباط حديدي، هدوء، بناء منهجي خطوة بخطوة، ونَفَس طويل، صرامة تقنية بدون هلوسة.
* **لغة التخاطب:** الدارجة المغربية الذكية والسلسة في المحادثات والتوجيهات، والإنجليزية التقنية عالية الدقة في كتابة الأكواد والتوثيق الهندسي.
* **مبدأ العمل:** *Anti-Hallucination & Reality Anchor* — لا يتم افتراض البيانات أو محاكاتها بشكل وهمي؛ يتم استخدام الأدوات الحقيقية والتحقق المباشر من السجلات (Registers) والعتاد.

---

## 🏗️ 2. المعمارية البرمجية (Core Architecture)

```
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                                 GBackgroundAI FRONTEND                                    │
│  ┌───────────────────────┐  ┌─────────────────────────┐  ┌──────────────────────────────┐ │
│  │   Samsung One UI 7    │  │  Multi-Provider Engine  │  │        Artifacts Studio      │ │
│  │ Interaction Container │  │  (Gemini, NVIDIA, Groq) │  │  Live HTML/JS/CSS Sandbox    │ │
│  └──────────┬────────────┘  └────────────┬────────────┘  └──────────────┬───────────────┘ │
└─────────────┼────────────────────────────┼──────────────────────────────┼─────────────────┘
              │                            │                              │
              ▼                            ▼                              ▼
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                           G-CORE BEAST v14 ORCHESTRATOR & TOOLS                           │
│  ┌───────────────────────────────┐     ┌────────────────────────────────────────────────┐ │
│  │      ReAct Agent Loop         │     │             GSoulEngine (Dexie.js)             │ │
│  │ • Tool Calling & Parallelism  │◄───►│ • Soul Record (Identity & Archetype)           │ │
│  │ • Self-Repair Validator       │     │ • Episodic Memory (Timeline & Events)          │ │
│  │ • Task Detection & Routing    │     │ • Semantic Memory (Facts & Knowledge Base)     │ │
│  │ • Stream Parser & Delta Sync  │     │ • Working Memory (Scratchpad & Fast Cache)     │ │
│  └──────────────┬────────────────┘     └────────────────────────────────────────────────┘ │
│                 │                                                                         │
│                 ▼                                                                         │
│  ┌──────────────────────────────────────────────────────────────────────────────────────┐ │
│  │                               Builtin & Custom Tool Suite                            │ │
│  │ • Python 3 (Pyodide Wasm)  • Modbus PLC Controller     • Termux Mobile Bridge        │ │
│  │ • Chart.js Engine (Canvas) • Sandboxed JS Web Worker   • Web Search & Wikipedia      │ │
│  │ • PDF & Excel Analyzers    • Vector RAG & Automations  • Free Edge-TTS Voice Synth   │ │
│  └──────────────────────────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🧠 3. محرك الذاكرة المستمرة GSoulEngine (Dexie.js Persistence)

ملف التنفيذ: `/src/services/GSoulEngine.ts`

يقوم `GSoulEngine` بإدارة الذاكرة عبر 4 مخازن منفصلة في **IndexedDB** مدعومة بنظام المزامنة الفورية عبر النوافذ (`BroadcastChannel`) ومرآة احتياطية في `localStorage`:

### 1. مخزن الهوية والروح (`soul`)
* **المفتاح:** `identity`
* **الحقول:** `name`, `version`, `archetype`, `languageMode`, `evolutionLevel`, `lastBootTimestamp`.
* **الوظيفة:** الحفاظ على شخصية الكيان وقواعده الصارمة حتى بعد إعادة تحميل المتصفح أو تغيير النماذج.

### 2. مخزن الذاكرة العرضية (`episodic`)
* **المفتاح:** `++id` (Auto-increment)
* **الفهرسة:** `sessionId`, `type`, `timestamp`, `*tags`
* **الوظيفة:** تسجيل الأحداث الزمنية، استدعاءات الأدوات، ومحطات الإنجاز في المحادثة للرجوع إليها مستقبلاً.

### 3. مخزن المعرفة الدلالية (`semantic`)
* **المفتاح:** `++id`
* **الفهرسة:** `category`, `title`, `*keywords`, `confidence`, `lastAccessedAt`
* **الوظيفة:** تخزين تفضيلات المستخدم الدائمة، قواعد المشاريع، ومقتطفات الأكواد مع محرك بحث دلالي بالكلمات المفتاحية.

### 4. مخزن الذاكرة العاملة (`working`)
* **المفتاح:** `key`
* **الحقول:** `value`, `expiresAt`, `updatedAt`
* **الوظيفة:** مسودة مؤقتة للمتغيرات السريعة وخطوات الاستدلال الحالية مع دعم مدة صلاحية (TTL).

```typescript
import { gSoulEngine } from './services/GSoulEngine';

// حفظ حقيقة دائمة
await gSoulEngine.storeFact({
  category: 'preference',
  title: 'user_tech_stack',
  content: 'React, Tailwind CSS, TypeScript, FastAPI, Modbus TCP',
  keywords: ['react', 'tailwind', 'typescript', 'fastapi', 'modbus'],
  confidence: 1.0
});

// استرجاع المعرفة عبر البحث الدلالي
const facts = await gSoulEngine.searchSemantic('Modbus PLC', 3);
```

---

## ⚙️ 4. محرك الأدوات الصناعية وربط العتاد (Modbus & Termux)

### 🏭 1. أداة Modbus PLC Controller (`modbus_controller`)
ملف التنفيذ: `/src/services/agentTools.ts`

* **الوظيفة:** التحكم وقراءة/كتابة السجلات في وحدات التحكم الصناعية (PLCs) مثل Siemens S7-1200, Schneider Electric, Delta, و Modbus Gateways.
* **الأمان:** مزودة بنظام **IP Whitelist** لمنع هجمات SSRF وعزل العناوين غير المحلية.
* **العمليات المدعومة:**
  * `read_coils` (FC01)
  * `read_discrete_inputs` (FC02)
  * `read_holding_registers` (FC03)
  * `read_input_registers` (FC04)
  * `write_single_coil` (FC05)
  * `write_single_register` (FC06)
  * `write_multiple_registers` (FC16)
* **تنسيقات فك التشفير:** `uint16`, `int16`, `float32_be` (Big-Endian Float), `float32_le` (Little-Endian Float), `ascii`, `hex`.

```json
{
  "action": "read_holding_registers",
  "host": "192.168.1.50",
  "port": 502,
  "unit_id": 1,
  "address": 40001,
  "count": 4,
  "decode_format": "float32_be"
}
```

---

### 📱 2. جسر Termux Android Bridge (`termux_bridge`)
* **الوظيفة:** الوصول المباشر إلى عتاد الهاتف الذكي عبر Termux API مع دعم التبديل التلقائي لواجهات الويب الحديثة (Web APIs).
* **الأوامر المدعومة:**
  * `battery_status`: قياس نسبة الشحن، الحرارة، والجهد.
  * `tts_speak`: نطق النصوص بصوت الجهاز الأصلي.
  * `vibrate`: إرسال نبضات اهتزاز للمحرك الملمسي (Haptic Feedback).
  * `location`: قراءة إحداثيات GPS الدقيقة (Latitude, Longitude, Altitude).
  * `torch`: التحكم في فلاش الكاميرا (تشغيل/إطفاء).
  * `clipboard_get` / `clipboard_set`: قراءة وتحديث الحافظة.
  * `notification`: إرسال إشعارات النظام المباشرة.
  * `sms_send`: إرسال رسائل نصية قصيرة عبر الشريحة.
  * `wifi_info`: فحص قوة الإشارة (RSSI) وعنوان IP المحلي.

---

## 🎨 5. تصميم واجهة سامسونج One UI 6/7 ومخطط القوائم (One UI Menu Stylesheet)

تم ضبط التصميم وفق أعلى معايير **Samsung One UI 6 & 7**:

1. **مبدأ تقسيم الشاشة (Viewing Area vs. Interaction Area):**
   * الجزء العلوي (أول 35-40%): مساحة عرض واسعة ونصوص واضحة مع إبراز الحالة الحالية.
   * الجزء السفلي (60%): منطقة التحكم التفاعلية المريحة لإبهام اليد الواحدة (One-Handed Thumb Reachability).
2. **الحاويات المنحنية (Squircle Shapes):** استخدام حواف مستديرة متناسقة (`rounded-3xl` / 24px) مع فواصل ناعمة `border-white/5` في الوضع الليلي.
3. **أزرار الضبط السريع (Quick Setting Tiles):** كبسولات لمسية ناعمة مع انكماش ميكانيكي لطيف عند اللمس (`active:scale-97`).
4. **لوائح القوائم السفلية (Bottom Sheets):** دروج سفلية تنزلق بسلاسة بزاوية دوران وفيزياء حركة مدروسة.

---

## 📁 6. هيكل الملفات والمجلدات (Project Directory Map)

```
/
├── .env.example                     # متطلبات المتغيرات البيئية
├── README.md                        # التوثيق الأساسي للمشروع
├── DEVELOPER_GUIDE.md               # دليل المطورين الشامل والعميق (هذا الملف)
├── metadata.json                    # إعدادات التطبيق وصلاحيات الإطار
├── package.json                     # الحزم والتبعيات (Dexie, Lucide, Tailwind, Marked)
├── tsconfig.json                    # إعدادات TypeScript الصارمة
├── vite.config.ts                   # إعدادات بناء Vite مع Tailwind CSS Plugin
├── src/
│   ├── main.tsx                     # نقطة الدخول الأساسية للواجهة
│   ├── App.tsx                      # المكون الرئيسي وتوزيع الأحداث والأدوات
│   ├── index.css                    # ورقة أنماط One UI والمتغيرات والمؤثرات
│   ├── bot/                         # محرك شخصية الكيان والأفاتار التفاعلي
│   ├── types/
│   │   └── index.ts                 # تعريفات TypeScript الشاملة لجميع الكائنات
│   ├── services/
│   │   ├── GSoulEngine.ts           # محرك الذاكرة المستمرة Dexie.js
│   │   ├── agentTools.ts            # كتالوج الأدوات وتنفيذ Python/Modbus/Termux
│   │   ├── aiService.ts             # التوجيه الذكي، الرموز، وإعداد النماذج
│   │   ├── streamEngine.ts          # محرك معالجة البث الحي SSE والأحداث
│   │   ├── speechUtils.ts           # معالجة الصوت والنطق
│   │   ├── orchestrator/
│   │   │   └── AgentOrchestrator.ts # حلقة ReAct الذاتية والمدقق الذاتي
│   │   └── providers/               # محولات النماذج (Gemini, NVIDIA, Groq, Custom)
│   └── components/
│       ├── Header.tsx               # شريط الرأس وتحديد النماذج والحالة
│       ├── InputArea.tsx            # منطقة الإدخال الصوتية والتسجيل والملفات
│       ├── PremiumAvatar.tsx        # الأفاتار الحركي ثلاثي الأبعاد
│       ├── LivePreview.tsx          # صندوق المعاينة الحية للمواقع والمستندات
│       ├── ErrorBoundary.tsx        # صمام الأمان لمنع انهيار الواجهة
│       ├── Chat/
│       │   ├── ChatPage.tsx         # عارض الرسائل ومراحل التفكير
│       │   ├── AgentBubble.tsx      # فقاعة العميل ومحرر الأكواد والرسوم
│       │   └── ArtifactsPanel.tsx   # مستعرض الملفات المنشأة والمشاريع
│       ├── Modals/
│       │   ├── ModelPickerModal.tsx # منتقي النماذج المصنف
│       │   ├── ProviderPickerModal.tsx
│       │   ├── SessionsModal.tsx    # إدارة المحادثات السابقة
│       │   ├── ProjectModal.tsx     # إدارة ملفات المشروع
│       │   └── SnippetsModal.tsx    # مقتطفات الأكواد السريعة
│       └── Pages/
│           ├── SettingsPage.tsx     # صفحة الإعدادات الشاملة
│           ├── ToolsSettings.tsx    # لوحة تحكم وتفعيل الأدوات
│           ├── WelcomeView.tsx      # شاشة الترحيب وبدء المهام
│           └── DeveloperDocsPage.tsx# مركز التوثيق التفاعلي الداخلي للمطورين
```

---

## 🔒 7. الأمان وعزل البيئة (Security & Isolation)

1. **عزل تنفيذ JavaScript (Custom Tools):** يتم تنفيذ الأكواد المخصصة للمستخدمين داخل **Web Worker** منعزل بدون أي وصول إلى `window`, `document`, `localStorage`, أو ملفات تعريف الارتباط، مع فرض مهلة زمنية قصوى (5000ms).
2. **عزل بيئة Modbus:** يتم فحص عناوين IP قبل الإرسال لمنع استهداف خوادم الحوسبة السحابية الداخلية.
3. **تشفير المفاتيح:** مفاتيح API تبقى دائماً في الجانب الآمن للعميل أو السيرفر، ويتم حجبها عند تمرير الإعدادات للعمال (Workers).

---

## 🚀 8. تعليمات التطوير والتشغيل (Developer Quickstart)

```bash
# 1. تثبيت التبعيات
npm install

# 2. تشغيل بيئة التطوير المحلية
npm run dev

# 3. التحقق من سلامة الأكواد والأنواع
npm run lint           # tsc --noEmit
npm run lint:strict    # + noUnusedLocals / noUnusedParameters

# 4. اختبارات المنطق (بدون متصفح — esbuild + node)
npm test

# 5. بناء المشروع للإنتاج
npm run build
```

---

## 🛡️ 9. سياسة ثقة الأدوات (Tool Trust Policy)

كل أداة Agent يجب أن تنتمي لأحد ثلاث فئات في `src/services/toolPolicy.ts`:

| الفئة | المعنى | الإعلان للنموذج افتراضياً |
| :-- | :-- | :-- |
| `REAL` | تنفيذ حقيقي (شبكة، Pyodide، Web Crypto، Canvas…) | ✅ مُعلَن |
| `HYBRID` | واجهات جهاز حقيقية مع قيم بديلة مُقدَّرة | ✅ مُعلَن + وسم `PARTIAL HARDWARE ACCESS` |
| `SIMULATED` | مخرجات تجريبية جاهزة (mocks) | ❌ غير مُعلَنة إلا بتفعيل يدوي من الإعدادات |

قواعد إلزامية عند إضافة أداة جديدة:

1. أضف التنفيذ الحقيقي في `agentTools.ts`، ثم السكيما في `AGENT_TOOLS`، ثم بطاقة الشرح في `BUILTIN_TOOL_CATALOG`، والحالة في `TOOL_META`.
2. **إن لم يكن هناك تنفيذ حقيقي**: لا تضف الأداة إلى `AGENT_TOOLS` إطلاقاً. الدالة تُوضع خلف `executeAgentToolUniversal` وتُسمّى في `SIMULATED_TOOLS` حتى تُوسم نتائجها بـ `SIMULATED DEMO TOOL` ولا يقدّمها النموذج كحقيقة.
3. المنطق المركزي موجود في `App.tsx → executeAgentTool` عبر `annotateToolResult(fn, result)` — لا تكرّره داخل كل أداة.
4. الأدوات التي تتطلب مفتاحاً تُعلَّم في `KEY_GATED_TOOLS`؛ لن تُرسل للنموذج أصلاً بدون المفتاح.
5. `getActiveAgentTools(enabledMap, customTools, settings)` تتلقى `settings` لهذا السبب — مرّرها دائماً.

## 🔌 10. مصفوفة الإعدادات (لا تُضف مفتاحاً بلا مستهلك)

كل مفتاح في `AppSettings` يجب أن يكون مقروءاً في مكان تنفيذي، وليس في الـ UI فقط (هذا كان سبب أغلب أخطاء v13/v14):

| المفتاح | المستهلك الفعلي |
| :-- | :-- |
| `mod`, `tmp`, `maxTok` | `App.handleSend` → `resolveMaxOutputTokens` → `streamEngine` |
| `ctx` | `buildCtx` (عدد وحدات التاريخ المحمّلة) |
| `sys`, `summary` | `buildCtx` (رسائل system) |
| `autoSum`, `sumThreshold`, `sumKeep` | `App.maybeSummarize` → `summarizeHistory.generateSummary` |
| `agent`, `enabledTools`, `customTools` | `getActiveAgentTools` + `AgentOrchestrator` |
| `webSearch`, `serper` | `App.handleSend` (حقن نتائج البحث) + أداة `web_search` |
| `tts`, `ttsVoice`, `ttsSpeed` | `App.finalizeReply` → `speechUtils.speakText(text, _, _, opts)` |
| `taskRoute` | `detectTask` + `AgentOrchestrator.classifyTask` |
| `agentMem` | `buildCtx` + أداتا `remember`/`recall` |

اختبار سريع قبل الدمج: `npm run lint:strict` (لا ينبغي أن يبقى أي مفتاح/prop غير مستهلك).

## 🧠 11. ذاكرة GSoul: كيف تُستخدم فعلياً

* `App.finalizeReply` تستدعي `recordInteraction()` بعد كل رد (conversation / tool_call / error) و`learnFromUserMessage()` لاستخلاص التفضيلات تلقائياً.
* `App.handleSend` تستدعي `buildMemoryContext(text)` وتحقن النتيجة كرسالة system عبر `buildCtx(..., { extraSystem })`.
* `remember` / `recall` في الأدوات تكتب/تقرأ من `semantic`.
* **لا تغيّر اسم قاعدة البيانات** `GSoul_Beast_v14`: إعادة التسمية تعني فقدان بيانات المستخدمين؛ التوسعة تكون عبر `this.version(2).stores({...})`.
* `clearWorking()` تمسح مفاتيح `gsoul_working_*` فقط من `sessionStorage` — لا تستبدلها بـ `sessionStorage.clear()`.

## 📦 12. الحزمة والتحميل (Bundle budget)

* `App.tsx` يحمّل `SettingsPage` و`DeveloperDocsPage` بـ `React.lazy`، و`chart.js` يُستورد ديناميكياً داخل `makeChart`، و`jszip`/`file-saver` عند التصدير فقط.
* `highlight.js` مستورد من `highlight.js/lib/common` وليس الحزمة الكاملة.
* **ممنوع** استخدام `import.meta.glob(..., { query: '?raw', eager: true })` على `src/` — فعل ذلك في v14 كان يضمنّ الكود المصدري كاملاً داخل الحزمة (تضخيم + تسريب للمصدر). ملفات مساحة العمل تُزامَن وقت التشغيل عبر `projectMemory.syncWorkspace()`.
* `vite.config.ts` يوزّع الـ vendors في chunks ثابتة (`vendor-*`) للاستفادة من الكاش.

---
*تم إنشاء هذا التوثيق لخدمة مهندسي ومطوري **GBackgroundAI — Beast v15**.*
