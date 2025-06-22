# API Endpoint Testing Guide

This file contains curl commands to test all the endpoints in the pregnancy tracking backend API.

## Prerequisites
- Server should be running on `http://localhost:5000`
- MongoDB should be connected
- Replace `YOUR_JWT_TOKEN` with actual JWT token after registration/login

## Health Check

```bash
# Test server health
curl -X GET "http://localhost:5000/api/health"
```

## Authentication Endpoints

### Register User
```bash
curl -X POST "http://localhost:5000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "password123"
  }'
```

### Login User
```bash
curl -X POST "http://localhost:5000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane@example.com",
    "password": "password123"
  }'
```

## Profile Endpoints

### Get User Profile
```bash
curl -X GET "http://localhost:5000/api/profile" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Update User Profile
```bash
curl -X POST "http://localhost:5000/api/profile" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "pregnancyStage": "first_trimester",
    "conceptionDate": "2024-01-15"
  }'
```

## Logs Endpoints

### Create New Log
```bash
curl -X POST "http://localhost:5000/api/logs" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "text": "Feeling great today! Had a good breakfast and took my vitamins.",
    "date": "2024-01-20"
  }'
```

### Get User Logs
```bash
# Get all logs
curl -X GET "http://localhost:5000/api/logs" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get logs by date range
curl -X GET "http://localhost:5000/api/logs?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Dashboard Endpoints

### Get Dashboard Data
```bash
# Basic dashboard data
curl -X GET "http://localhost:5000/api/dashboard?trimester=1&weekOfPregnancy=8"

# With user context (requires auth)
curl -X GET "http://localhost:5000/api/dashboard?trimester=1&weekOfPregnancy=8" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Tasks Endpoints

### Get Daily Tasks
```bash
curl -X GET "http://localhost:5000/api/tasks/daily?trimester=1&weekOfPregnancy=8"
```

### Get Trimester Tasks
```bash
curl -X GET "http://localhost:5000/api/tasks/trimester?trimester=1"
```

### Mark Task as Completed (if implemented)
```bash
curl -X POST "http://localhost:5000/api/tasks/check" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "taskId": "task_id_here",
    "isCompleted": true
  }'
```

## Chatbot Endpoints

### Send Message to Chatbot
```bash
curl -X POST "http://localhost:5000/api/chatbot/message" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I am feeling nauseous today, what should I do?",
    "sessionId": "session_123"
  }'
```

### Test Session Continuity
```bash
# First message
curl -X POST "http://localhost:5000/api/chatbot/message" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, I am 8 weeks pregnant",
    "sessionId": "test_session_456"
  }'

# Follow-up message (should remember context)
curl -X POST "http://localhost:5000/api/chatbot/message" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What foods should I avoid?",
    "sessionId": "test_session_456"
  }'
```

## Voice Check-in Endpoints

### Start Voice Check-in
```bash
curl -X POST "http://localhost:5000/api/voice-checkin/start" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "trimester": 1,
    "weekOfPregnancy": 8
  }'
```

### Get Voice Check-in History
```bash
curl -X GET "http://localhost:5000/api/voice-checkin/history" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Handle Vapi Webhook (for testing webhook functionality)
```bash
curl -X POST "http://localhost:5000/api/voice-checkin/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "call-ended",
    "callId": "test_call_123",
    "transcript": "I am feeling good today. I took my vitamins and had a healthy breakfast.",
    "summary": "User reported feeling well, took vitamins, ate healthy breakfast"
  }'
```

## Error Testing

### Test Invalid Routes
```bash
# Should return 404
curl -X GET "http://localhost:5000/api/nonexistent"
```

### Test Invalid Authentication
```bash
# Should return 401
curl -X GET "http://localhost:5000/api/profile" \
  -H "Authorization: Bearer invalid_token"
```

### Test Invalid Data
```bash
# Should return validation error
curl -X POST "http://localhost:5000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "",
    "email": "invalid-email",
    "password": "123"
  }'
```

## Testing Workflow

1. **Start the server**: `node server.js`
2. **Test health check** to ensure server is running
3. **Register a new user** and save the JWT token
4. **Login with the user** to verify authentication
5. **Update profile** with pregnancy information
6. **Test dashboard** endpoints with pregnancy data
7. **Create some logs** to test logging functionality
8. **Test chatbot** with various pregnancy-related questions
9. **Test voice check-in** functionality
10. **Test error cases** to ensure proper error handling

## Notes

- Replace `YOUR_JWT_TOKEN` with the actual token received from login/register
- Some endpoints may require specific data based on your database schema
- Voice check-in endpoints require Vapi integration to be properly configured
- Session IDs for chatbot should be unique for each conversation
- Date formats should be in ISO format (YYYY-MM-DD)

## Expected Response Formats

Most successful responses will follow this format:
```json
{
  "success": true,
  "data": { ... },
  "message": "Success message"
}
```

Error responses will follow this format:
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error information"
}
```
