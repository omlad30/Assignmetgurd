import { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { PlusCircle, FileText, Calendar, ArrowLeft, Trash, Edit3, HelpCircle, Lock, Unlock, BarChart2, Plus, X } from 'lucide-react';

const ClassroomView = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [assignments, setAssignments] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [classroom, setClassroom] = useState(null);
  const [loading, setLoading] = useState(true);

  // Default subject from teacher profile or classroom name
  const defaultSubject = user?.subject || classroom?.name || '';

  // Navigation Tabs: 'assignments' | 'quizzes'
  const [activeContentType, setActiveContentType] = useState('assignments');
  const [selectedDivTab, setSelectedDivTab] = useState('ALL');

  // Assignment Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [formData, setFormData] = useState({
    title: '', subject: defaultSubject, description: '', deadline: ''
  });

  // Quiz Modal State
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizFormData, setQuizFormData] = useState({
    title: '',
    subject: defaultSubject,
    description: '',
    startTime: '',
    endTime: '',
    isPasswordProtected: false,
    password: '',
    questions: [
      {
        questionText: '',
        options: ['', '', '', ''],
        correctOptionIndex: 0,
        points: 1
      }
    ]
  });

  // Keep defaultSubject updated when user or classroom loads
  useEffect(() => {
    if (defaultSubject) {
      setFormData(prev => ({ ...prev, subject: prev.subject || defaultSubject }));
      setQuizFormData(prev => ({ ...prev, subject: prev.subject || defaultSubject }));
    }
  }, [defaultSubject]);

  const fetchClassroomAndData = async () => {
    try {
      const [assignRes, classRes] = await Promise.all([
        api.get(`/assignments/classroom/${id}`),
        api.get(`/classrooms/${id}`)
      ]);
      setAssignments(assignRes.data || []);
      setClassroom(classRes.data || null);

      try {
        const quizRes = await api.get(`/quizzes/classroom/${id}`);
        setQuizzes(quizRes.data || []);
      } catch (e) {
        console.error('Error fetching quizzes:', e);
      }
    } catch (err) {
      toast.error('Failed to load classroom details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassroomAndData();
  }, [id]);

  // Assignment Handlers
  const handleOpenCreate = () => {
    setEditingAssignment(null);
    setFormData({
      title: '',
      subject: user?.subject || classroom?.name || '',
      description: '',
      deadline: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (assignment) => {
    setEditingAssignment(assignment);
    const dateObj = new Date(assignment.deadline);
    const formattedDeadline = !isNaN(dateObj) ? new Date(dateObj.getTime() - (dateObj.getTimezoneOffset() * 60000)).toISOString().slice(0, 16) : '';

    setFormData({
      title: assignment.title || '',
      subject: assignment.subject || user?.subject || classroom?.name || '',
      description: assignment.description || '',
      deadline: formattedDeadline
    });
    setShowModal(true);
  };

  const handleSubmitAssignment = async (e) => {
    e.preventDefault();
    try {
      if (editingAssignment) {
        await api.put(`/assignments/${editingAssignment._id}`, formData);
        toast.success('Assignment updated successfully!');
      } else {
        await api.post('/assignments', { ...formData, classroomId: id });
        toast.success('Assignment created successfully');
      }
      setShowModal(false);
      setEditingAssignment(null);
      setFormData({ title: '', subject: user?.subject || classroom?.name || '', description: '', deadline: '' });
      fetchClassroomAndData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save assignment');
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (window.confirm('Are you sure you want to delete this assignment? All submissions will be permanently lost.')) {
      try {
        await api.delete(`/assignments/${assignmentId}`);
        toast.success('Assignment deleted successfully');
        fetchClassroomAndData();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to delete assignment');
      }
    }
  };

  // Quiz Handlers & Builder
  const handleOpenCreateQuiz = () => {
    const nowStr = new Date(Date.now() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
    setQuizFormData({
      title: '',
      subject: user?.subject || classroom?.name || '',
      description: '',
      startTime: nowStr,
      endTime: '',
      isPasswordProtected: false,
      password: '',
      questions: [
        {
          questionText: '',
          options: ['', '', '', ''],
          correctOptionIndex: 0,
          points: 1
        }
      ]
    });
    setShowQuizModal(true);
  };

  const handleAddQuestion = () => {
    setQuizFormData(prev => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          questionText: '',
          options: ['', '', '', ''],
          correctOptionIndex: 0,
          points: 1
        }
      ]
    }));
  };

  const handleRemoveQuestion = (qIndex) => {
    if (quizFormData.questions.length <= 1) {
      toast.warning('Quiz must have at least one question.');
      return;
    }
    setQuizFormData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== qIndex)
    }));
  };

  const handleQuestionChange = (qIndex, field, value) => {
    setQuizFormData(prev => {
      const updatedQs = [...prev.questions];
      updatedQs[qIndex][field] = value;
      return { ...prev, questions: updatedQs };
    });
  };

  const handleOptionChange = (qIndex, optIndex, value) => {
    setQuizFormData(prev => {
      const updatedQs = [...prev.questions];
      const updatedOpts = [...updatedQs[qIndex].options];
      updatedOpts[optIndex] = value;
      updatedQs[qIndex].options = updatedOpts;
      return { ...prev, questions: updatedQs };
    });
  };

  const handleSubmitQuiz = async (e) => {
    e.preventDefault();

    // Validation
    if (!quizFormData.startTime || !quizFormData.endTime) {
      toast.error('Please specify both Start Date/Time and End Date/Time.');
      return;
    }

    if (new Date(quizFormData.endTime) <= new Date(quizFormData.startTime)) {
      toast.error('End Date & Time must be after Start Date & Time.');
      return;
    }

    if (quizFormData.isPasswordProtected && (!quizFormData.password || !quizFormData.password.trim())) {
      toast.error('Please enter a password for the password-protected quiz.');
      return;
    }

    for (let i = 0; i < quizFormData.questions.length; i++) {
      const q = quizFormData.questions[i];
      if (!q.questionText.trim()) {
        toast.error(`Question #${i + 1} text cannot be empty.`);
        return;
      }
      for (let j = 0; j < 4; j++) {
        if (!q.options[j] || !q.options[j].trim()) {
          toast.error(`Option ${j + 1} for Question #${i + 1} cannot be empty.`);
          return;
        }
      }
    }

    try {
      await api.post('/quizzes', {
        ...quizFormData,
        classroomId: id
      });
      toast.success('Quiz created successfully!');
      setShowQuizModal(false);
      fetchClassroomAndData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create quiz');
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    if (window.confirm('Are you sure you want to delete this quiz? All student submissions for this quiz will be deleted.')) {
      try {
        await api.delete(`/quizzes/${quizId}`);
        toast.success('Quiz deleted successfully');
        fetchClassroomAndData();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to delete quiz');
      }
    }
  };



  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-8 md:flex md:items-center md:justify-between relative overflow-hidden">
        <div className="flex-1 min-w-0 relative z-10 flex items-center">
          <Link to="/teacher" className="mr-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">
              {classroom?.name || 'Classroom'}
            </h2>
            <p className="mt-2 text-sm text-gray-500 font-medium">
              Invite Code: <span className="font-mono font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded">{classroom?.inviteCode || 'N/A'}</span> &bull; Manage assignments & quizzes by Division
            </p>
          </div>
        </div>
        <div className="mt-6 flex gap-3 md:mt-0 md:ml-4 relative z-10">
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center px-5 py-2.5 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 shadow-primary-500/30 transition-all focus:outline-none"
          >
            <PlusCircle className="-ml-1 mr-2 h-5 w-5" />
            New Assignment
          </button>
          <button
            onClick={handleOpenCreateQuiz}
            className="inline-flex items-center px-5 py-2.5 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-purple-500/30 transition-all focus:outline-none"
          >
            <HelpCircle className="-ml-1 mr-2 h-5 w-5" />
            New Quiz
          </button>
        </div>
      </div>

      {/* Main Content Toggle Tabs (Assignments vs Quizzes) */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div className="flex bg-gray-200/70 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveContentType('assignments')}
            className={`flex items-center px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeContentType === 'assignments'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            <FileText className="h-4 w-4 mr-2 text-primary-600" />
            Assignments ({assignments.length})
          </button>
          <button
            onClick={() => setActiveContentType('quizzes')}
            className={`flex items-center px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeContentType === 'quizzes'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            <HelpCircle className="h-4 w-4 mr-2 text-purple-600" />
            Quizzes ({quizzes.length})
          </button>
        </div>


      </div>

      {/* ASSIGNMENTS VIEW */}
      {activeContentType === 'assignments' && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {assignments.map(assignment => {
            const isPassed = new Date(assignment.deadline) < new Date();

            return (
              <div key={assignment._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col justify-between">
                <div className="p-6 relative group">
                  <div className="absolute top-4 right-4 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button
                      onClick={() => handleOpenEdit(assignment)}
                      className="p-2 text-gray-400 hover:text-primary-600 bg-gray-50 hover:bg-primary-50 rounded-lg transition-colors"
                      title="Edit / Extend Deadline"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteAssignment(assignment._id)}
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
                    >
                      Extend Date
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {assignments.length === 0 && (
            <div className="col-span-full py-12 text-center border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
              <h3 className="mt-2 text-sm font-medium text-gray-900">No assignments found for this classroom</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new assignment.</p>
            </div>
          )}
        </div>
      )}

      {/* QUIZZES VIEW */}
      {activeContentType === 'quizzes' && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {quizzes.map(quiz => {
            const isPassed = new Date(quiz.deadline) < new Date();

            return (
              <div key={quiz._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col justify-between">
                <div className="p-6 relative group">
                  <div className="absolute top-4 right-4 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button
                      onClick={() => handleDeleteQuiz(quiz._id)}
                      className="p-2 text-gray-400 hover:text-red-600 bg-gray-50 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Quiz"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {quiz.subject}
                    </span>

                    {/* Password Protection Badge */}
                    {quiz.isPasswordProtected ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        <Lock className="w-3 h-3 mr-1" /> Password: <span className="font-mono ml-1 underline">{quiz.password}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                        <Unlock className="w-3 h-3 mr-1" /> Passwordless
                      </span>
                    )}


                  </div>

                  <h3 className="text-lg font-bold text-gray-900 truncate pr-10 mb-1">{quiz.title}</h3>
                  <p className="text-xs text-gray-500 mb-3">{quiz.questions?.length || 0} Questions &bull; {quiz.description || 'No description'}</p>

                  <div className="space-y-1.5 mb-6 text-xs">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="flex-shrink-0 mr-1.5 h-3.5 w-3.5 text-purple-600" />
                      <span className="font-bold mr-1">Starts:</span> {quiz.startTime ? new Date(quiz.startTime).toLocaleString('en-IN') : 'Immediate'}
                    </div>
                    <div className={`flex items-center ${isPassed ? 'text-red-600 font-bold' : 'text-gray-600'}`}>
                      <Calendar className="flex-shrink-0 mr-1.5 h-3.5 w-3.5 text-rose-500" />
                      <span className="font-bold mr-1">Ends:</span> {new Date(quiz.endTime || quiz.deadline).toLocaleString('en-IN')}
                      {isPassed && <span className="ml-2 text-[10px] font-extrabold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Closed</span>}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      to={`/quiz-results/${quiz._id}`}
                      className="w-full flex justify-center items-center px-3 py-2 border border-purple-300 shadow-sm text-sm font-bold rounded-lg text-purple-700 bg-purple-50 hover:bg-purple-100 transition"
                    >
                      <BarChart2 className="mr-1.5 h-4 w-4" /> View Leaderboard / Scores
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
          {quizzes.length === 0 && (
            <div className="col-span-full py-12 text-center border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
              <HelpCircle className="mx-auto h-10 w-10 text-gray-400 mb-2" />
              <h3 className="text-sm font-medium text-gray-900">No quizzes found for this classroom</h3>
              <p className="mt-1 text-sm text-gray-500">Create a password-protected or public quiz for your students.</p>
            </div>
          )}
        </div>
      )}

      {/* ASSIGNMENT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">
                {editingAssignment ? 'Edit Assignment' : 'Create New Assignment'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAssignment} className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
                  <input required type="text" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary-500" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Subject</label>
                  <input required type="text" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary-500" value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                  <textarea className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary-500 resize-none" rows="3" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}></textarea>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Deadline / Due Date</label>
                  <input required type="datetime-local" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary-500 font-medium" value={formData.deadline} onChange={e => setFormData({ ...formData, deadline: e.target.value })} />
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-5 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-xl hover:bg-primary-700">
                  {editingAssignment ? 'Save & Extend' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUIZ BUILDER MODAL */}
      {showQuizModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-extrabold text-gray-900 flex items-center">
                  <HelpCircle className="h-6 w-6 text-purple-600 mr-2" />
                  Create New MCQ Quiz
                </h3>
                <p className="text-xs text-gray-500">Build multiple-choice questions with optional password protection.</p>
              </div>
              <button onClick={() => setShowQuizModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmitQuiz} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Basic Meta */}
              <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Quiz Title</label>
                    <input required type="text" placeholder="e.g. Midterm Physics Quiz" className="w-full border border-gray-300 rounded-xl px-4 py-2 bg-white" value={quizFormData.title} onChange={e => setQuizFormData({ ...quizFormData, title: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Subject</label>
                    <input required type="text" placeholder="e.g. Physics" className="w-full border border-gray-300 rounded-xl px-4 py-2 bg-white" value={quizFormData.subject} onChange={e => setQuizFormData({ ...quizFormData, subject: e.target.value })} />
                  </div>
                </div>

                {/* 2 equal size sections in a single row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Start Date & Time</label>
                    <input required type="datetime-local" className="w-full border border-gray-300 rounded-xl px-3 py-2 bg-white font-medium text-sm" value={quizFormData.startTime} onChange={e => setQuizFormData({ ...quizFormData, startTime: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">End Date & Time</label>
                    <input required type="datetime-local" className="w-full border border-gray-300 rounded-xl px-3 py-2 bg-white font-medium text-sm" value={quizFormData.endTime} onChange={e => setQuizFormData({ ...quizFormData, endTime: e.target.value })} />
                  </div>
                </div>
              </div>

              {/* Password Protection Toggle */}
              <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  {quizFormData.isPasswordProtected ? <Lock className="h-6 w-6 text-purple-700" /> : <Unlock className="h-6 w-6 text-gray-400" />}
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">Require Password to Attempt Quiz</h4>
                    <p className="text-xs text-gray-500">Students must enter this passcode before opening questions.</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="passToggle"
                    className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                    checked={quizFormData.isPasswordProtected}
                    onChange={e => setQuizFormData({ ...quizFormData, isPasswordProtected: e.target.checked })}
                  />
                  <label htmlFor="passToggle" className="text-sm font-bold text-gray-700 cursor-pointer">Enable Password</label>
                </div>

                {quizFormData.isPasswordProtected && (
                  <div className="w-full md:w-48">
                    <input
                      required
                      type="text"
                      placeholder="Passcode (e.g. quiz123)"
                      className="w-full border border-purple-300 rounded-xl px-3 py-1.5 text-sm font-mono font-bold bg-white text-purple-900 focus:ring-purple-500"
                      value={quizFormData.password}
                      onChange={e => setQuizFormData({ ...quizFormData, password: e.target.value })}
                    />
                  </div>
                )}
              </div>

              {/* Question Builder */}
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h4 className="text-lg font-bold text-gray-900">Questions ({quizFormData.questions.length})</h4>
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-bold text-purple-700 bg-purple-100 hover:bg-purple-200 rounded-lg transition"
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add Question
                  </button>
                </div>

                {quizFormData.questions.map((q, qIndex) => (
                  <div key={qIndex} className="p-5 border border-gray-200 rounded-xl bg-white space-y-4 shadow-sm relative">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                      <span className="font-extrabold text-sm text-purple-900 bg-purple-100 px-3 py-1 rounded-full">
                        Question #{qIndex + 1}
                      </span>
                      {quizFormData.questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(qIndex)}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Remove Question"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Question Statement</label>
                      <input
                        required
                        type="text"
                        placeholder="Enter the question here..."
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        value={q.questionText}
                        onChange={e => handleQuestionChange(qIndex, 'questionText', e.target.value)}
                      />
                    </div>

                    {/* Options (4 MCQs) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {q.options.map((opt, optIndex) => (
                        <div key={optIndex} className={`flex items-center p-2 rounded-lg border ${q.correctOptionIndex === optIndex ? 'border-emerald-500 bg-emerald-50/40' : 'border-gray-200'}`}>
                          <input
                            type="radio"
                            name={`correct_${qIndex}`}
                            checked={q.correctOptionIndex === optIndex}
                            onChange={() => handleQuestionChange(qIndex, 'correctOptionIndex', optIndex)}
                            className="mr-2 h-4 w-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                          <span className="font-bold text-xs text-gray-500 mr-2">{String.fromCharCode(65 + optIndex)}.</span>
                          <input
                            required
                            type="text"
                            placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                            className="w-full border border-gray-200 rounded px-2.5 py-1 text-sm bg-white"
                            value={opt}
                            onChange={e => handleOptionChange(qIndex, optIndex, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>

                    <p className="text-xs text-emerald-700 font-medium flex items-center">
                      ✓ Radio button indicates the correct answer key.
                    </p>
                  </div>
                ))}
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-gray-200 flex justify-end gap-3">
                <button type="button" onClick={() => setShowQuizModal(false)} className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-6 py-2.5 text-sm font-bold text-white bg-purple-600 rounded-xl hover:bg-purple-700 shadow-md shadow-purple-500/30">
                  Save & Publish Quiz
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
