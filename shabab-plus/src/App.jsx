import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import {
  getAuth,
  signInAnonymously,
  signInWithCustomToken,
  onAuthStateChanged
} from 'firebase/auth';
import {
  Sparkles,
  Users,
  QrCode,
  Monitor,
  Smartphone,
  Settings,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Maximize2,
  Minimize2,
  Play,
  Activity,
  Lock,
  Unlock,
  Columns
} from 'lucide-react';

// ============================================================================
// 1. ثوابت وإعدادات الـ Firebase والتطبيق
// ============================================================================
const rawFirebaseConfig = typeof __firebase_config !== 'undefined' ? __firebase_config : {};
const firebaseConfig = {
  apiKey: rawFirebaseConfig.apiKey || "AIzaSyA_bNcj-oyPelPfe1X1wODqUJos2KV7ZvU",
  authDomain: rawFirebaseConfig.authDomain || "shabab-plus-c0986.firebaseapp.com",
  projectId: rawFirebaseConfig.projectId || "shabab-plus-c0986",
  storageBucket: rawFirebaseConfig.storageBucket || "shabab-plus-c0986.firebasestorage.app",
  messagingSenderId: rawFirebaseConfig.messagingSenderId || "1001948899736",
  appId: rawFirebaseConfig.appId || "1:1001948899736:web:c4a8cd0dd705f040f823ed",
  measurementId: rawFirebaseConfig.measurementId || "G-FHVZGFY6JJ",
  ...rawFirebaseConfig
};

let app, db, auth;
let isFirebaseAvailable = false;

try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  isFirebaseAvailable = true;
} catch (err) {
  console.warn("Firebase initialized in mock fallback mode:", err);
}

const COLLECTIONS = {
  EVENT_CONFIG: 'event_config',
  REGISTRATIONS: 'registrations',
  TRANSIENT_PULSES: 'transient_pulses'
};

const DEFAULT_EVENT_ID = 'shabab_plus_2026';
const DEFAULT_TARGET_COUNT = 100;

