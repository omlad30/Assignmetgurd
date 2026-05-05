import { useEffect, useState, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import api from '../utils/api';
import { Network, AlertCircle, BarChart3 } from 'lucide-react';
import { toast } from 'react-toastify';

const AnalyticsDashboard = ({ assignmentId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const graphRef = useRef();

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get(`/assignments/${assignmentId}/analytics`);
        setData(res.data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [assignmentId]);

  if (loading) return <div className="text-center p-4">Loading Analytics...</div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center">
            <BarChart3 className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Average AI Score</p>
            <p className="text-2xl font-bold text-gray-900">{data.averageAiScore}%</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Common Struggles</p>
            <p className="text-2xl font-bold text-gray-900">{data.struggleMetrics.length} flags</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Network Graph */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6 overflow-hidden">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <Network className="h-5 w-5 mr-2 text-primary-500" /> 
            Plagiarism Network Graph
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Nodes represent students. Links indicate a cosine similarity score above 0% between their submissions. Thicker lines mean higher similarity.
          </p>
          <div className="h-[400px] w-full border border-gray-200 rounded-lg overflow-hidden relative bg-gray-50 flex items-center justify-center">
            {data.graphData.nodes.length > 0 ? (
              <ForceGraph2D
                ref={graphRef}
                width={800}
                height={400}
                graphData={data.graphData}
                nodeLabel="name"
                nodeColor={() => '#8b5cf6'}
                linkColor={() => '#f87171'}
                linkWidth={(link) => link.value / 10}
                linkLabel="label"
              />
            ) : (
              <p className="text-gray-400">No similarities detected in the network.</p>
            )}
          </div>
        </div>

        {/* Struggle Metrics */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 text-orange-500" />
            Classroom Struggle Metrics
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Common weaknesses and flagged sentences across all submissions.
          </p>
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {data.struggleMetrics.length > 0 ? (
              data.struggleMetrics.map((sentence, idx) => (
                <div key={idx} className="bg-orange-50 border border-orange-100 p-3 rounded-lg text-sm text-orange-800">
                  "{sentence}"
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-sm">No significant issues flagged yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
