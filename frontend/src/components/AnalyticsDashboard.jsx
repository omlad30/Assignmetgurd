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
                height={400}
                graphData={data.graphData}
                nodeLabel="name"
                nodeRelSize={6}
                linkColor={(link) => link.value > 80 ? 'rgba(239, 68, 68, 0.8)' : link.value > 50 ? 'rgba(249, 115, 22, 0.6)' : 'rgba(156, 163, 175, 0.4)'}
                linkWidth={(link) => Math.max(1, link.value / 15)}
                linkLabel="label"
                linkDirectionalArrowLength={4}
                linkDirectionalArrowRelPos={1}
                linkCurvature={0.2}
                d3VelocityDecay={0.3}
                nodeCanvasObject={(node, ctx, globalScale) => {
                  const label = node.name;
                  const fontSize = 12 / globalScale;
                  ctx.font = `bold ${fontSize}px Inter, sans-serif`;
                  const textWidth = ctx.measureText(label).width;
                  const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.8);

                  // Draw glow
                  ctx.shadowColor = 'rgba(139, 92, 246, 0.4)';
                  ctx.shadowBlur = 10;
                  
                  // Draw badge background
                  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
                  ctx.beginPath();
                  ctx.roundRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, bckgDimensions[0], bckgDimensions[1], 4 / globalScale);
                  ctx.fill();
                  
                  // Reset shadow for text
                  ctx.shadowBlur = 0;

                  // Draw border
                  ctx.strokeStyle = '#8b5cf6';
                  ctx.lineWidth = 1 / globalScale;
                  ctx.stroke();

                  // Draw text
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'middle';
                  ctx.fillStyle = '#4c1d95';
                  ctx.fillText(label, node.x, node.y);

                  node.__bckgDimensions = bckgDimensions;
                }}
                nodePointerAreaPaint={(node, color, ctx) => {
                  ctx.fillStyle = color;
                  const bckgDimensions = node.__bckgDimensions;
                  bckgDimensions && ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, bckgDimensions[0], bckgDimensions[1]);
                }}
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
