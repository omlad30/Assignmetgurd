import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import { Users, BookOpen, ShieldCheck, GraduationCap, Building, Activity } from 'lucide-react';
import { toast } from 'react-toastify';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [classrooms, setClassrooms] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const res = await api.get('/admin/stats');
        setStats(res.data.stats);
        setClassrooms(res.data.classrooms);
        setAnalytics(res.data.analytics);
      } catch (err) {
        toast.error('Failed to load admin dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
      {/* Decorative blurred backgrounds */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-emerald-300 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob animation-delay-2000"></div>
      
      <div className="relative mb-8 flex justify-between items-center z-10">
        <div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 tracking-tight">
            Institutional Overview
          </h1>
          <p className="mt-2 text-sm text-gray-500 font-medium">
            Welcome, {user?.fullName}. Here is your administrative bird's-eye view.
          </p>
        </div>
        <button 
          onClick={logout}
          className="bg-white/60 backdrop-blur-md px-4 py-2 rounded-xl text-sm font-bold text-gray-700 hover:text-rose-600 border border-white/50 shadow-sm hover:shadow-md transition-all"
        >
          Secure Logout
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8 relative z-10">
        <div className="glass-panel p-6 flex items-center">
          <div className="p-4 rounded-full bg-blue-50 text-blue-600 mr-4">
            <GraduationCap className="h-8 w-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Students</p>
            <p className="text-3xl font-bold text-gray-900">{stats?.totalStudents || 0}</p>
          </div>
        </div>
        <div className="glass-panel p-6 flex items-center">
          <div className="p-4 rounded-full bg-emerald-50 text-emerald-600 mr-4">
            <Users className="h-8 w-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Teachers</p>
            <p className="text-3xl font-bold text-gray-900">{stats?.totalTeachers || 0}</p>
          </div>
        </div>
        <div className="glass-panel p-6 flex items-center">
          <div className="p-4 rounded-full bg-purple-50 text-purple-600 mr-4">
            <Building className="h-8 w-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Active Classrooms</p>
            <p className="text-3xl font-bold text-gray-900">{stats?.totalClassrooms || 0}</p>
          </div>
        </div>
        <div className="glass-panel p-6 flex items-center">
          <div className="p-4 rounded-full bg-orange-50 text-orange-600 mr-4">
            <BookOpen className="h-8 w-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Assignments</p>
            <p className="text-3xl font-bold text-gray-900">{stats?.totalAssignments || 0}</p>
          </div>
        </div>
      </div>

      <div className="relative z-10 mb-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
          <ShieldCheck className="h-6 w-6 mr-2 text-primary-600" />
          Classroom Directory
        </h2>
        <div className="glass-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200/50">
              <thead className="bg-gray-50/50 backdrop-blur-sm">
                <tr>
                  <th className="py-4 pl-6 pr-3 text-left text-xs font-bold text-gray-500 uppercase">Classroom Name</th>
                  <th className="px-3 py-4 text-left text-xs font-bold text-gray-500 uppercase">Subject</th>
                  <th className="px-3 py-4 text-left text-xs font-bold text-gray-500 uppercase">Teacher</th>
                  <th className="px-3 py-4 text-left text-xs font-bold text-gray-500 uppercase">Student Count</th>
                  <th className="px-3 py-4 text-left text-xs font-bold text-gray-500 uppercase">Join Code</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white/30 backdrop-blur-md">
                {classrooms.map((room) => (
                  <tr key={room._id} className="hover:bg-white/50 transition-colors">
                    <td className="whitespace-nowrap py-4 pl-6 pr-3 font-semibold text-gray-900">{room.name}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-gray-700 font-medium">{room.teacherId?.subject || 'N/A'}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-gray-900 font-medium">
                      {room.teacherId?.fullName} 
                      <span className="text-xs text-gray-400 block">{room.teacherId?.email}</span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {room.students?.length || 0} enrolled
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 font-mono text-sm text-primary-600 font-bold tracking-widest">{room.inviteCode}</td>
                  </tr>
                ))}
                {classrooms.length === 0 && (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-sm text-gray-500">No classrooms active yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Analytics Section */}
      {analytics && (
        <div className="relative z-10 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Activity className="h-6 w-6 mr-2 text-primary-600" />
            Platform Analytics
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* User Growth Bar Chart */}
            <div className="glass-panel p-6 lg:col-span-2">
              <h3 className="text-lg font-bold text-gray-800 mb-4">User Growth (Last 7 Days)</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.userGrowth} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" stroke="#888" fontSize={12} tickMargin={10} />
                    <YAxis stroke="#888" fontSize={12} allowDecimals={false} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      cursor={{fill: 'rgba(139, 92, 246, 0.1)'}}
                    />
                    <Bar dataKey="users" name="New Users" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Role Distribution Pie Chart */}
            <div className="glass-panel p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Role Distribution</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.roleDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      <Cell fill="#3b82f6" /> {/* Students - Blue */}
                      <Cell fill="#10b981" /> {/* Teachers - Emerald */}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
