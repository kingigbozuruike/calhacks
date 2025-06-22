# Pregnancy Tracker Backend API

This is the backend API for the pregnancy tracking application, built with Express.js and designed to work with MongoDB.

## Developer B - Implemented Features

As Developer B, I have implemented the following components:

### 1. Dashboard API
- **GET /api/dashboard** - Get comprehensive dashboard data
- **GET /api/dashboard/content** - Get trimester-specific content (tips, affirmations, todos)
- **GET /api/dashboard/stats** - Get detailed pregnancy statistics and milestones

### 2. Task Management System
- **GET /api/tasks/daily** - Get daily tasks for user
- **GET /api/tasks/trimester** - Get tasks by trimester
- **GET /api/tasks** - Get all tasks with optional filtering
- **POST /api/tasks** - Create a new task
- **POST /api/tasks/check** - Mark task as completed/incomplete

### 3. Chatbot System (Powered by Google Gemini AI)
- **POST /api/chatbot/message** - Send message to chatbot and get AI-powered response
- **GET /api/chatbot/history** - Get chat history
- **DELETE /api/chatbot/history** - Clear chat history

## API Documentation

### Dashboard Endpoints

#### GET /api/dashboard
Get comprehensive dashboard data including trimester progress, daily content, and task summaries.

**Query Parameters:**
- `userId` (string, optional): User ID for development
- `trimester` (number, optional): Override trimester for testing
- `weekOfPregnancy` (number, optional): Override week for testing
- `dueDate` (string, optional): Override due date for testing
- `conceptionDate` (string, optional): Override conception date for testing

**Example Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "trimester": 1,
      "weekOfPregnancy": 8,
      "dueDate": "2024-08-15T00:00:00.000Z",
      "conceptionDate": "2023-11-15T00:00:00.000Z"
    },
    "trimesterProgress": {
      "currentTrimester": 1,
      "currentWeek": 8,
      "trimesterProgress": 62,
      "weeksInTrimester": 13,
      "weeksCompleted": 8,
      "weeksRemaining": 5,
      "daysUntilDue": 210,
      "overallProgress": 20
    },
    "dailyContent": {
      "tip": {
        "id": 1,
        "title": "Stay Hydrated",
        "content": "Drink at least 8-10 glasses of water daily...",
        "category": "health"
      },
      "affirmation": {
        "id": 1,
        "title": "You Are Strong",
        "content": "Your body is doing amazing work...",
        "category": "mindfulness"
      },
      "todo": {
        "id": 1,
        "title": "Schedule First Prenatal Appointment",
        "content": "Book your first prenatal checkup...",
        "category": "medical"
      },
      "didYouKnow": "Your baby's heart starts beating around week 6!"
    },
    "tasks": {
      "today": [...],
      "trimester": [...],
      "summary": {
        "totalTodayTasks": 3,
        "completedTodayTasks": 1,
        "totalTrimesterTasks": 5,
        "completedTrimesterTasks": 2
      }
    }
  }
}
```

#### GET /api/dashboard/content
Get trimester-specific content (tips, affirmations, todos).

**Query Parameters:**
- `trimester` (number, required): Trimester number (1, 2, or 3)
- `type` (string, optional): Content type ('tip', 'affirmation', 'todo', 'all')

#### GET /api/dashboard/stats
Get detailed pregnancy statistics and milestones.

### Task Endpoints

#### GET /api/tasks/daily
Get daily tasks for the authenticated user.

**Query Parameters:**
- `userId` (string, optional): User ID for development
- `date` (string, optional): Date in ISO format, defaults to today

#### GET /api/tasks/trimester
Get tasks by trimester for the authenticated user.

**Query Parameters:**
- `trimester` (number, required): Trimester number (1, 2, or 3)

#### POST /api/tasks
Create a new task for the authenticated user.

**Request Body:**
```json
{
  "title": "Take prenatal vitamin",
  "description": "Take daily prenatal vitamin with breakfast",
  "trimester": 1,
  "category": "nutrition",
  "priority": "high",
  "dueDate": "2024-01-15T00:00:00.000Z",
  "isDaily": true
}
```

#### POST /api/tasks/check
Mark a task as completed or incomplete.

**Request Body:**
```json
{
  "taskId": "1",
  "isCompleted": true
}
```

### Chatbot Endpoints

#### POST /api/chatbot/message
Send a message to the chatbot and receive a response.

**Request Body:**
```json
{
  "message": "How much water should I drink?",
  "context": {
    "trimester": 1,
    "weekOfPregnancy": 8,
    "dueDate": "2024-08-15T00:00:00.000Z"
  }
}
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "userMessage": "How much water should I drink?",
    "botResponse": "During your 1st trimester, focus on drinking 8-10 glasses of water daily...",
    "responseType": "nutrition",
    "suggestions": [
      "What foods should I avoid?",
      "How much weight should I gain?",
      "Prenatal vitamin recommendations"
    ],
    "context": {
      "trimester": 1,
      "weekOfPregnancy": 8
    },
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

