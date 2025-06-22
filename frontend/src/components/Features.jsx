function Features() {
  return (
    <section>
      <h2 className="text-4xl font-semibold text-thistle mb-8 text-center scroll-mt-24" style={{fontFamily: 'Poppins'}} id='features'>We offer</h2>
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
    </section>
  )
}

export default Features