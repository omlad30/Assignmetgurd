import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import SubmitAssignment from './pages/SubmitAssignment';
import AssignmentResult from './pages/AssignmentResult';
import AssignmentSubmissionsView from './pages/AssignmentSubmissionsView';
import ClassroomView from './pages/ClassroomView';
import StudentClassroomView from './pages/StudentClassroomView';
import NotFound from './pages/NotFound';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';

function App() {
  const { user } = useContext(AuthContext);

  const HomeRedirect = () => {
    if (user?.role === 'teacher') return <Navigate to="/teacher" />;
    if (user?.role === 'student') return <Navigate to="/student" />;
    return <Home />;
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auth/success" element={<Home />} /> {/* Handles Google Redirect */}

          {/* Student Routes */}
          <Route path="/student" element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentDashboard />
            </ProtectedRoute>
          } />
          <Route path="/student/classroom/:id" element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentClassroomView />
            </ProtectedRoute>
          } />
          <Route path="/submit/:id" element={
            <ProtectedRoute allowedRoles={['student']}>
              <SubmitAssignment />
            </ProtectedRoute>
          } />
          <Route path="/submission-result/:id" element={
            <ProtectedRoute allowedRoles={['student']}>
              <AssignmentResult />
            </ProtectedRoute>
          } />

          {/* Teacher Routes */}
          <Route path="/teacher" element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <TeacherDashboard />
            </ProtectedRoute>
          } />
          <Route path="/classroom/:id" element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <ClassroomView />
            </ProtectedRoute>
          } />
          <Route path="/assignment-results/:id" element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <AssignmentSubmissionsView />
            </ProtectedRoute>
          } />

          {/* 404 Catch All */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {/* Simple Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
            <div className="mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} AssignGuard. All rights reserved.
            </div>
            <div className="flex space-x-6">
              <a href="#" className="hover:text-primary-600 transition">Privacy Policy</a>
              <a href="#" className="hover:text-primary-600 transition">Terms of Service</a>
              <a href="mailto:support@assignguard.com" className="hover:text-primary-600 transition">Contact Support</a>
            </div>
          </div>
        </div>
      </footer>

      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
    </div>
  );
}

export default App;
