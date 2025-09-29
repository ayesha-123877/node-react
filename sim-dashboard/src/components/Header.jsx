export default function Header() {
  return (
    <header className="fixed top-0 left-0 w-full bg-blue-600 text-white shadow-md z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-3">
        
        {/* Logo + Name */}
        <div className="flex items-center gap-2 cursor-pointer">
          <span className="text-2xl">📶</span>
          <h1 className="text-xl font-bold tracking-wide">
            SIMTrackr
          </h1>
        </div>

        {/* Profile */}
        <div className="flex items-center gap-3">
          <span className="text-sm hidden sm:block">Welcome, User</span>
          <div className="w-9 h-9 rounded-full bg-white text-blue-600 flex items-center justify-center font-bold">
            U
          </div>
        </div>
      </div>
    </header>
  );
}
