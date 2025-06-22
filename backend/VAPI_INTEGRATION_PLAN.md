# Vapi Voice Integration Implementation Plan (SDK Approach)

## Overview
We're implementing voice capabilities for the pregnancy app using Vapi Web SDK, focusing on voice-based daily check-ins and voice chatbot functionality.

## 1. Voice-Based Daily Check-ins

### Functionality
- User clicks "Start Voice Check-in" button
- Records voice using Vapi Web SDK
- Transcribes speech to text
- AI analyzes for health concerns or red flags
- Shows results and saves to database

### Technical Implementation
- **Frontend**: Vapi Web SDK for voice recording
- **Backend**: Process transcribed text and analyze for health concerns
- **Routes**: `POST /api/voice/daily-checkin`

### Health Monitoring Keywords to Flag:
- Pain: "severe pain", "cramping", "bleeding", "spotting"
- Symptoms: "nausea", "vomiting", "dizziness", "headache", "swelling"
- Emotional: "depressed", "anxious", "worried", "scared"
- Physical: "can't sleep", "no appetite", "very tired"

## 2. Voice Chatbot Integration

### Functionality
- Voice-based conversations with pregnancy assistant
- Uses existing chat logic with voice input/output
- Maintains conversation continuity

### Technical Implementation
- **Frontend**: Vapi Web SDK for voice interaction
- **Backend**: Existing chat endpoints with voice support
- **Routes**: `POST /api/voice/chat`

## Frontend Implementation (React/Next.js)

### Install Vapi Web SDK
```bash
npm install @vapi-ai/web
```

### Voice Check-in Component
```javascript
import Vapi from '@vapi-ai/web';

const VoiceCheckin = () => {
  const vapi = new Vapi('your-public-key');

  const startVoiceCheckin = async () => {
    try {
      // Start voice recording
      const response = await vapi.start({
        transcriber: {
          provider: 'deepgram',
          model: 'nova-2',
          language: 'en-US'
        },
        voice: {
          provider: 'playht',
          voiceId: 'jennifer'
        },
        model: {
          provider: 'openai',
          model: 'gpt-3.5-turbo',
          messages: [{
            role: 'system',
            content: 'You are a pregnancy health assistant. Listen to the user\'s daily check-in and respond supportively.'
          }]
        }
      });

      // Handle the transcribed text
      vapi.on('speech-end', (transcript) => {
        sendToBackend(transcript);
      });

    } catch (error) {
      console.error('Voice recording failed:', error);
    }
  };

  const sendToBackend = async (transcript) => {
    try {
      const response = await fetch('/api/voice/daily-checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript })
      });

      const result = await response.json();
      // Handle response (show concerns, success message, etc.)
    } catch (error) {
      console.error('Failed to process voice check-in:', error);
    }
  };

  return (
    <button onClick={startVoiceCheckin}>
      Start Voice Check-in
    </button>
  );
};
```

### Voice Chat Component
```javascript
const VoiceChat = () => {
  const vapi = new Vapi('your-public-key');

  const startVoiceChat = async () => {
    try {
      await vapi.start({
        transcriber: {
          provider: 'deepgram',
          model: 'nova-2',
          language: 'en-US'
        },
        voice: {
          provider: 'playht',
          voiceId: 'jennifer'
        },
        model: {
          provider: 'openai',
          model: 'gpt-3.5-turbo',
          messages: [{
            role: 'system',
            content: 'You are a supportive pregnancy assistant. Provide helpful, accurate information about pregnancy.'
          }]
        }
      });

      // Handle conversation
      vapi.on('message', (message) => {
        console.log('Assistant:', message);
      });

    } catch (error) {
      console.error('Voice chat failed:', error);
    }
  };

  return (
    <button onClick={startVoiceChat}>
      Start Voice Chat
    </button>
  );
};
```

## Backend Updates Needed

### 1. Voice Check-in Route
Already implemented in `/routes/voiceCheckin.js`

### 2. Voice Chat Route
```javascript
// Add to existing chat routes
router.post('/voice/chat', async (req, res) => {
  try {
    const { transcript, sessionId } = req.body;

    // Use existing chat logic
    const response = await chatController.processMessage({
      body: { message: transcript, sessionId }
    }, res);

    // Return response for voice synthesis
    res.json({
      success: true,
      message: response.message,
      audioUrl: null // Vapi will handle TTS
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

## Environment Variables Needed

Add to `.env`:
```
VAPI_PUBLIC_KEY=your_vapi_public_key
VAPI_PRIVATE_KEY=your_vapi_private_key
```

## Next Steps

### Backend (Already mostly complete):
1. ✅ Voice check-in endpoint implemented
2. ✅ Health analysis service ready
3. ✅ Database models created
4. ⏳ Add voice chat endpoint

### Frontend (To be implemented):
1. Install Vapi Web SDK
2. Create voice check-in component
3. Create voice chat component
4. Add voice controls to existing UI
5. Handle voice responses and errors

### Testing:
1. Test voice recording and transcription
2. Test health concern detection
3. Test voice chat functionality
4. Test error handling and fallbacks

## Simplified Architecture

```
Frontend (React/Next.js)
├── Vapi Web SDK
├── Voice Check-in Component
└── Voice Chat Component
    ↓
Backend (Node.js/Express)
├── /api/voice/daily-checkin
├── /api/voice/chat
├── Health Analysis Service
└── Existing Chat Logic
    ↓
Database (MongoDB)
├── VoiceCheckin Model
├── ChatHistory Model
└── User Model
```

This approach is much simpler than the assistant-based approach and gives you more control over the voice interactions while leveraging your existing backend logic.
