# Vapi Voice Integration Implementation Plan

## Overview
We're implementing comprehensive voice capabilities for the pregnancy app using Vapi, including voice-based daily check-ins, voice chatbot, medication reminders, and emergency contact features.

## 1. Voice-Based Daily Check-ins

### Functionality
- User speaks their daily log instead of typing
- AI analyzes speech for potential health concerns or red flags
- If concerns detected: Show popup with findings and recommendations
- If no concerns: Show success notification
- Extract relevant information to add to user's pregnancy context

### Technical Implementation
- **VapiService.js**: Voice recording and transcription
- **VoiceLogController.js**: Handle voice log processing
- **HealthAnalysisService.js**: Analyze transcribed text for health concerns
- **Routes**: `POST /api/voice/daily-checkin`

### Health Monitoring Keywords/Phrases to Flag:
- Pain-related: "severe pain", "cramping", "bleeding", "spotting"
- Symptoms: "nausea", "vomiting", "dizziness", "headache", "swelling"
- Emotional: "depressed", "anxious", "worried", "scared"
- Physical: "can't sleep", "no appetite", "very tired"

### Response Flow:
1. User starts voice recording
2. Vapi transcribes speech to text
3. AI analyzes for health concerns
4. If concerns found: Generate recommendations and show popup
5. If no concerns: Log entry and show success message
6. Extract context (symptoms, mood, activities) for user profile

## 2. Voice Chatbot Integration

### Functionality
- Voice-based conversations with pregnancy assistant
- Fetches user context from database for personalized responses
- Maintains conversation continuity like text chat
- Supports both voice input and voice output (TTS)

### Technical Implementation
- **VoiceChatController.js**: Handle voice chat sessions
- **VapiService.js**: Voice-to-text and text-to-voice conversion
- Integration with existing **ChatController.js** and **SessionService.js**
- **Routes**: `POST /api/voice/chat`, `GET /api/voice/chat/history`

### Features:
- Real-time voice conversation
- Context-aware responses based on pregnancy stage
- Voice session management
- Fallback to text if voice fails

## 3. Medication/Task Reminders via Voice Calls

### Functionality
- Automatically call users at specified times for reminders
- Read out tasks/medications from their todo list
- Allow users to confirm completion via voice
- Reschedule if user doesn't answer or requests delay

### Technical Implementation
- **ReminderService.js**: Schedule and manage reminder calls
- **VapiService.js**: Outbound call functionality
- **TaskController.js**: Integration with existing task system
- **Routes**: `POST /api/voice/reminders/schedule`, `GET /api/voice/reminders`

### Reminder Flow:
1. User sets reminder time for specific tasks/medications
2. System schedules call using Vapi
3. At scheduled time, Vapi calls user
4. Reads reminder message
5. User can respond: "Done", "Remind me in 30 minutes", "Skip today"
6. System updates task status accordingly

## 4. Emergency Contact Voice Assistant

### Functionality
- User clicks emergency button and speaks command
- AI extracts contact person and emergency details
- Automatically calls the specified contact
- Delivers emergency message with user's location and situation

### Technical Implementation
- **EmergencyService.js**: Handle emergency call logic
- **ContactService.js**: Manage user's emergency contacts
- **VapiService.js**: Voice recognition and outbound calling
- **Routes**: `POST /api/voice/emergency`, `GET /api/voice/emergency/contacts`

### Emergency Flow:
1. User clicks emergency button
2. Voice prompt: "What's your emergency?"
3. User speaks: "Call my husband and tell him I'm bleeding"
4. AI extracts: Contact="husband", Message="bleeding"
5. System finds husband's number from contacts
6. Vapi calls husband with automated message
7. Message includes: User's name, situation, location, timestamp

### Emergency Message Template:
"This is an automated emergency call for [User Name]. She has reported [Emergency Situation] and may need assistance. Her current location is [Location]. This call was made at [Timestamp]. Please contact her immediately or call emergency services if needed."

## Vapi Assistant Configuration

### Assistant Prompts for Vapi Dashboard

You'll need to create these assistants in your Vapi dashboard:

#### 1. Daily Check-in Assistant
```
Name: Pregnancy Daily Check-in
System Prompt: You are a caring pregnancy health assistant helping with daily check-ins. Listen to the user's daily update about how they're feeling, any symptoms, activities, or concerns. Be empathetic and supportive. Ask follow-up questions if needed to get a complete picture of their day. Keep responses warm but concise. Focus on gathering information about their physical and emotional wellbeing.

First Message: "Hi! I'm here for your daily check-in. How are you feeling today? Tell me about any symptoms, activities, or anything else on your mind."
```

#### 2. Voice Chatbot Assistant
```
Name: Pregnancy Support Chatbot
System Prompt: You are a knowledgeable and empathetic pregnancy support assistant. You have access to the user's pregnancy information including their trimester, due date, and previous conversations. Provide helpful, accurate information about pregnancy, answer questions, offer emotional support, and give practical advice. Always be supportive and never provide medical diagnoses - recommend consulting healthcare providers for medical concerns. Keep responses conversational and caring.

First Message: "Hello! I'm your pregnancy support assistant. I'm here to help answer questions, provide support, or just chat about your pregnancy journey. What would you like to talk about today?"
```

