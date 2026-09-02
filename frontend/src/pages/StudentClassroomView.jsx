import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import StatusBadge from '../components/StatusBadge';
import SimilarityMeter from '../components/SimilarityMeter';
import { Calendar, Clock, FileText, Upload, ArrowLeft, HelpCircle, Lock, Unlock, CheckCircle, Key, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { io } from 'socket.io-client';

const StudentClassroomView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [quizSubmissions, setQuizSubmissions] = useState([]);
  const [classroom, setClassroom] = useState(null);
  const [loading, setLoading] = useState(true);

  // Tab State
  const [activeTab, setActiveTab] = useState('assignments'); // 'assignments' | 'quizzes'

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

    return () => socket.disconnect();
  }, [id]);

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
    if(days > 0) return `${days}d ${hours}h remaining`;
    return `${hours}h remaining`;
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
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 bg-white rounded-3xl p-6 shadow-sm border border-gray-100 gap-4">
        <div className="flex items-center">
          <Link to="/student" className="mr-4 p-2 bg-gray-50 border border-gray-200 rounded-full hover:bg-gray-100 transition shadow-sm">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              {classroom?.name || 'Classroom'}
            </h2>
            <p className="mt-1 text-sm text-gray-500 font-medium">
              {classroom?.teacherId?.fullName ? `Instructor: ${classroom.teacherId.fullName}` : 'Classroom activities'}
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-gray-100 p-1.5 rounded-2xl border border-gray-200 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('assignments')}
            className={`flex items-center px-5 py-2 rounded-xl text-xs font-extrabold transition-all ${
              activeTab === 'assignments' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="h-4 w-4 mr-1.5 text-primary-600" />
            Assignments ({assignments.length})
          </button>
          <button
            onClick={() => setActiveTab('quizzes')}
            className={`flex items-center px-5 py-2 rounded-xl text-xs font-extrabold transition-all ${
              activeTab === 'quizzes' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <HelpCircle className="h-4 w-4 mr-1.5 text-purple-600" />
            Quizzes ({quizzes.length})
          </button>
        </div>
      </div>

      {/* ASSIGNMENTS LIST */}
      {activeTab === 'assignments' && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {assignments.map(assignment => {
            const submission = getSubmissionForAssignment(assignment._id);
            const isPassed = new Date(assignment.deadline) < new Date();

            return (
              <div key={assignment._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col justify-between">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <div className="space-x-1.5 space-y-1">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {assignment.subject}
                      </span>
                      {assignment.targetDivision && assignment.targetDivision !== 'ALL' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                          Div {assignment.targetDivision}
                        </span>
                      )}
                      <h3 className="text-lg font-bold text-gray-900 truncate" title={assignment.title}>{assignment.title}</h3>
                    </div>
                    {submission && <StatusBadge status={submission.status} />}
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                      Deadline: {new Date(assignment.deadline).toLocaleDateString('en-IN')}
                    </div>
                    {!isPassed && !submission && (
                      <div className="flex items-center text-sm font-medium text-orange-600">
                        <Clock className="flex-shrink-0 mr-1.5 h-4 w-4 text-orange-500" />
                        {getTimeRemaining(assignment.deadline)}
                      </div>
                    )}
                  </div>

                  {submission ? (
                    <div className="mt-6 pt-4 border-t border-gray-100 space-y-3">
                      <SimilarityMeter score={submission.similarityScore} label="Similarity Score" />
                      {submission.aiScore > 0 && (
                        <SimilarityMeter score={submission.aiScore} label="AI Content Score" />
                      )}
                      {submission.grade && (
                        <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg mt-2">
                          <span className="text-sm font-medium text-gray-600">Grade:</span>
                          <span className="text-sm font-bold text-gray-900">{submission.grade}</span>
                        </div>
                      )}
                      <Link
                        to={`/submission-result/${submission._id}`}
                        className="mt-4 w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition"
                      >
                        <FileText className="mr-2 h-4 w-4" /> View Details
                      </Link>
                    </div>
                  ) : (
                    <div className="mt-6 pt-4 border-t border-gray-100">
                      {isPassed ? (
                        <button disabled className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-gray-500 bg-gray-100 cursor-not-allowed">
                          Deadline Passed
                        </button>
                      ) : (
                        <Link
                          to={`/submit/${assignment._id}`}
                          className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 shadow-sm shadow-primary-500/30 transition"
                        >
                          <Upload className="mr-2 h-4 w-4" /> Submit Now
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {assignments.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
              No assignments available in this classroom.
            </div>
          )}
        </div>
      )}

      {/* QUIZZES LIST */}
      {activeTab === 'quizzes' && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {quizzes.map(quiz => {
            const quizSub = getQuizSubmission(quiz._id);
            const now = new Date();
            const quizEndTime = quiz.endTime || quiz.deadline;
            const hasStarted = !quiz.startTime || new Date(quiz.startTime) <= now;
            const hasEnded = quizEndTime && new Date(quizEndTime) < now;

            return (
              <div key={quiz._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col justify-between">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {quiz.subject}
                    </span>
                    {quiz.isPasswordProtected ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        <Lock className="w-3 h-3 mr-1" /> Protected
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                        <Unlock className="w-3 h-3 mr-1" /> Public
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 truncate mb-1" title={quiz.title}>{quiz.title}</h3>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-4">{quiz.questions?.length || 0} Questions &bull; {quiz.description || 'No description'}</p>

                  <div className="space-y-1.5 mb-4 text-xs">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="flex-shrink-0 mr-1.5 h-3.5 w-3.5 text-purple-600" />
                      <span className="font-bold mr-1">Starts:</span> {quiz.startTime ? new Date(quiz.startTime).toLocaleString('en-IN') : 'Immediate'}
                    </div>
                    <div className={`flex items-center ${hasEnded ? 'text-red-600 font-bold' : 'text-gray-600'}`}>
                      <Calendar className="flex-shrink-0 mr-1.5 h-3.5 w-3.5 text-rose-500" />
                      <span className="font-bold mr-1">Ends:</span> {new Date(quizEndTime).toLocaleString('en-IN')}
                    </div>
                  </div>

                  {/* Submission Status or Attempt Action */}
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    {quizSub ? (
                      <div className="bg-purple-50 rounded-xl p-3 border border-purple-100">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-bold text-purple-900 flex items-center">
                            <CheckCircle className="w-4 h-4 text-purple-700 mr-1" /> Completed
                          </span>
                          <span className="text-xs font-extrabold text-purple-700">{quizSub.score} / {quizSub.totalScore} ({quizSub.percentage}%)</span>
                        </div>
                        <Link
                          to={`/student/quiz/${quiz._id}`}
                          className="mt-2 w-full text-center block py-1.5 text-xs font-bold text-purple-700 hover:underline"
                        >
                          Review Answers & Score &rarr;
                        </Link>
                      </div>
                    ) : !hasStarted ? (
                      <button disabled className="w-full flex justify-center items-center px-4 py-2.5 text-xs font-bold rounded-xl text-amber-800 bg-amber-50 border border-amber-200 cursor-not-allowed">
                        Quiz Starts at {new Date(quiz.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </button>
                    ) : hasEnded ? (
                      <button disabled className="w-full flex justify-center items-center px-4 py-2.5 text-xs font-bold rounded-xl text-gray-500 bg-gray-100 border border-gray-200 cursor-not-allowed">
                        Quiz Closed (Expired)
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAttemptQuizClick(quiz)}
                        className="w-full flex justify-center items-center px-4 py-2.5 border border-transparent text-sm font-extrabold rounded-xl text-white bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-500/30 transition"
                      >
                        {quiz.isPasswordProtected ? <Lock className="mr-2 h-4 w-4" /> : <HelpCircle className="mr-2 h-4 w-4" />}
                        Attempt Quiz
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {quizzes.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
              No quizzes available for your division in this classroom.
            </div>
          )}
        </div>
      )}

      {/* PASSWORD VERIFICATION MODAL */}
      {selectedQuizForPass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-2 text-amber-900">
                <div className="p-2 bg-amber-100 rounded-xl">
                  <Key className="h-6 w-6 text-amber-700" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-gray-900">Password Required</h3>
                  <p className="text-xs text-gray-500">Enter passcode to unlock quiz</p>
                </div>
              </div>
              <button onClick={() => setSelectedQuizForPass(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleVerifyPassword} className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  <span className="font-bold text-purple-900">{selectedQuizForPass.title}</span> requires a passcode set by your teacher.
                </p>
                <input
                  autoFocus
                  required
                  type="password"
                  placeholder="Enter passcode..."
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-center text-lg font-mono font-bold tracking-widest focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  value={inputPassword}
                  onChange={e => setInputPassword(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedQuizForPass(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={verifying}
                  className="px-5 py-2 text-sm font-bold text-white bg-purple-600 rounded-xl hover:bg-purple-700 shadow-md shadow-purple-500/30 flex items-center"
                >
                  {verifying ? 'Verifying...' : 'Unlock & Start'}
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
