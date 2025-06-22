function Header() {
  return (
    <header className="p-6 sticky top-0 z-50 bg-white">
      <nav className="flex justify-between items-center max-w-6xl mx-auto">
        <a href="/" className="text-5xl font-medium text-thistle cursor-pointer" style={{fontFamily: 'Fredoka'}}>
          bump
        </a>
        
        <div className="flex items-center space-x-8">
          <div className="hidden md:flex space-x-10">
            <a href="#features" className="text-gray-700 font-light hover:text-thistle" style={{fontFamily: 'Fredoka'}}>Features</a>
            <a href="#about" className="text-gray-700 font-light hover:text-thistle" style={{fontFamily: 'Fredoka'}}>About</a>
            <a href="#support" className="text-gray-700 font-light hover:text-thistle" style={{fontFamily: 'Fredoka'}}>Support</a>
          </div>
          
          <div className="flex space-x-4">
            <button className="bg-fairy-tale text-black px-6 py-2 rounded-lg hover:bg-black hover:text-white transition-colors" style={{fontFamily: 'Fredoka'}}>
              Login
            </button>
            <button className="bg-carnation-pink text-black px-6 py-2 rounded-lg font-semibold hover:bg-black hover:text-white transition-colors" style={{fontFamily: 'Fredoka'}}>
              Sign Up
            </button>
          </div>
        </div>
      </nav>
    </header>
  )
}

export default Header