import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import SubmitAssignment from './pages/SubmitAssignment';
import AssignmentResult from './pages/AssignmentResult';
import AssignmentSubmissionsView from './pages/AssignmentSubmissionsView';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';

function App() {
  const { user } = useContext(AuthContext);

  const HomeRedirect = () => {
    if (user?.role === 'teacher') return <Navigate to="/teacher" />;
    if (user?.role === 'student') return <Navigate to="/student" />;
    return <Navigate to="/login" />;
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auth/success" element={<Login />} /> {/* Handles Google Redirect */}

          {/* Student Routes */}
          <Route path="/student" element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentDashboard />
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
          <Route path="/assignment-results/:id" element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <AssignmentSubmissionsView />
            </ProtectedRoute>
          } />
        </Routes>
      </main>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
    </div>
  );
}

export default App;
