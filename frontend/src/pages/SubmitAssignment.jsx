import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { toast } from 'react-toastify';
import { UploadCloud, File, AlertCircle } from 'lucide-react';

const SubmitAssignment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [draftLoading, setDraftLoading] = useState(false);
  const [draftResult, setDraftResult] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        const res = await api.get(`/assignments/${id}`);
        setAssignment(res.data);
      } catch (err) {
        toast.error('Failed to load assignment details');
        navigate('/student');
      } finally {
        setInitialLoading(false);
      }
    };
    fetchAssignment();
  }, [id, navigate]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (
        selectedFile.type === 'application/pdf' ||
        selectedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        selectedFile.type === 'application/msword' ||
        selectedFile.type.startsWith('image/')
      ) {
        setFile(selectedFile);
      } else {
        toast.error('Only PDF, DOCX, and Image files are supported');
        e.target.value = null; // reset
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      return toast.warn('Please select a file first.');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('assignmentId', id);

    setLoading(true);
    try {
      const res = await api.post('/submissions', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      toast.success('Assignment submitted successfully!');
      navigate(`/submission-result/${res.data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDraftCheck = async () => {
    if (!file) {
      return toast.warn('Please select a file to check.');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('assignmentId', id);

    setDraftLoading(true);
    setDraftResult(null);
    try {
      const res = await api.post('/submissions/draft', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setDraftResult(res.data);
      toast.success('Draft check complete!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Draft check failed');
    } finally {
      setDraftLoading(false);
    }
  };

  if (initialLoading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-primary-600 to-indigo-700 px-6 py-8 sm:p-10 text-white">
          <div className="flex justify-between items-start flex-col sm:flex-row gap-4">
            <div>
              <h2 className="text-3xl font-extrabold sm:text-4xl">
                Submit: {assignment?.title}
              </h2>
              {assignment?.subject && (
                <span className="inline-block mt-2 px-2 py-1 bg-white/20 rounded text-xs font-bold uppercase tracking-wider text-primary-100 backdrop-blur-sm">
                  {assignment.subject}
                </span>
              )}
              <div className="mt-4 text-base text-white/90 bg-black/10 p-4 rounded-lg max-w-2xl border border-white/10 shadow-inner">
                <p className="font-semibold mb-1 text-sm text-primary-200">Assignment Details:</p>
                <p className="whitespace-pre-wrap">{assignment?.description || 'No description provided for this assignment.'}</p>
              </div>
            </div>
            {assignment?.deadline && (
              <div className="text-left sm:text-right bg-white/10 p-3 rounded-lg backdrop-blur-sm border border-white/20 shadow-sm shrink-0">
                <p className="text-xs font-bold uppercase tracking-wider text-primary-200">Deadline</p>
                <p className="font-medium text-lg">{new Date(assignment.deadline).toLocaleDateString()}</p>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-8 sm:p-10 bg-white">
          <div className="mb-8 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-amber-500" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-amber-800">Honor Code</h3>
                <div className="mt-2 text-sm text-amber-700">
                  <p>By submitting, you agree that this is your own original work. Your file will be scanned for plagiarism and AI-generated content.</p>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload PDF, DOCX, or Image file
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl hover:border-primary-500 transition-colors bg-gray-50">
                  <div className="space-y-2 text-center">
                    {file ? (
                      <div className="flex flex-col items-center">
                        <File className="mx-auto h-12 w-12 text-primary-500" />
                        <span className="mt-2 text-sm text-gray-900 font-medium">{file.name}</span>
                        <span className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                        <button type="button" onClick={() => setFile(null)} className="mt-2 text-sm text-red-600 hover:text-red-500">Remove</button>
                      </div>
                    ) : (
                      <>
                        <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600 justify-center">
                          <label className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500 p-1">
                            <span>Upload a file</span>
                            <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".pdf,.doc,.docx,image/*" />
                          </label>
                          <p className="pl-1 pt-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">PDF, DOCX, Images up to 10MB</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {draftResult && (
                <div className="mb-6 p-5 rounded-xl bg-blue-50 border border-blue-200 shadow-sm transition-all duration-300">
                  <h3 className="text-xl font-bold text-blue-900 mb-2 flex items-center gap-2">
                    <span className="bg-blue-200 text-blue-800 p-1 rounded">✨</span> Pre-Flight Check Results
                  </h3>
                  <p className="text-sm text-blue-800 mb-4 font-medium">This was just a check. Your teacher has not seen this yet.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm flex flex-col items-center justify-center border border-gray-100">
                      <span className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Similarity Score</span>
                      <span className={`text-3xl font-extrabold ${draftResult.similarityScore > 60 ? 'text-red-600' : 'text-green-600'}`}>{draftResult.similarityScore}%</span>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm flex flex-col items-center justify-center border border-gray-100">
                      <span className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">AI Probability</span>
                      <span className={`text-3xl font-extrabold ${draftResult.aiScore > 80 ? 'text-red-600' : 'text-green-600'}`}>{draftResult.aiScore}%</span>
                    </div>
                  </div>

                  {draftResult.feedback && (
                    <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-primary-500">
                      <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2 text-primary-600">AI Tutor Feedback</h4>
                      <p className="text-gray-700 italic">"{draftResult.feedback}"</p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDraftCheck}
                  disabled={loading || draftLoading || !file}
                  className={`inline-flex justify-center py-2 px-4 border border-indigo-300 shadow-sm text-sm font-bold rounded-lg text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${loading || draftLoading || !file ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {draftLoading ? 'Checking...' : 'Run Pre-Flight Check'}
                </button>
                <button
                  type="submit"
                  disabled={loading || draftLoading || !file}
                  className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-bold rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${loading || draftLoading || !file ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loading ? 'Submitting...' : 'Final Submit'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SubmitAssignment;
