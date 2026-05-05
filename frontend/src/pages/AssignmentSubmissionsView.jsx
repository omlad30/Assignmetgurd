import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import StatusBadge from '../components/StatusBadge';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import { ArrowLeft, Download, ExternalLink, Search, Users, BarChart } from 'lucide-react';
import { toast } from 'react-toastify';

const AssignmentSubmissionsView = () => {
  const { id } = useParams();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('submissions'); // 'submissions' or 'analytics'

  const fetchSubmissions = async () => {
    try {
      const res = await api.get(`/submissions/assignment/${id}`);
      setSubmissions(res.data);
    } catch (err) {
      toast.error('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [id]);

  const handleGradeChange = async (subId, newGrade) => {
    try {
      await api.put(`/submissions/${subId}/grade`, { grade: newGrade });
      toast.success('Grade updated');
      fetchSubmissions();
    } catch (err) {
      toast.error('Failed to update grade');
    }
  };

  const handleStatusChange = async (subId, status) => {
    try {
      await api.put(`/submissions/${subId}/status`, { status });
      toast.success(`Submission ${status}`);
      fetchSubmissions();
    } catch (err) {
      toast.error('Failed to update status');
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center">
          <Link to="/teacher" className="p-2 mr-2 text-gray-400 hover:text-gray-600 transition-colors bg-white rounded-full border border-gray-200">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h2 className="text-2xl font-bold text-gray-900">Assignment Overview</h2>
        </div>

        {activeTab === 'submissions' && (
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm w-0 min-w-full md:min-w-[300px]"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="mb-8 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('submissions')}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center ${activeTab === 'submissions'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            <Users className="h-5 w-5 mr-2" />
            Submissions
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center ${activeTab === 'analytics'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            <BarChart className="h-5 w-5 mr-2" />
            Analytics & Graph
          </button>
        </nav>
      </div>

      {activeTab === 'analytics' ? (
        <AnalyticsDashboard assignmentId={id} />
      ) : (
        <div className="bg-white shadow-sm ring-1 ring-gray-200 sm:rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Student</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">AI Score</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Similarity</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Grade</th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filtered.map((submission) => (
                  <tr key={submission._id}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 sm:pl-6">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                            {submission.studentId?.fullName?.charAt(0)}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="font-medium text-gray-900">{submission.studentId?.fullName}</div>
                          <div className="text-gray-500 text-sm">{submission.studentId?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <StatusBadge status={submission.status} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                      <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${submission.aiScore > 50 ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>
                        {submission.aiScore}%
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                      <div className="flex flex-col">
                        <span className={`font-medium ${submission.similarityScore > 70 ? 'text-red-600' : 'text-gray-900'}`}>{submission.similarityScore}%</span>
                        {submission.matchedWithStudentId && (
                          <span className="text-xs text-gray-500">Matched: {submission.matchedWithStudentId.fullName}</span>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {submission.status === 'accepted' ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            id={`grade-${submission._id}`}
                            className="w-16 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-1 border text-center"
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
                            className="text-xs font-medium bg-white hover:bg-primary-50 hover:text-primary-700 text-gray-600 px-2.5 py-1.5 rounded border border-gray-300 shadow-sm transition-all"
                          >
                            Update
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">N/A</span>
                      )}
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 flex justify-end gap-2 items-center">
                      {submission.status === 'quarantine' && (
                        <>
                          <button onClick={() => handleStatusChange(submission._id, 'accepted')} className="text-green-600 hover:text-green-900 border border-green-200 bg-green-50 px-2 py-1 rounded">Accept</button>
                          <button onClick={() => handleStatusChange(submission._id, 'rejected')} className="text-red-600 hover:text-red-900 border border-red-200 bg-red-50 px-2 py-1 rounded">Reject</button>
                        </>
                      )}
                      <a href={submission.fileUrl} target="_blank" rel="noreferrer" className="text-primary-600 hover:text-primary-900 inline-flex items-center ml-2">
                        <ExternalLink className="h-4 w-4 mr-1" /> View
                      </a>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-sm text-gray-500">
                      No submissions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentSubmissionsView;
