# Chat Feature Testing Guide

## Prerequisites
Make sure your server is running:
```bash
cd /Users/thetechking/Desktop/calhacks/backend
node server.js
```

## Test Commands

### 1. Basic Chat Message Test
```bash
curl -X POST "http://localhost:5000/api/chatbot/message" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hi, I am 8 weeks pregnant. What should I eat today?",
    "context": {
      "trimester": 1,
      "weekOfPregnancy": 8
    },
    "userId": "test_user_123"
  }'
```

### 2. Session-Based Conversation Test
First message (creates new session):
```bash
curl -X POST "http://localhost:5000/api/chatbot/message" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, I am in my first trimester",
    "context": {
      "trimester": 1,
      "weekOfPregnancy": 10
    },
    "userId": "session_test_user"
  }'
```

Copy the `sessionId` from the response, then send a follow-up message:
```bash
curl -X POST "http://localhost:5000/api/chatbot/message" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What exercises are safe for me?",
    "context": {
      "trimester": 1,
      "weekOfPregnancy": 10
    },
    "userId": "session_test_user",
    "sessionId": "PASTE_SESSION_ID_HERE"
  }'
```

### 3. Different Pregnancy Stages Test
Second trimester:
```bash
curl -X POST "http://localhost:5000/api/chatbot/message" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I am feeling baby movements now. Is this normal?",
    "context": {
      "trimester": 2,
      "weekOfPregnancy": 20
    },
    "userId": "trimester2_user"
  }'
```

Third trimester:
```bash
curl -X POST "http://localhost:5000/api/chatbot/message" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I am getting close to my due date. What should I prepare?",
    "context": {
      "trimester": 3,
      "weekOfPregnancy": 36
    },
    "userId": "trimester3_user"
  }'
```

### 4. Get Chat History Test
```bash
curl "http://localhost:5000/api/chatbot/history?userId=test_user_123&limit=10&offset=0"
```

### 5. Clear Chat History Test
```bash
curl -X DELETE "http://localhost:5000/api/chatbot/history" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user_123"
  }'
```

### 6. Test Session Summarization (Send 10+ Messages)
Create a script to test automatic summarization:
```bash
#!/bin/bash

# First message to create session
RESPONSE=$(curl -s -X POST "http://localhost:5000/api/chatbot/message" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hi, I am 12 weeks pregnant",
    "context": {"trimester": 1, "weekOfPregnancy": 12},
    "userId": "summary_test_user"
  }')

# Extract session ID (you might need to parse this manually)
echo "First response: $RESPONSE"
echo "Copy the sessionId and use it in the following commands:"

# Then send 9 more messages with the same sessionId to trigger summarization
```

### 7. Error Handling Tests

Empty message test:
```bash
curl -X POST "http://localhost:5000/api/chatbot/message" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "",
    "userId": "error_test_user"
  }'
```

Missing message test:
```bash
curl -X POST "http://localhost:5000/api/chatbot/message" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "error_test_user"
  }'
```

### 8. Comprehensive Conversation Flow Test
```bash
# Message 1: Introduction
curl -X POST "http://localhost:5000/api/chatbot/message" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hi! I just found out I am pregnant, about 6 weeks along",
    "context": {"trimester": 1, "weekOfPregnancy": 6},
    "userId": "flow_test_user"
  }'

# Message 2: Follow-up question (use sessionId from response above)
curl -X POST "http://localhost:5000/api/chatbot/message" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What vitamins should I be taking?",
    "context": {"trimester": 1, "weekOfPregnancy": 6},
    "userId": "flow_test_user",
    "sessionId": "PASTE_SESSION_ID_HERE"
  }'

# Message 3: Another follow-up
curl -X POST "http://localhost:5000/api/chatbot/message" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Are there any foods I should avoid?",
    "context": {"trimester": 1, "weekOfPregnancy": 6},
    "userId": "flow_test_user",
    "sessionId": "PASTE_SESSION_ID_HERE"
  }'
```

## What to Look For

### Successful Response Format:
```json
{
  "success": true,
  "data": {
    "sessionId": "sess_1234567890_user123",
    "userMessage": "Your message here",
    "botResponse": "AI generated response",
    "responseType": "advice",
    "suggestions": ["Follow-up question 1", "Follow-up question 2"],
    "context": {
      "trimester": 1,
      "weekOfPregnancy": 8
    },
    "conversationLength": 2,
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

### Key Features to Verify:
1. **Session Continuity**: Same sessionId should be returned for follow-up messages
2. **Context Awareness**: Responses should be relevant to pregnancy stage
3. **Conversation Length**: Should increment with each message in the session
4. **AI Integration**: Responses should be contextual and helpful
5. **Error Handling**: Proper error messages for invalid requests
6. **Summarization**: After 10 messages, session should be cleared and summarized

### Debug Information:
Check your server console for debug logs showing:
- Session creation and management
- AI response generation
- Conversation summarization (after 10 messages)
- Error handling

## Quick Test Script
Save this as `test-chat.sh`:
```bash
#!/bin/bash
echo "Testing basic chat message..."
curl -X POST "http://localhost:5000/api/chatbot/message" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, I am 8 weeks pregnant", "context": {"trimester": 1, "weekOfPregnancy": 8}, "userId": "quick_test"}'

echo -e "\n\nTesting chat history..."
curl "http://localhost:5000/api/chatbot/history?userId=quick_test"
```

Run with: `chmod +x test-chat.sh && ./test-chat.sh`
