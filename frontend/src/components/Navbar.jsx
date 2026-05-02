import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LogOut, BookOpen, User } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <BookOpen className="h-8 w-8 text-primary-600 mb-1" />
              <span className="ml-2 text-xl font-bold text-gray-900 tracking-tight">Assign<span className="text-primary-600">Guard</span></span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <div className="flex items-center space-x-2 text-sm font-medium text-gray-700 bg-gray-50 px-2 sm:px-3 py-1.5 rounded-full border border-gray-200 max-w-[120px] sm:max-w-xs overflow-hidden text-ellipsis whitespace-nowrap">
                  {user.profilePicture ? (
                    <img src={user.profilePicture} alt="Avatar" className="h-6 w-6 rounded-full flex-shrink-0" />
                  ) : (
                    <User className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  )}
                  <span className="hidden sm:inline">{user.fullName} ({user.role})</span>
                  <span className="inline sm:hidden">{user.role}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 text-gray-500 hover:text-red-600 transition-colors duration-200"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="hidden sm:inline text-sm font-medium">Log out</span>
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-2 sm:space-x-4">
                <Link to="/login" className="text-gray-600 hover:text-gray-900 font-medium text-sm transition hidden sm:inline">Log in</Link>
                <Link to="/register" className="bg-primary-600 text-white px-3 sm:px-4 py-2 rounded-lg font-medium text-sm hover:bg-primary-700 transition shadow-md shadow-primary-500/30 whitespace-nowrap">Get Started</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
