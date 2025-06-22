const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    if (!this.apiKey) {
      console.warn('GEMINI_API_KEY not found in environment variables. Chatbot will use fallback responses.');
      this.genAI = null;
      this.model = null;
    } else {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    }
  }

  async generateResponse(userMessage, userContext) {
    if (!this.model) {
      return this.generateFallbackResponse(userMessage, userContext);
    }

    try {
      const { trimester, weekOfPregnancy, dueDate } = userContext;

      // Create a comprehensive prompt for pregnancy-focused responses
      const prompt = this.buildPregnancyPrompt(userMessage, trimester, weekOfPregnancy, dueDate);

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse the response to extract structured data
      const structuredResponse = this.parseGeminiResponse(text, userContext);

      return structuredResponse;
    } catch (error) {
      console.error('Error calling Gemini API:', error);

      // Fall back to mock response if API call fails
      return this.generateFallbackResponse(userMessage, userContext);
    }
  }

  buildPregnancyPrompt(userMessage, trimester, weekOfPregnancy, dueDate) {
    const dueDateObj = new Date(dueDate);
    const daysUntilDue = Math.ceil((dueDateObj - new Date()) / (1000 * 60 * 60 * 24));

    return `You are a knowledgeable and supportive pregnancy assistant chatbot. You provide helpful, accurate, and empathetic responses to pregnant women.

IMPORTANT GUIDELINES:
- Always be supportive and encouraging
- Provide evidence-based information
- Remind users to consult healthcare providers for medical concerns
- Keep responses concise but informative (5 sentences max)
- Focus on practical, actionable advice
- Be sensitive to pregnancy concerns and emotions

USER CONTEXT:
- Current trimester: ${trimester}
- Week of pregnancy: ${weekOfPregnancy}
- Days until due date: ${Math.max(0, daysUntilDue)}
- Trimester stage: ${this.getTrimesterDescription(trimester)}

USER MESSAGE: "${userMessage}"

Please respond with helpful pregnancy advice. Format your response as JSON with the following structure:
{
  "text": "Your main response here",
  "type": "category (nutrition, symptoms, exercise, development, general, medical)",
  "suggestions": ["Follow-up question 1", "Follow-up question 2", "Follow-up question 3"]
}

Make sure the suggestions are relevant follow-up questions the user might want to ask.`;
  }

  parseGeminiResponse(responseText, userContext) {
    try {
      // Try to parse JSON response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedResponse = JSON.parse(jsonMatch[0]);

        // Validate the response structure
        if (parsedResponse.text && parsedResponse.type) {
          return {
            text: parsedResponse.text,
            type: parsedResponse.type || 'general',
            suggestions: parsedResponse.suggestions || this.getDefaultSuggestions(userContext)
          };
        }
      }

      // If JSON parsing fails, use the raw text
      return {
        text: responseText.trim(),
        type: this.categorizeResponse(responseText),
        suggestions: this.getDefaultSuggestions(userContext)
      };
    } catch (error) {
      console.error('Error parsing Gemini response:', error);

      // Return raw text with basic categorization
      return {
        text: responseText.trim(),
        type: 'general',
        suggestions: this.getDefaultSuggestions(userContext)
      };
    }
  }

  /**
   * Categorize response based on content keywords
   * @param {string} text - Response text to categorize
   * @returns {string} - Category type
   */
  categorizeResponse(text) {
    const lowerText = text.toLowerCase();

    if (lowerText.includes('eat') || lowerText.includes('food') || lowerText.includes('nutrition') || lowerText.includes('vitamin')) {
      return 'nutrition';
    }
    if (lowerText.includes('exercise') || lowerText.includes('workout') || lowerText.includes('activity')) {
      return 'exercise';
    }
    if (lowerText.includes('symptom') || lowerText.includes('nausea') || lowerText.includes('pain') || lowerText.includes('tired')) {
      return 'symptoms';
    }
    if (lowerText.includes('baby') || lowerText.includes('development') || lowerText.includes('growth')) {
      return 'development';
    }
    if (lowerText.includes('doctor') || lowerText.includes('medical') || lowerText.includes('healthcare')) {
      return 'medical';
    }

    return 'general';
  }

  /**
   * Get default suggestions based on user context
   * @param {Object} userContext - User's pregnancy context
   * @returns {Array<string>} - Array of suggestion questions
   */
  getDefaultSuggestions(userContext) {
    const { trimester } = userContext;

    const suggestions = {
      1: [
        'What foods should I avoid in first trimester?',
        'How can I manage morning sickness?',
        'What prenatal vitamins should I take?',
        'When should I schedule my first appointment?'
      ],
      2: [
        'What exercises are safe in second trimester?',
        'When will I feel baby movements?',
        'What should I know about anatomy scan?',
        'How much weight should I gain?'
      ],
      3: [
        'How can I prepare for labor?',
        'What are signs of labor?',
        'How can I manage third trimester discomfort?',
        'What should I pack for hospital?'
      ]
    };

    const trimesterSuggestions = suggestions[trimester] || suggestions[1];
    return trimesterSuggestions.slice(0, 3); // Return first 3 suggestions
  }

  /**
   * Get trimester description for context
   * @param {number} trimester - Trimester number
   * @returns {string} - Trimester description
   */
  getTrimesterDescription(trimester) {
    const descriptions = {
      1: 'First trimester (weeks 1-13) - Early pregnancy, organ development',
      2: 'Second trimester (weeks 14-27) - Often called the "golden period"',
      3: 'Third trimester (weeks 28-40) - Final preparation for birth'
    };

    return descriptions[trimester] || descriptions[1];
  }

  /**
   * Generate fallback response when Gemini is not available
   * @param {string} message - User message
   * @param {Object} userContext - User context
   * @returns {Object} - Fallback response object
   */
  generateFallbackResponse(message, userContext) {
    const { trimester, weekOfPregnancy } = userContext;

    // Simple keyword-based responses (same as before)
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('water') || lowerMessage.includes('drink') || lowerMessage.includes('hydrat')) {
      return {
        text: `During your ${this.getOrdinal(trimester)} trimester, aim for 8-10 glasses of water daily. Staying hydrated is crucial for you and your baby's health.`,
        type: 'nutrition',
        suggestions: ['What other drinks are safe?', 'How much is too much water?', 'Signs of dehydration during pregnancy']
      };
    }

    if (lowerMessage.includes('nausea') || lowerMessage.includes('morning sickness') || lowerMessage.includes('sick')) {
      return {
        text: `Morning sickness is common in the ${this.getOrdinal(trimester)} trimester. Try eating small, frequent meals and consider ginger tea. Contact your healthcare provider if symptoms are severe.`,
        type: 'symptoms',
        suggestions: ['Natural remedies for nausea', 'When to call the doctor', 'Foods that help with nausea']
      };
    }

    if (lowerMessage.includes('exercise') || lowerMessage.includes('workout') || lowerMessage.includes('activity')) {
      return {
        text: `Exercise is beneficial during pregnancy! In your ${this.getOrdinal(trimester)} trimester, consider walking, swimming, or prenatal yoga. Always consult your doctor before starting new activities.`,
        type: 'exercise',
        suggestions: ['Safe exercises for my trimester', 'How much exercise is recommended?', 'Warning signs to stop exercising']
      };
    }

    if (lowerMessage.includes('baby') || lowerMessage.includes('development') || lowerMessage.includes('growth')) {
      return {
        text: `At ${weekOfPregnancy} weeks, your baby is developing rapidly! Each week brings exciting new milestones in your ${this.getOrdinal(trimester)} trimester.`,
        type: 'development',
        suggestions: ['Baby development this week', 'When will I feel movements?', 'Baby size comparison']
      };
    }

    // Default response
    return {
      text: `I'm here to support you through your pregnancy journey! You're currently ${weekOfPregnancy} weeks along in your ${this.getOrdinal(trimester)} trimester. Feel free to ask about nutrition, symptoms, exercise, or baby development.`,
      type: 'general',
      suggestions: this.getDefaultSuggestions(userContext)
    };
  }

  /**
   * Generate daily pregnancy tip using Gemini AI
   * @param {Object} userContext - User's pregnancy context
   * @returns {Promise<Object>} - Tip object with title and content
   */
  async generateDailyTip(userContext) {
    if (!this.model) {
      return this.getFallbackTip(userContext);
    }

    try {
      const { trimester, weekOfPregnancy } = userContext;

      const prompt = `You are a pregnancy health expert. Generate a helpful daily tip for a pregnant woman.

USER CONTEXT:
- Current trimester: ${trimester}
- Week of pregnancy: ${weekOfPregnancy}
- Trimester stage: ${this.getTrimesterDescription(trimester)}

Generate a practical, evidence-based pregnancy tip that is:
- Specific to their current trimester and week
- Actionable and easy to follow
- Safe and medically sound
- Encouraging and supportive

Format your response as JSON:
{
  "title": "Brief tip title (max 6 words)",
  "content": "Detailed tip explanation (2-3 sentences)",
  "category": "health|nutrition|wellness|preparation|exercise"
}`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return this.parseContentResponse(text, 'tip', userContext);
    } catch (error) {
      console.error('Error generating daily tip:', error);
      return this.getFallbackTip(userContext);
    }
  }

  /**
   * Generate daily affirmation using Gemini AI
   * @param {Object} userContext - User's pregnancy context
   * @returns {Promise<Object>} - Affirmation object with title and content
   */
  async generateDailyAffirmation(userContext) {
    if (!this.model) {
      return this.getFallbackAffirmation(userContext);
    }

    try {
      const { trimester, weekOfPregnancy } = userContext;

      const prompt = `You are a pregnancy wellness coach. Generate a positive, empowering affirmation for a pregnant woman.

USER CONTEXT:
- Current trimester: ${trimester}
- Week of pregnancy: ${weekOfPregnancy}
- Trimester stage: ${this.getTrimesterDescription(trimester)}

Generate an affirmation that is:
- Emotionally supportive and uplifting
- Relevant to their pregnancy stage
- Focuses on strength, capability, and positivity
- Acknowledges the journey they're on

Format your response as JSON:
{
  "title": "Affirmation theme (max 4 words)",
  "content": "The full affirmation statement (1-2 sentences)",
  "category": "mindfulness|strength|confidence|connection|gratitude"
}`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return this.parseContentResponse(text, 'affirmation', userContext);
    } catch (error) {
      console.error('Error generating daily affirmation:', error);
      return this.getFallbackAffirmation(userContext);
    }
  }

  /**
   * Generate daily todo using Gemini AI
   * @param {Object} userContext - User's pregnancy context
   * @returns {Promise<Object>} - Todo object with title and content
   */
  async generateDailyTodo(userContext) {
    if (!this.model) {
      return this.getFallbackTodo(userContext);
    }

    try {
      const { trimester, weekOfPregnancy, dueDate } = userContext;
      const dueDateObj = new Date(dueDate);
      const daysUntilDue = Math.ceil((dueDateObj - new Date()) / (1000 * 60 * 60 * 24));

      const prompt = `You are a pregnancy planning expert. Generate a practical todo item for a pregnant woman.

USER CONTEXT:
- Current trimester: ${trimester}
- Week of pregnancy: ${weekOfPregnancy}
- Days until due date: ${Math.max(0, daysUntilDue)}
- Trimester stage: ${this.getTrimesterDescription(trimester)}

Generate a todo that is:
- Appropriate for their current pregnancy stage
- Practical and achievable
- Important for pregnancy health or preparation
- Specific and actionable

Format your response as JSON:
{
  "title": "Todo action item (max 8 words)",
  "content": "Detailed explanation of what to do and why (2-3 sentences)",
  "category": "medical|preparation|nutrition|wellness|education|planning"
}`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return this.parseContentResponse(text, 'todo', userContext);
    } catch (error) {
      console.error('Error generating daily todo:', error);
      return this.getFallbackTodo(userContext);
    }
  }

  /**
   * Generate "Did you know?" fact using Gemini AI
   * @param {Object} userContext - User's pregnancy context
   * @returns {Promise<string>} - Interesting pregnancy fact
   */
  async generateDidYouKnowFact(userContext) {
    if (!this.model) {
      return this.getFallbackDidYouKnow(userContext);
    }

    try {
      const { trimester, weekOfPregnancy } = userContext;

      const prompt = `Generate an interesting, educational "Did you know?" fact about pregnancy for a woman in her ${this.getOrdinal(trimester)} trimester at ${weekOfPregnancy} weeks.

The fact should be:
- Fascinating and engaging
- Relevant to their current pregnancy stage
- Scientifically accurate
- Positive and wonder-inspiring
- About baby development, pregnancy changes, or interesting pregnancy science

Respond with just the fact as a single sentence starting with "Did you know that..."`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();

      return text || this.getFallbackDidYouKnow(userContext);
    } catch (error) {
      console.error('Error generating did you know fact:', error);
      return this.getFallbackDidYouKnow(userContext);
    }
  }

  /**
   * Parse content response from Gemini
   * @param {string} responseText - Raw response from Gemini
   * @param {string} contentType - Type of content (tip, affirmation, todo)
   * @param {Object} userContext - User context for fallback
   * @returns {Object} - Parsed content object
   */
  parseContentResponse(responseText, contentType, userContext) {
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedResponse = JSON.parse(jsonMatch[0]);

        if (parsedResponse.title && parsedResponse.content) {
          return {
            id: Date.now(), // Simple ID for development
            trimester: userContext.trimester,
            title: parsedResponse.title,
            content: parsedResponse.content,
            category: parsedResponse.category || 'general'
          };
        }
      }

      // If parsing fails, create a basic structure from the text
      return {
        id: Date.now(),
        trimester: userContext.trimester,
        title: `${contentType.charAt(0).toUpperCase() + contentType.slice(1)} for Week ${userContext.weekOfPregnancy}`,
        content: responseText.trim(),
        category: 'general'
      };
    } catch (error) {
      console.error(`Error parsing ${contentType} response:`, error);

      // Return fallback based on content type
      switch (contentType) {
        case 'tip':
          return this.getFallbackTip(userContext);
        case 'affirmation':
          return this.getFallbackAffirmation(userContext);
        case 'todo':
          return this.getFallbackTodo(userContext);
        default:
          return null;
      }
    }
  }

  /**
   * Fallback tip when AI is unavailable
   */
  getFallbackTip(userContext) {
    const { trimester } = userContext;
    const tips = {
      1: {
        title: "Stay Hydrated Daily",
        content: "Drink at least 8-10 glasses of water daily to support your growing baby and prevent dehydration. Add lemon or cucumber for variety.",
        category: "health"
      },
      2: {
        title: "Prenatal Vitamins Matter",
        content: "Continue taking your prenatal vitamins, especially folic acid and iron. They support your baby's development and your energy levels.",
        category: "nutrition"
      },
      3: {
        title: "Practice Breathing Techniques",
        content: "Learn deep breathing exercises now to help manage labor pain and reduce anxiety. Practice for 5-10 minutes daily.",
        category: "preparation"
      }
    };

    return {
      id: Date.now(),
      trimester,
      ...tips[trimester] || tips[1]
    };
  }

  /**
   * Fallback affirmation when AI is unavailable
   */
  getFallbackAffirmation(userContext) {
    const { trimester } = userContext;
    const affirmations = {
      1: {
        title: "You Are Strong",
        content: "Your body is doing amazing work growing your baby. Trust in your strength and the incredible process happening within you.",
        category: "strength"
      },
      2: {
        title: "Embrace This Journey",
        content: "You are exactly where you need to be in this moment. Your baby is growing perfectly, and you are becoming the mother you're meant to be.",
        category: "confidence"
      },
      3: {
        title: "Ready and Capable",
        content: "You have everything within you to birth your baby safely. Your body knows what to do, and you are prepared for this moment.",
        category: "confidence"
      }
    };

    return {
      id: Date.now(),
      trimester,
      ...affirmations[trimester] || affirmations[1]
    };
  }

  /**
   * Fallback todo when AI is unavailable
   */
  getFallbackTodo(userContext) {
    const { trimester } = userContext;
    const todos = {
      1: {
        title: "Schedule First Prenatal Appointment",
        content: "Book your first prenatal checkup with your healthcare provider. This usually happens around 8-10 weeks and includes important initial tests.",
        category: "medical"
      },
      2: {
        title: "Plan Anatomy Scan",
        content: "Schedule your 20-week anatomy scan if you haven't already. This detailed ultrasound checks your baby's development and can reveal the gender.",
        category: "medical"
      },
      3: {
        title: "Pack Hospital Bag",
        content: "Start preparing your hospital bag with essentials for labor, delivery, and recovery. Include comfortable clothes, toiletries, and baby items.",
        category: "preparation"
      }
    };

    return {
      id: Date.now(),
      trimester,
      ...todos[trimester] || todos[1]
    };
  }

  /**
   * Fallback "Did you know?" fact when AI is unavailable
   */
  getFallbackDidYouKnow(userContext) {
    const { trimester } = userContext;
    const facts = {
      1: [
        "Did you know that your baby's heart starts beating around week 6, even before you might know you're pregnant?",
        "Did you know that morning sickness affects about 70% of pregnant women and is actually a sign of a healthy pregnancy?",
        "Did you know that your baby is about the size of a blueberry at 8 weeks but already has tiny fingers and toes forming?"
      ],
      2: [
        "Did you know that you might start feeling your baby's movements between weeks 16-20, and they feel like gentle flutters at first?",
        "Did you know that your baby can hear sounds from outside the womb during the second trimester and may respond to music?",
        "Did you know that the second trimester is often called the 'golden period' because many women feel their best during these weeks?"
      ],
      3: [
        "Did you know that your baby's brain grows rapidly during the third trimester, gaining about 250,000 neurons per minute?",
        "Did you know that babies born after 37 weeks are considered full-term, but every day in the womb helps with development?",
        "Did you know that your baby is practicing breathing movements in the womb, even though they're getting oxygen through the umbilical cord?"
      ]
    };

    const trimesterFacts = facts[trimester] || facts[1];
    return trimesterFacts[Math.floor(Math.random() * trimesterFacts.length)];
  }

  /**
   * Generate daily tasks using Gemini AI
   * @param {Object} userContext - User's pregnancy context
   * @returns {Promise<Array>} - Array of daily task objects
   */
  async generateDailyTasks(userContext) {
    if (!this.model) {
      return this.getFallbackDailyTasks(userContext);
    }

    try {
      const { trimester, weekOfPregnancy, dueDate } = userContext;
      const dueDateObj = new Date(dueDate);
      const daysUntilDue = Math.ceil((dueDateObj - new Date()) / (1000 * 60 * 60 * 24));

      const prompt = `You are a pregnancy care expert. Generate 3-4 daily tasks for a pregnant woman.

USER CONTEXT:
- Current trimester: ${trimester}
- Week of pregnancy: ${weekOfPregnancy}
- Days until due date: ${Math.max(0, daysUntilDue)}
- Trimester stage: ${this.getTrimesterDescription(trimester)}

Generate daily tasks that are:
- Appropriate for their current pregnancy stage
- Mix of health, wellness, and preparation activities
- Achievable and practical for daily completion
- Include both recurring daily habits and specific actions

Format your response as JSON array:
[
  {
    "title": "Task title (max 8 words)",
    "description": "Detailed explanation (2-3 sentences)",
    "category": "medical|nutrition|wellness|preparation|exercise",
    "priority": "high|medium|low",
    "isDaily": true
  }
]`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return this.parseTasksResponse(text, userContext, 'daily');
    } catch (error) {
      console.error('Error generating daily tasks:', error);
      return this.getFallbackDailyTasks(userContext);
    }
  }

  /**
   * Generate trimester-specific tasks using Gemini AI
   * @param {Object} userContext - User's pregnancy context
   * @returns {Promise<Array>} - Array of trimester task objects
   */
  async generateTrimesterTasks(userContext) {
    if (!this.model) {
      return this.getFallbackTrimesterTasks(userContext);
    }

    try {
      const { trimester, weekOfPregnancy, dueDate } = userContext;
      const dueDateObj = new Date(dueDate);
      const daysUntilDue = Math.ceil((dueDateObj - new Date()) / (1000 * 60 * 60 * 1000));

      const prompt = `You are a pregnancy planning expert. Generate 5-7 important tasks for a woman in her ${this.getOrdinal(trimester)} trimester.

USER CONTEXT:
- Current trimester: ${trimester}
- Week of pregnancy: ${weekOfPregnancy}
- Days until due date: ${Math.max(0, daysUntilDue)}
- Trimester stage: ${this.getTrimesterDescription(trimester)}

Generate trimester tasks that are:
- Critical for this specific trimester
- Mix of medical appointments, preparations, and education
- Include both urgent and non-urgent items
- Appropriate timing for their pregnancy stage

Format your response as JSON array:
[
  {
    "title": "Task title (max 10 words)",
    "description": "Detailed explanation with timing and importance (2-3 sentences)",
    "category": "medical|preparation|nutrition|education|wellness|planning",
    "priority": "high|medium|low",
    "isDaily": false,
    "dueInWeeks": 2
  }
]`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return this.parseTasksResponse(text, userContext, 'trimester');
    } catch (error) {
      console.error('Error generating trimester tasks:', error);
      return this.getFallbackTrimesterTasks(userContext);
    }
  }

  /**
   * Parse tasks response from Gemini
   * @param {string} responseText - Raw response from Gemini
   * @param {Object} userContext - User context for fallback
   * @param {string} taskType - Type of tasks (daily or trimester)
   * @returns {Array} - Array of task objects
   */
  parseTasksResponse(responseText, userContext, taskType) {
    try {
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsedTasks = JSON.parse(jsonMatch[0]);

        if (Array.isArray(parsedTasks) && parsedTasks.length > 0) {
          return parsedTasks.map((task, index) => ({
            id: Date.now() + index, // Simple ID for development
            userId: 'user123', // Mock user ID
            title: task.title || `${taskType} task`,
            description: task.description || 'AI-generated task',
            trimester: userContext.trimester,
            category: task.category || 'wellness',
            priority: task.priority || 'medium',
            isDaily: task.isDaily !== undefined ? task.isDaily : (taskType === 'daily'),
            isCompleted: false,
            assignedDate: new Date().toISOString(),
            dueDate: task.dueInWeeks ? new Date(Date.now() + task.dueInWeeks * 7 * 24 * 60 * 60 * 1000).toISOString() : null,
            completedAt: null,
            weekOfPregnancy: userContext.weekOfPregnancy
          }));
        }
      }

      // If parsing fails, return fallback
      return taskType === 'daily'
        ? this.getFallbackDailyTasks(userContext)
        : this.getFallbackTrimesterTasks(userContext);

    } catch (error) {
      console.error(`Error parsing ${taskType} tasks response:`, error);
      return taskType === 'daily'
        ? this.getFallbackDailyTasks(userContext)
        : this.getFallbackTrimesterTasks(userContext);
    }
  }

  /**
   * Fallback daily tasks when AI is unavailable
   */
  getFallbackDailyTasks(userContext) {
    const { trimester } = userContext;
    const baseTasks = [
      {
        id: Date.now() + 1,
        userId: 'user123',
        title: 'Take prenatal vitamin',
        description: 'Take your daily prenatal vitamin with breakfast to support your baby\'s development.',
        trimester,
        category: 'nutrition',
        priority: 'high',
        isDaily: true,
        isCompleted: false,
        assignedDate: new Date().toISOString(),
        completedAt: null
      },
      {
        id: Date.now() + 2,
        userId: 'user123',
        title: 'Drink 8 glasses of water',
        description: 'Stay hydrated throughout the day to support your increased blood volume and baby\'s growth.',
        trimester,
        category: 'wellness',
        priority: 'medium',
        isDaily: true,
        isCompleted: false,
        assignedDate: new Date().toISOString(),
        completedAt: null
      }
    ];

    // Add trimester-specific daily tasks
    if (trimester === 1) {
      baseTasks.push({
        id: Date.now() + 3,
        userId: 'user123',
        title: 'Monitor morning sickness',
        description: 'Track your nausea patterns and try small, frequent meals to manage morning sickness.',
        trimester,
        category: 'wellness',
        priority: 'medium',
        isDaily: true,
        isCompleted: false,
        assignedDate: new Date().toISOString(),
        completedAt: null
      });
    } else if (trimester === 2) {
      baseTasks.push({
        id: Date.now() + 3,
        userId: 'user123',
        title: 'Practice prenatal exercises',
        description: 'Do 20-30 minutes of gentle prenatal exercises or walking to maintain fitness.',
        trimester,
        category: 'exercise',
        priority: 'medium',
        isDaily: true,
        isCompleted: false,
        assignedDate: new Date().toISOString(),
        completedAt: null
      });
    } else if (trimester === 3) {
      baseTasks.push({
        id: Date.now() + 3,
        userId: 'user123',
        title: 'Practice breathing exercises',
        description: 'Spend 10-15 minutes practicing deep breathing and relaxation techniques for labor preparation.',
        trimester,
        category: 'preparation',
        priority: 'high',
        isDaily: true,
        isCompleted: false,
        assignedDate: new Date().toISOString(),
        completedAt: null
      });
    }

    return baseTasks;
  }

  /**
   * Fallback trimester tasks when AI is unavailable
   */
  getFallbackTrimesterTasks(userContext) {
    const { trimester } = userContext;

    const trimesterTasks = {
      1: [
        {
          id: Date.now() + 10,
          userId: 'user123',
          title: 'Schedule first prenatal appointment',
          description: 'Book your initial prenatal visit with your healthcare provider for comprehensive health screening.',
          trimester: 1,
          category: 'medical',
          priority: 'high',
          isDaily: false,
          isCompleted: false,
          assignedDate: new Date().toISOString(),
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          completedAt: null
        },
        {
          id: Date.now() + 11,
          userId: 'user123',
          title: 'Research prenatal vitamins',
          description: 'Learn about different prenatal vitamin options and discuss with your doctor which is best for you.',
          trimester: 1,
          category: 'education',
          priority: 'medium',
          isDaily: false,
          isCompleted: false,
          assignedDate: new Date().toISOString(),
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          completedAt: null
        }
      ],
      2: [
        {
          id: Date.now() + 20,
          userId: 'user123',
          title: 'Schedule anatomy scan',
          description: 'Book your 20-week anatomy scan to check baby\'s development and potentially learn the gender.',
          trimester: 2,
          category: 'medical',
          priority: 'high',
          isDaily: false,
          isCompleted: false,
          assignedDate: new Date().toISOString(),
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          completedAt: null
        },
        {
          id: Date.now() + 21,
          userId: 'user123',
          title: 'Start planning nursery',
          description: 'Begin thinking about nursery design, furniture needs, and baby essentials for the second half of pregnancy.',
          trimester: 2,
          category: 'preparation',
          priority: 'medium',
          isDaily: false,
          isCompleted: false,
          assignedDate: new Date().toISOString(),
          dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
          completedAt: null
        }
      ],
      3: [
        {
          id: Date.now() + 30,
          userId: 'user123',
          title: 'Pack hospital bag',
          description: 'Prepare your hospital bag with essentials for labor, delivery, and recovery. Include baby items too.',
          trimester: 3,
          category: 'preparation',
          priority: 'high',
          isDaily: false,
          isCompleted: false,
          assignedDate: new Date().toISOString(),
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          completedAt: null
        },
        {
          id: Date.now() + 31,
          userId: 'user123',
          title: 'Finalize birth plan',
          description: 'Complete your birth plan and discuss preferences with your healthcare provider and birth partner.',
          trimester: 3,
          category: 'planning',
          priority: 'high',
          isDaily: false,
          isCompleted: false,
          assignedDate: new Date().toISOString(),
          dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
          completedAt: null
        }
      ]
    };

    return trimesterTasks[trimester] || trimesterTasks[1];
  }

  /**
   * Extract conversation summary and insights from a completed chat session
   * @param {Array} messages - Array of conversation messages
   * @param {Object} userContext - User's pregnancy context
   * @returns {Object} Extracted insights and summary
   */
  async extractConversationSummary(messages, userContext) {
    try {
      if (!messages || messages.length === 0) {
        return {
          concerns: [],
          preferences: [],
          topics: [],
          medicalInfo: [],
          recentTopics: [],
          pregnancyContext: userContext
        };
      }

      // Create conversation text for analysis
      const conversationText = messages
        .map(msg => `${msg.role}: ${msg.message}`)
        .join('\n');

      const prompt = `
Analyze this pregnancy-related conversation and extract key insights. Return a JSON object with the following structure:

{
  "concerns": ["array of health concerns mentioned"],
  "preferences": ["array of user preferences mentioned"],
  "topics": ["array of main topics discussed"],
  "medicalInfo": ["array of important medical information mentioned"],
  "recentTopics": ["array of most recent 3 topics discussed"],
  "pregnancyContext": {
    "trimester": number,
    "weekOfPregnancy": number,
    "symptoms": ["array of symptoms mentioned"],
    "lifestyle": ["array of lifestyle preferences"]
  }
}

Conversation to analyze:
${conversationText}

Current pregnancy context: Trimester ${userContext.trimester}, Week ${userContext.weekOfPregnancy}

Extract only factual information mentioned in the conversation. Keep arrays concise (max 5 items each).
Return only valid JSON, no additional text.
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      try {
        // Parse the JSON response
        const summary = JSON.parse(text);

        console.log('Extracted conversation summary:', {
          concernsCount: summary.concerns?.length || 0,
          preferencesCount: summary.preferences?.length || 0,
          topicsCount: summary.topics?.length || 0
        });

        return {
          concerns: summary.concerns || [],
          preferences: summary.preferences || [],
          topics: summary.topics || [],
          medicalInfo: summary.medicalInfo || [],
          recentTopics: summary.recentTopics || [],
          pregnancyContext: {
            ...userContext,
            ...(summary.pregnancyContext || {})
          },
          messageCount: messages.length
        };
      } catch (parseError) {
        console.error('Failed to parse conversation summary JSON:', parseError);

        // Fallback: extract basic insights from conversation text
        return {
          concerns: this.extractKeywords(conversationText, ['nausea', 'fatigue', 'pain', 'worry', 'concern', 'problem']),
          preferences: this.extractKeywords(conversationText, ['natural', 'organic', 'gentle', 'prefer', 'like', 'want']),
          topics: this.extractKeywords(conversationText, ['exercise', 'nutrition', 'sleep', 'symptoms', 'appointment']),
          medicalInfo: [],
          recentTopics: messages.slice(-3).map(msg => msg.message.split(' ').slice(0, 3).join(' ')),
          pregnancyContext: userContext,
          messageCount: messages.length
        };
      }
    } catch (error) {
      console.error('Error extracting conversation summary:', error);

      // Return basic fallback summary
      return {
        concerns: [],
        preferences: [],
        topics: [],
        medicalInfo: [],
        recentTopics: [],
        pregnancyContext: userContext,
        messageCount: messages.length
      };
    }
  }

  /**
   * Helper function to extract keywords from text
   * @private
   */
  extractKeywords(text, keywords) {
    const lowerText = text.toLowerCase();
    return keywords.filter(keyword => lowerText.includes(keyword));
  }

  /**
   * Helper function to get ordinal numbers
   * @param {number} number - Number to convert
   * @returns {string} - Ordinal string
   */
  getOrdinal(number) {
    const ordinals = ['', '1st', '2nd', '3rd'];
    return ordinals[number] || `${number}th`;
  }
}

module.exports = new GeminiService();
