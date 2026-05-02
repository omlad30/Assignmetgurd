import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { toast } from 'react-toastify';
import { PlusCircle, Users, Copy, Check, BookOpen } from 'lucide-react';

const TeacherDashboard = () => {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [copiedCode, setCopiedCode] = useState(null);

  const fetchClassrooms = async () => {
    try {
      const res = await api.get('/classrooms/teacher');
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

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/classrooms', { name });
      toast.success('Classroom created successfully');
      setShowModal(false);
      setName('');
      fetchClassrooms();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create classroom');
    }
  };

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.info('Invite code copied!');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-10 md:flex md:items-center md:justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-primary-500/10 rounded-full blur-3xl"></div>
        <div className="flex-1 min-w-0 relative z-10">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">
            My Classrooms
          </h2>
          <p className="mt-2 text-sm text-gray-500 font-medium">Manage your classes and assignments</p>
        </div>
        <div className="mt-6 flex md:mt-0 md:ml-4 relative z-10">
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center px-6 py-3 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 shadow-primary-500/40 hover:shadow-primary-500/60 transition-all hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 active:scale-95"
          >
            <PlusCircle className="-ml-1 mr-2 h-5 w-5" />
            New Classroom
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {classrooms.map(classroom => (
          <div key={classroom._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 truncate mb-4">{classroom.name}</h3>
              
              <div className="flex items-center justify-between mb-6 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="text-sm">
                  <span className="text-gray-500 block text-xs font-semibold uppercase tracking-wider mb-1">Invite Code</span>
                  <span className="font-mono font-bold text-primary-700 text-lg tracking-widest">{classroom.inviteCode}</span>
                </div>
                <button onClick={() => copyToClipboard(classroom.inviteCode)} className="p-2 text-gray-400 hover:text-primary-600 hover:bg-white rounded-md transition-colors border border-transparent hover:border-gray-200 shadow-sm">
                  {copiedCode === classroom.inviteCode ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
                </button>
              </div>

              <div className="flex items-center text-sm text-gray-500 mb-6">
                <Users className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                <span className="font-medium text-gray-900">{classroom.students?.length || 0}</span>&nbsp;Students Enrolled
              </div>

              <Link
                to={`/classroom/${classroom._id}`}
                className="w-full flex justify-center items-center px-4 py-2.5 border border-transparent shadow-sm text-sm font-bold rounded-lg text-white bg-gray-900 hover:bg-gray-800 transition"
              >
                Enter Classroom
              </Link>
            </div>
          </div>
        ))}
        {classrooms.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 px-4 bg-white rounded-3xl border border-dashed border-gray-300 shadow-sm">
            <div className="h-24 w-24 bg-primary-50 text-primary-500 rounded-full flex items-center justify-center mb-6">
              <BookOpen className="h-12 w-12" />
            </div>
            <h3 className="text-2xl font-extrabold text-gray-900 mb-2">No classrooms yet</h3>
            <p className="text-gray-500 text-center max-w-sm mb-8 text-lg">
              Create your first classroom to generate an invite code and start managing assignments.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center px-6 py-3 border border-transparent rounded-xl shadow-sm text-base font-bold text-white bg-primary-600 hover:bg-primary-700 shadow-primary-500/30 transition-all transform hover:-translate-y-1"
            >
              <PlusCircle className="-ml-1 mr-2 h-5 w-5" />
              Create Classroom
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-gray-900/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-xl font-bold text-gray-900">Create Classroom</h3>
            </div>
            
            <form onSubmit={handleCreate}>
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Classroom Name</label>
                  <input required type="text" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="e.g. CS 101 - Fall 2026" value={name} onChange={e => setName(e.target.value)} />
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-5 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-xl hover:bg-primary-700">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
