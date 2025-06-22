# Gemini AI Integration Guide

## Overview
The pregnancy tracker chatbot is now powered by **Google's Gemini AI**, providing intelligent, context-aware responses for pregnancy-related questions.

## ✨ Key Features

### 🤖 Intelligent Responses
- Context-aware responses based on user's trimester and week of pregnancy
- Evidence-based pregnancy information
- Supportive and empathetic tone
- Structured JSON responses with categorization

### 🎯 Pregnancy-Focused Prompting
- Specialized prompts for pregnancy-related queries
- Trimester-specific advice and information
- Safety reminders to consult healthcare providers
- Practical, actionable advice

### 🔄 Fallback System
- Graceful fallback to keyword-based responses if Gemini API is unavailable
- Ensures chatbot always provides helpful responses
- No service interruption during API issues

### 📊 Response Categorization
- Automatic categorization: nutrition, symptoms, exercise, development, medical, general
- Relevant follow-up question suggestions
- Trimester-appropriate content recommendations

## 🔧 Configuration

### Environment Setup
Your Gemini API key is already configured in the `.env` file:
```bash
GEMINI_API_KEY=AIzaSyALUmd8XIor6bweaJ0-bLDVUaG6vZyw7c4
```

### Dependencies
The `@google/generative-ai` package has been added to `package.json`:
```json
{
  "dependencies": {
    "@google/generative-ai": "^0.21.0"
  }
}
```

## 🚀 How It Works

1. **User Input**: User sends a message with pregnancy context (trimester, week, due date)
2. **Prompt Building**: GeminiService builds a specialized pregnancy-focused prompt
3. **AI Generation**: Gemini AI generates a contextual, supportive response
4. **Response Parsing**: Response is parsed and categorized with follow-up suggestions
5. **Fallback**: If API fails, system gracefully falls back to keyword-based responses

## 📝 Usage Example

### API Request
```bash
curl -X POST "http://localhost:5000/api/chatbot/message" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I have morning sickness, what can I do?",
    "context": {
      "trimester": 1,
      "weekOfPregnancy": 8,
      "dueDate": "2024-08-15T00:00:00.000Z"
    }
  }'
```

### Expected Response
```json
{
  "success": true,
  "data": {
    "userMessage": "I have morning sickness, what can I do?",
    "botResponse": "Morning sickness is very common in the first trimester. Try eating small, frequent meals throughout the day and consider ginger tea or crackers. If symptoms are severe, contact your healthcare provider.",
    "responseType": "symptoms",
    "suggestions": [
      "Natural remedies for nausea",
      "When to call the doctor",
      "Foods that help with morning sickness"
    ],
    "context": {
      "trimester": 1,
      "weekOfPregnancy": 8
    },
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

## 🏗️ Implementation Details

### GeminiService Class
Located in `/services/GeminiService.js`, this service handles:
- API key validation and initialization
- Prompt engineering for pregnancy-specific responses
- Response parsing and categorization
- Fallback response generation
- Error handling and logging

### Prompt Engineering
The system uses carefully crafted prompts that include:
- User's pregnancy context (trimester, week, due date)
- Safety guidelines and medical disclaimers
- Response format specifications (JSON structure)
- Empathetic and supportive tone instructions

### Error Handling
- API failures gracefully fall back to keyword-based responses
- Malformed JSON responses are parsed and categorized
- Network issues don't break the chatbot functionality
- Comprehensive logging for debugging

## 🔍 Testing

### Start the Server
```bash
cd backend
npm install
npm start
```

### Test the Chatbot
```bash
# Test basic functionality
curl -X POST "http://localhost:5000/api/chatbot/message" \
  -H "Content-Type: application/json" \
  -d '{"message": "How much water should I drink?"}'

# Test with full context
curl -X POST "http://localhost:5000/api/chatbot/message" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What exercises are safe for me?",
    "context": {
      "trimester": 2,
      "weekOfPregnancy": 20,
      "dueDate": "2024-06-15T00:00:00.000Z"
    }
  }'
```

## 🎯 Response Categories

The AI automatically categorizes responses into:
- **nutrition**: Food, diet, vitamins, hydration
- **symptoms**: Morning sickness, fatigue, pain, discomfort
- **exercise**: Physical activity, yoga, walking, safety
- **development**: Baby growth, milestones, movements
- **medical**: Healthcare, appointments, medications
- **general**: General pregnancy advice and support

## 🔮 Future Enhancements

1. **Chat History Storage**: Implement database storage for conversation history
2. **Advanced Context**: Add user preferences and medical history context
3. **Multi-language Support**: Extend Gemini prompts for multiple languages
4. **Personalization**: Learn from user interactions to improve responses
5. **Voice Integration**: Add voice input/output capabilities
6. **Image Analysis**: Allow users to share images for analysis

## 🛠️ Troubleshooting

### API Key Issues
- Ensure `GEMINI_API_KEY` is set in `.env` file
- Verify API key is valid and has proper permissions
- Check API quota and usage limits

### Response Quality
- The system includes fallback responses for when Gemini is unavailable
- Responses are designed to be supportive and medically responsible
- All responses include reminders to consult healthcare providers

### Performance
- Responses typically take 1-3 seconds depending on network conditions
- Fallback responses are instantaneous
- Consider implementing response caching for common questions
