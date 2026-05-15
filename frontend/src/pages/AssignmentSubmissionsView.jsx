import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import StatusBadge from '../components/StatusBadge';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import { ArrowLeft, Download, ExternalLink, Search, Users, BarChart } from 'lucide-react';
import { toast } from 'react-toastify';
import { io } from 'socket.io-client';

const AssignmentSubmissionsView = () => {
  const { id } = useParams();
  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('submissions'); // 'submissions' or 'analytics'

  const fetchData = async () => {
    try {
      const [assignRes, subRes] = await Promise.all([
        api.get(`/assignments/${id}`),
        api.get(`/submissions/assignment/${id}`)
      ]);
      setAssignment(assignRes.data);
      setSubmissions(subRes.data);
    } catch (err) {
      toast.error('Failed to load assignment data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Determine backend URL from api settings
    const backendUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000';
    const socket = io(backendUrl, { withCredentials: true });

    socket.on('connect', () => {
      socket.emit('join_assignment', id);
    });

    socket.on('new_submission', (newSub) => {
      setSubmissions(prev => {
        // Remove previous attempt if exists
        const filtered = prev.filter(s => s.studentId._id !== newSub.studentId._id);
        return [newSub, ...filtered];
      });
      toast.info(`🔔 New submission received from ${newSub.studentId.fullName}!`, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "light",
      });
    });

    return () => socket.disconnect();
  }, [id]);

  const handleGradeChange = async (subId, newGrade) => {
    try {
      await api.put(`/submissions/${subId}/grade`, { grade: newGrade });
      toast.success('Grade updated');
      fetchData();
    } catch (err) {
      toast.error('Failed to update grade');
    }
  };

  const handleStatusChange = async (subId, status) => {
    try {
      await api.put(`/submissions/${subId}/status`, { status });
      toast.success(`Submission ${status}`);
      fetchData();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleExport = async () => {
    try {
      const response = await api.get(`/assignments/${id}/export`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${assignment?.title || 'assignment'}_grades.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      toast.success('Export successful');
    } catch (err) {
      toast.error('Failed to export grades');
    }
  };


  const filtered = submissions.filter(s =>
    s.studentId?.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.studentId?.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
      {/* Decorative blurred backgrounds for premium look */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob animation-delay-4000"></div>

      <div className="relative mb-6 flex justify-between items-center flex-wrap gap-4 z-10">
        <div className="flex items-center">
          <Link to="/teacher" className="p-3 mr-4 text-gray-500 hover:text-primary-600 transition-all bg-white/60 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm hover:shadow-md hover:-translate-y-0.5">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 tracking-tight">{assignment?.title || 'Assignment Overview'}</h2>
        </div>

        {activeTab === 'submissions' && (
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-primary-400 group-focus-within:text-primary-600 transition-colors" />
              </div>
              <input
                type="text"
                className="premium-input pl-10 pr-4 py-3 min-w-[300px]"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-4 py-3 rounded-2xl border border-white/50 shadow-sm transition-all hover:shadow hover:-translate-y-0.5 backdrop-blur-md"
              title="Export Grades as CSV"
            >
              <Download className="h-5 w-5 text-primary-600" />
              <span className="font-medium">Export</span>
            </button>
          </div>
        )}
      </div>

      <div className="relative mb-6 z-10">
        {assignment?.description && (
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-white/50">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Assignment Prompt / Details</h3>
            <p className="text-gray-800 whitespace-pre-wrap">{assignment.description}</p>
            {assignment?.deadline && (
              <p className="mt-4 text-sm font-medium text-gray-500">
                <span className="font-bold">Deadline:</span> {new Date(assignment.deadline).toLocaleString('en-IN')}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="relative mb-8 z-10">
        <nav className="flex space-x-2 bg-white/40 backdrop-blur-md p-1.5 rounded-2xl border border-white/50 shadow-sm w-max">
          <button
            onClick={() => setActiveTab('submissions')}
            className={`px-5 py-2.5 font-medium text-sm rounded-xl flex items-center transition-all duration-300 ${activeTab === 'submissions'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
              }`}
          >
            <Users className="h-5 w-5 mr-2" />
            Submissions
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-5 py-2.5 font-medium text-sm rounded-xl flex items-center transition-all duration-300 ${activeTab === 'analytics'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
              }`}
          >
            <BarChart className="h-5 w-5 mr-2" />
            Analytics & Graph
          </button>
        </nav>
      </div>

      <div className="relative z-10">
        {activeTab === 'analytics' ? (
          <div className="glass-panel p-6">
            <AnalyticsDashboard assignmentId={id} />
          </div>
        ) : (
          <div className="glass-panel overflow-hidden transition-all duration-500">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200/50">
                <thead className="bg-gray-50/50 backdrop-blur-sm">
                  <tr>
                    <th scope="col" className="py-4 pl-6 pr-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Student</th>
                    <th scope="col" className="px-3 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-3 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">AI Score</th>
                    <th scope="col" className="px-3 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Similarity</th>
                    <th scope="col" className="px-3 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Grade</th>
                    <th scope="col" className="relative py-4 pl-3 pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white/30 backdrop-blur-md">
                  {filtered.map((submission) => (
                    <tr key={submission._id} className="hover:bg-white/50 transition-colors duration-200">
                      <td className="whitespace-nowrap py-4 pl-6 pr-3">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-primary-700 font-bold shadow-inner">
                              {submission.studentId?.fullName?.charAt(0)}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="font-semibold text-gray-900">{submission.studentId?.fullName}</div>
                            <div className="text-gray-500 text-xs mt-0.5">{submission.studentId?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4">
                        <StatusBadge status={submission.status} />
                      </td>
                      <td className="whitespace-nowrap px-3 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${submission.aiScore > 50 ? 'bg-orange-50 border-orange-200 text-orange-700 shadow-sm' : 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm'}`}>
                          {submission.aiScore}%
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4">
                        <div className="flex flex-col">
                          <span className={`font-bold text-sm ${submission.similarityScore > 70 ? 'text-rose-600' : 'text-gray-700'}`}>{submission.similarityScore}%</span>
                          {submission.matchedWithStudentId && (
                            <span className="text-xs text-gray-500 font-medium">with: {submission.matchedWithStudentId.fullName}</span>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4">
                        {submission.status === 'accepted' ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              id={`grade-${submission._id}`}
                              className="w-16 rounded-xl border border-gray-200 bg-white/80 shadow-inner focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 sm:text-sm p-1.5 text-center transition-all font-medium"
                              defaultValue={submission.grade || ''}
                              placeholder="A, 90"
                            />
                            <button
                              onClick={() => {
                                const val = document.getElementById(`grade-${submission._id}`).value;
                                if (val !== submission.grade) {
                                  handleGradeChange(submission._id, val);
                                }
                              }}
                              className="text-xs font-medium bg-white hover:bg-primary-50 hover:text-primary-700 text-gray-600 px-3 py-2 rounded-xl border border-gray-200 shadow-sm hover:shadow transition-all"
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic text-sm">N/A</span>
                        )}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-6 text-right text-sm font-medium flex justify-end gap-3 items-center">
                        {submission.status === 'quarantine' && (
                          <div className="flex gap-2">
                            <button onClick={() => handleStatusChange(submission._id, 'accepted')} className="text-emerald-700 hover:text-white hover:bg-emerald-600 border border-emerald-200 bg-emerald-50 px-3 py-1.5 rounded-xl transition-all shadow-sm">Accept</button>
                            <button onClick={() => handleStatusChange(submission._id, 'rejected')} className="text-rose-700 hover:text-white hover:bg-rose-600 border border-rose-200 bg-rose-50 px-3 py-1.5 rounded-xl transition-all shadow-sm">Reject</button>
                          </div>
                        )}
                        <a
                          href={
                            submission.fileUrl.match(/\.(docx|doc)$/i)
                            ? `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(submission.fileUrl)}`
                            : submission.fileUrl
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary-600 hover:text-primary-800 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-xl inline-flex items-center transition-all"
                        >
                          <ExternalLink className="h-4 w-4 mr-1.5" /> View
                        </a>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan="6" className="py-16 text-center">
                        <p className="text-sm text-gray-500 font-medium">No submissions found matching your search.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignmentSubmissionsView;