#### GET /api/chatbot/history
Get chat history for the authenticated user.

**Query Parameters:**
- `limit` (number, optional): Number of messages to return (default: 50)
- `offset` (number, optional): Number of messages to skip (default: 0)

#### DELETE /api/chatbot/history
Clear chat history for the authenticated user.

## Models

### ContentBank Model
Stores tips, affirmations, and todo templates organized by trimester.

**Schema Fields:**
- `type`: 'tip', 'affirmation', or 'todo'
- `trimester`: 1, 2, or 3
- `title`: Content title
- `content`: Main content text
- `category`: Content category
- `priority`: Priority level (1-5)
- `isActive`: Whether content is active
- `tags`: Array of tags

### Task Model
Stores user-specific tasks linked to trimester and dates.

**Schema Fields:**
- `userId`: Reference to User
- `title`: Task title
- `description`: Task description
- `trimester`: 1, 2, or 3
- `category`: Task category
- `priority`: 'low', 'medium', or 'high'
- `dueDate`: Optional due date
- `isCompleted`: Completion status
- `isDaily`: Whether it's a daily recurring task
- `weekOfPregnancy`: Specific week assignment

## Development Notes

### Current Status
- All endpoints are implemented with mock data
- Authentication middleware placeholders are in place
- Database models are defined but commented out
- Ready for integration with Developer A's auth system

### TODO for Developer A Integration
1. **Database Setup**: Uncomment mongoose schemas and connect to MongoDB
2. **Authentication**: Implement JWT middleware and replace mock user IDs
3. **User Model**: Create User model with pregnancy information
4. **Data Integration**: Replace mock data with actual database queries

### Testing the API

You can test the API endpoints using tools like Postman or curl:

```bash
# Get dashboard data
curl "http://localhost:5000/api/dashboard?trimester=1&weekOfPregnancy=8"

# Get daily tasks
curl "http://localhost:5000/api/tasks/daily?userId=user123"

# Send chatbot message
curl -X POST "http://localhost:5000/api/chatbot/message" \
  -H "Content-Type: application/json" \
  -d '{"message": "How much water should I drink?", "userId": "user123"}'

# Create a new task
curl -X POST "http://localhost:5000/api/tasks" \
  -H "Content-Type: application/json" \
  -d '{"title": "Take vitamin", "trimester": 1, "userId": "user123"}'
```

### Error Handling
All endpoints include comprehensive error handling with appropriate HTTP status codes and error messages.

### Mock Data
The system includes realistic mock data for development and testing:
- Sample tips, affirmations, and todos for each trimester
- Mock tasks with various categories and priorities
- Intelligent chatbot responses based on keywords
- Pregnancy statistics and milestone calculations

## Next Steps for AI Integration

The chatbot system is designed with placeholders for AI integration:

1. Replace the `generateChatbotResponse` function with actual AI service calls
2. Implement chat history storage in the database
3. Add more sophisticated context awareness
4. Integrate with external AI services (OpenAI, Claude, etc.)

## File Structure

```
backend/
├── controllers/
│   ├── TaskController.js       # Task management logic
│   ├── ChatController.js       # Chatbot logic
│   └── DashboardController.js  # Dashboard data logic
├── models/
│   ├── Task.js                 # Task model definition
│   └── ContentBank.js          # Content model definition
├── routes/
│   ├── tasks.js               # Task routes
│   ├── chat.js                # Chat routes
│   └── dashboard.js           # Dashboard routes
├── server.js                  # Main server file
└── package.json               # Dependencies
```
