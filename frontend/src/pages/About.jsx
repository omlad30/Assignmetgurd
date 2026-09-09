import React from 'react';
import { Shield, BookOpen, BrainCircuit, Cpu, Lock, Layers, Zap, Award, CheckCircle2 } from 'lucide-react';

const About = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200 py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden flex justify-center">
      
      {/* Background blobs */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-primary-300 dark:bg-primary-900/30 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-3xl opacity-70 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-300 dark:bg-purple-900/30 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-pink-300 dark:bg-pink-900/30 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>

      <div className="max-w-4xl w-full relative z-10 space-y-10">
        
        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-6">
            <div className="relative flex items-center justify-center h-20 w-20 rounded-3xl bg-gradient-to-br from-primary-600 to-purple-600 shadow-xl shadow-primary-500/30 transform rotate-3 hover:rotate-0 transition-transform duration-300">
              <Shield className="h-12 w-12 text-white absolute" strokeWidth={1.5} />
              <BookOpen className="h-6 w-6 text-white absolute mt-2" strokeWidth={2.5} />
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
            About <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 via-indigo-600 to-purple-600">AssignGuard</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto font-medium">
            Empowering modern education through AI-driven authenticity, institutional security, and ethical learning workflows.
          </p>
        </div>

        {/* Mission & Vision Panel */}
        <div className="glass-panel p-8 sm:p-10 dark:bg-gray-900/60 dark:border-gray-800">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <Award className="h-7 w-7 text-primary-500 mr-3" />
            Our Vision
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-base sm:text-lg leading-relaxed mb-6">
            Traditional Learning Management Systems often struggle to verify the authenticity of student submissions, especially with the surge of generative AI tools and peer-to-peer sharing.
          </p>
          <p className="text-gray-600 dark:text-gray-300 text-base sm:text-lg leading-relaxed mb-6">
            <strong>AssignGuard</strong> bridges this gap by integrating transparent peer duplicate checks, Google Gemini-powered linguistic verification, and structured classroom management directly into one unified platform.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            <div className="p-5 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
              <Shield className="h-8 w-8 text-primary-500 mb-3" />
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">Mathematical Authenticity</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">TF-IDF Vector Space modeling and Cosine Similarity to detect peer duplicate clusters without human bias.</p>
            </div>
            <div className="p-5 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
              <BrainCircuit className="text-purple-500 h-8 w-8 mb-3" />
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">Explainable AI Scoring</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">Constructive feedback highlighting suspected AI text to foster student growth rather than punitive measures.</p>
            </div>
          </div>
        </div>

        {/* Architecture & Core Pillars */}
        <div className="glass-panel p-8 sm:p-10 dark:bg-gray-900/60 dark:border-gray-800">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <Cpu className="h-7 w-7 text-indigo-500 mr-3" />
            Core Technology Pillars
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-3">
                <Lock className="text-blue-600 h-5 w-5" />
              </div>
              <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1">Security & SSO</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">Google OAuth 2.0, Firebase tokens, and Helmet protection for enterprise-grade integrity.</p>
            </div>

            <div className="p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
              <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center mb-3">
                <Layers className="text-emerald-600 h-5 w-5" />
              </div>
              <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1">Admission Control</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">Classroom join queues with one-click teacher authorization to keep classrooms secure.</p>
            </div>

            <div className="p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
              <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/30 rounded-xl flex items-center justify-center mb-3">
                <Zap className="text-amber-600 h-5 w-5" />
              </div>
              <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1">Real-Time Engine</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">Live submission updates, pre-flight self-checking, and interactive quiz assessment.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default About;