// ============================================================================
// 2. مكون شعار "شباب+" المخصص (SVG)
// ============================================================================
function ShababPlusLogo({ className = 'w-16 h-16', customUrl = '' }) {
  if (customUrl) {
    return (
      <img
        src={customUrl}
        alt="شعار الحدث"
        className={`${className} object-contain`}
      />
    );
  }

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <div className="absolute inset-0 bg-[#A61936] rounded-2xl transform rotate-3 shadow-lg opacity-90"></div>
      <div className="absolute inset-0 bg-[#0B2D50] rounded-2xl transform -rotate-3 shadow-md flex items-center justify-center">
        <span className="text-white font-black text-xl tracking-tighter">
          شباب<span className="text-[#A61936]">+</span>
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// 3. مكون شاشة تسجيل المشارك (الاسم ← سؤال الجاهزية ← انضم الآن ← ترحيب)
// ============================================================================
function ParticipantRegistrationPage({
  existingRegistration,
  onRegisterSubmit,
  registrationStatus,
  registrationError,
  customLogoUrl,
  isConnected
}) {
  const [fullName, setFullName] = useState('');
  const [isReady, setIsReady] = useState(false);
  const [nameError, setNameError] = useState('');
  const [readyError, setReadyError] = useState('');

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const trimmed = fullName.trim();

    if (!trimmed) {
      setNameError('يرجى كتابة الاسم الثلاثي أو الكامل للبدء');
      return;
    }
    if (trimmed.length < 3) {
      setNameError('الاسم قصير جداً، يرجى كتابة الاسم الكامل');
      return;
    }
    if (!isReady) {
      setReadyError('يرجى تأكيد جاهزيتك قبل الانضمام');
      return;
    }

    setNameError('');
    setReadyError('');
    onRegisterSubmit(trimmed, isReady);
  };

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col justify-between p-4 sm:p-6 text-center">
      {/* الترويسة والشعار */}
      <header className="pt-6 pb-4 flex flex-col items-center">
        <ShababPlusLogo className="w-20 h-20 mb-4" customUrl={customLogoUrl} />
        <h1 className="text-2xl sm:text-3xl font-black text-[#0B2D50] tracking-tight">
          الملتقى الافتتاحي لـ <span className="text-[#A61936]">شباب+</span>
        </h1>
        <p className="text-xs sm:text-sm text-[#0B2D50]/70 mt-1 font-semibold">
          بداية الرحلة | اهلا بك في البرنامج البنائي المستمر للشباب الاردني
        </p>

        <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#0B2D50]/5 border border-[#0B2D50]/10">
          {isConnected ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[#0B2D50]">متصل بالقاعة مباشرة</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span className="text-[#0B2D50]/60">جاري الاتصال...</span>
            </>
          )}
        </div>
      </header>

      <main className="my-auto py-4">
        {existingRegistration || registrationStatus === 'success' ? (
          /* ====== شاشة الترحيب بعد الانضمام ====== */
          <div className="bg-white rounded-3xl p-8 shadow-xl border-2 border-emerald-500/30 text-center animate-fadeIn">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5 text-emerald-600">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0B2D50] mb-3">
              أهلاً بك في عائلة شباب<span className="text-[#A61936]">+</span> 🎉
            </h2>
            <p className="text-base font-extrabold text-[#A61936]">
              {existingRegistration?.displayName || fullName}
            </p>
            <p className="text-xs font-semibold text-[#0B2D50]/60 mt-4">
              تم تسجيلك بنجاح، شاهد اسمك على شاشة القاعة الآن!
            </p>
          </div>
        ) : (
          /* ====== نموذج التسجيل ====== */
          <form
            onSubmit={handleFormSubmit}
            className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-[#0B2D50]/10 text-right"
          >
            <h2 className="text-lg font-black text-[#0B2D50] mb-4 text-center">
              سجّل اسمك لبدء رحلتك في شباب+
            </h2>

            {/* 1) الاسم */}
            <div className="mb-5">
              <label className="block text-xs font-bold text-[#0B2D50] mb-2">
                الاسم الكامل / الثلاثي
              </label>
              <input
                type="text"
                placeholder="مثال: محمد أحمد علي"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  setNameError('');
                }}
                className="w-full text-right font-bold rounded-xl px-4 py-3 bg-[#F2EFE6] border border-[#0B2D50]/20 focus:outline-none focus:ring-2 focus:ring-[#A61936]"
              />
              {nameError && (
                <p className="mt-1.5 text-xs font-bold text-[#A61936]">{nameError}</p>
              )}
            </div>

            {/* 2) سؤال الجاهزية + الـ checkbox */}
            <div className="mb-5 bg-[#F2EFE6] p-4 rounded-2xl border border-[#0B2D50]/15 text-center">
              <h3 className="text-sm font-bold text-[#0B2D50] mb-3">
                جاهز تكون جزء من الرحلة؟
              </h3>
              <label className="inline-flex items-center gap-3 cursor-pointer select-none bg-white px-5 py-3 rounded-xl border border-[#0B2D50]/20 shadow-sm active:scale-95 transition-transform">
                <input
                  type="checkbox"
                  checked={isReady}
                  onChange={(e) => {
                    setIsReady(e.target.checked);
                    setReadyError('');
                  }}
                  className="w-6 h-6 rounded focus:ring-[#A61936] accent-[#A61936]"
                />
                <span className="text-base font-extrabold text-[#0B2D50]">
                  {isReady ? 'أنا جاهز ومستعد! 🚀' : 'اضغط هنا لتأكيد جاهزيتك'}
                </span>
              </label>
              {readyError && (
                <p className="mt-2 text-xs font-bold text-[#A61936]">{readyError}</p>
              )}
            </div>

            {registrationError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{registrationError}</span>
              </div>
            )}

            {/* 3) زر الانضمام */}
            <button
              type="submit"
              disabled={registrationStatus === 'submitting'}
              className="w-full py-4 rounded-2xl bg-[#A61936] text-white font-black text-base shadow-lg hover:bg-[#8e142d] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {registrationStatus === 'submitting' ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>جاري تسجيل الاسم...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>انضم الآن</span>
                </>
              )}
            </button>
          </form>
        )}
      </main>

      <footer className="py-4 text-xs font-bold text-[#0B2D50]/50">
        جميع الحقوق محفوظة © شباب+ 2026
      </footer>
    </div>
  );
}

