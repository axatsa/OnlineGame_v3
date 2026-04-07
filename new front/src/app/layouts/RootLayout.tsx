import { Outlet, Link, useLocation } from "react-router";
import { useEffect, useState } from "react";
import { Sparkles, User, Settings, LogOut } from "lucide-react";

export function RootLayout() {
  const location = useLocation();
  const [navScrolled, setNavScrolled] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setNavScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen font-sans w-full antialiased bg-stone-50 selection:bg-black selection:text-white">
      <nav 
        className={`fixed top-0 left-0 right-0 z-50 px-8 py-6 flex justify-between items-center transition-all duration-300 ${
          navScrolled ? "bg-black/5 backdrop-blur-xl py-4" : "bg-transparent py-8"
        }`}
      >
        <Link 
          to="/" 
          className="text-2xl font-black tracking-tighter hover:opacity-70 transition-opacity flex items-center gap-2"
        >
          classplay
        </Link>
        <div className="flex gap-12 font-medium tracking-tight items-center">
          <div className="flex gap-8">
            <Link to="/" className="hover:opacity-60 transition-opacity">Overview</Link>
            <Link to="/library" className="hover:opacity-60 transition-opacity">Library</Link>
            <Link to="/students" className="hover:opacity-60 transition-opacity">Students</Link>
          </div>
          
          <div className="flex items-center gap-6 border-l-2 border-black/10 pl-12">
            <div className="flex items-center gap-2 bg-fuchsia-200 text-fuchsia-900 px-4 py-2 rounded-full font-bold text-sm">
              <Sparkles size={16} className="text-fuchsia-700" />
              <span>4,250</span>
            </div>
            
            <div className="relative">
              <button 
                onClick={() => setShowProfile(!showProfile)}
                className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center hover:scale-105 transition-transform"
              >
                <User size={20} />
              </button>
              
              {showProfile && (
                <div className="absolute right-0 top-16 w-64 bg-white rounded-3xl shadow-2xl p-4 flex flex-col gap-2 border border-black/5">
                  <div className="p-4 border-b border-black/5 mb-2">
                    <p className="font-bold text-lg">Sarah Jenkins</p>
                    <p className="text-black/50 text-sm">sarah@school.edu</p>
                  </div>
                  <Link to="/profile" className="flex items-center gap-3 p-4 hover:bg-black/5 rounded-2xl transition-colors">
                    <Settings size={20} className="opacity-50" />
                    <span>Settings</span>
                  </Link>
                  <button className="flex items-center gap-3 p-4 hover:bg-black/5 rounded-2xl transition-colors text-rose-500">
                    <LogOut size={20} />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
      <main className="w-full">
        <Outlet />
      </main>
    </div>
  );
}