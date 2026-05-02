import { Link } from 'react-router-dom';
import { Home, Compass } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center space-y-8 p-10 glass-panel">
        <div className="mx-auto h-24 w-24 bg-gradient-to-tr from-primary-100 to-indigo-100 rounded-full flex items-center justify-center mb-4 border border-primary-200">
          <Compass className="h-12 w-12 text-primary-600" />
        </div>
        
        <h1 className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-600 tracking-tighter">
          404
        </h1>
        
        <h2 className="text-2xl font-bold text-gray-900 mt-2">Page Not Found</h2>
        
        <p className="text-gray-500 text-lg mt-4 mb-8">
          Oops! The page you're looking for doesn't exist or has been moved.
        </p>
        
        <Link 
          to="/"
          className="inline-flex items-center justify-center w-full px-6 py-3.5 border border-transparent text-base font-bold rounded-xl text-white bg-primary-600 hover:bg-primary-700 shadow-md transition-all duration-200 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <Home className="h-5 w-5 mr-2" />
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
