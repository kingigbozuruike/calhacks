function Testimonials() {
  const testimonials = [
    {
      name: "Sarah Johnson",
      image: "/images/black-woman-avatar.svg",
      text: "Bump has been my lifeline during pregnancy. The AI answers my questions at 3 AM when I'm worried about strange symptoms, and the weekly updates help me understand exactly what's happening with my baby's development.",
      rating: 5
    },
    {
      name: "Michelle Rodriguez",
      image: "/images/white-woman-avatar.svg",
      text: "As a first-time mom, I had so many questions and anxieties. Bump's personalized guidance made me feel supported every step of the way. The wellness tips helped me manage morning sickness and later pregnancy discomforts.",
      rating: 5
    },
    {
      name: "Aisha Patel",
      image: "/images/racially-ambiguous-woman-avatar.svg",
      text: "I love how Bump combines medical information with emotional support. It's like having a doctor, doula, and supportive friend all in one app. The weekly tracking visuals are beautiful and make me excited for each new stage.",
      rating: 5
    }
  ];

  return (
    <section className="py-16 text-center scroll-mt-24" id="testimonials">
      <h2 className="text-4xl font-semibold text-thistle mb-12 text-center" style={{fontFamily: 'Poppins'}}>
        What moms are saying
      </h2>

      <div className="space-y-16">
        {testimonials.map((testimonial, index) => (
          <div 
            key={testimonial.name}
            className={`flex flex-col ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} gap-8 items-center`}
          >
            <div className="md:w-1/3 flex flex-col items-center">
              <div className="relative mb-4">
                <img 
                  src="/images/avatar-background.svg" 
                  alt="Background" 
                  className="w-40 h-40"
                />
                <img 
                  src={testimonial.image} 
                  alt={testimonial.name}
                  className="w-28 h-28 rounded-full object-cover absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                />
              </div>
              <h3 className="text-xl font-semibold text-gray-800" style={{fontFamily: 'Poppins'}}>
                {testimonial.name}
              </h3>
              <div className="flex text-yellow-400 mt-2">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </div>
            
            <div className={`md:w-2/3 bg-${index % 2 === 0 ? 'fairy-tale' : 'uranian-blue'}/10 p-6 rounded-2xl`}>
              <p className="text-lg text-gray-700 italic" style={{fontFamily: 'Poppins'}}>
                "{testimonial.text}"
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Testimonials;