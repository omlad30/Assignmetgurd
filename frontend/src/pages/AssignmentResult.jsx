import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import StatusBadge from '../components/StatusBadge';
import SimilarityMeter from '../components/SimilarityMeter';
import { Download, ArrowLeft, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';

const AssignmentResult = () => {
  const { id } = useParams();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Because we didn't make an endpoint specifically for single submission by ID,
    // we'll fetch all auth user's submissions and find it.
    // Actually in a real prod app we'd want `/api/submissions/:id`, but we'll work with what we have.
    const fetchSubmission = async () => {
      try {
        const res = await api.get('/submissions/student');
        const found = res.data.find(s => s._id === id);
        if (found) {
          setSubmission(found);
        } else {
          toast.error("Submission not found");
        }
      } catch (err) {
        toast.error('Failed to load results');
      } finally {
        setLoading(false);
      }
    };
    fetchSubmission();
  }, [id]);

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  );

  if (!submission) return <div>Data not found</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/student" className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-500 mb-6 transition-colors">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
      </Link>

      <div className="bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Submission Result</h2>
            <p className="text-sm text-gray-500 mt-1">{submission.assignmentId?.title}</p>
          </div>
          <StatusBadge status={submission.status} />
        </div>

        <div className="p-6 sm:p-8 space-y-8">
          {/* Top Level Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-4 uppercase tracking-wider">Similarity Analysis</h3>
              <SimilarityMeter score={submission.similarityScore} label="Matched with peers" />
              {submission.status === 'rejected' && (
                <div className="mt-3 text-sm text-red-600 font-medium">
                  {submission.rejectionReason}
                </div>
              )}
            </div>

            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-4 uppercase tracking-wider">AI Content Analysis</h3>
              <SimilarityMeter score={submission.aiScore || 0} label="AI Probability" />
              <div className="mt-3 text-sm">
                Verdict: <span className="font-semibold text-gray-900">{submission.aiVerdict || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* AI Sentences Highlight */}
          {submission.suspiciousSentences && submission.suspiciousSentences.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
                Suspicious / AI Generated Sentences
              </h3>
              <ul className="space-y-2 bg-orange-50 p-4 rounded-xl border border-orange-200">
                {submission.suspiciousSentences.map((sentence, index) => (
                  <li key={index} className="text-sm text-orange-800 list-disc ml-4">
                    {sentence}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-between items-center pt-6 border-t border-gray-100">
            <div>
              <span className="text-sm text-gray-500">Submitted at: </span>
              <span className="text-sm font-medium text-gray-900">{new Date(submission.submittedAt).toLocaleString('en-IN')}</span>
            </div>
            {submission.fileUrl && (
              <a href={submission.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition">
                <Download className="mr-2 h-4 w-4" /> Download Original File
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignmentResult;
