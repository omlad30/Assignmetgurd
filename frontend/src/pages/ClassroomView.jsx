import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { toast } from 'react-toastify';
import { PlusCircle, FileText, Calendar, ArrowLeft, Trash, Edit3 } from 'lucide-react';

const ClassroomView = () => {
  const { id } = useParams();
  const [assignments, setAssignments] = useState([]);
  const [classroom, setClassroom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [selectedDivTab, setSelectedDivTab] = useState('ALL');
  const [formData, setFormData] = useState({
    title: '', subject: '', description: '', deadline: '', targetDivision: 'ALL'
  });

  const fetchClassroomAndAssignments = async () => {
    try {
      const [assignRes, classRes] = await Promise.all([
        api.get(`/assignments/classroom/${id}`),
        api.get(`/classrooms/${id}`)
      ]);
      setAssignments(assignRes.data);
      setClassroom(classRes.data);
    } catch (err) {
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassroomAndAssignments();
  }, [id]);

  const handleOpenCreate = () => {
    setEditingAssignment(null);
    setFormData({ title: '', subject: '', description: '', deadline: '', targetDivision: 'ALL' });
    setShowModal(true);
  };

  const handleOpenEdit = (assignment) => {
    setEditingAssignment(assignment);
    const dateObj = new Date(assignment.deadline);
    const formattedDeadline = !isNaN(dateObj) ? new Date(dateObj.getTime() - (dateObj.getTimezoneOffset() * 60000)).toISOString().slice(0, 16) : '';

    setFormData({
      title: assignment.title || '',
      subject: assignment.subject || '',
      description: assignment.description || '',
      deadline: formattedDeadline,
      targetDivision: assignment.targetDivision || 'ALL'
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAssignment) {
        await api.put(`/assignments/${editingAssignment._id}`, formData);
        toast.success('Assignment updated & deadline extended successfully!');
      } else {
        await api.post('/assignments', { ...formData, classroomId: id });
        toast.success('Assignment created successfully');
      }
      setShowModal(false);
      setEditingAssignment(null);
      setFormData({ title: '', subject: '', description: '', deadline: '', targetDivision: 'ALL' });
      fetchClassroomAndAssignments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save assignment');
    }
  };

  const handleDelete = async (assignmentId) => {
    if (window.confirm('Are you sure you want to delete this assignment? All submissions will be permanently lost.')) {
      try {
        await api.delete(`/assignments/${assignmentId}`);
        toast.success('Assignment deleted successfully');
        fetchClassroomAndAssignments();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to delete assignment');
      }
    }
  };

  const filteredAssignments = assignments.filter(assignment => {
    if (selectedDivTab === 'ALL') return true;
    return (assignment.targetDivision || 'ALL') === selectedDivTab;
  });

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-8 md:flex md:items-center md:justify-between relative overflow-hidden">
        <div className="flex-1 min-w-0 relative z-10 flex items-center">
          <Link to="/teacher" className="mr-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">
              {classroom?.name || 'Classroom Assignments'}
            </h2>
            <p className="mt-2 text-sm text-gray-500 font-medium">
              Invite Code: <span className="font-mono font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded">{classroom?.inviteCode || 'N/A'}</span> &bull; Manage assignments by Division
            </p>
          </div>
        </div>
        <div className="mt-6 flex md:mt-0 md:ml-4 relative z-10">
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center px-6 py-3 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 shadow-primary-500/40 hover:shadow-primary-500/60 transition-all hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 active:scale-95"
          >
            <PlusCircle className="-ml-1 mr-2 h-5 w-5" />
            New Assignment
          </button>
        </div>
      </div>

      {/* Division Category Tabs */}
      <div className="flex items-center space-x-2 mb-8 bg-gray-100/80 p-1.5 rounded-2xl w-fit border border-gray-200">
        <button
          onClick={() => setSelectedDivTab('ALL')}
          className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${selectedDivTab === 'ALL'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
            }`}
        >
          All Divisions ({assignments.length})
        </button>
        <button
          onClick={() => setSelectedDivTab('A')}
          className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${selectedDivTab === 'A'
              ? 'bg-white text-primary-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
            }`}
        >
          Division A ({assignments.filter(a => a.targetDivision === 'A').length})
        </button>
        <button
          onClick={() => setSelectedDivTab('B')}
          className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${selectedDivTab === 'B'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
            }`}
        >
          Division B ({assignments.filter(a => a.targetDivision === 'B').length})
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredAssignments.map(assignment => {
          const isPassed = new Date(assignment.deadline) < new Date();

          return (
            <div key={assignment._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col justify-between">
              <div className="p-6 relative group">
                <div className="absolute top-4 right-4 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-all focus-within:opacity-100">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleOpenEdit(assignment);
                    }}
                    className="p-2 text-gray-400 hover:text-primary-600 bg-gray-50 hover:bg-primary-50 rounded-lg transition-colors"
                    title="Edit / Extend Deadline"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDelete(assignment._id);
                    }}
                    className="p-2 text-gray-400 hover:text-red-600 bg-gray-50 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Assignment"
                  >
                    <Trash className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {assignment?.subject || 'No Subject'}
                  </span>

                  {(!assignment.targetDivision || assignment.targetDivision === 'ALL') ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                      All Divisions
                    </span>
                  ) : assignment.targetDivision === 'A' ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                      Div A Only
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
                      Div B Only
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-gray-900 truncate pr-14 mb-1">{assignment?.title || 'Untitled'}</h3>
                <p className="text-sm text-gray-500 line-clamp-2 mb-4 h-10">{assignment?.description || 'No description'}</p>

                <div className="space-y-2 mb-6">
                  <div className={`flex items-center text-sm font-medium ${isPassed ? 'text-red-600' : 'text-gray-600'}`}>
                    <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4" />
                    Due: {assignment?.deadline ? new Date(assignment.deadline).toLocaleString('en-IN') : 'No deadline'}
                    {isPassed && <span className="ml-2 text-xs font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Expired</span>}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link
                    to={`/assignment-results/${assignment._id}`}
                    className="flex-1 flex justify-center items-center px-3 py-2 border border-primary-300 shadow-sm text-sm font-medium rounded-lg text-primary-700 bg-primary-50 hover:bg-primary-100 transition"
                  >
                    <FileText className="mr-1.5 h-4 w-4" /> Submissions
                  </Link>
                  <button
                    onClick={() => handleOpenEdit(assignment)}
                    className="px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition"
                    title="Extend Due Date"
                  >
                    Extend Date
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {filteredAssignments.length === 0 && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
            <h3 className="mt-2 text-sm font-medium text-gray-900">No assignments found for {selectedDivTab === 'ALL' ? 'this classroom' : `Division ${selectedDivTab}`}</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new assignment for this division.</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-gray-900/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">
                {editingAssignment ? 'Edit Assignment / Extend Deadline' : 'Create New Assignment'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
                  <input required type="text" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Subject</label>
                  <input required type="text" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500" value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Target Division</label>
                  <select
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white font-medium"
                    value={formData.targetDivision}
                    onChange={e => setFormData({ ...formData, targetDivision: e.target.value })}
                  >
                    <option value="ALL">All Divisions (No Division filter)</option>
                    <option value="A">Division A Only</option>
                    <option value="B">Division B Only</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">Select which students can view and submit this assignment.</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                  <textarea className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none" rows="3" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}></textarea>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Deadline / Due Date</label>
                  <input required type="datetime-local" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-medium" value={formData.deadline} onChange={e => setFormData({ ...formData, deadline: e.target.value })} />
                  <p className="mt-1 text-xs text-primary-600">Update this field to extend the due date for students.</p>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onClick={() => { setShowModal(false); setEditingAssignment(null); }} className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-5 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-xl hover:bg-primary-700">
                  {editingAssignment ? 'Save & Extend' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassroomView;
