import { Link } from "react-router";
import logo from "figma:asset/174e39e89466ed54b9a7e0843340c359cd2083e8.png";

export function Navigation() {
  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-6xl">
      <div 
        className="px-8 py-4 rounded-[24px] backdrop-blur-xl bg-white/70 shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-white/40"
      >
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img src={logo} alt="ClassPlay Logo" className="h-12" />
          </Link>
          
          <div className="flex items-center gap-6">
            <Link 
              to="/dashboard" 
              className="text-gray-700 hover:text-blue-500 transition-colors"
            >
              Dashboard
            </Link>
            <Link 
              to="/generator" 
              className="text-gray-700 hover:text-blue-500 transition-colors"
            >
              Generator
            </Link>
            <Link
              to="/dashboard"
              className="px-8 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-all shadow-lg hover:shadow-xl hover:scale-105"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
