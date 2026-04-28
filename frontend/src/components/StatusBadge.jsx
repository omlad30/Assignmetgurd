import { CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react';

const StatusBadge = ({ status }) => {
  switch (status) {
    case 'accepted':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
          <CheckCircle className="w-3.5 h-3.5 mr-1" />
          Accepted
        </span>
      );
    case 'rejected':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
          <XCircle className="w-3.5 h-3.5 mr-1" />
          Rejected (Duplicate)
        </span>
      );
    case 'ai_flagged':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
          <AlertTriangle className="w-3.5 h-3.5 mr-1" />
          AI Suspected
        </span>
      );
    case 'pending':
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
          <Clock className="w-3.5 h-3.5 mr-1" />
          Pending
        </span>
      );
  }
};

export default StatusBadge;
