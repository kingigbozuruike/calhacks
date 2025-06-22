# Testing Gemini API Integration

## 🚀 Quick Start Guide

### 1. Install Dependencies
```bash
cd /Users/thetechking/Desktop/calhacks/backend
npm install
```

### 2. Verify Environment Setup
Check that your `.env` file has the Gemini API key:
```bash
cat .env
```
Should show:
```
GEMINI_API_KEY=AIzaSyALUmd8XIor6bweaJ0-bLDVUaG6vZyw7c4
```

### 3. Start the Server
```bash
npm start
# or
node server.js
```

You should see:
```
Server running on port 5000
```

## 🧪 Testing Gemini API

### Test 1: Health Check
```bash
curl http://localhost:5000/api/health
```

**Expected Response:**
```json
{
  "message": "Server is running",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Test 2: AI-Powered Chatbot
```bash
curl -X POST "http://localhost:5000/api/chatbot/message" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How much water should I drink during pregnancy?",
    "context": {
      "trimester": 1,
      "weekOfPregnancy": 8,
      "dueDate": "2024-08-15T00:00:00.000Z"
    }
  }'
```

**Expected Response (AI-Generated):**
```json
{
  "success": true,
  "data": {
    "userMessage": "How much water should I drink during pregnancy?",
    "botResponse": "During your first trimester, aim for 8-10 glasses of water daily. Staying hydrated helps with morning sickness and supports your baby's development. If you're experiencing nausea, try sipping water throughout the day rather than drinking large amounts at once.",
    "responseType": "nutrition",
    "suggestions": [
      "What other drinks are safe during pregnancy?",
      "How can I manage morning sickness?",
      "What foods help with hydration?"
    ],
    "context": {
      "trimester": 1,
      "weekOfPregnancy": 8
    },
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

### Test 3: AI-Generated Dashboard Content
```bash
curl "http://localhost:5000/api/dashboard?trimester=1&weekOfPregnancy=8"
```

**Expected Response (AI-Generated Content):**
```json
{
  "success": true,
  "data": {
    "user": {
      "trimester": 1,
      "weekOfPregnancy": 8
    },
    "dailyContent": {
      "tip": {
        "id": 1234567890,
        "trimester": 1,
        "title": "Stay Hydrated Daily",
        "content": "At 8 weeks, your blood volume is increasing to support your growing baby. Drink 8-10 glasses of water daily to help reduce nausea and support healthy circulation.",
        "category": "health"
      },
      "affirmation": {
        "id": 1234567891,
        "trimester": 1,
        "title": "You Are Strong",
        "content": "Your body is doing incredible work creating new life. Trust in your strength and the amazing process happening within you right now.",
        "category": "strength"
      },
      "todo": {
        "id": 1234567892,
        "trimester": 1,
        "title": "Schedule Prenatal Appointment",
        "content": "Book your first prenatal visit with your healthcare provider. This important appointment will establish your pregnancy care plan and ensure everything is progressing well.",
        "category": "medical"
      },
      "didYouKnow": "Did you know that at 8 weeks, your baby's heart is beating about 150-170 times per minute, which is almost twice as fast as your own heart rate?"
    }
  }
}
```

### Test 4: Specific AI Content Generation
```bash
# Test AI-generated tip
curl "http://localhost:5000/api/dashboard/content?trimester=2&type=tip&weekOfPregnancy=20"

# Test AI-generated affirmation
curl "http://localhost:5000/api/dashboard/content?trimester=1&type=affirmation&weekOfPregnancy=8"

# Test AI-generated todo
curl "http://localhost:5000/api/dashboard/content?trimester=3&type=todo&weekOfPregnancy=35"
```

## 🔍 Troubleshooting

### Issue 1: Server Won't Start
**Error:** `Cannot find module '@google/generative-ai'`
**Solution:**
```bash
npm install @google/generative-ai
```

### Issue 2: API Key Error
**Error:** `GEMINI_API_KEY not found in environment variables`
**Solution:**
1. Check `.env` file exists in backend directory
2. Verify API key is correct
3. Restart server after adding API key

### Issue 3: Gemini API Errors
**Error:** API calls failing
**Check:**
1. API key is valid and active
2. Internet connection is working
3. Check server logs for detailed error messages

### Issue 4: Fallback Responses
If you see generic responses instead of AI-generated content, the system is using fallback mode. Check:
1. API key is correctly set
2. No network issues
3. Gemini API quota not exceeded

## 📊 What to Look For

### ✅ **Working Correctly:**
- Responses are contextual and specific to trimester/week
- Content varies between requests (not identical)
- Responses mention specific pregnancy details
- JSON structure is complete with all fields

### ❌ **Using Fallback (Not AI):**
- Generic, repetitive responses
- Same content returned multiple times
- Missing context-specific details
- Console shows "GEMINI_API_KEY not found" warnings

## 🎯 Advanced Testing

### Test Different Pregnancy Stages
```bash
# First trimester (early pregnancy)
curl "http://localhost:5000/api/dashboard?trimester=1&weekOfPregnancy=6"

# Second trimester (mid pregnancy)
curl "http://localhost:5000/api/dashboard?trimester=2&weekOfPregnancy=20"

# Third trimester (late pregnancy)
curl "http://localhost:5000/api/dashboard?trimester=3&weekOfPregnancy=36"
```

### Test Various Chatbot Questions
```bash
# Nutrition question
curl -X POST "http://localhost:5000/api/chatbot/message" \
  -H "Content-Type: application/json" \
  -d '{"message": "What foods should I avoid?", "context": {"trimester": 1, "weekOfPregnancy": 8}}'

# Exercise question
curl -X POST "http://localhost:5000/api/chatbot/message" \
  -H "Content-Type: application/json" \
  -d '{"message": "Is it safe to exercise?", "context": {"trimester": 2, "weekOfPregnancy": 20}}'

# Symptoms question
curl -X POST "http://localhost:5000/api/chatbot/message" \
  -H "Content-Type: application/json" \
  -d '{"message": "I have morning sickness", "context": {"trimester": 1, "weekOfPregnancy": 8}}'
```

## 📝 Monitoring

### Check Server Logs
Watch for these messages:
- ✅ `Server running on port 5000` - Server started successfully
- ❌ `GEMINI_API_KEY not found` - API key missing
- ❌ `Error calling Gemini API` - API call failed
- ✅ No error messages - Everything working correctly

### Performance Check
- AI responses should take 1-3 seconds
- Fallback responses are instant
- Multiple parallel requests should work fine

## 🎉 Success Indicators

Your Gemini API is working correctly if:
1. ✅ Server starts without API key warnings
2. ✅ Chatbot responses are contextual and varied
3. ✅ Dashboard content changes between requests
4. ✅ Content mentions specific pregnancy weeks/trimesters
5. ✅ No "fallback" messages in server logs
6. ✅ Response times are 1-3 seconds (not instant)

If all tests pass, your Gemini AI integration is working perfectly! 🎊