// ============================================================================
// 4. مكون شاشة العرض الكبرى في القاعة (Display Page)
// ============================================================================
function LiveEventDisplay({
  registrations,
  targetCount,
  activePulse,
  queueDepth,
  canonicalUrl,
  customLogoUrl,
  isConnected,
  isFullscreen,
  onToggleFullscreen
}) {
  const currentCount = registrations.length;
  const percentage = Math.min(100, Math.round((currentCount / targetCount) * 100));

  return (
    <div className="min-h-screen bg-[#0B2D50] text-white flex flex-col justify-between p-6 sm:p-10 relative overflow-hidden">
      {activePulse && (
        <div
          className={`absolute inset-0 pointer-events-none transition-opacity duration-500 z-0 ${
            activePulse.action === 'checked'
              ? 'bg-[#A61936]/20 animate-pulse'
              : 'bg-amber-500/10'
          }`}
        />
      )}

      <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-6">
        <div className="flex items-center gap-4">
          <ShababPlusLogo className="w-16 h-16" customUrl={customLogoUrl} />
          <div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              شباب<span className="text-[#A61936]">+</span> | الملتقى الافتتاحي
            </h1>
            <p className="text-xs sm:text-sm text-white/70 font-semibold mt-1">
              لوحة التفاعل الحية وبث أسماء الحاضرين
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-left hidden sm:block">
            <div className="text-2xl sm:text-4xl font-black text-emerald-400">
              {currentCount}{' '}
              <span className="text-base font-semibold text-white/60">
                / {targetCount}
              </span>
            </div>
            <div className="text-xs font-bold text-white/50">المشاركون الآن</div>
          </div>

          <button
            type="button"
            onClick={onToggleFullscreen}
            className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
            title="ملء الشاشة"
          >
            {isFullscreen ? <Minimize2 className="w-6 h-6" /> : <Maximize2 className="w-6 h-6" />}
          </button>
        </div>
      </div>

      <div className="relative z-10 my-6">
        <div className="flex justify-between items-center text-sm font-bold text-white/80 mb-2">
          <span>نسبة الجاهزية والاكتمال</span>
          <span className="text-emerald-400 font-extrabold">{percentage}%</span>
        </div>
        <div className="w-full bg-white/10 h-4 rounded-full overflow-hidden p-0.5 border border-white/10">
          <div
            className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-700 shadow-lg"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      <div className="relative z-10 flex-1 my-4 bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 flex flex-col justify-start">
        <h2 className="text-lg font-bold text-white/80 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-[#A61936]" />
          <span>مشتركين شباب+</span>
        </h2>

        {registrations.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-white/40 font-bold">
            <Activity className="w-12 h-12 mb-2 animate-bounce" />
            <span>بانتظار تسجيل المشتركين...</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 overflow-y-auto max-h-[45vh] p-2">
            {registrations.map((reg, idx) => (
              <div
                key={reg.id}
                className="bg-white/10 hover:bg-white/20 border border-white/15 rounded-2xl p-3 text-center transition-all animate-fadeIn"
              >
                <div className="text-xs font-bold text-[#A61936] mb-1">
                  #{registrations.length - idx}
                </div>
                <div className="text-sm sm:text-base font-black text-white truncate">
                  {reg.displayName}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="relative z-10 flex flex-wrap items-center justify-between text-xs font-bold text-white/50 border-t border-white/10 pt-4">
        <div>حالة الاتصال: {isConnected ? 'متصل 🟢' : 'منقطع 🔴'}</div>
        {activePulse && (
          <div className="text-emerald-400 font-extrabold animate-pulse">
            ⚡ تفاعل حي من أحد المشاركين!
          </div>
        )}
        <div>شباب+ 2026</div>
      </div>
    </div>
  );
}

// ============================================================================
// 5. مكون عرض الـ QR Code للجمهور في القاعة
// ============================================================================
function QrCodePresentation({ canonicalUrl, customLogoUrl, onOpenSettings }) {
  const displayUrl =
    canonicalUrl ||
    (typeof window !== 'undefined' ? window.location.href : 'https://shabab-plus.app');

  return (
    <div className="min-h-screen bg-[#0B2D50] text-white flex flex-col items-center justify-center p-6 text-center">
      <ShababPlusLogo className="w-24 h-24 mb-6" customUrl={customLogoUrl} />
      <h1 className="text-3xl sm:text-5xl font-black mb-4">
        امسح الرمز للتسجيل والمشاركة 📱
      </h1>
      <p className="text-base sm:text-xl text-white/70 max-w-lg mb-8 font-semibold">
        افتح كاميرا هاتفك وامسح الرمز لتسجيل حضورك في ملتقى شباب+ فوراً
      </p>

      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-2xl border-4 border-[#A61936]">
        <div className="w-64 h-64 sm:w-80 sm:h-80 bg-gray-900 rounded-2xl flex items-center justify-center text-white relative overflow-hidden border-2 border-black">
          <QrCode className="w-48 h-48 sm:w-60 sm:h-60 text-white" />
          <div className="absolute inset-0 bg-white/5 flex items-center justify-center">
            <span className="bg-[#A61936] text-white text-xs font-black px-3 py-1 rounded-full shadow">
              شباب+
            </span>
          </div>
        </div>
      </div>

      <p className="mt-6 text-sm font-bold text-white/60 dir-ltr">{displayUrl}</p>
    </div>
  );
}

// ============================================================================
// 6. لوحة إعدادات واختبارات المنظمين
// ============================================================================
function OrganizerConfigAndTests({
  targetCount,
  canonicalUrl,
  customLogoUrl,
  eventId,
  registrationsCount,
  onSaveConfig,
  onTriggerTestPulse,
  onTriggerBurstPulses,
  onSimulateNewParticipant,
  onResetCurrentBrowserToken,
  rehearsalTokenId
}) {
  const [target, setTarget] = useState(targetCount);
  const [simName, setSimName] = useState('');

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-3xl p-6 shadow-md border border-[#0B2D50]/10">
        <h2 className="text-xl font-black text-[#0B2D50] mb-4 flex items-center gap-2">
          <Settings className="w-6 h-6 text-[#A61936]" />
          <span>إعدادات الحدث والقاعة</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#0B2D50] mb-2">
              العدد المخطط للمشاركين (Target)
            </label>
            <input
              type="number"
              value={target}
              onChange={(e) => setTarget(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl bg-[#F2EFE6] border border-[#0B2D50]/20 font-bold"
            />
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={() => onSaveConfig({ targetCount: target })}
              className="w-full py-2.5 rounded-xl bg-[#0B2D50] text-white font-extrabold text-sm hover:bg-[#123f6e]"
            >
              حفظ الإعدادات
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-md border border-[#0B2D50]/10">
        <h2 className="text-xl font-black text-[#0B2D50] mb-4 flex items-center gap-2">
          <Play className="w-6 h-6 text-[#A61936]" />
          <span>اختبارات وتجارب القاعة الحية</span>
        </h2>

        <div className="flex flex-wrap gap-3 mb-6">
          <button
            type="button"
            onClick={() => onTriggerTestPulse(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700"
          >
            إرسال نبضة تجريبية (جاهز)
          </button>

          <button
            type="button"
            onClick={onTriggerBurstPulses}
            className="px-4 py-2.5 rounded-xl bg-[#A61936] text-white font-bold text-xs hover:bg-[#8e142d]"
          >
            إرسال دفعة نبضات سريعة 🔥
          </button>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <label className="block text-xs font-bold text-[#0B2D50] mb-2">
            محاكاة تسجيل اسم مشارك جديد
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="اسم المشارك الوهمي"
              value={simName}
              onChange={(e) => setSimName(e.target.value)}
              className="flex-1 px-4 py-2 rounded-xl bg-[#F2EFE6] border border-[#0B2D50]/20 text-sm font-bold"
            />
            <button
              type="button"
              onClick={() => {
                if (simName) {
                  onSimulateNewParticipant(simName);
                  setSimName('');
                }
              }}
              className="px-5 py-2 rounded-xl bg-[#0B2D50] text-white font-bold text-xs"
            >
              إضافة للقاعة
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 7. التطبيق الرئيسي (App)
// ============================================================================
export default function App() {
  const [activeView, setActiveView] = useState(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '');
      const path = window.location.pathname;
      if (hash === '/display' || path.endsWith('/display')) return 'display';
      if (hash === '/qr' || path.endsWith('/qr')) return 'qr';
      if (hash === '/config' || path.endsWith('/config')) return 'config';
      if (hash === '/split' || path.endsWith('/split')) return 'split';
      if (hash === '/admin' || path.endsWith('/admin')) return 'display';
    }
    return 'register';
  });

  const [isOrganizerAuthenticated, setIsOrganizerAuthenticated] = useState(() => {
    try {
      return typeof window !== 'undefined' && window.sessionStorage.getItem('shabab_organizer') === '1';
    } catch (_) {
      return false;
    }
  });
  const [organizerPasscode, setOrganizerPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState(false);

  const [user, setUser] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  const [eventConfig, setEventConfig] = useState({
    eventId: DEFAULT_EVENT_ID,
    targetCount: DEFAULT_TARGET_COUNT,
    canonicalRegistrationUrl: '',
    customLogoDataUrl: ''
  });

  const [registrations, setRegistrations] = useState([]);
  const [registrationStatus, setRegistrationStatus] = useState('idle');
  const [registrationError, setRegistrationError] = useState('');

  const [rehearsalSuffix, setRehearsalSuffix] = useState('');

  const [, setIsReadyChecked] = useState(false);
  const [, setCheckboxSyncState] = useState('idle');
  const [activePulse, setActivePulse] = useState(null);
  const [pulseQueue, setPulseQueue] = useState([]);
  const processedPulseIdsRef = useRef(new Set());
  const mountTimestampRef = useRef(Date.now());

  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const linkId = 'shabab-arabic-fonts';
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href =
        'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Tajawal:wght@400;500;700;800;900&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  const navigateTo = useCallback((view) => {
    setActiveView(view);
    if (typeof window !== 'undefined') {
      try {
        window.history.replaceState(null, '', `#/${view}`);
      } catch (_) {}
    }
  }, []);

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      const map = {
        '/display': 'display',
        '/qr': 'qr',
        '/config': 'config',
        '/split': 'split',
        '/admin': 'display',
        '/register': 'register'
      };
      setActiveView(map[hash] || 'register');
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const handleOrganizerLogin = (e) => {
    e.preventDefault();
    if (organizerPasscode.trim() === 'shabab2026' || organizerPasscode.trim() === '1234') {
      setIsOrganizerAuthenticated(true);
      try {
        window.sessionStorage.setItem('shabab_organizer', '1');
      } catch (_) {}
      setOrganizerPasscode('');
      setPasscodeError(false);
    } else {
      setPasscodeError(true);
    }
  };

  const handleOrganizerLogout = () => {
    setIsOrganizerAuthenticated(false);
    try {
      window.sessionStorage.removeItem('shabab_organizer');
    } catch (_) {}
    navigateTo('register');
  };

  const needsOrganizerLogin = activeView !== 'register' && !isOrganizerAuthenticated;
  const effectiveView = needsOrganizerLogin ? 'register' : activeView;

  useEffect(() => {
    const initAuth = async () => {
      if (!isFirebaseAvailable || !auth) {
        setUser({ uid: 'mock_demo_user_' + Math.random().toString(36).slice(2, 7) });
        setIsConnected(true);
        return;
      }

      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.warn('Firebase Auth fallback enabled:', err);
        setUser({ uid: 'local_preview_user' });
        setIsConnected(true);
      }
    };

    initAuth();
    if (isFirebaseAvailable && auth) {
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        if (currentUser) {
          setUser(currentUser);
          setIsConnected(true);
        } else {
          setUser({ uid: 'local_preview_user' });
          setIsConnected(true);
        }
      });
      return () => unsubscribe();
    }
  }, []);

  useEffect(() => {
    if (!isFirebaseAvailable || !db) {
      setIsConnected(true);
      return;
    }

    const configDocRef = doc(db, COLLECTIONS.EVENT_CONFIG, 'active_config');

    const unsubConfig = onSnapshot(
      configDocRef,
      (snap) => {
        setIsConnected(true);
        if (snap.exists()) {
          const data = snap.data();
          setEventConfig((prev) => ({
            eventId: data.eventId || prev.eventId || DEFAULT_EVENT_ID,
            targetCount:
              typeof data.targetCount === 'number' && data.targetCount > 0
                ? data.targetCount
                : DEFAULT_TARGET_COUNT,
            canonicalRegistrationUrl: data.canonicalRegistrationUrl || '',
            customLogoDataUrl: data.customLogoDataUrl || ''
          }));
        }
      },
      () => {
        console.warn('Config listener fallback active');
        setIsConnected(true);
      }
    );

    const regsColRef = collection(db, COLLECTIONS.REGISTRATIONS);

    const unsubRegs = onSnapshot(
      regsColRef,
      (snapshot) => {
        setIsConnected(true);
        const list = [];
        const seenIds = new Set();

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (
            data &&
            typeof data.displayName === 'string' &&
            data.displayName.trim().length > 0 &&
            (data.eventId || DEFAULT_EVENT_ID) === eventConfig.eventId &&
            !seenIds.has(docSnap.id)
          ) {
            seenIds.add(docSnap.id);
            list.push({
              id: docSnap.id,
              displayName: data.displayName.trim(),
              createdAt: typeof data.createdAt === 'number' ? data.createdAt : 0,
              eventId: data.eventId || DEFAULT_EVENT_ID
            });
          }
        });

        list.sort((a, b) => b.createdAt - a.createdAt);
        setRegistrations(list);
      },
      () => {
        console.warn('Registrations listener fallback active');
        setIsConnected(true);
      }
    );

    const pulsesColRef = collection(db, COLLECTIONS.TRANSIENT_PULSES);

    const unsubPulses = onSnapshot(
      pulsesColRef,
      (snapshot) => {
        const now = Date.now();
        const incomingPulses = [];

        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const data = change.doc.data();
            const pulseId = data?.interactionId || change.doc.id;
            const createdAt = typeof data?.createdAt === 'number' ? data.createdAt : 0;

            if (now - createdAt > 12000) {
              deleteDoc(change.doc.ref).catch(() => {});
              return;
            }

            if (
              data &&
              (data.eventId || DEFAULT_EVENT_ID) === eventConfig.eventId &&
              (data.action === 'checked' || data.action === 'unchecked') &&
              createdAt >= mountTimestampRef.current - 5000 &&
              !processedPulseIdsRef.current.has(pulseId)
            ) {
              processedPulseIdsRef.current.add(pulseId);
              incomingPulses.push({
                docId: change.doc.id,
                interactionId: pulseId,
                action: data.action,
                createdAt
              });

              setTimeout(() => {
                deleteDoc(change.doc.ref).catch(() => {});
              }, 5500);
            }
          }
        });

        if (incomingPulses.length > 0) {
          incomingPulses.sort((a, b) => a.createdAt - b.createdAt);
          setPulseQueue((prev) => [...prev, ...incomingPulses]);
        }
      },
      () => {
        console.warn('Pulses listener fallback active');
      }
    );

    return () => {
      unsubConfig();
      unsubRegs();
      unsubPulses();
    };
  }, [user, eventConfig.eventId]);

  useEffect(() => {
    if (pulseQueue.length === 0) return;
    if (!activePulse) {
      const [nextPulse, ...rest] = pulseQueue;
      setActivePulse(nextPulse);
      setPulseQueue(rest);
      return;
    }
    const transitionTimer = setTimeout(() => {
      setPulseQueue((currentQueue) => {
        if (currentQueue.length === 0) return currentQueue;
        const [nextPulse, ...rest] = currentQueue;
        setActivePulse(nextPulse);
        return rest;
      });
    }, 700);

    return () => clearTimeout(transitionTimer);
  }, [pulseQueue, activePulse]);

  useEffect(() => {
    if (!activePulse) return;
    const clearTimer = setTimeout(() => {
      setActivePulse(null);
    }, 2400);
    return () => clearTimeout(clearTimer);
  }, [activePulse]);

  const currentBrowserRegistrationId = useMemo(() => {
    const uid = user?.uid || 'preview_user';
    return `${eventConfig.eventId}_${uid}${rehearsalSuffix}`;
  }, [user, eventConfig.eventId, rehearsalSuffix]);

  const existingRegistrationForBrowser = useMemo(() => {
    if (!currentBrowserRegistrationId) return null;
    return registrations.find((r) => r.id === currentBrowserRegistrationId) || null;
  }, [registrations, currentBrowserRegistrationId]);

  const sendTransientCheckboxPulse = useCallback(
    async (nextCheckedState) => {
      setIsReadyChecked(nextCheckedState);
      setCheckboxSyncState('sending');
      const interactionId =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `pulse_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

      const newPulse = {
        interactionId,
        action: nextCheckedState ? 'checked' : 'unchecked',
        createdAt: Date.now()
      };

      if (!isFirebaseAvailable || !db) {
        setActivePulse(newPulse);
        setCheckboxSyncState('delivered');
        return;
      }

      const pulseDocRef = doc(db, COLLECTIONS.TRANSIENT_PULSES, interactionId);

      const transientPayload = {
        eventId: eventConfig.eventId,
        interactionId,
        action: nextCheckedState ? 'checked' : 'unchecked',
        createdAt: Date.now()
      };

      try {
        await setDoc(pulseDocRef, transientPayload);
        setCheckboxSyncState('delivered');
        setTimeout(() => {
          deleteDoc(pulseDocRef).catch(() => {});
        }, 6000);
      } catch (err) {
        setActivePulse(newPulse);
        setCheckboxSyncState('delivered');
      }
    },
    [user, eventConfig.eventId]
  );

  // التسجيل: يحفظ الاسم ثم يرسل نبضة "جاهز" للشاشة الكبيرة
  const handleParticipantRegistration = useCallback(
    async (validatedFullName, isReady = true) => {
      if (registrationStatus === 'submitting') return;
      setRegistrationStatus('submitting');
      setRegistrationError('');

      const regDocId = currentBrowserRegistrationId;
      const newRecord = {
        id: regDocId,
        displayName: validatedFullName,
        createdAt: Date.now(),
        eventId: eventConfig.eventId
      };

      if (!isFirebaseAvailable || !db) {
        setRegistrations((prev) => [newRecord, ...prev]);
        setRegistrationStatus('success');
        if (isReady) sendTransientCheckboxPulse(true);
        return;
      }

      const regDocRef = doc(db, COLLECTIONS.REGISTRATIONS, regDocId);

      try {
        await setDoc(regDocRef, {
          displayName: validatedFullName,
          createdAt: Date.now(),
          eventId: eventConfig.eventId
        });
        setRegistrationStatus('success');
        if (isReady) sendTransientCheckboxPulse(true);
      } catch (err) {
        console.warn('Firebase registration error, fallback to local:', err);
        setRegistrations((prev) => [newRecord, ...prev]);
        setRegistrationStatus('success');
        if (isReady) sendTransientCheckboxPulse(true);
      }
    },
    [registrationStatus, currentBrowserRegistrationId, eventConfig.eventId, sendTransientCheckboxPulse]
  );

  const handleSaveOrganizerConfig = useCallback(
    async (partialConfig) => {
      const updated = {
        ...eventConfig,
        ...partialConfig,
        updatedAt: Date.now()
      };
      setEventConfig(updated);

      if (!isFirebaseAvailable || !db) return;

      const configDocRef = doc(db, COLLECTIONS.EVENT_CONFIG, 'active_config');
      try {
        await setDoc(configDocRef, updated);
      } catch (err) {
        console.warn('Saved config locally only');
      }
    },
    [eventConfig]
  );

  const handleTriggerBurstPulses = useCallback(async () => {
    const actions = ['checked', 'checked', 'unchecked', 'checked', 'checked', 'unchecked'];
    actions.forEach((act, idx) => {
      setTimeout(() => {
        const interactionId = `burst_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 7)}`;
        const pulse = {
          interactionId,
          action: act,
          createdAt: Date.now()
        };

        if (!isFirebaseAvailable || !db) {
          setActivePulse(pulse);
          return;
        }

        const pulseRef = doc(db, COLLECTIONS.TRANSIENT_PULSES, interactionId);
        setDoc(pulseRef, {
          eventId: eventConfig.eventId,
          interactionId,
          action: act,
          createdAt: Date.now()
        })
          .then(() => {
            setTimeout(() => deleteDoc(pulseRef).catch(() => {}), 6000);
          })
          .catch(() => {
            setActivePulse(pulse);
          });
      }, idx * 220);
    });
  }, [eventConfig.eventId]);

  const handleSimulateNewParticipant = useCallback(
    async (name) => {
      if (!name) return;
      const simId = `${eventConfig.eventId}_sim_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const newRecord = {
        id: simId,
        displayName: name,
        createdAt: Date.now(),
        eventId: eventConfig.eventId
      };

      if (!isFirebaseAvailable || !db) {
        setRegistrations((prev) => [newRecord, ...prev]);
        return;
      }

      const regRef = doc(db, COLLECTIONS.REGISTRATIONS, simId);
      try {
        await setDoc(regRef, {
          displayName: name,
          createdAt: Date.now(),
          eventId: eventConfig.eventId
        });
      } catch (err) {
        setRegistrations((prev) => [newRecord, ...prev]);
      }
    },
    [eventConfig.eventId]
  );

  const handleResetBrowserTokenForRehearsal = useCallback(() => {
    setRehearsalSuffix(`_r_${Math.random().toString(36).slice(2, 7)}`);
    setRegistrationStatus('idle');
    setRegistrationError('');
  }, []);

  const toggleFullscreen = () => {
    if (typeof document === 'undefined') return;
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const navButtonClass = (view) =>
    `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
      activeView === view ? 'bg-[#A61936] text-white shadow' : 'text-white/80 hover:bg-white/10'
    }`;

  const bottomButtonClass = (view) =>
    `flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
      activeView === view ? 'bg-[#A61936] text-white shadow-md' : 'text-white/70 hover:bg-white/10'
    }`;

  return (
    <div
      dir="rtl"
      lang="ar"
      style={{ fontFamily: "'Cairo', 'Tajawal', sans-serif" }}
      className={`min-h-screen bg-[#F2EFE6] text-[#0B2D50] flex flex-col selection:bg-[#A61936] selection:text-white ${
        isOrganizerAuthenticated ? 'pb-16' : ''
      }`}
    >
      {/* نافذة رمز المنظم */}
      {needsOrganizerLogin && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleOrganizerLogin}
            className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl text-center"
          >
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-[#0B2D50]/10 flex items-center justify-center text-[#0B2D50]">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-black text-[#0B2D50] mb-1">دخول المنظمين</h2>
            <p className="text-xs font-semibold text-[#0B2D50]/60 mb-4">
              أدخل رمز المنظم لعرض باقي الشاشات
            </p>
            <input
              type="password"
              autoFocus
              value={organizerPasscode}
              onChange={(e) => {
                setOrganizerPasscode(e.target.value);
                setPasscodeError(false);
              }}
              placeholder="رمز المنظم"
              className="w-full text-center font-bold rounded-xl px-4 py-3 bg-[#F2EFE6] border border-[#0B2D50]/20 focus:outline-none focus:ring-2 focus:ring-[#A61936]"
            />
            {passcodeError && (
              <p className="mt-2 text-xs font-bold text-[#A61936]">الرمز غير صحيح</p>
            )}
            <div className="mt-4 flex gap-2">
              <button
                type="submit"
                className="flex-1 py-3 rounded-xl bg-[#A61936] text-white font-black text-sm hover:bg-[#8e142d]"
              >
                دخول
              </button>
              <button
                type="button"
                onClick={() => {
                  setOrganizerPasscode('');
                  setPasscodeError(false);
                  navigateTo('register');
                }}
                className="px-4 py-3 rounded-xl bg-[#0B2D50]/10 text-[#0B2D50] font-bold text-sm"
              >
                رجوع
              </button>
            </div>
          </form>
        </div>
      )}

      {/* شريط المنظمين العلوي */}
      {isOrganizerAuthenticated && activeView !== 'register' && !isFullscreen && (
        <nav
          aria-label="التنقل بين شاشات الملتقى للمنظمين"
          className="sticky top-0 z-50 bg-[#0B2D50] text-white shadow-md border-b border-white/10 px-3 sm:px-6 py-2.5"
        >
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span className="font-extrabold text-sm sm:text-base tracking-tight">
                لوحة التحكم | شباب+
              </span>
              <span className="hidden md:inline-block text-xs text-white/60 font-medium">
                (المسجلون: {registrations.length})
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button type="button" onClick={() => navigateTo('display')} className={navButtonClass('display')}>
                <Monitor className="w-4 h-4" />
                <span>شاشة القاعة</span>
              </button>

              <button type="button" onClick={() => navigateTo('split')} className={navButtonClass('split')}>
                <Columns className="w-4 h-4" />
                <span>المعاينة المزدوجة</span>
              </button>

              <button type="button" onClick={() => navigateTo('qr')} className={navButtonClass('qr')}>
                <QrCode className="w-4 h-4" />
                <span>رمز QR</span>
              </button>

              <button type="button" onClick={() => navigateTo('config')} className={navButtonClass('config')}>
                <Settings className="w-4 h-4" />
                <span>الإعدادات</span>
              </button>

              <button
                type="button"
                onClick={() => navigateTo('register')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white/70 hover:bg-white/10 border border-white/20"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>شاشة المشارك</span>
              </button>
            </div>
          </div>
        </nav>
      )}

      {/* المحتوى الرئيسي */}
      <main className="flex-1 relative">
        {(() => {
          switch (effectiveView) {
            case 'register':
              return (
                <ParticipantRegistrationPage
                  existingRegistration={existingRegistrationForBrowser}
                  onRegisterSubmit={handleParticipantRegistration}
                  registrationStatus={registrationStatus}
                  registrationError={registrationError}
                  customLogoUrl={eventConfig.customLogoDataUrl}
                  isConnected={isConnected}
                />
              );

            case 'display':
              return (
                <LiveEventDisplay
                  registrations={registrations}
                  targetCount={eventConfig.targetCount}
                  activePulse={activePulse}
                  queueDepth={pulseQueue.length}
                  canonicalUrl={eventConfig.canonicalRegistrationUrl}
                  customLogoUrl={eventConfig.customLogoDataUrl}
                  isConnected={isConnected}
                  isFullscreen={isFullscreen}
                  onToggleFullscreen={toggleFullscreen}
                />
              );

            case 'split':
              return (
                <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
                  <div className="mb-4 rounded-2xl bg-[#0B2D50] text-white px-5 py-3 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm">
                    <span className="font-bold">
                      شاشة المعاينة المزدوجة: سجّل من هاتف المشارك (يميناً) لتشاهد التحديث السريع في القاعة (يساراً)!
                    </span>
                    <button
                      type="button"
                      onClick={handleResetBrowserTokenForRehearsal}
                      className="px-3 py-1 rounded-lg bg-[#A61936] text-white font-bold hover:bg-[#8e142d] cursor-pointer"
                    >
                      تجربة مشارك جديد
                    </button>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                    <div className="xl:col-span-4 border-2 border-[#0B2D50]/15 rounded-3xl bg-[#EAE6DC]/60 p-2">
                      <div className="text-center py-1.5 text-xs font-extrabold text-[#0B2D50]/70">
                        📱 شاشة المشارك (تفتح على الجوال)
                      </div>
                      <ParticipantRegistrationPage
                        key={rehearsalSuffix}
                        existingRegistration={existingRegistrationForBrowser}
                        onRegisterSubmit={handleParticipantRegistration}
                        registrationStatus={registrationStatus}
                        registrationError={registrationError}
                        customLogoUrl={eventConfig.customLogoDataUrl}
                        isConnected={isConnected}
                      />
                    </div>

                    <div className="xl:col-span-8 border-2 border-[#0B2D50]/15 rounded-3xl overflow-hidden shadow-xl">
                      <div className="bg-[#0B2D50] text-white text-center py-1.5 text-xs font-extrabold">
                        🖥️ شاشة القاعة الرئيسية (تفتح على الشاشة الكبيرة/البروجكتور)
                      </div>
                      <LiveEventDisplay
                        registrations={registrations}
                        targetCount={eventConfig.targetCount}
                        activePulse={activePulse}
                        queueDepth={pulseQueue.length}
                        canonicalUrl={eventConfig.canonicalRegistrationUrl}
                        customLogoUrl={eventConfig.customLogoDataUrl}
                        isConnected={isConnected}
                        isFullscreen={isFullscreen}
                        onToggleFullscreen={toggleFullscreen}
                      />
                    </div>
                  </div>
                </div>
              );

            case 'qr':
              return (
                <QrCodePresentation
                  canonicalUrl={eventConfig.canonicalRegistrationUrl}
                  customLogoUrl={eventConfig.customLogoDataUrl}
                  onOpenSettings={() => navigateTo('config')}
                />
              );

            case 'config':
              return (
                <OrganizerConfigAndTests
                  targetCount={eventConfig.targetCount}
                  canonicalUrl={eventConfig.canonicalRegistrationUrl}
                  customLogoUrl={eventConfig.customLogoDataUrl}
                  eventId={eventConfig.eventId}
                  registrationsCount={registrations.length}
                  onSaveConfig={handleSaveOrganizerConfig}
                  onTriggerTestPulse={sendTransientCheckboxPulse}
                  onTriggerBurstPulses={handleTriggerBurstPulses}
                  onSimulateNewParticipant={handleSimulateNewParticipant}
                  onResetCurrentBrowserToken={handleResetBrowserTokenForRehearsal}
                  rehearsalTokenId={currentBrowserRegistrationId}
                />
              );

            default:
              return null;
          }
        })()}
      </main>

      {/* شريط التنقل السفلي للمنظمين */}
      {isOrganizerAuthenticated && (
        <div className="fixed bottom-3 left-1/2 transform -translate-x-1/2 z-50 bg-[#0B2D50]/95 backdrop-blur-md text-white px-4 py-2 rounded-2xl shadow-2xl border border-white/20 flex items-center gap-2">
          <button type="button" onClick={() => navigateTo('register')} className={bottomButtonClass('register')}>
            <Smartphone className="w-4 h-4" />
            <span>📱 شاشة المشارك</span>
          </button>

          <div className="w-px h-5 bg-white/20" />

          <button type="button" onClick={() => navigateTo('display')} className={bottomButtonClass('display')}>
            <Monitor className="w-4 h-4" />
            <span>🖥️ شاشة القاعة</span>
          </button>

          <div className="w-px h-5 bg-white/20" />

          <button type="button" onClick={() => navigateTo('split')} className={bottomButtonClass('split')}>
            <Columns className="w-4 h-4" />
            <span>👀 الشاشتين معاً</span>
          </button>

          <div className="w-px h-5 bg-white/20" />

          <button
            type="button"
            onClick={handleOrganizerLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all text-white/70 hover:bg-white/10"
          >
            <Unlock className="w-4 h-4" />
            <span>خروج</span>
          </button>
        </div>
      )}
    </div>
  );
}
