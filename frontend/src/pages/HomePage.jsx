import { Link } from 'react-router-dom'
// Images are now served from public/images
// No need to import SVGs when they're in the public folder
import Logo from '../components/Logo'

function HomePage() {
  return (
    <div className="bg-white min-h-screen flex flex-col justify-between">
      <header className="flex justify-center pt-8">
        <Logo className="text-4xl" />
      </header>

      <main className="flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-12">What is your goal?</h1>

        <div className="space-y-6 w-full max-w-lg px-4">
          <div className="bg-purple-100 rounded-2xl p-6 flex items-center space-x-6 cursor-pointer">
            <img src="/images/get-pregnant-icon.svg" alt="Get pregnant" className="w-16 h-16" />
            <div>
              <h2 className="font-bold text-xl text-gray-800">Get pregnant</h2>
              <p className="text-gray-600">Track your cycles and best days to conceive</p>
            </div>
          </div>

          <div className="bg-pink-100 rounded-2xl p-6 flex items-center space-x-6 cursor-pointer">
            <img src="/images/get-pregnant-icon2.svg" alt="Track my pregnancy" className="w-16 h-16" />
            <div>
              <h2 className="font-bold text-xl text-gray-800">Track my pregnancy</h2>
              <p className="text-gray-600">Monitor the progress of your baby on the way</p>
            </div>
          </div>

          <div className="bg-yellow-100 rounded-2xl p-6 flex items-center space-x-6 cursor-pointer">
            <img src="/images/get-pregnant-icon3.svg" alt="Child's development" className="w-16 h-16" />
            <div>
              <h2 className="font-bold text-xl text-gray-800">Child's development</h2>
              <p className="text-gray-600">Stay informed on your newborn's health and development</p>
            </div>
          </div>
        </div>
        <p className="text-gray-500 mt-8">
          Already a user?{' '}
          <Link to="/login" className="font-semibold text-gray-700 underline">
            Log in
          </Link>
        </p>
      </main>

      <footer className="text-center py-8">
        <p className="text-gray-500">
          By continuing you accept our <br />
          <span className="font-semibold text-gray-700">Terms of Use</span> and{' '}
          <span className="font-semibold text-gray-700">Privacy Policy</span>
        </p>
      </footer>
    </div>
  );
}

export default HomePage
