import { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { 
  PlusCircle, FileText, Calendar, ArrowLeft, Trash, Edit3, 
  HelpCircle, Lock, Unlock, BarChart2, Plus, X, Users, UserPlus, 
  Check, XCircle, Mail, Hash, BookOpen, Layers, Search,
  UploadCloud, Download, File, FolderPlus, Eye, Clock
} from 'lucide-react';

const ClassroomView = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [assignments, setAssignments] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [classroom, setClassroom] = useState(null);
  const [loading, setLoading] = useState(true);

  // Default subject from teacher profile or classroom name
  const defaultSubject = user?.subject || classroom?.name || '';

  // Navigation Tabs: 'assignments' | 'quizzes' | 'materials' | 'students' | 'pending'
  const [activeContentType, setActiveContentType] = useState('assignments');
  const [studentSearch, setStudentSearch] = useState('');

  // Material State
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [materialUploading, setMaterialUploading] = useState(false);
  const [materialFormData, setMaterialFormData] = useState({
    title: '',
    subject: defaultSubject,
    description: ''
  });
  const [materialFile, setMaterialFile] = useState(null);
  const [materialSubjectFilter, setMaterialSubjectFilter] = useState('All');
  const [materialSearch, setMaterialSearch] = useState('');

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
      setMaterialFormData(prev => ({ ...prev, subject: prev.subject || defaultSubject }));
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

      try {
        const matRes = await api.get(`/materials/classroom/${id}`);
        setMaterials(matRes.data || []);
      } catch (e) {
        console.error('Error fetching materials:', e);
      }
    } catch (err) {
      toast.error('Failed to load classroom details');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileBadge = (fileType) => {
    const type = (fileType || '').toLowerCase();
    if (type === 'pdf') {
      return { bg: 'bg-rose-50 text-rose-700 border-rose-200', label: 'PDF' };
    }
    if (['doc', 'docx'].includes(type)) {
      return { bg: 'bg-blue-50 text-blue-700 border-blue-200', label: 'DOCX' };
    }
    if (['ppt', 'pptx'].includes(type)) {
      return { bg: 'bg-amber-50 text-amber-700 border-amber-200', label: 'SLIDES' };
    }
    if (type === 'txt') {
      return { bg: 'bg-gray-50 text-gray-700 border-gray-200', label: 'TEXT' };
    }
    if (type === 'image') {
      return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'IMAGE' };
    }
    return { bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', label: 'FILE' };
  };

  const handleOpenUploadMaterial = () => {
    setMaterialFormData({
      title: '',
      subject: defaultSubject,
      description: ''
    });
    setMaterialFile(null);
    setShowMaterialModal(true);
  };

  const handleUploadMaterialSubmit = async (e) => {
    e.preventDefault();
    if (!materialFormData.title.trim() || !materialFormData.subject.trim()) {
      toast.error('Title and Subject are required');
      return;
    }
    if (!materialFile) {
      toast.error('Please select a file to upload');
      return;
    }

    setMaterialUploading(true);
    const data = new FormData();
    data.append('title', materialFormData.title.trim());
    data.append('subject', materialFormData.subject.trim());
    data.append('description', materialFormData.description.trim());
    data.append('classroomId', id);
    data.append('file', materialFile);

    try {
      const res = await api.post('/materials', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Study material uploaded successfully!');
      setMaterials(prev => [res.data, ...prev]);
      setShowMaterialModal(false);
      setMaterialFile(null);
      setMaterialFormData({ title: '', subject: defaultSubject, description: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload material');
    } finally {
      setMaterialUploading(false);
    }
  };

  const handleDeleteMaterial = async (materialId) => {
    if (window.confirm('Are you sure you want to delete this study material? Students will no longer have access to it.')) {
      try {
        await api.delete(`/materials/${materialId}`);
        toast.success('Study material deleted');
        setMaterials(prev => prev.filter(m => m._id !== materialId));
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to delete material');
      }
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
      subject: defaultSubject,
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
      subject: assignment.subject || defaultSubject,
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
      setFormData({ title: '', subject: defaultSubject, description: '', deadline: '' });
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

  const handleApproveStudent = async (studentId) => {
    try {
      await api.post(`/classrooms/${id}/approve/${studentId}`);
      toast.success('Student approved');
      fetchClassroomAndData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve student');
    }
  };

  const handleRejectStudent = async (studentId) => {
    if (window.confirm('Are you sure you want to reject this request?')) {
      try {
        await api.post(`/classrooms/${id}/reject/${studentId}`);
        toast.success('Student rejected');
        fetchClassroomAndData();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to reject student');
      }
    }
  };

  // Quiz Handlers & Builder
  const handleOpenCreateQuiz = () => {
    const nowStr = new Date(Date.now() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
    setQuizFormData({
      title: '',
      subject: defaultSubject,
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

  const filteredStudents = (classroom?.students || []).filter(student => {
    const q = studentSearch.toLowerCase();
    return (
      (student.fullName && student.fullName.toLowerCase().includes(q)) ||
      (student.email && student.email.toLowerCase().includes(q)) ||
      (student.rollNo && student.rollNo.toLowerCase().includes(q)) ||
      (student.division && student.division.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 mb-8 md:flex md:items-center md:justify-between relative overflow-hidden">
        <div className="flex-1 min-w-0 relative z-10 flex items-center">
          <Link to="/teacher" className="mr-4 p-2.5 bg-gray-100 hover:bg-gray-200 rounded-2xl transition">
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </Link>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              {classroom?.name || 'Classroom'}
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-gray-500 font-medium flex items-center flex-wrap gap-2">
              <span>Invite Code:</span>
              <span className="font-mono font-bold text-primary-700 bg-primary-50 border border-primary-200 px-2.5 py-0.5 rounded-lg">
                {classroom?.inviteCode || 'N/A'}
              </span>
              <span className="text-gray-300">•</span>
              <span>{classroom?.students?.length || 0} Enrolled Students</span>
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3 md:mt-0 md:ml-4 relative z-10">
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center px-4 py-2.5 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 shadow-primary-500/20 transition-all focus:outline-none"
          >
            <PlusCircle className="-ml-1 mr-2 h-4 w-4" />
            New Assignment
          </button>
          <button
            onClick={handleOpenCreateQuiz}
            className="inline-flex items-center px-4 py-2.5 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-purple-500/20 transition-all focus:outline-none"
          >
            <HelpCircle className="-ml-1 mr-2 h-4 w-4" />
            New Quiz
          </button>
          <button
            onClick={handleOpenUploadMaterial}
            className="inline-flex items-center px-4 py-2.5 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-amber-500/20 transition-all focus:outline-none"
          >
            <FolderPlus className="-ml-1 mr-2 h-4 w-4" />
            Upload Material
          </button>
        </div>
      </div>

      {/* Main Grid with Sidebar + Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* SIDEBAR NAVIGATION */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 sticky top-6 space-y-1">
            <button
              onClick={() => setActiveContentType('assignments')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                activeContentType === 'assignments'
                  ? 'bg-primary-50 text-primary-700 border border-primary-200/60 shadow-xs'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center">
                <FileText className={`h-4 w-4 mr-3 ${activeContentType === 'assignments' ? 'text-primary-600' : 'text-gray-400'}`} />
                <span>Assignments</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                activeContentType === 'assignments' ? 'bg-primary-200/70 text-primary-800' : 'bg-gray-100 text-gray-600'
              }`}>
                {assignments.length}
              </span>
            </button>

            <button
              onClick={() => setActiveContentType('quizzes')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                activeContentType === 'quizzes'
                  ? 'bg-purple-50 text-purple-700 border border-purple-200/60 shadow-xs'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center">
                <HelpCircle className={`h-4 w-4 mr-3 ${activeContentType === 'quizzes' ? 'text-purple-600' : 'text-gray-400'}`} />
                <span>Quizzes</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                activeContentType === 'quizzes' ? 'bg-purple-200/70 text-purple-800' : 'bg-gray-100 text-gray-600'
              }`}>
                {quizzes.length}
              </span>
            </button>

            <button
              onClick={() => setActiveContentType('materials')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                activeContentType === 'materials'
                  ? 'bg-amber-50 text-amber-700 border border-amber-200/60 shadow-xs'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center">
                <BookOpen className={`h-4 w-4 mr-3 ${activeContentType === 'materials' ? 'text-amber-600' : 'text-gray-400'}`} />
                <span>Study Material</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                activeContentType === 'materials' ? 'bg-amber-200/70 text-amber-800' : 'bg-gray-100 text-gray-600'
              }`}>
                {materials.length}
              </span>
            </button>

            <button
              onClick={() => setActiveContentType('students')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                activeContentType === 'students'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-xs'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center">
                <Users className={`h-4 w-4 mr-3 ${activeContentType === 'students' ? 'text-emerald-600' : 'text-gray-400'}`} />
                <span>Students</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                activeContentType === 'students' ? 'bg-emerald-200/70 text-emerald-800' : 'bg-gray-100 text-gray-600'
              }`}>
                {classroom?.students?.length || 0}
              </span>
            </button>

            <button
              onClick={() => setActiveContentType('pending')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                activeContentType === 'pending'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200/60 shadow-xs'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center">
                <UserPlus className={`h-4 w-4 mr-3 ${activeContentType === 'pending' ? 'text-blue-600' : 'text-gray-400'}`} />
                <span>Join Requests</span>
              </div>
              {(classroom?.pendingStudents?.length || 0) > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-blue-500 text-white animate-pulse">
                  {classroom.pendingStudents.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* MAIN VIEW CONTENT AREA */}
        <div className="lg:col-span-3">

      {/* ASSIGNMENTS VIEW */}
      {activeContentType === 'assignments' && (
        <div className="grid gap-6 md:grid-cols-2">
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

      {/* STUDY MATERIAL & NOTES VIEW */}
      {activeContentType === 'materials' && (() => {
        const materialSubjects = ['All', ...new Set(materials.map(m => m.subject).filter(Boolean))];
        const filteredMaterials = materials.filter(m => {
          const matchesSubject = materialSubjectFilter === 'All' || m.subject.toLowerCase() === materialSubjectFilter.toLowerCase();
          const q = materialSearch.toLowerCase();
          const matchesSearch = !q || 
            (m.title && m.title.toLowerCase().includes(q)) || 
            (m.description && m.description.toLowerCase().includes(q)) || 
            (m.fileName && m.fileName.toLowerCase().includes(q)) ||
            (m.subject && m.subject.toLowerCase().includes(q));
          return matchesSubject && matchesSearch;
        });

        return (
          <div className="space-y-6">
            {/* Filter and Search Bar */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              {/* Subject Pills */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400 mr-1">Subject:</span>
                {materialSubjects.map(sub => (
                  <button
                    key={sub}
                    onClick={() => setMaterialSubjectFilter(sub)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      materialSubjectFilter.toLowerCase() === sub.toLowerCase()
                        ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/30'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>

              {/* Search & Upload CTA */}
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-60">
                  <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search notes, documents..."
                    value={materialSearch}
                    onChange={e => setMaterialSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none bg-gray-50/50"
                  />
                </div>
                <button
                  onClick={handleOpenUploadMaterial}
                  className="inline-flex items-center px-3.5 py-2 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors whitespace-nowrap"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add
                </button>
              </div>
            </div>

            {/* Materials Grid */}
            {filteredMaterials.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2">
                {filteredMaterials.map(mat => {
                  const badge = getFileBadge(mat.fileType);
                  return (
                    <div
                      key={mat._id}
                      className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all flex flex-col justify-between group"
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-100">
                              {mat.subject}
                            </span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold border ${badge.bg}`}>
                              {badge.label}
                            </span>
                          </div>

                          <button
                            onClick={() => handleDeleteMaterial(mat._id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            title="Delete Study Material"
                          >
                            <Trash className="h-4 w-4" />
                          </button>
                        </div>

                        <h3 className="text-lg font-bold text-gray-900 line-clamp-1 mb-1.5" title={mat.title}>
                          {mat.title}
                        </h3>

                        {mat.description && (
                          <p className="text-xs text-gray-500 line-clamp-2 mb-4 leading-relaxed">
                            {mat.description}
                          </p>
                        )}

                        {/* File details */}
                        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex items-center justify-between text-xs text-gray-600 mb-2">
                          <div className="flex items-center min-w-0 pr-2">
                            <File className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                            <span className="truncate font-medium text-gray-700">{mat.fileName}</span>
                          </div>
                          <span className="font-mono text-[11px] text-gray-400 flex-shrink-0 font-semibold">
                            {formatFileSize(mat.fileSize)}
                          </span>
                        </div>

                        <div className="flex items-center text-[11px] text-gray-400 mt-2">
                          <Clock className="h-3.5 w-3.5 mr-1" />
                          <span>Uploaded {new Date(mat.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                      </div>

                      {/* Action footer */}
                      <div className="p-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between gap-3">
                        <a
                          href={mat.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full flex items-center justify-center px-4 py-2 bg-white hover:bg-amber-500 hover:text-white border border-gray-200 hover:border-amber-500 rounded-xl text-xs font-bold text-gray-700 shadow-xs transition-all"
                        >
                          <Download className="h-3.5 w-3.5 mr-1.5" />
                          View / Download Document
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-14 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-white p-8">
                <BookOpen className="mx-auto h-12 w-12 text-amber-300 mb-3" />
                <h3 className="text-base font-bold text-gray-900">No study materials found</h3>
                <p className="mt-1 text-xs text-gray-500 max-w-sm mx-auto">
                  {materialSubjectFilter !== 'All' || materialSearch
                    ? 'No notes match your filter or search criteria.'
                    : 'Upload syllabus notes, documents, lecture slides, or references for your students.'}
                </p>
                <button
                  onClick={handleOpenUploadMaterial}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-sm"
                >
                  <FolderPlus className="h-3.5 w-3.5 mr-1.5" /> Upload Material
                </button>
              </div>
            )}
          </div>
        );
      })()}

      {/* STUDENTS ROSTER VIEW */}
      {activeContentType === 'students' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Top Bar with Search & Total */}
          <div className="p-5 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Enrolled Students</h3>
              <p className="text-xs text-gray-500">All students currently admitted to this classroom.</p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by name, roll no, email..."
                value={studentSearch}
                onChange={e => setStudentSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50/50"
              />
            </div>
          </div>

          {/* Students Table */}
          {filteredStudents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50/60">
                  <tr>
                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Roll No
                    </th>
                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Student Name
                    </th>
                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Email Address
                    </th>
                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Division
                    </th>
                    <th scope="col" className="px-6 py-3.5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100 text-sm">
                  {filteredStudents.map((student, idx) => (
                    <tr key={student._id || idx} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-xs font-bold px-2.5 py-1 bg-gray-100 text-gray-800 rounded-lg">
                          {student.rollNo || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center font-bold text-xs shadow-xs mr-3">
                            {student.fullName ? student.fullName.slice(0, 2).toUpperCase() : 'ST'}
                          </div>
                          <span className="font-bold text-gray-900">{student.fullName || 'Unnamed Student'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        <div className="flex items-center text-xs">
                          <Mail className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                          <span>{student.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-700">
                          {student.division || classroom?.division || 'A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Admitted
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 px-4">
              <Users className="mx-auto h-12 w-12 text-gray-300 mb-3" />
              <h4 className="text-sm font-bold text-gray-800">
                {studentSearch ? 'No matching students found' : 'No students enrolled yet'}
              </h4>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                {studentSearch 
                  ? 'Try searching with a different name, roll number, or email.' 
                  : `Share the classroom code (${classroom?.inviteCode}) with your students to admit them.`}
              </p>
            </div>
          )}
        </div>
      )}

      {/* PENDING REQUESTS VIEW */}
      {activeContentType === 'pending' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">Pending Join Requests</h3>
            <p className="text-xs text-gray-500">Admit or reject student requests to join this classroom.</p>
          </div>

          <div className="p-6">
            {classroom?.pendingStudents?.length > 0 ? (
              <div className="space-y-3">
                {classroom.pendingStudents.map(student => (
                  <div key={student._id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50/80 transition">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                        {student.fullName ? student.fullName.slice(0, 2).toUpperCase() : 'RQ'}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">{student.fullName}</h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Roll: <span className="font-semibold text-gray-700">{student.rollNo || 'N/A'}</span> &bull; 
                          Div: <span className="font-semibold text-gray-700">{student.division || 'N/A'}</span> &bull; 
                          Email: <span className="font-semibold text-gray-700">{student.email}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleApproveStudent(student._id)} 
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
                      >
                        <Check className="h-4 w-4" />
                        <span>Admit</span>
                      </button>
                      <button 
                        onClick={() => handleRejectStudent(student._id)} 
                        className="px-3.5 py-1.5 bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                      >
                        <XCircle className="h-4 w-4" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <UserPlus className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <h4 className="text-sm font-bold text-gray-800">No pending join requests</h4>
                <p className="text-xs text-gray-500 mt-1">When students use your invite code, their requests will appear here.</p>
              </div>
            )}
          </div>
        </div>
      )}

        </div> {/* End lg:col-span-3 */}
      </div> {/* End main grid */}

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

      {/* UPLOAD STUDY MATERIAL MODAL */}
      {showMaterialModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-2xl">
                  <FolderPlus className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Upload Study Material</h3>
                  <p className="text-xs text-gray-500">Share lecture notes, PDFs, or slides with students</p>
                </div>
              </div>
              <button
                onClick={() => setShowMaterialModal(false)}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUploadMaterialSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Material Title *
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g., Chapter 1 - CPU Scheduling Algorithms"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  value={materialFormData.title}
                  onChange={e => setMaterialFormData({ ...materialFormData, title: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Subject *
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g., Operating Systems"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  value={materialFormData.subject}
                  onChange={e => setMaterialFormData({ ...materialFormData, subject: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Description / Topic Notes (Optional)
                </label>
                <textarea
                  rows="3"
                  placeholder="Brief overview of the material, recommended reading, or chapter sections..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  value={materialFormData.description}
                  onChange={e => setMaterialFormData({ ...materialFormData, description: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Select Document / Notes File *
                </label>
                <div className="border-2 border-dashed border-gray-200 hover:border-amber-400 rounded-2xl p-6 text-center transition-colors bg-gray-50/50">
                  <input
                    type="file"
                    id="material-file-upload"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,image/*"
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        setMaterialFile(e.target.files[0]);
                      }
                    }}
                  />
                  <label htmlFor="material-file-upload" className="cursor-pointer flex flex-col items-center">
                    <UploadCloud className="h-10 w-10 text-amber-500 mb-2" />
                    {materialFile ? (
                      <div className="text-center">
                        <span className="text-xs font-bold text-gray-900 block truncate max-w-xs">{materialFile.name}</span>
                        <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 inline-block">
                          {(materialFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to upload
                        </span>
                      </div>
                    ) : (
                      <div>
                        <span className="text-xs font-bold text-amber-600 hover:underline">Click to browse file</span>
                        <p className="text-[11px] text-gray-400 mt-1">PDF, Word (DOCX), PPT slides, TXT, or images up to 25MB</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowMaterialModal(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={materialUploading}
                  className="inline-flex items-center px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-md shadow-amber-500/20 disabled:opacity-50 transition-all"
                >
                  {materialUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white mr-2"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <FolderPlus className="h-4 w-4 mr-1.5" />
                      Publish Material
                    </>
                  )}
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
