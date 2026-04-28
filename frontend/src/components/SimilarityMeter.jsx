const SimilarityMeter = ({ score, label = "Similarity" }) => {
  let colorClass = "bg-green-500";
  if (score > 30 && score <= 70) colorClass = "bg-yellow-400";
  if (score > 70) colorClass = "bg-red-500";

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-medium text-gray-700">{label}</span>
        <span className={`text-xs font-bold ${score > 70 ? 'text-red-600' : 'text-gray-900'}`}>{score}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 overflow-hidden">
        <div 
          className={`h-2.5 rounded-full transition-all duration-1000 ease-out ${colorClass}`} 
          style={{ width: `${score}%` }}
        ></div>
      </div>
    </div>
  );
};

export default SimilarityMeter;
