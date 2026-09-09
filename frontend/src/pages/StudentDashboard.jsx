import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Users, Plus, ArrowRight, BookOpen, Clock, Calendar, CheckCircle } from 'lucide-react';

const StudentDashboard = () => {
  const { user, refreshUser } = useContext(AuthContext);
  const [classrooms, setClassrooms] = useState([]);
  const [upcomingAssignments, setUpcomingAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [division, setDivision] = useState('');
  const [joining, setJoining] = useState(false);

  const fetchData = async () => {
    try {
      const [classRes, assignRes] = await Promise.all([
        api.get('/classrooms/student'),
        api.get('/assignments/student/upcoming').catch(() => ({ data: [] }))
      ]);
      setClassrooms(classRes.data);
      setUpcomingAssignments(assignRes.data || []);
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!inviteCode) return;
    
    setJoining(true);
    try {
      const response = await api.post('/classrooms/join', { 
        inviteCode: inviteCode.trim(),
        rollNo: rollNo.trim(),
        division: division.trim()
      });
      toast.success(response.data.message || 'Successfully requested to join!');
      setShowJoinModal(false);
      setInviteCode('');
      setRollNo('');
      setDivision('');
      await refreshUser();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to join classroom');
    } finally {
      setJoining(false);
    }
  };

  const getTimeRemaining = (deadline) => {
    const total = Date.parse(deadline) - Date.parse(new Date());
    if (total <= 0) return "Deadline passed";
    const days = Math.floor((total / (1000 * 60 * 60 * 24)));
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    if(days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 shadow-xl shadow-indigo-500/20 mb-10 md:flex md:items-center md:justify-between relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl mix-blend-overlay pointer-events-none"></div>
        <div className="absolute bottom-0 left-20 -mb-10 w-40 h-40 bg-purple-400 opacity-20 rounded-full blur-2xl mix-blend-overlay pointer-events-none"></div>
        
        <div className="flex-1 min-w-0 relative z-10">
          <h2 className="text-3xl font-bold text-white tracking-tight sm:text-4xl mb-2">
            Welcome back, {user?.fullName?.split(' ')[0] || 'Student'}! 👋
          </h2>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3">
            <p className="text-sm text-indigo-100 font-medium">Ready to conquer your assignments today?</p>
            {user?.rollNo && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-sm border border-white/10 shadow-sm">
                Roll No: {user.rollNo}
              </span>
            )}
            {user?.division && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-sm border border-white/10 shadow-sm">
                Div: {user.division}
              </span>
            )}
          </div>
        </div>
        <div className="mt-6 flex md:mt-0 md:ml-4 relative z-10">
          <button
            onClick={() => setShowJoinModal(true)}
            className="inline-flex items-center px-6 py-3 border border-transparent rounded-xl shadow-lg text-sm font-bold text-indigo-600 bg-white hover:bg-gray-50 hover:shadow-xl hover:-translate-y-0.5 transition-all focus:outline-none active:scale-95"
          >
            <Plus className="-ml-1 mr-2 h-5 w-5 text-indigo-600" />
            Join Classroom
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Content: Classrooms */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900 flex items-center">
              <BookOpen className="mr-3 h-6 w-6 text-indigo-600" />
              My Enrolled Classes
            </h3>
          </div>
          
          <div className="grid gap-6 sm:grid-cols-2">
            {classrooms.map((classroom, idx) => {
              // Generate a slight gradient variation based on index
              const gradients = [
                'from-blue-50 to-indigo-50 border-blue-100 hover:border-blue-300',
                'from-purple-50 to-fuchsia-50 border-purple-100 hover:border-purple-300',
                'from-emerald-50 to-teal-50 border-emerald-100 hover:border-emerald-300',
                'from-orange-50 to-amber-50 border-orange-100 hover:border-orange-300'
              ];
              const iconColors = ['text-blue-500', 'text-purple-500', 'text-emerald-500', 'text-orange-500'];
              const gradClass = gradients[idx % gradients.length];
              const iconClass = iconColors[idx % iconColors.length];

              return (
                <div key={classroom._id} className={`bg-gradient-to-br ${gradClass} rounded-2xl shadow-sm border overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col group hover:-translate-y-1`}>
                  <div className="p-6 flex-1 relative">
                    <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <BookOpen className={`w-20 h-20 ${iconClass}`} />
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 mb-1 truncate pr-10" title={classroom.name}>{classroom.name}</h3>
                    <p className="text-sm font-semibold text-gray-600 mb-6">Instructor: <span className="text-gray-900">{classroom.teacherId?.fullName}</span></p>
                    
                    <div className="flex items-center text-sm font-medium text-gray-600 bg-white/60 backdrop-blur-sm w-max px-3 py-1.5 rounded-lg">
                      <Users className={`flex-shrink-0 mr-2 h-4 w-4 ${iconClass}`} />
                      <span>{classroom.students?.length || 0} Classmates</span>
                    </div>
                  </div>
                  
                  <div className="bg-white/40 backdrop-blur-md px-6 py-4 border-t border-white/50">
                    <Link
                      to={`/student/classroom/${classroom._id}`}
                      className="w-full flex justify-between items-center text-indigo-700 font-bold hover:text-indigo-900 transition-colors"
                    >
                      <span>Enter Classroom</span>
                      <ArrowRight className="h-5 w-5 transform group-hover:translate-x-1.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              );
            })}
            
            {classrooms.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-16 px-4 bg-white/50 backdrop-blur-sm rounded-3xl border-2 border-dashed border-gray-200 shadow-sm">
                <div className="h-20 w-20 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center mb-6 shadow-sm transform rotate-3">
                  <Users className="h-10 w-10" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">You aren't enrolled in any classes</h3>
                <p className="text-gray-500 text-center max-w-sm mb-8">
                  It looks a little quiet here. Ask your teacher for a 6-character Invite Code to join your first classroom.
                </p>
                <button
                  onClick={() => setShowJoinModal(true)}
                  className="inline-flex items-center px-6 py-3 border border-transparent rounded-xl shadow-sm text-base font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/30 transition-all transform hover:-translate-y-1"
                >
                  <Plus className="-ml-1 mr-2 h-5 w-5" />
                  Join Your First Classroom
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: Upcoming Tasks */}
        <div className="lg:w-80 flex-shrink-0">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden sticky top-8">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900 flex items-center">
                <Clock className="mr-2 h-5 w-5 text-orange-500" />
                Upcoming Tasks
              </h3>
              <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2.5 py-1 rounded-full">
                {upcomingAssignments.length}
              </span>
            </div>
            
            <div className="p-4 max-h-[500px] overflow-y-auto custom-scrollbar">
              {upcomingAssignments.length > 0 ? (
                <div className="space-y-4">
                  {upcomingAssignments.map(assignment => (
                    <Link key={assignment._id} to={`/student/classroom/${assignment.classroomId?._id}`} className="block group">
                      <div className="p-4 rounded-2xl border border-gray-100 bg-white hover:bg-orange-50 hover:border-orange-200 transition-all shadow-sm hover:shadow-md">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md truncate max-w-[120px]">
                            {assignment.classroomId?.name}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-gray-900 group-hover:text-orange-700 transition-colors line-clamp-2 mb-3">
                          {assignment.title}
                        </h4>
                        <div className="flex items-center justify-between text-xs font-medium text-gray-500">
                          <div className="flex items-center text-orange-600 font-bold bg-orange-100 px-2 py-1 rounded-lg">
                            <Clock className="w-3.5 h-3.5 mr-1" />
                            {getTimeRemaining(assignment.deadline)}
                          </div>
                          <span className="text-gray-400">Due soon</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 px-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-500 mb-4">
                    <CheckCircle className="h-8 w-8" />
                  </div>
                  <h4 className="text-base font-bold text-gray-900 mb-1">All caught up!</h4>
                  <p className="text-xs text-gray-500">You don't have any upcoming assignments due soon.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-gray-900/60 backdrop-blur-md transition-opacity">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
              <h3 className="text-xl font-bold text-gray-900">Join a Classroom</h3>
              <p className="text-sm text-gray-600 mt-1">Enter the invite code provided by your instructor.</p>
            </div>
            
            <form onSubmit={handleJoin}>
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Invite Code</label>
                  <input
                    required
                    type="text"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 font-mono text-xl tracking-[0.3em] text-center focus:ring-0 focus:border-indigo-500 uppercase text-gray-900 shadow-sm transition-colors"
                    placeholder="e.g. A7B9X2"
                    value={inviteCode}
                    onChange={e => setInviteCode(e.target.value.toUpperCase())}
                    maxLength={6}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Roll No (Optional)</label>
                    <input
                      type="text"
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 focus:ring-0 focus:border-indigo-500 shadow-sm transition-colors"
                      placeholder="e.g. 101"
                      value={rollNo}
                      onChange={e => setRollNo(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Division (Optional)</label>
                    <input
                      type="text"
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 focus:ring-0 focus:border-indigo-500 shadow-sm transition-colors"
                      placeholder="e.g. A"
                      value={division}
                      onChange={e => setDivision(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onClick={() => setShowJoinModal(false)} className="px-5 py-2.5 text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" disabled={joining} className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-50 shadow-md shadow-indigo-500/30 transition-all active:scale-95 flex items-center">
                  {joining ? 'Joining...' : 'Join Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
