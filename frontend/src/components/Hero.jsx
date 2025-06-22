import VoiceAssistantButton from "./VoiceAssistantButton"

function Hero() {
  return (
    <section className="flex flex-col md:flex-row items-center mb-20 gap-8">
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
    </section>
  )
}
export default Hero
