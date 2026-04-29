import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { toast } from 'react-toastify';
import { PlusCircle, FileText, Calendar, ArrowLeft, Copy } from 'lucide-react';

const ClassroomView = () => {
  const { id } = useParams();
  const [assignments, setAssignments] = useState([]);
  const [classroom, setClassroom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '', subject: '', description: '', deadline: ''
  });

  const fetchClassroomAndAssignments = async () => {
    try {
      // In a real app we'd have a specific endpoint for single classroom details
      // For now we'll fetch assignments directly
      const res = await api.get(`/assignments/classroom/${id}`);
      setAssignments(res.data);
    } catch (err) {
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassroomAndAssignments();
  }, [id]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/assignments', { ...formData, classroomId: id });
      toast.success('Assignment created successfully');
      setShowModal(false);
      setFormData({ title: '', subject: '', description: '', deadline: '' });
      fetchClassroomAndAssignments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create assignment');
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
        <div className="flex-1 min-w-0 relative z-10 flex items-center">
          <Link to="/teacher" className="mr-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">
              Classroom Assignments
            </h2>
            <p className="mt-2 text-sm text-gray-500 font-medium">Manage assignments for this specific class.</p>
          </div>
        </div>
        <div className="mt-6 flex md:mt-0 md:ml-4 relative z-10">
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center px-6 py-3 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 shadow-primary-500/40 hover:shadow-primary-500/60 transition-all hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 active:scale-95"
          >
            <PlusCircle className="-ml-1 mr-2 h-5 w-5" />
            New Assignment
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {assignments.map(assignment => (
          <div key={assignment._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-6">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mb-2">
                {assignment?.subject || 'No Subject'}
              </span>
              <h3 className="text-lg font-bold text-gray-900 truncate mb-1">{assignment?.title || 'Untitled'}</h3>
              <p className="text-sm text-gray-500 line-clamp-2 mb-4 h-10">{assignment?.description || 'No description'}</p>
              
              <div className="space-y-2 mb-6">
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                  Due: {assignment?.deadline ? new Date(assignment.deadline).toLocaleString('en-IN') : 'No deadline'}
                </div>
              </div>

              <Link
                to={`/assignment-results/${assignment._id}`}
                className="w-full flex justify-center items-center px-4 py-2 border border-primary-300 shadow-sm text-sm font-medium rounded-lg text-primary-700 bg-primary-50 hover:bg-primary-100 transition"
              >
                <FileText className="mr-2 h-4 w-4" /> View Submissions
              </Link>
            </div>
          </div>
        ))}
        {assignments.length === 0 && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
            <h3 className="mt-2 text-sm font-medium text-gray-900">No assignments in this class</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new assignment.</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-gray-900/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-xl font-bold text-gray-900">Create New Assignment</h3>
            </div>
            
            <form onSubmit={handleCreate} className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
                  <input required type="text" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Subject</label>
                  <input required type="text" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                  <textarea className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none" rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Deadline</label>
                  <input required type="datetime-local" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500" value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} />
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

export default ClassroomView;
