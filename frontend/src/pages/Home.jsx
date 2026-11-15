import { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import { toast } from 'react-toastify';
import { 
  Mail, Lock, LogIn, ShieldCheck, BrainCircuit, BookOpen, CheckCircle2, 
  Sparkles, Layers, FileCheck, Play, Pause, RotateCcw, Video, 
  ArrowRight, Users, GraduationCap, School, ShieldAlert, Cpu, 
  Check, AlertTriangle, Eye, HelpCircle, Download, FileText
} from 'lucide-react';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';

const Home = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpRequested, setOtpRequested] = useState(false);
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  // Interactive Showcase State
  const [activeRoleTab, setActiveRoleTab] = useState('teacher');
  const [walkthroughStep, setWalkthroughStep] = useState(0);
  const [isPlayingWalkthrough, setIsPlayingWalkthrough] = useState(false);
  const [customVideoUrl, setCustomVideoUrl] = useState('');
  const [showVideoInput, setShowVideoInput] = useState(false);
  const [mediaMode, setMediaMode] = useState('walkthrough'); // 'walkthrough' or 'video'

  const walkthroughSteps = [
    {
      title: "1. Multi-Role Authentication",
      badge: "Security & RBAC",
      badgeColor: "bg-purple-100 text-purple-700 border-purple-200",
      description: "Dedicated access models: Instant 1-click Google sign-in for students, secret faculty code protection for teachers, and 2FA 6-digit email OTP for administrators.",
      preview: {
        type: "auth",
        roles: [
          { name: "Student", tag: "Roll No & Division", color: "from-emerald-500 to-teal-600" },
          { name: "Teacher", tag: "Secret Faculty Key", color: "from-indigo-600 to-purple-600" },
          { name: "Admin", tag: "2FA Email OTP Verification", color: "from-amber-500 to-orange-600" }
        ]
      }
    },
    {
      title: "2. Ingestion & Empty File Blocker",
      badge: "Ingestion Pipeline",
      badgeColor: "bg-blue-100 text-blue-700 border-blue-200",
      description: "Files with under 15 words are automatically rejected. Valid PDFs, Word DOCX, and handwritten notes stream directly into RAM memory buffer in under 250ms with Gemini Vision OCR.",
      preview: {
        type: "ingestion",
        status: "Checked in <250ms",
        rejectedCase: "Blank file (<15 words) ➜ ❌ REJECTED",
        acceptedCase: "Valid PDF / DOCX / Image ➜ ✔ STREAMED TO CLOUD"
      }
    },
    {
      title: "3. Anti-Evasion Sanitizer",
      badge: "Hacker Defense",
      badgeColor: "bg-rose-100 text-rose-700 border-rose-200",
      description: "Neutralizes sneaky student tricks: regex strips invisible zero-width unicode spaces (\\u200B) and normalizes Russian Cyrillic homoglyph lookalikes back into standard Latin ASCII.",
      preview: {
        type: "sanitizer",
        trick1: "Zero-Width Spaces: d[ZWSP]a[ZWSP]t[ZWSP]a ➜ Cleaned: 'data'",
        trick2: "Cyrillic Swap: Cyrillic 'а' (\\u0430) ➜ Latin 'a' (\\u0061)",
        result: "100% Normalized Clean Text"
      }
    },
    {
      title: "4. TF-IDF & Cosine Plagiarism",
      badge: "Mathematical NLP",
      badgeColor: "bg-amber-100 text-amber-700 border-amber-200",
      description: "Vectorizes assignment vocabulary using natural TF-IDF. Computes multi-dimensional cosine angles across all cohort submissions. Similarity >= 65% triggers automatic Quarantine.",
      preview: {
        type: "plagiarism",
        score: "72% Similarity",
        status: "QUARANTINED (Marks Held)",
        notice: "Teacher alerted with matched peer student ID"
      }
    },
    {
      title: "5. Expected Answer & AI Auto-Grade",
      badge: "Gemini 1.5 Flash",
      badgeColor: "bg-purple-100 text-purple-700 border-purple-200",
      description: "Teachers can optionally provide a Model Answer. Google Gemini evaluates student concept depth, suggests a grade (e.g., 8.5/10), and gives 1-click teacher approval.",
      preview: {
        type: "grading",
        modelKey: "Model Answer Key: Provided by Teacher",
        suggested: "✨ AI Suggested Grade: 8.5 / 10",
        feedback: "Clear explanation of core principles, minor omission in rollback example."
      }
    },
    {
      title: "6. Real-Time Graph & Quiz Proctoring",
      badge: "Live WebSockets",
      badgeColor: "bg-emerald-100 text-emerald-700 border-emerald-200",
      description: "Interactive 2D force-directed network graph displays collusion clusters live. Scheduled online quizzes monitor browser tab switches and auto-submit upon 3 violations.",
      preview: {
        type: "proctor",
        graph: "Live 2D Collusion Network Graph Active",
        quizAlert: "Tab Switch Warning (2/3) ➜ 3rd Violation Auto-Submits"
      }
    }
  ];

  useEffect(() => {
    let interval;
    if (isPlayingWalkthrough) {
      interval = setInterval(() => {
        setWalkthroughStep((prev) => (prev + 1) % walkthroughSteps.length);
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [isPlayingWalkthrough, walkthroughSteps.length]);

  useEffect(() => {
    if (user) {
      if (user.requiresOtp) {
        setOtpRequested(true);
        setIsLoading(false);
      } else {
        if (user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate(user.role === 'teacher' ? '/teacher' : '/student');
        }
      }
    }
  }, [user, navigate]);

  useEffect(() => {
    if (window.location.hash === '#login-form') {
      const el = document.getElementById('login-form');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (otpRequested) {
      try {
        const res = await api.post('/auth/verify-otp', { otp });
        setUser(res.data);
        toast.success('Admin Login successful!');
      } catch (err) {
        toast.error(err.response?.data?.message || 'OTP verification failed');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      toast.error(err.message || 'Login failed');
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center bg-gray-50 px-4 sm:px-6 lg:px-8 relative overflow-x-hidden py-10">
      <div className="absolute top-10 -left-10 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob"></div>
      <div className="absolute top-0 right-10 w-96 h-96 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-1/2 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-4000"></div>

      <div className="max-w-6xl w-full flex flex-col lg:flex-row items-center gap-12 relative z-10">
        <div className="flex-1 w-full text-gray-900 px-2 sm:px-4 mt-8 lg:mt-0 text-center lg:text-left">
          {/* Trust Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-50 border border-primary-200 text-primary-700 text-xs sm:text-sm font-semibold mb-6 shadow-sm">
            <Sparkles className="w-4 h-4 text-primary-600 animate-pulse" />
            <span>Next-Gen Academic Integrity & LMS</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4 lg:mb-6">
            The Smartest Way to <br className="hidden lg:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 via-indigo-600 to-purple-600">
              Teach, Verify & Grade
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 mb-8 leading-relaxed">
            AssignGuard unifies classroom hierarchies, multi-subject management, and explainable AI integrity checks to elevate learning and eliminate academic dishonesty.
          </p>

          {/* Core Feature Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left max-w-xl mx-auto lg:mx-0 mb-8">
            <div className="p-4 bg-white/80 backdrop-blur-md rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center mb-3">
                <Layers className="text-primary-600 h-5 w-5" />
              </div>
              <h3 className="font-bold text-gray-900 text-base mb-1">Classroom & Roster Hub</h3>
              <p className="text-xs text-gray-500 leading-relaxed">Dedicated teacher sidebars with searchable student rosters, roll numbers, and division tracking.</p>
            </div>

            <div className="p-4 bg-white/80 backdrop-blur-md rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center mb-3">
                <ShieldCheck className="text-purple-600 h-5 w-5" />
              </div>
              <h3 className="font-bold text-gray-900 text-base mb-1">Admission Control</h3>
              <p className="text-xs text-gray-500 leading-relaxed">Secure classroom access with instant join requests and 1-click teacher admission approvals.</p>
            </div>

            <div className="p-4 bg-white/80 backdrop-blur-md rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-3">
                <BrainCircuit className="text-blue-600 h-5 w-5" />
              </div>
              <h3 className="font-bold text-gray-900 text-base mb-1">Explainable AI & Plagiarism</h3>
              <p className="text-xs text-gray-500 leading-relaxed">Mathematical Cosine TF-IDF duplicate checks paired with Gemini AI authenticity scoring.</p>
            </div>

            <div className="p-4 bg-white/80 backdrop-blur-md rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center mb-3">
                <FileCheck className="text-amber-600 h-5 w-5" />
              </div>
              <h3 className="font-bold text-gray-900 text-base mb-1">Proctored Quizzes & Anti-Cheat</h3>
              <p className="text-xs text-gray-500 leading-relaxed">Tab-switch detection with auto-submit penalties, instant grading, and 1-click CSV grade export.</p>
            </div>
          </div>

          {/* Quick Technology Chips */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 text-xs font-semibold text-gray-500">
            <span className="px-3 py-1 bg-white border border-gray-200 rounded-full shadow-2xs">🛡️ Tab-Switch Proctoring</span>
            <span className="px-3 py-1 bg-white border border-gray-200 rounded-full shadow-2xs">⚡ Gemini 2.5 Flash</span>
            <span className="px-3 py-1 bg-white border border-gray-200 rounded-full shadow-2xs">📐 Cosine TF-IDF</span>
            <span className="px-3 py-1 bg-white border border-gray-200 rounded-full shadow-2xs">📊 CSV Grade Export</span>
          </div>
        </div>

        <div className="flex-1 w-full max-w-md mx-auto" id="login-form">
          <div className="glass-panel p-6 sm:p-10 relative">
            <div>
              <div className="mx-auto h-12 w-12 sm:h-14 sm:w-14 bg-gradient-to-tr from-primary-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/30 mb-4 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
                <Lock className="h-6 w-6 text-white" />
              </div>
              <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900 tracking-tight">
                Welcome back
              </h2>
              <p className="mt-2 text-center text-sm text-gray-500 font-medium">
                Sign in to access your AssignGuard dashboard
              </p>
            </div>
            <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
              {!otpRequested ? (
                <>
                  <div className="space-y-4">
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                        <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                      </div>
                      <input
                        type="email"
                        required
                        className="premium-input pl-11"
                        placeholder="Email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                        <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                      </div>
                      <input
                        type="password"
                        required
                        className="premium-input pl-11"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end">
                    <div className="text-sm">
                      <Link to="/forgot-password" className="font-medium text-primary-600 hover:text-primary-500 transition-colors">
                        Forgot your password?
                      </Link>
                    </div>
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className={`group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-2xl text-white shadow-xl transition-all duration-300 ${isLoading ? 'bg-primary-400 cursor-not-allowed shadow-none' : 'bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 shadow-primary-500/20 transform hover:-translate-y-0.5'}`}
                    >
                      <span className="absolute left-0 inset-y-0 flex items-center pl-4">
                        {isLoading ? (
                          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <LogIn className="h-5 w-5 text-white/70 group-hover:text-white transition-colors" />
                        )}
                      </span>
                      {isLoading ? 'Signing in securely...' : 'Sign in securely'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="p-3 bg-primary-50 rounded-xl border border-primary-100 text-sm text-primary-800 font-medium">
                      An OTP has been sent to your email to verify your Admin access.
                    </div>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                        <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                      </div>
                      <input
                        type="text"
                        required
                        className="premium-input pl-11 text-center tracking-[0.5em] font-bold text-lg"
                        placeholder="000000"
                        maxLength="6"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className={`group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-2xl text-white shadow-xl transition-all duration-300 ${isLoading ? 'bg-primary-400 cursor-not-allowed shadow-none' : 'bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 shadow-primary-500/20 transform hover:-translate-y-0.5'}`}
                    >
                      {isLoading ? 'Verifying OTP...' : 'Verify OTP'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setOtpRequested(false)}
                      className="mt-4 w-full text-sm text-gray-500 hover:text-primary-600 transition-colors"
                    >
                      Back to login
                    </button>
                  </div>
                </>
              )}
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-transparent text-gray-500 backdrop-blur-md rounded-full font-medium">Or continue with</span>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={loginWithGoogle}
                  className="w-full flex justify-center items-center py-3.5 px-4 border border-gray-200 rounded-2xl shadow-sm bg-white/80 backdrop-blur-sm text-sm font-bold text-gray-700 hover:bg-white hover:border-gray-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-300"
                >
                  <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Google
                </button>
              </div>
            </div>

            <p className="mt-6 text-center text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="font-bold text-primary-600 hover:text-primary-500 transition-colors">
                Sign up here
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION 2: INTERACTIVE VIDEO & WALKTHROUGH DEMO SHOWCASE */}
      {/* ========================================================= */}
      <div className="w-full max-w-6xl mt-20 relative z-10" id="demo-showcase">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs sm:text-sm font-semibold mb-4 shadow-xs">
            <Video className="w-4 h-4 text-purple-600" />
            <span>Interactive Project Demonstration</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            See AssignGuard in Action
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto mt-2">
            Experience our 6-step end-to-end workflow: from multi-role authentication to automated plagiarism quarantine and Gemini AI model-answer grading.
          </p>

          {/* Toggle between Walkthrough & Video */}
          <div className="inline-flex items-center p-1.5 bg-gray-200/80 rounded-2xl mt-6 border border-gray-300 shadow-inner">
            <button
              onClick={() => setMediaMode('walkthrough')}
              className={`px-5 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                mediaMode === 'walkthrough'
                  ? 'bg-white text-gray-900 shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Interactive Simulated Walkthrough
            </button>
            <button
              onClick={() => setMediaMode('video')}
              className={`px-5 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                mediaMode === 'video'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Watch Project Video
            </button>
          </div>
        </div>

        {/* DEMO DISPLAY FRAME */}
        <div className="bg-gradient-to-b from-gray-900 to-gray-950 rounded-3xl p-4 sm:p-8 shadow-2xl border border-gray-800 text-white relative overflow-hidden">
          {/* Subtle Ambient Backlight */}
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-cyan-600/20 rounded-full blur-3xl pointer-events-none"></div>

          {mediaMode === 'walkthrough' ? (
            <div>
              {/* Step Navigation Bar */}
              <div className="flex items-center justify-between pb-6 border-b border-gray-800 flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${walkthroughSteps[walkthroughStep].badgeColor}`}>
                    {walkthroughSteps[walkthroughStep].badge}
                  </span>
                  <span className="text-gray-400 text-xs sm:text-sm font-medium">
                    Step {walkthroughStep + 1} of {walkthroughSteps.length}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsPlayingWalkthrough(!isPlayingWalkthrough)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-lg shadow-purple-600/30"
                  >
                    {isPlayingWalkthrough ? (
                      <>
                        <Pause className="w-4 h-4 fill-current" /> Pause Demo
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current" /> Auto-Play Demo
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setWalkthroughStep(0);
                      setIsPlayingWalkthrough(false);
                    }}
                    className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl transition-colors"
                    title="Restart Walkthrough"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Step Progress Indicators */}
              <div className="grid grid-cols-6 gap-2 my-4">
                {walkthroughSteps.map((step, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setWalkthroughStep(idx);
                      setIsPlayingWalkthrough(false);
                    }}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      idx === walkthroughStep
                        ? 'bg-gradient-to-r from-purple-500 to-cyan-400 scale-y-125'
                        : idx < walkthroughStep
                        ? 'bg-purple-900/80'
                        : 'bg-gray-800'
                    }`}
                    title={step.title}
                  />
                ))}
              </div>

              {/* Main Simulated Screen Preview */}
              <div className="grid lg:grid-cols-12 gap-8 items-center py-6">
                {/* Left Description Column */}
                <div className="lg:col-span-5 space-y-4">
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {walkthroughSteps[walkthroughStep].title}
                  </h3>
                  <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                    {walkthroughSteps[walkthroughStep].description}
                  </p>

                  <div className="pt-4 flex items-center gap-3">
                    <button
                      disabled={walkthroughStep === 0}
                      onClick={() => setWalkthroughStep(prev => Math.max(0, prev - 1))}
                      className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed text-xs sm:text-sm font-semibold transition-colors"
                    >
                      &larr; Previous Step
                    </button>
                    <button
                      disabled={walkthroughStep === walkthroughSteps.length - 1}
                      onClick={() => setWalkthroughStep(prev => Math.min(walkthroughSteps.length - 1, prev + 1))}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-30 disabled:cursor-not-allowed text-xs sm:text-sm font-semibold transition-colors"
                    >
                      Next Step &rarr;
                    </button>
                  </div>
                </div>

                {/* Right Interactive Mockup Screen */}
                <div className="lg:col-span-7">
                  <div className="bg-gray-950/90 rounded-2xl border border-gray-800 p-6 sm:p-8 relative min-h-[300px] flex flex-col justify-center shadow-inner">
                    {/* Step 1: Auth preview */}
                    {walkthroughStep === 0 && (
                      <div className="space-y-4">
                        <div className="text-xs uppercase tracking-wider text-purple-400 font-bold mb-2">Simulated Authentication Dashboard</div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="p-4 rounded-xl bg-gray-900 border border-gray-800 text-center">
                            <div className="w-10 h-10 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold mb-2">🎓</div>
                            <h4 className="font-bold text-sm text-white">Student</h4>
                            <p className="text-[11px] text-gray-400 mt-1">Roll No & Class</p>
                            <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800">1-Click Google</span>
                          </div>
                          <div className="p-4 rounded-xl bg-gray-900 border border-indigo-900/60 text-center relative overflow-hidden">
                            <div className="w-10 h-10 mx-auto rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold mb-2">👨‍🏫</div>
                            <h4 className="font-bold text-sm text-white">Teacher</h4>
                            <p className="text-[11px] text-gray-400 mt-1">Faculty Gate</p>
                            <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800">Secret Code Verified</span>
                          </div>
                          <div className="p-4 rounded-xl bg-gray-900 border border-amber-900/60 text-center">
                            <div className="w-10 h-10 mx-auto rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold mb-2">🛡️</div>
                            <h4 className="font-bold text-sm text-white">Admin</h4>
                            <p className="text-[11px] text-gray-400 mt-1">Central Cockpit</p>
                            <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] bg-amber-950 text-amber-300 border border-amber-800">2FA OTP Shield</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 2: Empty Guard Ingestion */}
                    {walkthroughStep === 1 && (
                      <div className="space-y-4">
                        <div className="text-xs uppercase tracking-wider text-blue-400 font-bold mb-2">Dual Ingestion & Anti-Empty Guard</div>
                        <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/80 text-xs text-red-300 flex items-center justify-between">
                          <span>❌ <strong>Dummy File Uploaded:</strong> 4 words ("Assignment test ok")</span>
                          <span className="px-2 py-0.5 rounded bg-red-900 text-white font-bold text-[10px]">REJECTED</span>
                        </div>
                        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/80 text-xs text-emerald-300 flex items-center justify-between">
                          <span>✔ <strong>Valid Assignment:</strong> 420 words (PDF + Scanned Notes)</span>
                          <span className="px-2 py-0.5 rounded bg-emerald-900 text-white font-bold text-[10px]">&lt;250ms OK</span>
                        </div>
                        <div className="p-3 rounded-lg bg-gray-900 border border-gray-800 text-[11px] text-gray-400">
                          <strong>Dual OCR:</strong> `pdf-parse` extracts digital text; `Tesseract` + `Google Gemini Vision` OCR transcribe handwritten diagrams.
                        </div>
                      </div>
                    )}

                    {/* Step 3: Anti-Evasion Sanitizer */}
                    {walkthroughStep === 2 && (
                      <div className="space-y-4">
                        <div className="text-xs uppercase tracking-wider text-rose-400 font-bold mb-2">Active Evasion Sanitizer Layer</div>
                        <div className="space-y-2 text-xs">
                          <div className="p-3 rounded-xl bg-gray-900 border border-gray-800">
                            <span className="text-gray-400 block mb-1">Evasion Trick 1: Invisible Zero-Width Unicode (\u200B)</span>
                            <div className="font-mono text-rose-400 line-through">s[ZWSP]y[ZWSP]s[ZWSP]t[ZWSP]e[ZWSP]m</div>
                            <div className="font-mono text-emerald-400 mt-1">➜ Purged into clean ASCII: "system"</div>
                          </div>
                          <div className="p-3 rounded-xl bg-gray-900 border border-gray-800">
                            <span className="text-gray-400 block mb-1">Evasion Trick 2: Russian Cyrillic Homoglyph Swap</span>
                            <div className="font-mono text-rose-400 line-through">Russian 'а' (\u0430) instead of English 'a' (\u0061)</div>
                            <div className="font-mono text-emerald-400 mt-1">➜ Normalized to English: 'a'</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 4: Plagiarism & 65% Threshold */}
                    {walkthroughStep === 3 && (
                      <div className="space-y-4">
                        <div className="text-xs uppercase tracking-wider text-amber-400 font-bold mb-2">TF-IDF Vectorization & Cosine Similarity</div>
                        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/80 flex items-center justify-between">
                          <div>
                            <div className="text-lg font-bold text-amber-300">Similarity: 72%</div>
                            <div className="text-xs text-amber-200/80">Threshold Exceeded (&ge; 65%)</div>
                          </div>
                          <span className="px-3 py-1 rounded-xl bg-amber-500 text-gray-950 font-black text-xs uppercase tracking-wider">
                            QUARANTINE
                          </span>
                        </div>
                        <p className="text-xs text-gray-400">
                          AssignGuard mathematically separates legitimate template overlap (20–35%) from true copying (&ge; 65%), alerting teachers instantly via email.
                        </p>
                      </div>
                    )}

                    {/* Step 5: Model Answer & AI Auto-Grading */}
                    {walkthroughStep === 4 && (
                      <div className="space-y-4">
                        <div className="text-xs uppercase tracking-wider text-purple-400 font-bold mb-2">Teacher Model Answer & Gemini Auto-Grading</div>
                        <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-800/80 space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-300 font-medium">Model Answer Evaluated:</span>
                            <span className="text-purple-300 font-bold text-sm">✨ Suggested: 8.5 / 10</span>
                          </div>
                          <p className="text-xs text-purple-200/90 italic">
                            "Comprehensive explanation of ACID properties. Minor omission in rollback demonstration."
                          </p>
                          <div className="pt-1 flex justify-end">
                            <span className="px-3 py-1 bg-purple-600 rounded-lg text-white font-bold text-xs">
                              ✔ 1-Click Accept Grade
                            </span>
                          </div>
                        </div>
                        <p className="text-[11px] text-gray-400">
                          Completely optional for teachers. If left blank, assignments default to manual grading.
                        </p>
                      </div>
                    )}

                    {/* Step 6: Live Graph & Proctoring */}
                    {walkthroughStep === 5 && (
                      <div className="space-y-4">
                        <div className="text-xs uppercase tracking-wider text-emerald-400 font-bold mb-2">Real-Time Collusion Graph & Anti-Cheat Quiz</div>
                        <div className="p-3.5 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-between">
                          <div className="text-xs text-gray-300">
                            <strong>Live 2D Plagiarism Graph:</strong><br />
                            <span className="text-gray-400">Force-directed nodes update in real-time via WebSockets</span>
                          </div>
                          <span className="px-2 py-1 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded text-xs font-mono">Live Sync</span>
                        </div>
                        <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800 text-xs text-rose-300 flex items-center justify-between">
                          <div>
                            <strong>Active Tab-Switch Proctoring:</strong><br />
                            <span className="text-rose-400/90">Monitors `document.hidden` (3 warnings max)</span>
                          </div>
                          <span className="px-2 py-1 bg-rose-900 text-white rounded font-bold text-[10px]">AUTO-SUBMIT</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* VIDEO PLAYER EMBED MODE */
            <div className="py-6 space-y-6">
              <div className="aspect-video w-full max-w-4xl mx-auto bg-black rounded-2xl overflow-hidden border border-gray-800 relative flex items-center justify-center shadow-2xl">
                {customVideoUrl ? (
                  customVideoUrl.includes('youtube.com') || customVideoUrl.includes('youtu.be') ? (
                    <iframe
                      src={customVideoUrl.replace('watch?v=', 'embed/')}
                      title="AssignGuard Demo Video"
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  ) : (
                    <video
                      src={customVideoUrl}
                      controls
                      className="w-full h-full object-contain"
                      poster="/assets/hero.png"
                    >
                      Your browser does not support the video tag.
                    </video>
                  )
                ) : (
                  <div className="text-center p-8 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-purple-600/30 text-purple-400 flex items-center justify-center mx-auto border border-purple-500/40 shadow-lg">
                      <Play className="w-8 h-8 fill-current ml-1" />
                    </div>
                    <h4 className="text-xl font-bold text-white">Project Showcase Video</h4>
                    <p className="text-sm text-gray-400 max-w-md mx-auto">
                      Generate your video clips with Gemini / Google Veo, and paste your video link below (or place <code>demo-video.mp4</code> in the frontend public folder).
                    </p>
                    <button
                      onClick={() => setShowVideoInput(!showVideoInput)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition-all"
                    >
                      {showVideoInput ? 'Hide URL Input' : 'Attach Custom Video URL'}
                    </button>
                  </div>
                )}
              </div>

              {/* Video URL Input Dropdown */}
              {showVideoInput && (
                <div className="max-w-xl mx-auto p-4 bg-gray-900 rounded-2xl border border-gray-800 space-y-3">
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
                    Enter Video Link (YouTube, Cloudinary MP4, or Local path)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="e.g. https://www.youtube.com/watch?v=... or /demo.mp4"
                      className="flex-1 bg-gray-950 border border-gray-700 rounded-xl px-4 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500"
                      value={customVideoUrl}
                      onChange={(e) => setCustomVideoUrl(e.target.value)}
                    />
                    <button
                      onClick={() => {
                        if (customVideoUrl) toast.success('Video loaded successfully!');
                      }}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition-colors"
                    >
                      Load
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-500">
                    Supports YouTube embed links, Cloudinary video links, or direct <code>.mp4</code> URLs.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION 3: 4-STAGE TECHNICAL WORKFLOW CARDS */}
      {/* ========================================================= */}
      <div className="w-full max-w-6xl mt-24 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            End-to-End System Architecture
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto mt-2">
            Engineered with an asynchronous event-driven pipeline that guarantees sub-250ms responses while offloading heavy OCR and NLP vector operations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-lg mb-4 group-hover:scale-110 transition-transform">
                01
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">3-Tier RBAC Authentication</h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-4">
                Firebase ID token verification backed by MongoDB sync, Teacher access gatekeepers, and Admin 2FA Email OTPs via Nodemailer.
              </p>
            </div>
            <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">Role Security &rarr;</span>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg mb-4 group-hover:scale-110 transition-transform">
                02
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">Ingestion & Anti-Evasion</h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-4">
                Multer RAM buffer streams to Cloudinary in &lt;250ms. Rejects empty files (&lt;15 words) and cleans zero-width Unicode and Cyrillic glyphs.
              </p>
            </div>
            <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Sanitization &rarr;</span>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg mb-4 group-hover:scale-110 transition-transform">
                03
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">TF-IDF & AI Auto-Grading</h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-4">
                Cosine similarity isolates peer copies at &ge;65% Quarantine. If teacher provides an Expected Answer, Gemini auto-suggests a score out of 10.
              </p>
            </div>
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">NLP & Gemini 1.5 &rarr;</span>
          </div>

          {/* Card 4 */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg mb-4 group-hover:scale-110 transition-transform">
                04
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">Live WebSockets & Proctoring</h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-4">
                Socket.io broadcasts live updates to the teacher's 2D Network Graph. Quizzes actively track tab switches with auto-submit penalties.
              </p>
            </div>
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Real-Time Sync &rarr;</span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION 4: ROLE HIGHLIGHTS (STUDENT / TEACHER / ADMIN) */}
      {/* ========================================================= */}
      <div className="w-full max-w-6xl mt-24 relative z-10">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Built for Every Stakeholder
          </h2>
          <p className="text-base text-gray-600 mt-2">
            Explore dedicated capabilities designed for Students, Teachers, and Administrators.
          </p>

          {/* Role Tabs */}
          <div className="flex justify-center gap-3 mt-6">
            <button
              onClick={() => setActiveRoleTab('student')}
              className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                activeRoleTab === 'student'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <GraduationCap className="w-4 h-4" /> For Students
            </button>
            <button
              onClick={() => setActiveRoleTab('teacher')}
              className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                activeRoleTab === 'teacher'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <School className="w-4 h-4" /> For Teachers
            </button>
            <button
              onClick={() => setActiveRoleTab('admin')}
              className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                activeRoleTab === 'admin'
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <ShieldAlert className="w-4 h-4" /> For Administrators
            </button>
          </div>
        </div>

        {/* Tab Content Cards */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 sm:p-10 border border-gray-200 shadow-xl">
          {activeRoleTab === 'student' && (
            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold mb-3">01</div>
                <h4 className="font-bold text-gray-900 text-base mb-1">Pre-Flight Draft Audit</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  2 private attempts per assignment to check peer similarity and receive AI writing suggestions before final submission.
                </p>
              </div>
              <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold mb-3">02</div>
                <h4 className="font-bold text-gray-900 text-base mb-1">Multi-Format Submissions</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Upload PDF, Word DOCX, or handwritten paper scans with instant text feedback and deadline countdown locks.
                </p>
              </div>
              <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold mb-3">03</div>
                <h4 className="font-bold text-gray-900 text-base mb-1">Subject Resources & Quizzes</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Direct access to faculty study materials, notes, reference slides, and proctored online quizzes.
                </p>
              </div>
            </div>
          )}

          {activeRoleTab === 'teacher' && (
            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold mb-3">01</div>
                <h4 className="font-bold text-gray-900 text-base mb-1">Model Answer & Auto-Grading</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Set optional expected answers; Google Gemini analyzes submissions and suggests marks with 1-click teacher approval.
                </p>
              </div>
              <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold mb-3">02</div>
                <h4 className="font-bold text-gray-900 text-base mb-1">Live 2D Plagiarism Graph</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Interactive force-directed graph reveals peer collusion clusters and similarity percentages in real time.
                </p>
              </div>
              <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold mb-3">03</div>
                <h4 className="font-bold text-gray-900 text-base mb-1">Roster & Gradebook Export</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Review student admission requests, track roll numbers and divisions, and export complete class gradebooks as CSV/PDF.
                </p>
              </div>
            </div>
          )}

          {activeRoleTab === 'admin' && (
            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold mb-3">01</div>
                <h4 className="font-bold text-gray-900 text-base mb-1">2FA Cryptographic OTP</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  High-security administrator verification using 6-digit ephemeral OTPs hashed with bcrypt and dispatched via Nodemailer.
                </p>
              </div>
              <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold mb-3">02</div>
                <h4 className="font-bold text-gray-900 text-base mb-1">7-Day User Growth Analytics</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Visual aggregation charts powered by MongoDB `$match` and `$group` pipelines monitoring active teacher/student ratios.
                </p>
              </div>
              <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold mb-3">03</div>
                <h4 className="font-bold text-gray-900 text-base mb-1">Global System Oversight</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Monitor institutional health across all active classrooms, assignments, submissions, and integrity violations.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION 5: PERFORMANCE & MATHEMATICAL METRICS BANNER */}
      {/* ========================================================= */}
      <div className="w-full max-w-6xl mt-24 mb-16 relative z-10">
        <div className="bg-gradient-to-r from-primary-900 via-indigo-900 to-purple-900 rounded-3xl p-8 sm:p-12 text-white shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 border border-primary-800">
          <div className="space-y-2 text-center md:text-left">
            <span className="text-xs font-bold text-primary-300 uppercase tracking-widest">Built for Scale & Accuracy</span>
            <h3 className="text-2xl sm:text-3xl font-extrabold">Ready to Experience AssignGuard?</h3>
            <p className="text-sm text-primary-100 max-w-lg">
              Empower your institution with explainable AI, mathematical NLP plagiarism detection, and automated grading.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button
              onClick={() => {
                const el = document.getElementById('login-form');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-6 py-3.5 bg-white text-gray-900 hover:bg-gray-100 font-extrabold rounded-2xl text-sm transition-all shadow-lg text-center"
            >
              Sign In to Portal &rarr;
            </button>
            <Link
              to="/register"
              className="px-6 py-3.5 bg-primary-700/60 hover:bg-primary-700 text-white font-extrabold rounded-2xl text-sm transition-all border border-primary-500/50 text-center"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="w-full max-w-6xl py-8 border-t border-gray-200 text-center text-xs text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-gray-800">AssignGuard</span>
          <span>&copy; {new Date().getFullYear()} — Academic Integrity & Smart LMS</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <span className="px-2.5 py-1 bg-gray-100 rounded-lg text-gray-600 font-mono text-[10px]">Node.js</span>
          <span className="px-2.5 py-1 bg-gray-100 rounded-lg text-gray-600 font-mono text-[10px]">React 19</span>
          <span className="px-2.5 py-1 bg-gray-100 rounded-lg text-gray-600 font-mono text-[10px]">MongoDB Atlas</span>
          <span className="px-2.5 py-1 bg-gray-100 rounded-lg text-gray-600 font-mono text-[10px]">Google Gemini 1.5</span>
          <span className="px-2.5 py-1 bg-gray-100 rounded-lg text-gray-600 font-mono text-[10px]">Socket.IO</span>
        </div>
      </footer>
    </div>
  );
};

export default Home;
