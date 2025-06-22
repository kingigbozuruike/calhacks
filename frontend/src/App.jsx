import './App.css'
import Header from './components/Header'

function App() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row items-center mb-20 gap-8">
          <div className="md:w-1/2">
            <img src="/images/feeling-pregnancy.svg" alt="Pregnancy Illustration" className="w-full max-w-lg mx-auto" />
          </div>
          <div className="md:w-1/2 text-left">
            <h1 className="text-5xl md:text-6xl font-bold text-thistle mb-6 leading-tight" style={{fontFamily: 'Poppins'}}>
              Your AI Pregnancy
              <br />
              <span className="text-carnation-pink">Companion</span>
            </h1>
            <p className="text-xl text-gray-700 mb-10 leading-relaxed" style={{fontFamily: 'Poppins'}}>
              Supporting you from conception through postpartum with personalized emotional, 
              physical, and practical wellness guidance — tailored to each beautiful stage of motherhood.
            </p>
            <button className="bg-carnation-pink text-black px-12 py-4 rounded-lg text-xl font-medium hover:bg-black hover:text-white transition-colors" style={{fontFamily: 'Fredoka'}}>
              Start Your Journey
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <div className="bg-fairy-tale/20 rounded-2xl p-8 text-center">
            <div className="mb-4 flex justify-center">
              <img src="/images/representing-ai.webp" alt="AI" className="h-20" />
            </div>
            <h3 className="text-xl font-bold text-thistle mb-3">AI-Powered Support</h3>
            <p className="text-gray-600">Get personalized advice and answers to your pregnancy questions 24/7</p>
          </div>
          <div className="bg-uranian-blue/20 rounded-2xl p-8 text-center">
            <div className="mb-4 flex justify-center">
              <img src="/images/cutie.svg" alt="Calendar" className="h-20" />
            </div>
            <h3 className="text-xl font-bold text-thistle mb-3">Weekly Tracking</h3>
            <p className="text-gray-600">Follow your baby's development week by week with beautiful visualizations</p>
          </div>
          <div className="bg-fairy-tale/20 rounded-2xl p-8 text-center">
            <div className="mb-4 flex justify-center">
              <img src="/images/wellness.svg" alt="Wellness" className="h-20" />
            </div>
            <h3 className="text-xl font-bold text-thistle mb-3">Wellness Care</h3>
            <p className="text-gray-600">Emotional and physical wellness support tailored to your journey</p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-light-sky-blue/20 rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold text-thistle mb-4">
            Ready to start your beautiful journey?
          </h2>
          <p className="text-gray-700 mb-8 text-lg">
            Join thousands of moms who trust Bump for their pregnancy journey
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-uranian-blue text-white px-8 py-3 rounded-lg font-semibold">
              Download App
            </button>
            <button className="bg-light-sky-blue text-white px-8 py-3 rounded-lg font-semibold">
              Learn More
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-8 text-gray-600">
        <p>Made with 💕 for amazing moms-to-be</p>
      </footer>
    </div>
  )
}

export default App
