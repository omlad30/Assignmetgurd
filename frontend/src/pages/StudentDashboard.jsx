import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import StatusBadge from '../components/StatusBadge';
import SimilarityMeter from '../components/SimilarityMeter';
import { Calendar, Clock, FileText, Upload } from 'lucide-react';
import { toast } from 'react-toastify';

const StudentDashboard = () => {
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [assignRes, subRes] = await Promise.all([
          api.get('/assignments'),
          api.get('/submissions/student')
        ]);
        setAssignments(assignRes.data);
        setSubmissions(subRes.data);
      } catch (err) {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getSubmissionForAssignment = (id) => {
    return submissions.find(s => s.assignmentId?._id === id);
  };

  const getTimeRemaining = (deadline) => {
    const total = Date.parse(deadline) - Date.parse(new Date());
    if (total <= 0) return "Deadline passed";
    const days = Math.floor((total / (1000 * 60 * 60 * 24)));
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    if(days > 0) return `${days}d ${hours}h remaining`;
    return `${hours}h remaining`;
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            My Assignments
          </h2>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {assignments.map(assignment => {
          const submission = getSubmissionForAssignment(assignment._id);
          const isPassed = new Date(assignment.deadline) < new Date();

          return (
            <div key={assignment._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mb-2">
                      {assignment.subject}
                    </span>
                    <h3 className="text-lg font-bold text-gray-900 truncate" title={assignment.title}>{assignment.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">By {assignment.teacherId?.fullName}</p>
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
            No assignments available at the moment.
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