#### 3. Medication Reminder Assistant
```
Name: Medication Reminder
System Prompt: You are a friendly medication reminder assistant. Your job is to remind users about their medications or pregnancy tasks in a gentle, encouraging way. Listen for their response - they might say "done", "remind me later", "skip today", or ask questions. Be understanding if they need to reschedule. Keep interactions brief but warm.

First Message: "Hi! This is your reminder call. It's time for [TASK_NAME]. Have you completed this task today?"
```

#### 4. Emergency Contact Assistant
```
Name: Emergency Contact Helper
System Prompt: You are an emergency assistant for pregnant women. Listen carefully to extract: 1) Who to call (husband, mom, doctor, etc.) 2) What the emergency situation is. Be calm, clear, and quick. Ask for clarification only if absolutely necessary. Once you have the information, confirm the details before proceeding with the emergency call.

First Message: "I'm here to help with your emergency. Please tell me who you need me to call and what's happening."
```

#### 5. Emergency Message Delivery Assistant
```
Name: Emergency Message Delivery
System Prompt: You are delivering an emergency message on behalf of a pregnant woman. Speak clearly and calmly. Deliver the pre-written emergency message exactly as provided. If the person has questions, explain that this is an automated emergency call and they should contact the person directly or emergency services if needed.

First Message: "[This will be dynamically generated with the emergency message]"
```

### Configuration Settings for Each Assistant:
- **Voice**: Choose a warm, female voice (e.g., "nova" or "alloy")
- **Language**: English (US)
- **Response Time**: Fast (for emergency scenarios)
- **Interruption Handling**: Allow interruptions for natural conversation
- **Silence Detection**: 2-3 seconds for daily check-ins, 1-2 seconds for emergencies

## Required Setup on Your End

### 1. Vapi Account Setup
- [ ] Create Vapi account at https://vapi.ai
- [ ] Get API key and add to `.env` file
- [ ] Set up phone number for outbound calls (if needed)
- [ ] Configure voice models and TTS settings

### 2. Environment Variables to Add
```env
# Vapi Configuration
VAPI_API_KEY=your_vapi_api_key_here
VAPI_PHONE_NUMBER=your_vapi_phone_number
VAPI_WEBHOOK_URL=http://localhost:5000/api/voice/webhook
```

### 3. Database Schema Updates
- **User Model**: Add emergency contacts array
- **VoiceLog Model**: Store voice transcriptions and analysis
- **Reminder Model**: Store scheduled voice reminders
- **EmergencyContact Model**: Store contact details and relationships

### 4. Frontend Integration Points
- Voice recording button for daily check-ins
- Voice chat interface with microphone controls
- Emergency button with voice command interface
- Reminder scheduling interface
- Health concern popup component

### 5. Permissions Required
- Microphone access for voice recording
- Location access for emergency calls
- Phone contacts access (optional, for easier emergency contact setup)

## File Structure to be Created/Modified

```
backend/
├── services/
│   ├── VapiService.js (main Vapi integration)
│   ├── HealthAnalysisService.js (health concern detection)
│   ├── ReminderService.js (voice reminder scheduling)
│   ├── EmergencyService.js (emergency call handling)
│   └── ContactService.js (emergency contact management)
├── controllers/
│   ├── VoiceLogController.js (voice daily check-ins)
│   ├── VoiceChatController.js (voice chatbot)
│   ├── ReminderController.js (voice reminders)
│   └── EmergencyController.js (emergency calls)
├── models/
│   ├── VoiceLog.js (voice log entries)
│   ├── EmergencyContact.js (emergency contacts)
│   └── VoiceReminder.js (scheduled reminders)
├── routes/
│   ├── voice.js (all voice-related routes)
│   └── emergency.js (emergency-specific routes)
└── utils/
    └── voiceAnalysis.js (voice processing utilities)
```

## Testing Strategy
- Unit tests for each voice service
- Integration tests for voice-to-text accuracy
- Emergency call simulation tests
- Health analysis accuracy tests
- Voice chat conversation flow tests

## Security Considerations
- Encrypt voice recordings if stored
- Secure emergency contact information
- Rate limiting for emergency calls
- Authentication for all voice endpoints
- Privacy compliance for voice data

## Estimated Development Time
- Voice Daily Check-ins: 2-3 days
- Voice Chatbot: 2-3 days
- Medication Reminders: 2-3 days
- Emergency Contact System: 3-4 days
- Testing & Integration: 2-3 days
- **Total: 11-16 days**

## Dependencies to Install
```bash
npm install @vapi-ai/web-sdk
npm install node-cron  # for scheduling reminders
npm install twilio     # backup for SMS if voice fails
```

---

**Please review this plan and confirm:**
1. Are all the features as you envisioned?
2. Any modifications to the emergency contact flow?
3. Any additional health monitoring keywords to flag?
4. Preferred voice reminder frequency options?
5. Any specific Vapi features you want to prioritize?

Once confirmed, I'll start implementing each component systematically.
