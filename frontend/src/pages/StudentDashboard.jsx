import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { toast } from 'react-toastify';
import { Users, Plus, ArrowRight } from 'lucide-react';

const StudentDashboard = () => {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [joining, setJoining] = useState(false);

  const fetchClassrooms = async () => {
    try {
      const res = await api.get('/classrooms/student');
      setClassrooms(res.data);
    } catch (err) {
      toast.error('Failed to load classrooms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!inviteCode) return;
    
    setJoining(true);
    try {
      await api.post('/classrooms/join', { inviteCode: inviteCode.trim() });
      toast.success('Successfully joined the classroom!');
      setShowJoinModal(false);
      setInviteCode('');
      fetchClassrooms();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to join classroom');
    } finally {
      setJoining(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-10 md:flex md:items-center md:justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="flex-1 min-w-0 relative z-10">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">
            My Enrolled Classes
          </h2>
          <p className="mt-2 text-sm text-gray-500 font-medium">Join a class using an invite code to see your assignments.</p>
        </div>
        <div className="mt-6 flex md:mt-0 md:ml-4 relative z-10">
          <button
            onClick={() => setShowJoinModal(true)}
            className="inline-flex items-center px-6 py-3 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-blue-500/40 hover:shadow-blue-500/60 transition-all hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 active:scale-95"
          >
            <Plus className="-ml-1 mr-2 h-5 w-5" />
            Join Classroom
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {classrooms.map(classroom => (
          <div key={classroom._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
            <div className="p-6 flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2 truncate" title={classroom.name}>{classroom.name}</h3>
              <p className="text-sm text-gray-500 mb-6">Instructor: <span className="font-medium text-gray-700">{classroom.teacherId?.fullName}</span></p>
              
              <div className="flex items-center text-sm text-gray-500">
                <Users className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                <span>{classroom.students?.length || 0} Classmates</span>
              </div>
            </div>
            
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
              <Link
                to={`/student/classroom/${classroom._id}`}
                className="w-full flex justify-between items-center text-blue-600 font-bold hover:text-blue-800 transition group"
              >
                <span>View Assignments</span>
                <ArrowRight className="h-5 w-5 transform group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        ))}
        {classrooms.length === 0 && (
          <div className="col-span-full py-16 text-center text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
            <h3 className="text-lg font-medium text-gray-900 mb-2">You aren't enrolled in any classes.</h3>
            <p className="text-sm mb-4">Ask your teacher for a 6-character Invite Code.</p>
            <button
              onClick={() => setShowJoinModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Join Classroom
            </button>
          </div>
        )}
      </div>

      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-gray-900/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-xl font-bold text-gray-900">Join Classroom</h3>
              <p className="text-sm text-gray-500 mt-1">Enter the invite code provided by your teacher.</p>
            </div>
            
            <form onSubmit={handleJoin}>
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Invite Code</label>
                  <input
                    required
                    type="text"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 font-mono text-lg tracking-widest text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
                    placeholder="e.g. A7B9X2"
                    value={inviteCode}
                    onChange={e => setInviteCode(e.target.value.toUpperCase())}
                    maxLength={6}
                  />
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onClick={() => setShowJoinModal(false)} className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={joining} className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center">
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
