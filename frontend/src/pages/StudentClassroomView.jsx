import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import StatusBadge from '../components/StatusBadge';
import SimilarityMeter from '../components/SimilarityMeter';
import { Calendar, Clock, FileText, Upload, ArrowLeft, HelpCircle, Lock, Unlock, CheckCircle, Key, X, BookOpen, Download, File, Search, FolderOpen } from 'lucide-react';
import { toast } from 'react-toastify';
import { io } from 'socket.io-client';

const StudentClassroomView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [quizSubmissions, setQuizSubmissions] = useState([]);
  const [classroom, setClassroom] = useState(null);
  const [loading, setLoading] = useState(true);

  // Tab State: 'assignments' | 'quizzes' | 'materials'
  const [activeTab, setActiveTab] = useState('assignments');

  // Study Material Filter State
  const [materialSubjectFilter, setMaterialSubjectFilter] = useState('All');
  const [materialSearch, setMaterialSearch] = useState('');

  // Password Modal State
  const [selectedQuizForPass, setSelectedQuizForPass] = useState(null);
  const [inputPassword, setInputPassword] = useState('');
  const [verifying, setVerifying] = useState(false);

  const fetchData = async () => {
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

      try {
        const subRes = await api.get('/submissions/student');
        setSubmissions(subRes.data || []);
      } catch (e) {
        console.error('Error fetching submissions:', e);
      }

      try {
        const quizSubRes = await api.get(`/quizzes/student/submissions/${id}`);
        setQuizSubmissions(quizSubRes.data || []);
      } catch (e) {
        console.error('Error fetching quiz submissions:', e);
      }
    } catch (err) {
      toast.error('Failed to load classroom details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Setup Socket.IO for real-time updates
    const backendUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000';
    const socket = io(backendUrl, { withCredentials: true });

    socket.on('connect', () => {
      socket.emit('join_classroom', id);
    });

    socket.on('assignment_deleted', (deletedId) => {
      setAssignments(prev => prev.filter(a => a._id !== deletedId));
      toast.info('An assignment was removed by your teacher.', { position: "bottom-right", autoClose: 5000 });
    });

    socket.on('quiz_created', () => {
      fetchData();
      toast.info('A new quiz has been posted in this classroom!', { position: "bottom-right", autoClose: 5000 });
    });

    socket.on('quiz_deleted', (deletedQuizId) => {
      setQuizzes(prev => prev.filter(q => q._id !== deletedQuizId));
    });

    socket.on('material_uploaded', (newMat) => {
      setMaterials(prev => {
        const exists = prev.some(m => m._id === newMat._id);
        if (exists) return prev;
        return [newMat, ...prev];
      });
      toast.info(`📚 New study material posted for ${newMat.subject}: "${newMat.title}"`, {
        position: "bottom-right",
        autoClose: 6000
      });
    });

    socket.on('material_deleted', (deletedId) => {
      setMaterials(prev => prev.filter(m => m._id !== deletedId));
    });

    return () => socket.disconnect();
  }, [id]);

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

  const getSubmissionForAssignment = (assignId) => {
    return submissions.find(s => s.assignmentId?._id === assignId || s.assignmentId === assignId);
  };

  const getQuizSubmission = (quizId) => {
    return quizSubmissions.find(qs => (qs.quizId?._id || qs.quizId) === quizId);
  };

  const getTimeRemaining = (deadline) => {
    const total = Date.parse(deadline) - Date.parse(new Date());
    if (total <= 0) return "Deadline passed";
    const days = Math.floor((total / (1000 * 60 * 60 * 24)));
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    if(days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  const handleAttemptQuizClick = (quiz) => {
    if (quiz.isPasswordProtected) {
      setSelectedQuizForPass(quiz);
      setInputPassword('');
    } else {
      navigate(`/student/quiz/${quiz._id}`);
    }
  };

  const handleVerifyPassword = async (e) => {
    e.preventDefault();
    if (!inputPassword.trim()) {
      toast.error('Please enter the quiz password');
      return;
    }
    setVerifying(true);
    try {
      const res = await api.post(`/quizzes/${selectedQuizForPass._id}/verify-password`, {
        password: inputPassword.trim()
      });
      if (res.data.success) {
        toast.success('Password verified! Opening quiz...');
        const passQuery = encodeURIComponent(inputPassword.trim());
        setSelectedQuizForPass(null);
        navigate(`/student/quiz/${selectedQuizForPass._id}?pass=${passQuery}`);
      } else {
        toast.error('Incorrect password. Please try again.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Incorrect password.');
    } finally {
      setVerifying(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  const completedAssignments = assignments.filter(a => getSubmissionForAssignment(a._id)).length;
  const completedQuizzes = quizzes.filter(q => getQuizSubmission(q._id)).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-8 shadow-xl shadow-indigo-500/20 mb-8 relative overflow-hidden text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -mt-20 -mr-20 pointer-events-none"></div>
        <div className="flex items-center relative z-10">
          <Link to="/student" className="mr-5 p-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full transition-all backdrop-blur-sm shadow-sm group">
            <ArrowLeft className="h-5 w-5 text-white group-hover:-translate-x-1 transition-transform" />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="h-5 w-5 text-indigo-200" />
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-100 bg-black/20 px-2 py-0.5 rounded-md backdrop-blur-sm border border-white/10">
                Classroom View
              </span>
            </div>
            <h2 className="text-3xl font-bold leading-tight sm:text-4xl sm:truncate">
              {classroom?.name || 'Loading Classroom...'}
            </h2>
            <p className="mt-1 text-base text-indigo-100 font-medium opacity-90">
              {classroom?.teacherId?.fullName ? `Instructor: ${classroom.teacherId.fullName}` : ''}
            </p>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex gap-6 relative z-10 self-start md:self-auto">
          <div className="text-center">
            <div className="text-2xl font-bold">{completedAssignments}/{assignments.length}</div>
            <div className="text-xs font-bold text-indigo-200 uppercase tracking-wide">Tasks Done</div>
          </div>
          <div className="w-px bg-white/20"></div>
          <div className="text-center">
            <div className="text-2xl font-bold">{completedQuizzes}/{quizzes.length}</div>
            <div className="text-xs font-bold text-indigo-200 uppercase tracking-wide">Quizzes Done</div>
          </div>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex flex-wrap bg-white p-1.5 rounded-2xl border border-gray-200 shadow-sm w-max mb-8 gap-1.5">
        <button
          onClick={() => setActiveTab('assignments')}
          className={`flex items-center px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'assignments'
              ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-xs'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <FileText className={`h-4 w-4 mr-2 ${activeTab === 'assignments' ? 'text-indigo-600' : 'text-gray-400'}`} />
          Assignments
          <span className={`ml-2 py-0.5 px-2 rounded-full text-xs font-bold ${activeTab === 'assignments' ? 'bg-indigo-200/60 text-indigo-800' : 'bg-gray-100 text-gray-600'}`}>{assignments.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('quizzes')}
          className={`flex items-center px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'quizzes'
              ? 'bg-purple-50 text-purple-700 border border-purple-100 shadow-xs'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <HelpCircle className={`h-4 w-4 mr-2 ${activeTab === 'quizzes' ? 'text-purple-600' : 'text-gray-400'}`} />
          Quizzes
          <span className={`ml-2 py-0.5 px-2 rounded-full text-xs font-bold ${activeTab === 'quizzes' ? 'bg-purple-200/60 text-purple-800' : 'bg-gray-100 text-gray-600'}`}>{quizzes.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('materials')}
          className={`flex items-center px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'materials'
              ? 'bg-amber-50 text-amber-700 border border-amber-100 shadow-xs'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <BookOpen className={`h-4 w-4 mr-2 ${activeTab === 'materials' ? 'text-amber-600' : 'text-gray-400'}`} />
          Notes & Materials
          <span className={`ml-2 py-0.5 px-2 rounded-full text-xs font-bold ${activeTab === 'materials' ? 'bg-amber-200/60 text-amber-800' : 'bg-gray-100 text-gray-600'}`}>{materials.length}</span>
        </button>
      </div>

      {/* ASSIGNMENTS LIST */}
      {activeTab === 'assignments' && (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {assignments.map(assignment => {
            const submission = getSubmissionForAssignment(assignment._id);
            const isPassed = new Date(assignment.deadline) < new Date();
            
            // Dynamic styling based on status
            let borderClass = "border-gray-200 hover:border-indigo-300";
            let bgClass = "bg-white";
            if (submission) {
              borderClass = "border-emerald-200 bg-emerald-50/30";
            } else if (isPassed) {
              borderClass = "border-red-200 bg-red-50/30";
            }

            return (
              <div key={assignment._id} className={`${bgClass} rounded-2xl shadow-sm border ${borderClass} overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col justify-between group`}>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-600 border border-indigo-100">
                      {assignment.subject}
                    </span>
                    {submission && <StatusBadge status={submission.status} />}
                    {isPassed && !submission && <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">MISSED</span>}
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2 mb-4" title={assignment.title}>
                    {assignment.title}
                  </h3>

                  <div className="space-y-2 mb-2">
                    <div className="flex items-center text-sm font-medium text-gray-600">
                      <Calendar className="flex-shrink-0 mr-2 h-4 w-4 text-gray-400" />
                      Due: {new Date(assignment.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                    {!isPassed && !submission && (
                      <div className="flex items-center text-sm font-bold text-orange-600 bg-orange-50 px-2.5 py-1.5 rounded-lg w-max border border-orange-100">
                        <Clock className="flex-shrink-0 mr-2 h-4 w-4 text-orange-500" />
                        {getTimeRemaining(assignment.deadline)} left
                      </div>
                    )}
                  </div>

                  {submission ? (
                    <div className="mt-6 pt-5 border-t border-gray-100 space-y-4">
                      <SimilarityMeter score={submission.similarityScore} label="Similarity" />
                      {submission.aiScore > 0 && (
                        <SimilarityMeter score={submission.aiScore} label="AI Content" />
                      )}
                      {submission.grade && (
                        <div className="flex justify-between items-center bg-white border border-gray-200 shadow-sm p-3 rounded-xl mt-2">
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Grade</span>
                          <span className="text-lg font-bold text-emerald-600">{submission.grade}</span>
                        </div>
                      )}
                      <Link
                        to={`/submission-result/${submission._id}`}
                        className="w-full flex justify-center items-center px-4 py-2.5 border border-gray-200 shadow-sm text-sm font-bold rounded-xl text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-95"
                      >
                        <FileText className="mr-2 h-4 w-4 text-gray-400" /> View Details
                      </Link>
                    </div>
                  ) : (
                    <div className="mt-6 pt-5 border-t border-gray-100">
                      {isPassed ? (
                        <button disabled className="w-full flex justify-center items-center px-4 py-3 border border-transparent text-sm font-bold rounded-xl text-red-500 bg-red-50 cursor-not-allowed">
                          Deadline Passed
                        </button>
                      ) : (
                        <Link
                          to={`/submit/${assignment._id}`}
                          className="w-full flex justify-center items-center px-4 py-3 border border-transparent text-sm font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-0.5 active:scale-95 group-hover:shadow-indigo-500/40"
                        >
                          <Upload className="mr-2 h-5 w-5" /> Submit Now
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {assignments.length === 0 && (
            <div className="col-span-full py-16 text-center bg-white rounded-3xl border-2 border-dashed border-gray-200">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 text-gray-400 mb-4">
                <FileText className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">No assignments yet</h3>
              <p className="text-gray-500">Your instructor hasn't posted any assignments here.</p>
            </div>
          )}
        </div>
      )}

      {/* QUIZZES LIST */}
      {activeTab === 'quizzes' && (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {quizzes.map(quiz => {
            const quizSub = getQuizSubmission(quiz._id);
            const now = new Date();
            const quizEndTime = quiz.endTime || quiz.deadline;
            const hasStarted = !quiz.startTime || new Date(quiz.startTime) <= now;
            const hasEnded = quizEndTime && new Date(quizEndTime) < now;

            return (
              <div key={quiz._id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col justify-between group hover:border-purple-300">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-100">
                      {quiz.subject}
                    </span>
                    {quiz.isPasswordProtected ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide bg-amber-50 text-amber-700 border border-amber-200">
                        <Lock className="w-3 h-3 mr-1" /> PROTECTED
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <Unlock className="w-3 h-3 mr-1" /> PUBLIC
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-purple-700 transition-colors line-clamp-2 mb-2" title={quiz.title}>{quiz.title}</h3>
                  <p className="text-sm font-medium text-gray-500 line-clamp-2 mb-4">
                    <span className="font-bold text-gray-700">{quiz.questions?.length || 0} Questions</span> &bull; {quiz.description || 'No description provided.'}
                  </p>

                  <div className="bg-gray-50 rounded-xl p-3 space-y-2 border border-gray-100 mb-2">
                    <div className="flex items-center text-xs font-semibold text-gray-600">
                      <Calendar className="flex-shrink-0 mr-2 h-4 w-4 text-purple-500" />
                      <span className="text-gray-400 w-12">Starts:</span> {quiz.startTime ? new Date(quiz.startTime).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : 'Immediate'}
                    </div>
                    <div className={`flex items-center text-xs font-semibold ${hasEnded ? 'text-red-600' : 'text-gray-600'}`}>
                      <Calendar className={`flex-shrink-0 mr-2 h-4 w-4 ${hasEnded ? 'text-red-500' : 'text-gray-400'}`} />
                      <span className={`${hasEnded ? 'text-red-400' : 'text-gray-400'} w-12`}>Ends:</span> {new Date(quizEndTime).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                    </div>
                  </div>

                  {/* Submission Status or Attempt Action */}
                  <div className="mt-6 pt-5 border-t border-gray-100">
                    {quizSub ? (
                      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-100">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-purple-800 flex items-center">
                            <CheckCircle className="w-4 h-4 text-emerald-500 mr-1.5" /> Completed
                          </span>
                          <span className="text-sm font-bold text-purple-700 bg-white px-2 py-0.5 rounded shadow-sm">
                            {quizSub.score} / {quizSub.totalScore} ({quizSub.percentage}%)
                          </span>
                        </div>
                        <Link
                          to={`/student/quiz/${quiz._id}`}
                          className="mt-3 w-full text-center block py-2 bg-white rounded-lg border border-purple-200 text-xs font-bold text-purple-700 hover:bg-purple-100 transition-colors shadow-sm"
                        >
                          Review Answers &rarr;
                        </Link>
                      </div>
                    ) : !hasStarted ? (
                      <button disabled className="w-full flex justify-center items-center px-4 py-3 text-sm font-bold rounded-xl text-amber-800 bg-amber-50 border border-amber-200 cursor-not-allowed">
                        <Clock className="w-4 h-4 mr-2 text-amber-500" />
                        Starts at {new Date(quiz.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </button>
                    ) : hasEnded ? (
                      <button disabled className="w-full flex justify-center items-center px-4 py-3 text-sm font-bold rounded-xl text-gray-500 bg-gray-100 border border-gray-200 cursor-not-allowed">
                        Quiz Closed
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAttemptQuizClick(quiz)}
                        className="w-full flex justify-center items-center px-4 py-3 border border-transparent text-sm font-bold rounded-xl text-white bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/30 transition-all hover:-translate-y-0.5 active:scale-95 group-hover:shadow-purple-500/40"
                      >
                        {quiz.isPasswordProtected ? <Lock className="mr-2 h-5 w-5" /> : <HelpCircle className="mr-2 h-5 w-5" />}
                        Attempt Quiz
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {quizzes.length === 0 && (
            <div className="col-span-full py-16 text-center bg-white rounded-3xl border-2 border-dashed border-gray-200">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 text-gray-400 mb-4">
                <HelpCircle className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">No quizzes yet</h3>
              <p className="text-gray-500">Your instructor hasn't posted any quizzes here.</p>
            </div>
          )}
        </div>
      )}

      {/* STUDY MATERIAL & NOTES LIST */}
      {activeTab === 'materials' && (() => {
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
              {/* Subject Filter Pills */}
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

              {/* Search Bar */}
              <div className="relative w-full md:w-72">
                <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search subject, topics, notes..."
                  value={materialSearch}
                  onChange={e => setMaterialSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none bg-gray-50/50"
                />
              </div>
            </div>

            {/* Materials Grid */}
            {filteredMaterials.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {filteredMaterials.map(mat => {
                  const badge = getFileBadge(mat.fileType);
                  return (
                    <div
                      key={mat._id}
                      className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col justify-between group"
                    >
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-3">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100">
                            {mat.subject}
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold border ${badge.bg}`}>
                            {badge.label}
                          </span>
                        </div>

                        <h3 className="text-lg font-bold text-gray-900 line-clamp-1 mb-1.5" title={mat.title}>
                          {mat.title}
                        </h3>

                        {mat.description && (
                          <p className="text-xs text-gray-500 line-clamp-3 mb-4 leading-relaxed">
                            {mat.description}
                          </p>
                        )}

                        {/* File Details Box */}
                        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex items-center justify-between text-xs text-gray-600 mt-2">
                          <div className="flex items-center min-w-0 pr-2">
                            <File className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                            <span className="truncate font-medium text-gray-700">{mat.fileName}</span>
                          </div>
                          <span className="font-mono text-[11px] text-gray-400 flex-shrink-0 font-semibold">
                            {formatFileSize(mat.fileSize)}
                          </span>
                        </div>

                        <div className="flex items-center text-[11px] text-gray-400 mt-3">
                          <Clock className="h-3.5 w-3.5 mr-1" />
                          <span>Uploaded {new Date(mat.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          {mat.teacherId?.fullName && (
                            <span className="ml-auto text-gray-500 font-medium truncate max-w-[120px]">
                              by {mat.teacherId.fullName}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Download Action Footer */}
                      <div className="p-4 bg-gray-50/50 border-t border-gray-100">
                        <a
                          href={mat.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full flex items-center justify-center px-4 py-2.5 bg-white hover:bg-amber-500 hover:text-white border border-gray-200 hover:border-amber-500 rounded-xl text-xs font-bold text-gray-700 shadow-xs transition-all"
                        >
                          <Download className="h-3.5 w-3.5 mr-2" />
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
                <h3 className="text-base font-bold text-gray-900">No study materials available yet</h3>
                <p className="mt-1 text-xs text-gray-500 max-w-sm mx-auto">
                  {materialSubjectFilter !== 'All' || materialSearch
                    ? 'No notes match your subject filter or search keyword.'
                    : 'Your instructor has not uploaded any documents or lecture notes for this classroom yet.'}
                </p>
              </div>
            )}
          </div>
        );
      })()}

      {/* PASSWORD VERIFICATION MODAL */}
      {selectedQuizForPass && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md transition-all duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 relative">
            <div className="absolute top-0 right-0 p-4">
              <button onClick={() => setSelectedQuizForPass(null)} className="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full p-1 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-8 text-center border-b border-gray-100">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 mb-4 shadow-sm">
                <Key className="h-8 w-8" />
              </div>
              <h3 className="font-bold text-2xl text-gray-900 mb-1">Password Required</h3>
              <p className="text-sm font-medium text-gray-500">
                To unlock <span className="text-purple-700 font-bold">{selectedQuizForPass.title}</span>
              </p>
            </div>

            <form onSubmit={handleVerifyPassword} className="p-6 bg-gray-50/50">
              <div className="mb-6">
                <input
                  autoFocus
                  required
                  type="password"
                  placeholder="Enter passcode"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-4 text-center text-2xl font-mono font-bold tracking-[0.3em] text-gray-900 focus:ring-0 focus:border-purple-500 shadow-sm transition-colors"
                  value={inputPassword}
                  onChange={e => setInputPassword(e.target.value)}
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedQuizForPass(null)}
                  className="flex-1 py-3 text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={verifying}
                  className="flex-1 py-3 text-sm font-bold text-white bg-purple-600 rounded-xl hover:bg-purple-700 shadow-lg shadow-purple-500/30 transition-all active:scale-95 disabled:opacity-70 flex justify-center items-center"
                >
                  {verifying ? 'Verifying...' : 'Unlock Quiz'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentClassroomView;
