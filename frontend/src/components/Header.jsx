import Logo from './Logo';

function Header() {

  return (
    <header className="p-6 sticky top-0 z-50 bg-white">
      <nav className="flex justify-between items-center max-w-6xl mx-auto">
        <Logo className="text-5xl" />
        
        <div className="flex items-center space-x-8">
          <div className="hidden md:flex space-x-10">
            <a href="#features" className="text-gray-700 font-light hover:text-thistle" style={{fontFamily: 'Fredoka'}}>Features</a>
            <a href="#testimonials" className="text-gray-700 font-light hover:text-thistle" style={{fontFamily: 'Fredoka'}}>Testimonials</a>
            <a href="#support" className="text-gray-700 font-light hover:text-thistle" style={{fontFamily: 'Fredoka'}}>Support</a>
          </div>
          
          <div className="flex space-x-4">
            <button className="bg-fairy-tale text-black px-6 py-2 rounded-lg hover:bg-black hover:text-white transition-colors" style={{fontFamily: 'Fredoka'}}>
              <a href="#footer">Contact Us</a>
            </button>
            <a 
              href="/signup"
              className="bg-carnation-pink text-black px-6 py-2 rounded-lg font-semibold hover:bg-black hover:text-white transition-colors inline-block" 
              style={{fontFamily: 'Fredoka'}}
            >
              Sign Up
            </a>
          </div>
        </div>
      </nav>
    </header>
  )
}

export default Header