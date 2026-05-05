import { useState, useContext, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import { toast } from 'react-toastify';
import { Mail, Lock, LogIn, ShieldCheck, BrainCircuit, GraduationCap } from 'lucide-react';

const Home = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { loginWithToken, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      navigate(user.role === 'teacher' ? '/teacher' : '/student');
    }
    // Check if redirected from Google OAuth Success
    const queryParams = new URLSearchParams(location.search);
    const token = queryParams.get('token');
    if (token) {
      loginWithToken(token).then(() => {
        toast.success("Successfully logged in with Google!");
      }).catch(() => {
        toast.error("Google authentication failed.");
      });
    }
  }, [user, navigate, location.search, loginWithToken]);

  useEffect(() => {
    if (location.hash === '#login-form') {
      const el = document.getElementById('login-form');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [location.hash]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', { email, password });
      await loginWithToken(res.data.token);
      toast.success('Login successful!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    }
  };

  const loginWithGoogle = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex lg:items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8 relative overflow-x-hidden py-10">
      {/* Animated Background Blobs */}
      <div className="absolute top-10 -left-10 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob"></div>
      <div className="absolute top-0 right-10 w-96 h-96 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-1/2 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-4000"></div>

      <div className="max-w-6xl w-full flex flex-col lg:flex-row items-center gap-12 relative z-10">

        {/* Left Side - Information */}
        <div className="flex-1 w-full text-gray-900 px-2 sm:px-4 mt-8 lg:mt-0 text-center lg:text-left">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4 lg:mb-6">
            The Smartest Way to <br className="hidden lg:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-purple-600">
              Submit & Grade
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-10">
            AssignGuard is not just a plagiarism checker. It's an AI-powered tutor that helps students write better and helps teachers grade faster.
          </p>

          <div className="space-y-6 lg:space-y-8 text-left max-w-md mx-auto lg:mx-0">
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-1">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-gray-100">
                  <BrainCircuit className="text-primary-500 h-6 w-6" />
                </div>
              </div>
              <div className="ml-5">
                <h3 className="text-xl font-bold text-gray-900 mb-1">Pre-Flight AI Checks</h3>
                <p className="text-gray-600">Students run checks to get constructive AI feedback before final submission.</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 mt-1">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-gray-100">
                  <ShieldCheck className="text-purple-500 h-6 w-6" />
                </div>
              </div>
              <div className="ml-5">
                <h3 className="text-xl font-bold text-gray-900 mb-1">Peer Duplicate Check</h3>
                <p className="text-gray-600">Advanced Cosine Similarity to mathematically prove originality.</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 mt-1">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-gray-100">
                  <GraduationCap className="text-green-500 h-6 w-6" />
                </div>
              </div>
              <div className="ml-5">
                <h3 className="text-xl font-bold text-gray-900 mb-1">Streamlined Grading</h3>
                <p className="text-gray-600">Automatic quarantine for suspicious submissions to save teachers time.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
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
              <div className="space-y-4">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                    <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                  </div>
                  <input
                    type="email"
                    required
                    className="premium-input"
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
                    className="premium-input"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-2xl text-white bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 shadow-xl shadow-primary-500/20 transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  <span className="absolute left-0 inset-y-0 flex items-center pl-4">
                    <LogIn className="h-5 w-5 text-white/70 group-hover:text-white transition-colors" />
                  </span>
                  Sign in securely
                </button>
              </div>
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
    </div>
  );
};

export default Home;
