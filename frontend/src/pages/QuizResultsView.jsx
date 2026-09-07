import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { toast } from 'react-toastify';
import { Trophy, ArrowLeft, Users, Award, Percent, Lock, Unlock } from 'lucide-react';

const QuizResultsView = () => {
  const { id } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await api.get(`/quizzes/${id}/results`);
        setQuiz(res.data.quiz);
        setSubmissions(res.data.submissions);
      } catch (err) {
        toast.error('Failed to load quiz results.');
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [id]);

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
    </div>
  );

  const totalSubmissions = submissions.length;
  const avgScore = totalSubmissions > 0
    ? Math.round(submissions.reduce((acc, curr) => acc + curr.score, 0) / totalSubmissions)
    : 0;
  const highestScore = totalSubmissions > 0
    ? Math.max(...submissions.map(s => s.score))
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center">
          <Link
            to={quiz?.classroomId ? `/classroom/${quiz.classroomId}` : '/teacher'}
            className="mr-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                {quiz?.subject}
              </span>
              {quiz?.isPasswordProtected ? (
                <span className="bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center">
                  <Lock className="w-3 h-3 mr-1" /> Password: <span className="font-mono underline ml-1">{quiz.password}</span>
                </span>
              ) : (
                <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center">
                  <Unlock className="w-3 h-3 mr-1" /> Public
                </span>
              )}
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900">{quiz?.title}</h1>
            <p className="text-xs text-gray-500 font-medium mt-1">
              {quiz?.questions?.length || 0} Questions
            </p>
          </div>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase">Submissions</p>
            <h3 className="text-2xl font-black text-gray-900">{totalSubmissions}</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
            <Percent className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase">Average Score</p>
            <h3 className="text-2xl font-black text-gray-900">{avgScore} / {quiz?.questions?.reduce((a, b) => a + (b.points || 1), 0)}</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-yellow-100 text-yellow-600 rounded-xl">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase">Highest Score</p>
            <h3 className="text-2xl font-black text-gray-900">{highestScore} / {quiz?.questions?.reduce((a, b) => a + (b.points || 1), 0)}</h3>
          </div>
        </div>
      </div>

      {/* Submissions Leaderboard Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-gray-900 flex items-center">
            <Trophy className="w-5 h-5 text-yellow-500 mr-2" />
            Student Leaderboard & Scores
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
              <tr>
                <th className="py-3.5 px-6">Rank</th>
                <th className="py-3.5 px-6">Student Name</th>
                <th className="py-3.5 px-6">Division</th>
                <th className="py-3.5 px-6">Score</th>
                <th className="py-3.5 px-6">Percentage</th>
                <th className="py-3.5 px-6">Submitted At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {submissions.map((sub, index) => {
                const percent = sub.percentage;
                let badgeClass = 'bg-emerald-100 text-emerald-800';
                if (percent < 50) badgeClass = 'bg-red-100 text-red-800';
                else if (percent < 75) badgeClass = 'bg-blue-100 text-blue-800';

                return (
                  <tr key={sub._id} className="hover:bg-gray-50/80 transition">
                    <td className="py-4 px-6 font-mono font-bold text-gray-700">
                      {index === 0 ? '🥇 1st' : index === 1 ? '🥈 2nd' : index === 2 ? '🥉 3rd' : `#${index + 1}`}
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-bold text-gray-900">{sub.studentId?.fullName || 'Student'}</div>
                      <div className="text-xs text-gray-400">{sub.studentId?.email}</div>
                    </td>
                    <td className="py-4 px-6 font-semibold text-gray-700">
                      Division {sub.studentId?.division || 'A'}
                    </td>
                    <td className="py-4 px-6 font-black text-gray-900">
                      {sub.score} / {sub.totalScore}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black ${badgeClass}`}>
                        {sub.percentage}%
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs text-gray-500">
                      {new Date(sub.submittedAt).toLocaleString('en-IN')}
                    </td>
                  </tr>
                );
              })}
              {submissions.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-gray-500">
                    No students have completed this quiz yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default QuizResultsView;
