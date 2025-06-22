import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';

const LoginPage = () => {
  const steps = ['First Trimester', 'Second Trimester', 'Third Trimester'];
  const [currentStep, setCurrentStep] = useState(1);
  const progress = ((currentStep - 1) / (steps.length - 1)) * 100;

  const facts = [
    "A baby's heart starts beating at just 6 weeks.",
    'Your blood volume increases by 40-50% during pregnancy.',
    'Babies can hear their mother\'s voice from inside the womb.',
    'The longest recorded pregnancy was 375 days long!',
  ];

  const trimesterTips = {
    1: [
      "Stay hydrated - aim for 8-10 glasses of water daily",
      "Take your prenatal vitamins with food",
      "Get plenty of rest - your body is working hard",
      "Eat small, frequent meals to manage nausea",
    ],
    2: [
      "Incorporate regular, gentle exercise like swimming or walking",
      "Start doing Kegel exercises to strengthen pelvic floor muscles",
      "Moisturize your belly to help with itchy skin",
      "Sleep on your side, preferably the left, for better blood flow",
    ],
    3: [
      "Pack your hospital bag and have it ready",
      "Track your baby's movements daily",
      "Learn the signs of labor",
      "Rest and elevate your feet whenever possible to reduce swelling",
    ],
  };

  const initialTodos = [
    { text: 'Drink 8-10 glasses of water', completed: false },
    { text: 'Take your prenatal vitamins', completed: true },
    { text: 'Go for a 30-minute walk', completed: false },
    { text: 'Practice deep breathing for 10 minutes', completed: false },
    { text: 'Eat a nutrient-rich meal', completed: false },
  ];
  
  const trimesterSizes = {
    1: { fruit: 'lemon', image: '/images/lemon.png' },
    2: { fruit: 'pineapple', image: '/images/pineapple.svg' },
    3: { fruit: 'watermelon', image: '/images/watermelon.png' },
  };

  const [currentFact, setCurrentFact] = useState(0);
  const [todos, setTodos] = useState(initialTodos);
  const currentSize = trimesterSizes[currentStep];
  const currentTips = trimesterTips[currentStep];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentFact((prevFact) => (prevFact + 1) % facts.length);
    }, 5000); // Change fact every 5 seconds
    return () => clearInterval(timer);
  }, [facts.length]);

  const toggleTodo = (index) => {
    const newTodos = [...todos];
    newTodos[index].completed = !newTodos[index].completed;
    setTodos(newTodos);
  };

  return (
    <div className="bg-white min-h-screen flex flex-col relative overflow-hidden">
      {/* Decorative Background Shapes */}
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-purple-100 rounded-full opacity-50" />
      <div className="absolute -bottom-24 -right-12 w-96 h-96 bg-pink-100 rounded-full opacity-50" />

      <header className="relative z-10 flex justify-center pt-8">
        <Logo className="text-4xl" />
      </header>
      <main className="relative z-10 flex-grow flex flex-col items-center pt-12">
        <div className="w-full max-w-4xl px-4">
          {/* Progress Bar */}
          <div className="relative mb-12">
            <div className="absolute top-5 left-0 w-full px-5">
              <div className="relative w-full h-0.5 bg-gray-300">
                <div
                  className="absolute top-0 left-0 h-full bg-pink-400 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <div className="relative flex justify-between">
              {steps.map((step, index) => (
                <div
                  key={step}
                  className="text-center cursor-pointer"
                  onClick={() => setCurrentStep(index + 1)}
                >
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center mx-auto relative transition-colors duration-300 ${
                      index + 1 <= currentStep
                        ? 'bg-pink-400 text-white'
                        : 'bg-white border-2 border-gray-300 text-gray-500'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <p
                    className={`mt-2 text-sm transition-colors duration-300 ${
                      index + 1 <= currentStep ? 'font-semibold text-gray-900' : 'text-gray-500'
                    }`}
                  >
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Left Column: Fun Fact */}
            <div className="bg-purple-50 rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4" style={{fontFamily: 'Poppins'}}>Did you know?</h2>
              <div className="relative h-32 flex items-center">
                <p className="text-lg text-gray-600">{facts[currentFact]}</p>
              </div>
            </div>

            {/* Right Column: Today's Tip */}
            <div className="bg-pink-50 rounded-2xl p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-4" style={{fontFamily: 'Poppins'}}>Today's Tip</h3>
              <div className="space-y-3">
                {currentTips.map((tip, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-gray-700 text-sm">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Baby Size Visualizer */}
          <div className="bg-green-50 rounded-2xl p-6 w-full text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4" style={{fontFamily: 'Poppins'}}>Your baby is growing!</h2>
            {currentSize && (
              <div className="flex flex-col items-center justify-center">
                <div className="w-24 h-24 mb-4">
                  <img src={currentSize.image} alt={currentSize.fruit} className="w-full h-full object-contain" />
                </div>
                <div className="text-center">
                  <p className="text-xl text-gray-700">This trimester, they're about the size of a</p>
                  <p className="text-3xl font-bold text-gray-900">{currentSize.fruit}!</p>
                </div>
              </div>
            )}
          </div>

          {/* Log Your Day Button */}
          <div className="text-center mt-8 mb-16">
            <Link to={`/daily-log?trimester=${currentStep}`}>
              <button
                className="bg-carnation-pink text-black px-8 py-3 rounded-lg font-semibold hover:bg-black hover:text-white transition-colors"
                style={{fontFamily: 'Fredoka'}}
              >
                Log Your Day
              </button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LoginPage; 