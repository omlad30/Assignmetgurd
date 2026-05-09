import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { LogOut, BookOpen, User, Shield, Moon, Sun } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex-shrink-0 flex items-center group">
              <div className="relative flex items-center justify-center h-10 w-10 mr-3 rounded-xl bg-gradient-to-br from-primary-600 to-purple-600 shadow-lg shadow-primary-500/30 group-hover:shadow-primary-500/50 transition-all duration-300">
                <Shield className="h-6 w-6 text-white absolute" strokeWidth={1.5} />
                <BookOpen className="h-3 w-3 text-white absolute mt-1" strokeWidth={2.5} />
              </div>
              <span className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">Assign<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-purple-600">Guard</span></span>
            </Link>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none"
              aria-label="Toggle dark mode"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            {user ? (
              <>
                <div className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 px-2 sm:px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 max-w-[120px] sm:max-w-xs overflow-hidden text-ellipsis whitespace-nowrap">
                  {user.profilePicture ? (
                    <img src={user.profilePicture} alt="Avatar" className="h-6 w-6 rounded-full flex-shrink-0" />
                  ) : (
                    <User className="h-5 w-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                  )}
                  <span className="hidden sm:inline">{user.fullName} ({user.role})</span>
                  <span className="inline sm:hidden">{user.role}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="hidden sm:inline text-sm font-medium">Log out</span>
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-2 sm:space-x-4">
                <Link to="/#login-form" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium text-sm transition hidden sm:inline">Log in</Link>
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
