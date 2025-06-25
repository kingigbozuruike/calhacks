import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FaPaperPlane, FaTimes, FaMicrophone } from 'react-icons/fa';
import VoiceModeIcon from '../components/VoiceModeIcon';
import Logo from '../components/Logo';
import TypingIndicator from '../components/TypingIndicator';
import Vapi from '@vapi-ai/web';

// VAPI Configuration
const PUBLIC_VAPI_KEY = "ca0c3517-117a-4aaf-9f5f-2142354d303b";
const LUNA_ASSISTANT_ID = "50081e37-8bee-4d48-9474-2cfecfc5ba36";

const vapi = new Vapi(PUBLIC_VAPI_KEY);

const VoiceModeOverlay = ({ close, vapiCallStatus, vapiTranscript, onToggleVapiCall }) => {
  const scrollRef = useRef(null);

  // Auto-scroll transcript to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [vapiTranscript]);

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col items-center p-8">
      <div className="flex-grow flex flex-col items-center justify-center max-w-4xl w-full">
        {/* Visual indicator */}
        <div className={`w-40 h-40 md:w-56 md:h-56 sphere-animation ${vapiCallStatus === 'in-call' ? 'recording' : ''}`}></div>

        {/* Status text */}
        <p className="text-gray-600 text-xl md:text-2xl mt-8 h-16 text-center">
          {vapiCallStatus === 'in-call' ? "Voice chat active - Speak naturally" :
           vapiCallStatus === 'starting' ? "Connecting..." :
           vapiCallStatus === 'ending' ? "Ending call..." :
           vapiCallStatus.startsWith('error') ? vapiCallStatus :
           "Click the microphone to start voice chat"}
        </p>

        {/* Transcript display */}
        <div
          ref={scrollRef}
          className="w-full max-w-2xl h-64 mt-8 p-4 bg-gray-50 rounded-lg overflow-y-auto border"
        >
          <h3 className="font-semibold text-gray-800 mb-4">Conversation Transcript:</h3>
          {vapiTranscript.length === 0 ? (
            <p className="text-gray-500 italic">Transcript will appear here during the conversation...</p>
          ) : (
            <div className="space-y-2">
              {vapiTranscript.map((msg, index) => (
                <div key={index} className={`p-2 rounded ${
                  msg.role === 'user' ? 'bg-blue-100 text-blue-800' :
                  msg.role === 'assistant' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  <span className="font-medium capitalize">{msg.role}:</span> {msg.text}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Control buttons */}
      <div className="flex items-center space-x-8 pb-8">
        <button
          onClick={onToggleVapiCall}
          disabled={vapiCallStatus === 'starting' || vapiCallStatus === 'ending'}
          className={`p-4 rounded-full transition-colors ${
            vapiCallStatus === 'in-call'
              ? 'bg-red-100 hover:bg-red-200 text-red-600'
              : 'bg-green-100 hover:bg-green-200 text-green-600'
          }`}
        >
          <FaMicrophone size={24} className={vapiCallStatus === 'in-call' ? 'animate-pulse' : ''} />
        </button>
        <button
          onClick={() => {
            // Stop VAPI call if it's active
            if (vapiCallStatus === 'in-call') {
              onToggleVapiCall();
            }
            close();
          }}
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
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // User and trimester state
  const [userContext, setUserContext] = useState(null);
  const [isLoadingContext, setIsLoadingContext] = useState(true);
  const [sessionId, setSessionId] = useState(null);

  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [vapiCallStatus, setVapiCallStatus] = useState('idle');
  const [vapiTranscript, setVapiTranscript] = useState([]);

  // VAPI event handlers
  const handleVapiCallStart = () => {
    console.log('Vapi: Call Started');
    setVapiCallStatus('in-call');
    setVapiTranscript([{ role: 'system', text: 'Voice call connected. Please speak.' }]);
  };

  const handleVapiCallEnd = () => {
    console.log('Vapi: Call Ended');
    setVapiCallStatus('idle');
    setVapiTranscript(prev => [...prev, { role: 'system', text: 'Voice call disconnected.' }]);
  };

  const handleVapiMessage = (message) => {
    console.log('Vapi Message Received:', message);
    if (message.type === 'transcript') {
      setVapiTranscript(prev => [...prev, { role: message.role, text: message.transcript }]);

      // Add transcript to chat messages
      if (message.role === 'user' || message.role === 'assistant') {
        const chatMessage = {
          id: Date.now() + Math.random(),
          text: message.transcript,
          sender: message.role === 'user' ? 'user' : 'ai'
        };
        setMessages(prevMessages => [...prevMessages, chatMessage]);
      }
    } else if (message.type === 'function-call') {
      setVapiTranscript(prev => [...prev, { role: 'system', text: `AI requested function: ${message.functionCall.name}` }]);
    }
  };

  const handleVapiError = (error) => {
    console.error('Vapi Error:', error);
    setVapiCallStatus(`error: ${error.message}`);
    setVapiTranscript(prev => [...prev, { role: 'system', text: `Error: ${error.message}` }]);
  };

  // Setup VAPI event listeners
  useEffect(() => {
    vapi.on('call-start', handleVapiCallStart);
    vapi.on('call-end', handleVapiCallEnd);
    vapi.on('message', handleVapiMessage);
    vapi.on('error', handleVapiError);

    return () => {
      vapi.off('call-start', handleVapiCallStart);
      vapi.off('call-end', handleVapiCallEnd);
      vapi.off('message', handleVapiMessage);
      vapi.off('error', handleVapiError);
    };
  }, []);

  const toggleVapiCall = async () => {
    if (vapiCallStatus === 'in-call') {
      setVapiCallStatus('ending');
      vapi.stop();
    } else {
      setVapiCallStatus('starting');
      try {
        // Request microphone permission
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());

        // Start VAPI call
        vapi.start(LUNA_ASSISTANT_ID);
      } catch (err) {
        console.error('Microphone access denied or error:', err);
        setVapiCallStatus('error: Mic access denied');
        setVapiTranscript(prev => [...prev, { role: 'system', text: 'Error: Please allow microphone access to use the voice assistant.' }]);
      }
    }
  };

  // Get trimester from URL params or user context
  const trimester = parseInt(searchParams.get('trimester')) || userContext?.trimester || 1;

  // Fetch user context on component mount
  useEffect(() => {
    const fetchUserContext = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const response = await fetch('https://calhacks.onrender.com/api/dashboard', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          const context = {
            trimester: data.data.user.trimester,
            weekOfPregnancy: data.data.user.weekOfPregnancy,
            dueDate: data.data.user.dueDate,
            firstName: data.data.user.firstName || 'there'
          };
          setUserContext(context);

          // Add initial welcome message
          setMessages([{
            id: 1,
            text: `Hi ${context.firstName}! How are you feeling today? I'm here to support you through your pregnancy journey.`,
            sender: 'ai'
          }]);
        } else {
          console.error('Failed to fetch user context');
        }
      } catch (error) {
        console.error('Error fetching user context:', error);
      } finally {
        setIsLoadingContext(false);
      }
    };

    fetchUserContext();
  }, [navigate]);

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
        icon: '/images/get-pregnant-icon.svg',
        title: 'First Trimester',
        weeks: 'Weeks 1–12',
        body: "So right now, you're in the very beginning of this journey — amazing! During the first trimester, your baby is just starting to form. Their brain and heart are developing, and while all that's happening, you might notice some changes in yourself too — like feeling extra tired, a bit queasy, or more emotional than usual. Totally normal — your body's working hard!"
    },
    2: {
        icon: '/images/get-pregnant-icon2.svg',
        title: 'Second Trimester',
        weeks: 'Weeks 13–26',
        body: "This is often the part where many moms start to feel a little better — nausea usually eases up, and you might get a burst of energy. Your baby's growing fast, and you might even feel them move for the first time! There may still be some discomfort, like backaches or that weird round ligament pain, but it's all part of the progress."
    },
    3: {
        icon: '/images/get-pregnant-icon3.svg',
        title: 'Third Trimester',
        weeks: 'Weeks 27–40',
        body: "You're in the home stretch! Your baby's getting bigger every week, and your body's preparing for delivery. It's normal to feel more out of breath, a little swollen, or even get practice contractions (those are called Braxton–Hicks). You've got this — every day is a step closer to meeting your little one."
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const currentTrimesterInfo = trimesterInfo[trimester];

  const handleSendMessage = async (fromVoice = false) => {
    const messageToSend = inputValue.trim();
    if (!messageToSend) return;

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Add user message to chat
    const userMessage = { id: Date.now(), text: messageToSend, sender: 'user' };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInputValue('');

    // Show typing indicator
    setIsTyping(true);

    try {
      const response = await fetch('https://calhacks.onrender.com/api/chatbot/message', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: messageToSend,
          sessionId: sessionId
        })
      });

      if (response.ok) {
        const data = await response.json();

        // Update session ID if provided
        if (data.data.sessionId) {
          setSessionId(data.data.sessionId);
        }

        // Add AI response to chat
        const aiMessage = {
          id: Date.now() + 1,
          text: data.data.botResponse,
          sender: 'ai'
        };

        setMessages(prevMessages => [...prevMessages, aiMessage]);
      } else {
        // Handle error response
        const errorMessage = {
          id: Date.now() + 1,
          text: "I'm sorry, I'm having trouble responding right now. Please try again.",
          sender: 'ai'
        };
        setMessages(prevMessages => [...prevMessages, errorMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Add error message to chat
      const errorMessage = {
        id: Date.now() + 1,
        text: "I'm sorry, I'm having trouble connecting right now. Please try again.",
        sender: 'ai'
      };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsTyping(false);
    }

    // If this was from voice mode, exit voice mode after sending
    if (fromVoice && isVoiceMode) {
      handleVoiceModeDeactivate();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  // Show loading state while fetching user context
  if (isLoadingContext) {
    return (
      <div className="h-screen bg-white flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-400 mb-4"></div>
        <p className="text-gray-600">Loading your chat...</p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-white flex flex-col">
      {isVoiceMode && (
        <VoiceModeOverlay
          close={handleVoiceModeDeactivate}
          vapiCallStatus={vapiCallStatus}
          vapiTranscript={vapiTranscript}
          onToggleVapiCall={toggleVapiCall}
        />
      )}

      <header className="flex justify-center pt-8">
        <Logo className="text-4xl" />
      </header>

      <div className="relative overflow-hidden p-8 shrink-0">
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-purple-100 rounded-full opacity-50"></div>
        <div className="absolute -bottom-24 -right-12 w-96 h-96 bg-green-100 rounded-full opacity-50"></div>

        <div className="relative max-w-3xl mx-auto flex items-center gap-8">
            <div className="w-40 h-40 p-4 bg-white/60 rounded-2xl backdrop-blur-sm">
                <img src={currentTrimesterInfo.icon} alt={currentTrimesterInfo.title} className="w-full h-full object-contain" />
            </div>
            <div className="text-gray-700">
                <p className="text-lg font-semibold text-purple-500">{currentTrimesterInfo.title}</p>
                <h2 className="text-3xl font-bold text-gray-800 mb-2" style={{fontFamily: 'Poppins'}}>{currentTrimesterInfo.weeks}</h2>
                <p className="text-sm">{currentTrimesterInfo.body}</p>
            </div>
        </div>
      </div>

      <main className="flex-grow overflow-y-auto p-4">
        <div className="max-w-3xl mx-auto w-full space-y-4 border-2 border-gray-200 rounded-3xl p-6 bg-white/80">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start gap-3 ${message.sender === 'user' ? 'justify-end' : ''}`}
            >
              {message.sender === 'ai' && (
                <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border-2 border-gray-200">
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
                <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border-2 border-gray-200">
                  <img src="/images/chat-avatar-lady.svg" alt="User" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          ))}
          {isTyping && <TypingIndicator />}
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
              onKeyDown={handleKeyDown}
              placeholder="Share your thoughts..."
              className="w-full border-2 border-gray-200 rounded-full py-3 pl-6 pr-28 focus:outline-none focus:border-pink-300 transition-colors"
            />
            <div className="absolute right-2 flex items-center">
              <button
                onClick={() => {
                  if (vapiCallStatus === 'idle') {
                    toggleVapiCall();
                    setIsVoiceMode(true);
                  } else {
                    toggleVapiCall();
                  }
                }}
                disabled={vapiCallStatus === 'starting' || vapiCallStatus === 'ending'}
                className={`p-2 focus:outline-none transition-colors ${
                  vapiCallStatus === 'in-call'
                    ? 'text-red-500 hover:text-red-600'
                    : 'text-gray-400 hover:text-pink-400'
                }`}
                title={vapiCallStatus === 'in-call' ? 'End voice chat' : 'Start voice chat'}
              >
                <FaMicrophone className={`w-6 h-6 ${vapiCallStatus === 'in-call' ? 'animate-pulse' : ''}`} />
              </button>
              <button
                onClick={handleSendMessage}
                className="bg-pink-400 text-white w-10 h-10 flex items-center justify-center rounded-full hover:bg-pink-500 transition-colors duration-300 focus:outline-none"
              >
                <FaPaperPlane size={20} />
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ChatPage;
