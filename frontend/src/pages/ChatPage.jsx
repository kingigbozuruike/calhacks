import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FaPaperPlane, FaUserCircle, FaTimes, FaMicrophone } from 'react-icons/fa';
import VoiceModeIcon from '../components/VoiceModeIcon';
import Logo from '../components/Logo';

const VoiceModeOverlay = ({ close, transcript, isRecording, onStartRecording }) => {
  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col items-center p-8">
      <div className="flex-grow flex flex-col items-center justify-center">
        <div className={`w-40 h-40 md:w-56 md:h-56 sphere-animation ${isRecording ? 'recording' : ''}`}></div>
        <p className="text-gray-600 text-xl md:text-2xl mt-8 h-16 text-center">
          {isRecording ? transcript || "Listening..." : "Tap the microphone to start recording"}
        </p>
      </div>

      <div className="flex items-center space-x-8 pb-8">
        <button
          onClick={onStartRecording}
          className="bg-gray-100 p-4 rounded-full hover:bg-gray-200 transition-colors"
        >
          <FaMicrophone size={24} className="text-gray-700" />
        </button>
        <button
          onClick={close}
          className="bg-gray-100 p-4 rounded-full hover:bg-gray-200 transition-colors"
        >
          <FaTimes size={24} className="text-gray-700" />
        </button>
      </div>
    </div>
  );
};

const ChatPage = () => {
  const [searchParams] = useSearchParams();
  const trimester = parseInt(searchParams.get('trimester')) || 1;
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const [messages, setMessages] = useState([
    { id: 1, text: "How are you feeling today?", sender: 'ai' },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) {
      console.error("Speech recognition not supported");
      return;
    }

    const SpeechRecognition = window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => {
      setIsRecording(false);
      // Don't automatically exit voice mode, let user decide
    };
    recognition.onerror = (event) => console.error('Speech recognition error: ', event.error);
    
    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      setInputValue(finalTranscript + interimTranscript);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, [isVoiceMode]); 
  
  const handleVoiceModeActivate = () => {
    if (recognitionRef.current) {
      setInputValue('');
      setIsVoiceMode(true);
      // Don't start recording immediately, wait for user to click microphone
    }
  };

  const handleVoiceModeDeactivate = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsVoiceMode(false);
    setIsRecording(false);
  };

  const handleStartRecording = () => {
    if (recognitionRef.current && isVoiceMode) {
      if (isRecording) {
        // Stop recording
        recognitionRef.current.stop();
      } else {
        // Start recording
        setInputValue('');
        recognitionRef.current.start();
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const trimesterInfo = {
    1: {
        icon: '🍼',
        title: 'First Trimester',
        weeks: 'Weeks 1–12',
        body: "So right now, you're in the very beginning of this journey — amazing! During the first trimester, your baby is just starting to form. Their brain and heart are developing, and while all that's happening, you might notice some changes in yourself too — like feeling extra tired, a bit queasy, or more emotional than usual. Totally normal — your body's working hard!"
    },
    2: {
        icon: '🤰',
        title: 'Second Trimester',
        weeks: 'Weeks 13–26',
        body: "This is often the part where many moms start to feel a little better — nausea usually eases up, and you might get a burst of energy. Your baby's growing fast, and you might even feel them move for the first time! There may still be some discomfort, like backaches or that weird round ligament pain, but it's all part of the progress."
    },
    3: {
        icon: '🤱',
        title: 'Third Trimester',
        weeks: 'Weeks 27–40',
        body: "You're in the home stretch! Your baby's getting bigger every week, and your body's preparing for delivery. It's normal to feel more out of breath, a little swollen, or even get practice contractions (those are called Braxton–Hicks). You've got this — every day is a step closer to meeting your little one."
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const currentTrimesterInfo = trimesterInfo[trimester];

  const handleSendMessage = (fromVoice = false) => {
    const messageToSend = inputValue.trim();
    if (messageToSend) {
      setMessages([...messages, { id: Date.now(), text: messageToSend, sender: 'user' }]);
      setInputValue('');
      // Placeholder for AI response
      setTimeout(() => {
        setMessages((prevMessages) => [
          ...prevMessages,
          { id: Date.now() + 1, text: "Thanks for sharing. It's important to acknowledge your feelings.", sender: 'ai' },
        ]);
      }, 1000);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="h-screen bg-white flex flex-col">
      {isVoiceMode && <VoiceModeOverlay close={handleVoiceModeDeactivate} transcript={inputValue} isRecording={isRecording} onStartRecording={handleStartRecording} />}
      
      <header className="flex justify-center pt-8">
        <Logo className="text-4xl" />
      </header>
      
      <div className="relative overflow-hidden p-8 shrink-0">
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-purple-100 rounded-full opacity-50"></div>
        <div className="absolute -bottom-24 -right-12 w-96 h-96 bg-green-100 rounded-full opacity-50"></div>

        <div className="relative max-w-3xl mx-auto flex items-center gap-8">
            <div className="text-8xl p-4 bg-white/60 rounded-2xl shadow-md backdrop-blur-sm">
                {currentTrimesterInfo.icon}
            </div>
            <div className="text-gray-700">
                <p className="text-lg font-semibold text-purple-500">{currentTrimesterInfo.title}</p>
                <h2 className="text-3xl font-bold text-gray-800 font-fredoka mb-2">{currentTrimesterInfo.weeks}</h2>
                <p className="text-sm">{currentTrimesterInfo.body}</p>
            </div>
        </div>
      </div>

      <main className="flex-grow overflow-y-auto p-4">
        <div className="max-w-3xl mx-auto w-full space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start gap-3 ${message.sender === 'user' ? 'justify-end' : ''}`}
            >
              {message.sender === 'ai' && (
                <div className="w-8 h-8 rounded-full overflow-hidden shrink-0">
                  <img src="/images/representing-ai.webp" alt="AI" className="w-full h-full object-cover object-left" />
                </div>
              )}
              <div
                className={`max-w-xs md:max-w-md p-3 rounded-2xl ${
                  message.sender === 'user'
                    ? 'bg-blue-500 text-white rounded-br-none'
                    : 'bg-gray-200 text-gray-800 rounded-bl-none'
                }`}
              >
                {message.text}
              </div>
              {message.sender === 'user' && (
                 <FaUserCircle className="text-gray-400 text-3xl shrink-0" />
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>
      <footer className="p-4 shrink-0">
        <div className="max-w-3xl mx-auto">
          <div className="relative flex items-center">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Share your thoughts..."
              className="w-full border-2 border-gray-200 rounded-full py-3 pl-6 pr-28 focus:outline-none focus:border-pink-300 transition-colors"
            />
            <div className="absolute right-2 flex items-center">
              <button
                onClick={handleVoiceModeActivate}
                className="p-2 focus:outline-none"
              >
                <VoiceModeIcon className="w-6 h-6 text-gray-400 hover:text-pink-400" />
              </button>
              <button
                onClick={handleSendMessage}
                className="bg-pink-400 text-white w-10 h-10 flex items-center justify-center rounded-full hover:bg-pink-500 transition-colors duration-300 focus:outline-none"
              >
                <FaPaperPlane />
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ChatPage; 