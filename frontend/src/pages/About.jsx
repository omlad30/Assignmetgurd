import React from 'react';
import { Shield, BookOpen, Users, Code, Zap, Award } from 'lucide-react';

const About = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200 py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden flex justify-center">
      
      {/* Background blobs */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-primary-300 dark:bg-primary-900/30 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-3xl opacity-70 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-300 dark:bg-purple-900/30 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-pink-300 dark:bg-pink-900/30 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>

      <div className="max-w-4xl w-full relative z-10 space-y-12">
        
        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-6">
            <div className="relative flex items-center justify-center h-20 w-20 rounded-3xl bg-gradient-to-br from-primary-600 to-purple-600 shadow-xl shadow-primary-500/30 transform rotate-3 hover:rotate-0 transition-transform duration-300">
              <Shield className="h-12 w-12 text-white absolute" strokeWidth={1.5} />
              <BookOpen className="h-6 w-6 text-white absolute mt-2" strokeWidth={2.5} />
            </div>
          </div>
          <h1 className="text-5xl font-black text-gray-900 dark:text-white tracking-tighter">
            About <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-purple-600">AssignGuard</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto font-medium">
            Empowering education through AI-driven security, ethical learning, and seamless classroom management.
          </p>
        </div>

        {/* Project Info Panel */}
        <div className="glass-panel p-8 sm:p-10 dark:bg-gray-900/60 dark:border-gray-800">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <Award className="h-8 w-8 text-primary-500 mr-3" />
            The Project
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed mb-6">
            AssignGuard is a next-generation Educational Technology platform. Traditional Learning Management Systems often struggle to verify the originality of student submissions, especially with the rise of AI tools and image-based bypasses.
          </p>
          <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed mb-8">
            We built this platform to integrate rigorous security checks (like Tesseract OCR and vector similarity matching) natively into the submission flow, ensuring academic integrity without compromising user experience.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
            <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center text-center">
              <Shield className="h-10 w-10 text-primary-500 mb-4" />
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Secure Submissions</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Advanced OCR prevents invisible text and image-based cheating.</p>
            </div>
            <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center text-center">
              <Zap className="h-10 w-10 text-purple-500 mb-4" />
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Real-Time Data</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Teachers get instant notifications and visual plagiarism network graphs.</p>
            </div>
          </div>
        </div>

        {/* Team CodeCrafter Panel */}
        <div className="glass-panel p-8 sm:p-10 bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 shadow-2xl relative overflow-hidden">
          {/* Decorative code pattern */}
          <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
            <Code className="h-64 w-64 text-white transform rotate-12 translate-x-16 -translate-y-16" />
          </div>
          
          <div className="relative z-10">
            <h2 className="text-3xl font-bold text-white mb-2 flex items-center justify-center sm:justify-start">
              <Users className="h-8 w-8 text-primary-400 mr-3" />
              Team <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-purple-400 ml-2">CodeCrafter</span>
            </h2>
            <p className="text-gray-300 text-lg mt-4 mb-10 text-center sm:text-left max-w-2xl">
              We are passionate developers dedicated to crafting elegant code and solving real-world problems. AssignGuard represents our commitment to building software that is not only functional but visually stunning, highly secure, and impactful.
            </p>

            {/* Member Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { name: 'Om Lad', role: 'Full Stack Developer', initials: 'OL', from: 'from-primary-500', to: 'to-blue-500' },
                { name: 'Devendra Nimbalkar', role: 'Backend Engineer', initials: 'DN', from: 'from-purple-500', to: 'to-pink-500' },
                { name: 'Manish Patil', role: 'Frontend Developer', initials: 'MP', from: 'from-green-500', to: 'to-teal-500' },
              ].map((member) => (
                <div
                  key={member.name}
                  className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 flex flex-col items-center text-center hover:bg-white/15 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className={`h-16 w-16 bg-gradient-to-tr ${member.from} ${member.to} rounded-full flex items-center justify-center shadow-lg mb-4`}>
                    <span className="text-white font-extrabold text-lg tracking-wide">{member.initials}</span>
                  </div>
                  <h3 className="text-white font-bold text-lg leading-tight">{member.name}</h3>
                  <span className="mt-1 text-xs font-semibold uppercase tracking-widest text-primary-300">{member.role}</span>
                  <div className="mt-3 flex items-center gap-1">
                    <Code className="h-3 w-3 text-gray-400" />
                    <span className="text-gray-400 text-xs">Code Crafter</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default About;
