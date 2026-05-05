import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import { toast } from 'react-toastify';
import { User, Mail, Lock, BookOpen, UserCircle, ShieldCheck } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'student',
    classInfo: '',
    subject: '',
    secretCode: ''
  });
  const { loginWithToken } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/register', formData);
      await loginWithToken(res.data.token);
      toast.success('Registration successful!');
      navigate(formData.role === 'teacher' ? '/teacher' : '/student');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-x-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute top-10 -left-10 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob"></div>
      <div className="absolute top-0 right-10 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-1/2 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-4000"></div>

      <div className="max-w-md w-full relative z-10">
        <div className="glass-panel p-8 sm:p-10 relative">
          <div>
            <div className="mx-auto h-14 w-14 bg-gradient-to-tr from-primary-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/30 mb-4 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
              <ShieldCheck className="h-7 w-7 text-white" />
            </div>
            <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900 tracking-tight">
              Create an account
            </h2>
            <p className="mt-2 text-center text-sm text-gray-500 font-medium">
              Join AssignGuard and revolutionize your workflow
            </p>
          </div>
          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                  <User className="h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                </div>
                <input
                  name="fullName"
                  type="text"
                  required
                  className="premium-input !pl-11"
                  placeholder="Full Name"
                  onChange={handleChange}
                />
              </div>
              
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                  <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                </div>
                <input
                  name="email"
                  type="email"
                  required
                  className="premium-input !pl-11"
                  placeholder="Email address"
                  onChange={handleChange}
                />
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                  <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                </div>
                <input
                  name="password"
                  type="password"
                  required
                  className="premium-input !pl-11"
                  placeholder="Password"
                  onChange={handleChange}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                    <UserCircle className="h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                  </div>
                  <select
                    name="role"
                    className="premium-input !pl-11 appearance-none bg-white"
                    onChange={handleChange}
                    value={formData.role}
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                  </select>
                </div>

                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                    <BookOpen className="h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                  </div>
                  <input
                    name={formData.role === 'student' ? 'classInfo' : 'subject'}
                    type="text"
                    required
                    className="premium-input !pl-11"
                    placeholder={formData.role === 'student' ? 'Class' : 'Subject'}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {formData.role === 'teacher' && (
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                  </div>
                  <input
                    name="secretCode"
                    type="password"
                    required
                    className="premium-input !pl-11"
                    placeholder="Teacher Access Code"
                    onChange={handleChange}
                  />
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-2xl text-white bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 shadow-xl shadow-primary-500/20 transition-all duration-300 transform hover:-translate-y-0.5"
              >
                Create Account
              </button>
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/#login-form" className="font-bold text-primary-600 hover:text-primary-500 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
