import React, { useState, useEffect, useRef } from 'react';
import Vapi from '@vapi-ai/web'; // Import the Vapi Web SDK

// --- IMPORTANT: REPLACE THESE WITH YOUR ACTUAL KEYS/IDs ---
// This is your Vapi Public Key, safe to expose in frontend code.
const PUBLIC_VAPI_KEY = "ca0c3517-117a-4aaf-9f5f-2142354d303b";

// This is the ID of your "Bump" (formerly Luna) assistant.
// This ID should be the one generated by your backend's VapiService
// and likely stored in your .env as VAPI_ASSISTANT_ID.
const LUNA_ASSISTANT_ID = "50081e37-8bee-4d48-9474-2cfecfc5ba36";

// --- IMPORTANT: REPLACE THESE WITH YOUR ACTUAL KEYS/IDs ---

const vapi = new Vapi(PUBLIC_VAPI_KEY);

const VoiceAssistantButton = () => {
    const [callStatus, setCallStatus] = useState('idle');
    const [transcript, setTranscript] = useState([]);
    const transcriptRef = useRef(null);

    // --- Define your event handler functions with names ---
    const handleCallStart = () => {
        console.log('Vapi: Call Started');
        setCallStatus('in-call');
        setTranscript([{ role: 'system', text: 'Call connected. Please allow microphone access.' }]);
    };

    const handleCallEnd = () => {
        console.log('Vapi: Call Ended');
        setCallStatus('idle');
        setTranscript(prev => [...prev, { role: 'system', text: 'Call disconnected.' }]);
    };

    const handleMessage = (message) => {
        console.log('Vapi Message Received:', message);
        if (message.type === 'transcript') {
            setTranscript(prev => [...prev, { role: message.role, text: message.transcript }]);
        } else if (message.type === 'function-call') {
            setTranscript(prev => [...prev, { role: 'system', text: `AI requested function: ${message.functionCall.name}` }]);
        }
    };

    const handleError = (error) => {
        console.error('Vapi Error:', error);
        setCallStatus(`error: ${error.message}`);
        setTranscript(prev => [...prev, { role: 'system', text: `Error: ${error.message}` }]);
    };
    // --- End of named event handler definitions ---


    useEffect(() => {
        // --- Register event listeners using the named functions ---
        vapi.on('call-start', handleCallStart);
        vapi.on('call-end', handleCallEnd);
        vapi.on('message', handleMessage);
        vapi.on('error', handleError);

        // Clean up event listeners using the same named functions
        return () => {
            vapi.off('call-start', handleCallStart); // Pass the function reference
            vapi.off('call-end', handleCallEnd);   // Pass the function reference
            vapi.off('message', handleMessage);     // Pass the function reference
            vapi.off('error', handleError);         // Pass the function reference
        };
    }, []); // Empty dependency array means this runs once on mount/unmount

    // Scroll transcript to bottom whenever it updates
    useEffect(() => {
        if (transcriptRef.current) {
            transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
        }
    }, [transcript]);

    const toggleCall = async () => {
        if (callStatus === 'in-call') {
            setCallStatus('ending');
            vapi.stop();
        } else {
            setCallStatus('starting');
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                stream.getTracks().forEach(track => track.stop());

                vapi.start(LUNA_ASSISTANT_ID);
            } catch (err) {
                console.error('Microphone access denied or error:', err);
                setCallStatus('error: Mic access denied');
                setTranscript(prev => [...prev, { role: 'system', text: 'Error: Please allow microphone access to use the voice assistant.' }]);
            }
        }
    };

    return (
        <div style={{
            fontFamily: 'Arial, sans-serif',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 'calc(100vh - 40px)',
            margin: '20px',
            backgroundColor: '#f0f8ff',
            color: '#333',
            borderRadius: '10px',
            boxShadow: '0 0 10px rgba(0,0,0,0.1)'
        }}>
            <h1 style={{ color: '#4a90e2' }}>Talk to Bump</h1>
            <p>Click the button to start your daily pregnancy check-in with Luna.</p>

            <button
                onClick={toggleCall}
                disabled={callStatus === 'starting' || callStatus === 'ending'}
                style={{
                    padding: '15px 30px',
                    fontSize: '1.2em',
                    cursor: 'pointer',
                    border: 'none',
                    borderRadius: '8px',
                    backgroundColor: callStatus === 'in-call' ? '#dc3545' : '#66cc66',
                    color: 'white',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    transition: 'background-color 0.3s ease, transform 0.2s ease',
                    marginTop: '20px',
                    minWidth: '180px'
                }}
            >
                {callStatus === 'in-call' ? 'End Check-in' : 'Start Check-in'}
            </button>

            <div style={{ marginTop: '20px', fontSize: '1.1em', color: '#555' }}>
                Status: {callStatus.charAt(0).toUpperCase() + callStatus.slice(1)}
            </div>

            <div
                ref={transcriptRef}
                style={{
                    marginTop: '30px',
                    width: '80%',
                    maxWidth: '600px',
                    minHeight: '100px',
                    maxHeight: '300px',
                    padding: '15px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    backgroundColor: 'white',
                    boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.05)',
                    whiteSpace: 'pre-wrap',
                    overflowY: 'auto',
                    textAlign: 'left',
                    fontSize: '0.95em'
                }}
            >
                <strong>Conversation Log:</strong><br/>
                {transcript.map((msg, index) => (
                    <span key={index} style={{
                        color: msg.role === 'user' ? '#007bff' : (msg.role === 'assistant' ? '#28a745' : '#888'),
                        fontWeight: msg.role === 'user' || msg.role === 'assistant' ? 'bold' : 'normal'
                    }}>
                        {`${msg.role}: ${msg.text}`}
                        <br/>
                    </span>
                ))}
            </div>
        </div>
    );
};

export default VoiceAssistantButton;
