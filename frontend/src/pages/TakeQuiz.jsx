import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { toast } from 'react-toastify';
import { HelpCircle, CheckCircle, XCircle, ArrowLeft, ArrowRight, ShieldCheck, Trophy, Lock, Key } from 'lucide-react';

const TakeQuiz = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const passFromUrl = searchParams.get('pass') || '';

  const [quiz, setQuiz] = useState(null);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [existingSubmission, setExistingSubmission] = useState(null);
  const [loading, setLoading] = useState(true);

  // Password fallback state if opened directly without query pass
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [inputPassword, setInputPassword] = useState(passFromUrl);

  // Quiz Attempt State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({}); // { [qIndex]: selectedOptionIndex }
  const [submitting, setSubmitting] = useState(false);
  const [resultSubmission, setResultSubmission] = useState(null);

  const fetchQuizDetails = async (passToUse) => {
    setLoading(true);
    try {
      const res = await api.get(`/quizzes/${id}`, {
        params: { password: passToUse }
      });
      setQuiz(res.data.quiz);
      setAlreadySubmitted(res.data.alreadySubmitted);
      if (res.data.submission) {
        setExistingSubmission(res.data.submission);
      }
      setPasswordRequired(false);
    } catch (err) {
      if (err.response?.status === 401 && err.response?.data?.requiresPassword) {
        setPasswordRequired(true);
      } else {
        toast.error(err.response?.data?.message || 'Failed to load quiz details.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizDetails(passFromUrl);
  }, [id, passFromUrl]);

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (!inputPassword.trim()) {
      toast.error('Please enter the password.');
      return;
    }
    fetchQuizDetails(inputPassword.trim());
  };

  const handleSelectOption = (qIndex, optionIndex) => {
    if (alreadySubmitted || resultSubmission) return;
    setUserAnswers(prev => ({
      ...prev,
      [qIndex]: optionIndex
    }));
  };

  const handleSubmitQuiz = async () => {
    const formattedAnswers = Object.entries(userAnswers).map(([qIdx, optIdx]) => ({
      questionIndex: parseInt(qIdx),
      selectedOptionIndex: optIdx
    }));

    const unansweredCount = (quiz.questions.length) - Object.keys(userAnswers).length;
    if (unansweredCount > 0) {
      if (!window.confirm(`You have ${unansweredCount} unanswered question(s). Are you sure you want to submit?`)) {
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await api.post(`/quizzes/${id}/submit`, {
        answers: formattedAnswers,
        password: inputPassword || passFromUrl
      });
      toast.success('Quiz submitted successfully!');
      setResultSubmission(res.data.submission);
      setAlreadySubmitted(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit quiz.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
    </div>
  );

  // Password Prompt fallback
  if (passwordRequired && !quiz) {
    return (
      <div className="max-w-md mx-auto my-12 px-4">
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 text-center">
          <div className="w-14 h-14 bg-purple-100 text-purple-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Quiz is Password Protected</h2>
          <p className="text-sm text-gray-500 mb-6">Please enter the password provided by your instructor to begin.</p>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <input
              type="password"
              placeholder="Enter passcode"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-center text-lg font-mono font-bold tracking-wider"
              value={inputPassword}
              onChange={e => setInputPassword(e.target.value)}
            />
            <button
              type="submit"
              className="w-full py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 shadow-lg shadow-purple-500/30"
            >
              Verify Passcode & Start
            </button>
          </form>
        </div>
      </div>
    );
  }

  const activeSubmission = resultSubmission || existingSubmission;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6 flex justify-between items-center">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-xs font-bold text-gray-500 hover:text-gray-900 mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Classroom
          </button>
          <h1 className="text-2xl font-extrabold text-gray-900">{quiz.title}</h1>
          <p className="text-xs text-gray-500">{quiz.subject} &bull; {quiz.questions.length} Questions</p>
        </div>
        {quiz.isPasswordProtected && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900">
            <ShieldCheck className="w-3.5 h-3.5 mr-1 text-amber-700" /> Protected Quiz
          </span>
        )}
      </div>

      {/* COMPLETED / RESULT VIEW */}
      {activeSubmission ? (
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-purple-100 space-y-8">
          <div className="text-center bg-gradient-to-br from-purple-50 to-indigo-50 p-8 rounded-2xl border border-purple-100">
            <Trophy className="w-14 h-14 text-yellow-500 mx-auto mb-3 animate-bounce" />
            <h2 className="text-3xl font-extrabold text-gray-900 mb-1">Quiz Completed!</h2>
            <p className="text-sm text-gray-600 mb-4">Here is your automated score summary:</p>

            <div className="inline-flex items-center justify-center bg-white px-6 py-3 rounded-2xl shadow-sm border border-purple-200 gap-4">
              <div>
                <span className="text-xs text-gray-500 font-bold block">Score</span>
                <span className="text-2xl font-black text-purple-700">{activeSubmission.score} / {activeSubmission.totalScore}</span>
              </div>
              <div className="h-8 w-px bg-gray-200"></div>
              <div>
                <span className="text-xs text-gray-500 font-bold block">Percentage</span>
                <span className="text-2xl font-black text-emerald-600">{activeSubmission.percentage}%</span>
              </div>
            </div>
          </div>

          {/* Answer Breakdown if available */}
          <div>
            <h3 className="text-lg font-extrabold text-gray-900 mb-4">Question Breakdown & Answer Key</h3>
            <div className="space-y-4">
              {quiz.questions.map((q, qIndex) => {
                const subAnswer = activeSubmission.answers?.find(a => a.questionIndex === qIndex);
                const studentOptIdx = subAnswer ? subAnswer.selectedOptionIndex : null;
                const isCorrect = subAnswer?.isCorrect;

                return (
                  <div key={qIndex} className={`p-5 rounded-2xl border ${isCorrect ? 'border-emerald-200 bg-emerald-50/30' : 'border-red-200 bg-red-50/30'}`}>
                    <div className="flex items-start justify-between mb-2">
                      <span className="font-bold text-sm text-gray-900">
                        {qIndex + 1}. {q.questionText}
                      </span>
                      {isCorrect ? (
                        <span className="inline-flex items-center text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                          <CheckCircle className="w-3.5 h-3.5 mr-1" /> Correct (+{q.points || 1})
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs font-bold text-red-700 bg-red-100 px-2.5 py-1 rounded-full">
                          <XCircle className="w-3.5 h-3.5 mr-1" /> Incorrect (0 pts)
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                      {q.options.map((opt, optIndex) => {
                        let optStyle = 'border-gray-200 bg-white text-gray-700';
                        if (q.correctOptionIndex !== undefined && optIndex === q.correctOptionIndex) {
                          optStyle = 'border-emerald-500 bg-emerald-100 text-emerald-900 font-bold';
                        } else if (optIndex === studentOptIdx && !isCorrect) {
                          optStyle = 'border-red-400 bg-red-100 text-red-900 line-through';
                        }

                        return (
                          <div key={optIndex} className={`p-2.5 rounded-xl border text-xs flex items-center ${optStyle}`}>
                            <span className="font-mono font-bold mr-2">{String.fromCharCode(65 + optIndex)}.</span>
                            {opt}
                            {q.correctOptionIndex !== undefined && optIndex === q.correctOptionIndex && (
                              <span className="ml-auto text-[10px] bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded">Correct Key</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* QUIZ ATTEMPT INTERFACE */
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 space-y-6">
          {/* Question Index Progress Dots */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <span className="text-xs font-extrabold text-purple-900 bg-purple-100 px-3 py-1 rounded-full">
              Question {currentQuestionIndex + 1} of {quiz.questions.length}
            </span>

            <div className="flex gap-1.5">
              {quiz.questions.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition ${
                    currentQuestionIndex === idx
                      ? 'bg-purple-600 text-white'
                      : userAnswers[idx] !== undefined
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Current Question */}
          {quiz.questions[currentQuestionIndex] && (
            <div className="space-y-6 py-2">
              <h2 className="text-xl font-extrabold text-gray-900 leading-snug">
                {currentQuestionIndex + 1}. {quiz.questions[currentQuestionIndex].questionText}
              </h2>

              <div className="space-y-3">
                {quiz.questions[currentQuestionIndex].options.map((option, optIdx) => {
                  const isSelected = userAnswers[currentQuestionIndex] === optIdx;

                  return (
                    <div
                      key={optIdx}
                      onClick={() => handleSelectOption(currentQuestionIndex, optIdx)}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'border-purple-600 bg-purple-50/70 shadow-sm'
                          : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className={`w-8 h-8 rounded-xl font-mono font-bold flex items-center justify-center text-sm ${
                          isSelected ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span className="text-sm font-semibold text-gray-900">{option}</span>
                      </div>

                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? 'border-purple-600 bg-purple-600 text-white' : 'border-gray-300'
                      }`}>
                        {isSelected && <div className="w-2 h-2 bg-white rounded-full"></div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Footer Controls */}
          <div className="flex items-center justify-between border-t border-gray-100 pt-6">
            <button
              disabled={currentQuestionIndex === 0}
              onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
              className="inline-flex items-center px-4 py-2 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl disabled:opacity-50"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Previous
            </button>

            {currentQuestionIndex < quiz.questions.length - 1 ? (
              <button
                onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                className="inline-flex items-center px-5 py-2 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-md shadow-purple-500/20"
              >
                Next <ArrowRight className="w-4 h-4 ml-1.5" />
              </button>
            ) : (
              <button
                onClick={handleSubmitQuiz}
                disabled={submitting}
                className="inline-flex items-center px-6 py-2.5 text-sm font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg shadow-emerald-500/30"
              >
                {submitting ? 'Evaluating...' : 'Submit Quiz Now'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TakeQuiz;
