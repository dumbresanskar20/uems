const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');

let geminiClient, openaiClient;

const initAI = () => {
  if (process.env.AI_PROVIDER === 'gemini' && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  } else if (process.env.OPENAI_API_KEY) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
};

initAI();

const analyzeWithGemini = async (prompt) => {
  const models = ['gemini-1.5-flash-latest', 'gemini-1.5-flash', 'gemini-pro'];
  let lastError;

  for (const modelName of models) {
    try {
      const model = geminiClient.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err) {
      lastError = err;
      console.warn(`Gemini model ${modelName} failed, trying next...`);
    }
  }
  throw lastError;
};

const analyzeWithOpenAI = async (prompt) => {
  const completion = await openaiClient.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 500,
  });
  return completion.choices[0].message.content;
};

const aiQuery = async (prompt) => {
  try {
    if (process.env.AI_PROVIDER === 'gemini' && geminiClient) {
      return await analyzeWithGemini(prompt);
    } else if (openaiClient) {
      return await analyzeWithOpenAI(prompt);
    }
    return null;
  } catch (error) {
    console.error('AI service error:', error.message);
    return null;
  }
};

// Analyze enquiry and return structured data
const analyzeEnquiry = async (enquiry) => {
  const enquiryData = {
    name: enquiry.name,
    email: enquiry.email,
    mobile: enquiry.mobile,
    dynamicFields: enquiry.dynamicFields ? Object.fromEntries(enquiry.dynamicFields) : {},
  };

  const prompt = `Analyze this customer enquiry and respond ONLY with a valid JSON object (no markdown):
Enquiry Data: ${JSON.stringify(enquiryData)}

Respond with this exact JSON structure:
{
  "summary": "Brief 2-3 sentence summary of the enquiry",
  "priorityScore": 75,
  "priority": "high",
  "urgency": "medium",
  "sentiment": "positive",
  "suggestedActions": ["Action 1", "Action 2", "Action 3"],
  "estimatedResponseTime": "24 hours",
  "keyTopics": ["topic1", "topic2"]
}

Priority levels: low, medium, high, urgent
Urgency levels: low, medium, high
Sentiment: positive, neutral, negative
Priority score: 0-100`;

  const response = await aiQuery(prompt);
  if (!response) return null;

  try {
    const cleaned = response.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return {
      summary: 'AI analysis unavailable',
      priorityScore: 50,
      priority: 'medium',
      suggestedActions: ['Review enquiry details', 'Contact customer'],
    };
  }
};

// Generate follow-up suggestions
const generateFollowUpSuggestions = async (enquiry) => {
  const prompt = `For this customer enquiry, suggest 3 specific follow-up actions. Respond with a JSON array only:
Customer: ${enquiry.name}
Status: ${enquiry.status}
Priority: ${enquiry.priority}

Respond with: ["action1", "action2", "action3"]`;

  const response = await aiQuery(prompt);
  if (!response) return ['Follow up with customer', 'Update status', 'Schedule callback'];

  try {
    const cleaned = response.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return ['Follow up with customer', 'Update status', 'Schedule callback'];
  }
};

// Dashboard AI insights
const generateDashboardInsights = async (stats) => {
  const prompt = `Based on these enquiry statistics, provide 3 actionable business insights as a JSON array:
Stats: ${JSON.stringify(stats)}

Respond with: [{"title": "Insight title", "description": "Brief description", "actionable": "What to do"}]`;

  const response = await aiQuery(prompt);
  if (!response) return [];

  try {
    const cleaned = response.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return [];
  }
};

module.exports = { analyzeEnquiry, generateFollowUpSuggestions, generateDashboardInsights };
