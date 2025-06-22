#!/bin/bash

echo "=== Testing Session Continuity ==="
echo ""

# Step 1: Send first message and capture sessionId
echo "Step 1: Sending first message..."
RESPONSE1=$(curl -s -X POST "http://localhost:5000/api/chatbot/message" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hi, I am 8 weeks pregnant and this is my first pregnancy",
    "context": {
      "trimester": 1,
      "weekOfPregnancy": 8
    },
    "userId": "session_test_user"
  }')

echo "Response 1:"
echo "$RESPONSE1" | jq '.'
echo ""

# Extract sessionId from the response
SESSION_ID=$(echo "$RESPONSE1" | jq -r '.data.sessionId')
echo "Extracted Session ID: $SESSION_ID"
echo ""

# Step 2: Send follow-up message using the same sessionId
echo "Step 2: Sending follow-up message with sessionId..."
RESPONSE2=$(curl -s -X POST "http://localhost:5000/api/chatbot/message" \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"What did I just tell you about my pregnancy?\",
    \"context\": {
      \"trimester\": 1,
      \"weekOfPregnancy\": 8
    },
    \"userId\": \"session_test_user\",
    \"sessionId\": \"$SESSION_ID\"
  }")

echo "Response 2:"
echo "$RESPONSE2" | jq '.'
echo ""

# Step 3: Send another follow-up to test memory
echo "Step 3: Testing conversation memory..."
RESPONSE3=$(curl -s -X POST "http://localhost:5000/api/chatbot/message" \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"Based on what I told you earlier, what week am I in?\",
    \"context\": {
      \"trimester\": 1,
      \"weekOfPregnancy\": 8
    },
    \"userId\": \"session_test_user\",
    \"sessionId\": \"$SESSION_ID\"
  }")

echo "Response 3:"
echo "$RESPONSE3" | jq '.'
echo ""

# Check conversation length progression
CONV_LENGTH_1=$(echo "$RESPONSE1" | jq -r '.data.conversationLength')
CONV_LENGTH_2=$(echo "$RESPONSE2" | jq -r '.data.conversationLength')
CONV_LENGTH_3=$(echo "$RESPONSE3" | jq -r '.data.conversationLength')

echo "=== Session Continuity Test Results ==="
echo "Conversation Length Progression:"
echo "  Message 1: $CONV_LENGTH_1 messages"
echo "  Message 2: $CONV_LENGTH_2 messages"
echo "  Message 3: $CONV_LENGTH_3 messages"
echo ""

if [ "$CONV_LENGTH_1" = "2" ] && [ "$CONV_LENGTH_2" = "4" ] && [ "$CONV_LENGTH_3" = "6" ]; then
    echo "✅ Session continuity is working correctly!"
    echo "✅ Conversation length is incrementing properly"
else
    echo "❌ Session continuity may have issues"
    echo "❌ Expected lengths: 2, 4, 6 but got: $CONV_LENGTH_1, $CONV_LENGTH_2, $CONV_LENGTH_3"
fi

echo ""
echo "=== Manual Verification ==="
echo "Check if the AI responses in steps 2 and 3 reference information from step 1"
echo "The bot should remember that you mentioned being 8 weeks pregnant and it being your first pregnancy"
