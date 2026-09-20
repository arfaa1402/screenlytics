const { GoogleGenerativeAI } = require('@google/generative-ai');
const ChatSession = require('../models/ChatSession');
const ChatMessage = require('../models/ChatMessage');
const Task = require('../models/Task');
const ScreenLog = require('../models/ScreenLog');
const ScheduleSuggestion = require('../models/ScheduleSuggestion');

// Initialize Gemini API if key is available
const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey && apiKey !== 'your_gemini_api_key_here' ? new GoogleGenerativeAI(apiKey) : null;

// System instructions for Gemini AI Academic Planning Assistant
const SYSTEM_INSTRUCTION = `
You are an expert, empathetic Academic Planning Assistant & Schedule Counselor for students using Screenlytics.
Your main goal is to help students analyze, balance, and optimize their daily schedules to achieve academic success without burnout.

Key Principles:
1. Act as a supportive counselor, not a rigid authority.
2. Provide practical, realistic, and personalized recommendations.
3. Balance academics, college/school timings, revision, breaks, sleep, exercise, and personal commitments.
4. Identify risks such as unrealistic workloads, insufficient sleep, excessive gaming/social media, lack of breaks, or overlapping deadlines.
5. If health or medical issues are mentioned, do NOT give medical advice — gently remind the student to maintain healthy habits (hydration, sleep, rest) and consult a healthcare professional if needed.

When evaluating or revising a student's schedule, try to include structured advice categorized as:
- KEEP: Positive habits or commitments to retain.
- CHANGE: Activities that need timing or structure adjustments.
- ADD: Important items missing (e.g. revision blocks, short breaks, exercise, meal times).
- REDUCE: Overly long sessions, excessive screen time, or low-priority distractions.
- AVOID: Unhealthy habits like late-night cramming, skipping sleep, or studying without breaks.
- REVISED TIMETABLE: A clear hourly/time-block breakdown suggestions.
- EXPLANATION: Concise reasoning behind your recommendations.
`;

// Helper: Call Gemini API with Fallback
async function generateAIResponse(userPrompt, conversationHistory = [], scheduleContext = '') {
  if (!genAI) {
    return {
      text: getFallbackResponse(userPrompt),
      advice: parseStructuredAdvice(getFallbackResponse(userPrompt)),
    };
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    let fullPrompt = `${SYSTEM_INSTRUCTION}\n\n`;
    if (scheduleContext) {
      fullPrompt += `--- STUDENT'S CURRENT SCHEDULE CONTEXT ---\n${scheduleContext}\n----------------------------------------\n\n`;
    }

    if (conversationHistory.length > 0) {
      fullPrompt += `--- RECENT CONVERSATION ---\n`;
      conversationHistory.forEach(msg => {
        fullPrompt += `${msg.sender === 'student' ? 'Student' : 'Advisor'}: ${msg.text}\n`;
      });
      fullPrompt += `---------------------------\n\n`;
    }

    fullPrompt += `Student Question/Input: ${userPrompt}\n\n`;
    fullPrompt += `Please provide a helpful response. If the prompt requests a schedule review or timetable, include clear headers for [KEEP], [CHANGE], [ADD], [REDUCE], [AVOID], [REVISED TIMETABLE], and [EXPLANATION].`;

    const result = await model.generateContent(fullPrompt);
    const responseText = result.response.text();
    const advice = parseStructuredAdvice(responseText);

    return { text: responseText, advice };
  } catch (err) {
    console.error('Gemini API Error:', err.message);
    const fallbackText = getFallbackResponse(userPrompt);
    return {
      text: `${fallbackText}\n\n*(Note: Running in offline fallback mode while AI service connects)*`,
      advice: parseStructuredAdvice(fallbackText),
    };
  }
}

// Helper: Parse structured sections from AI response
function parseStructuredAdvice(text) {
  const extractSection = (tag) => {
    const regex = new RegExp(`\\[?${tag}\\]?:?\\s*([\\s\\S]*?)(?=\\[?(KEEP|CHANGE|ADD|REDUCE|AVOID|REVISED TIMETABLE|EXPLANATION)\\]?|$)`, 'i');
    const match = text.match(regex);
    if (!match) return [];
    return match[1]
      .split('\n')
      .map(s => s.replace(/^[-*•\d.]+\s*/, '').trim())
      .filter(s => s.length > 0);
  };

  return {
    keep: extractSection('KEEP'),
    change: extractSection('CHANGE'),
    add: extractSection('ADD'),
    reduce: extractSection('REDUCE'),
    avoid: extractSection('AVOID'),
    explanation: extractSection('EXPLANATION').join(' '),
  };
}

// Fallback logic when API key is missing or offline
function getFallbackResponse(prompt) {
  const p = prompt.toLowerCase();
  if (p.includes('exam') || p.includes('test')) {
    return `Here is a balanced exam preparation strategy:
[KEEP]
- Maintain consistent wake-up and sleep times.
- Keep taking short 5-10 minute breaks after study blocks.

[CHANGE]
- Switch from passive reading to active recall & practice papers.
- Move intense study sessions to your peak energy hours.

[ADD]
- Daily 30-minute revision blocks for past topics.
- Hydration & brief light walking breaks.

[REDUCE]
- Social media and gaming sessions to 30 mins max before bed.

[AVOID]
- All-nighters right before exam days.
- Cramming multiple heavy subjects without breaks.

[EXPLANATION]
Spacing out revision improves long-term memory retention and prevents burnout during exam week.`;
  }

  if (p.includes('game') || p.includes('gaming') || p.includes('screen')) {
    return `Here are schedule adjustments for managing screen time & gaming:
[KEEP]
- Enjoying gaming as a reward AFTER completing study goals.

[CHANGE]
- Set fixed 1-hour gaming slots instead of open-ended sessions.

[ADD]
- Physical stretch/walk break between study and gaming.

[REDUCE]
- Gaming time on weekday evenings (keep to max 45-60 mins).

[AVOID]
- Gaming past 10:30 PM to preserve sleep quality.

[EXPLANATION]
Unwinding is important, but late-night gaming delays melatonin release, causing morning fatigue and lower focus.`;
  }

  return `Here is a personalized schedule recommendation:
[KEEP]
- Current college/school timing commitment.
- Daily meal and relaxation slots.

[CHANGE]
- Break long study sessions into 45-minute Pomodoro focus blocks.

[ADD]
- 15-minute buffer time between college arrival and homework start.
- Evening 20-minute daily review of key lessons.

[REDUCE]
- Unstructured idle phone scrolling in the afternoon.

[AVOID]
- Skipping meals or sleep to complete last-minute assignments.

[EXPLANATION]
Structuring your study into active blocks with short breaks maintains peak mental energy and improves retention.`;
}

// ─────────────────────────────────────────
// API CONTROLLERS
// ─────────────────────────────────────────

// 1. Send Message to Chatbot
exports.sendMessage = async (req, res) => {
  const userId = req.user.id;
  const { sessionId, message } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ message: 'Message content is required' });
  }

  try {
    let session;
    if (sessionId) {
      session = await ChatSession.findOne({ _id: sessionId, user: userId });
    }

    if (!session) {
      session = await ChatSession.create({
        user: userId,
        title: message.trim().slice(0, 30) + (message.length > 30 ? '...' : ''),
      });
    }

    // Save Student Message
    const userMsg = await ChatMessage.create({
      session: session._id,
      user: userId,
      sender: 'student',
      text: message.trim(),
    });

    // Fetch user schedule context (Tasks + Recent Screen Logs)
    const userTasks = await Task.find({ user: userId }).sort({ isoDate: 1, time: 1 }).limit(10);
    const userLogs = await ScreenLog.find({ user: userId }).sort({ logDate: -1 }).limit(5);

    let scheduleContext = `Planner Tasks:\n` + userTasks.map(t => `- ${t.title} (${t.type}, ${t.isoDate} at ${t.time}, ${t.duration} mins)`).join('\n') + `\n\nRecent Screen Logs:\n` + userLogs.map(l => `- Date: ${l.logDate}, Total Mins: ${l.totalMins}, Study: ${l.studyMins}m, Social: ${l.socialMins}m, Ent: ${l.entMins}m, Score: ${l.score}`).join('\n');

    // Fetch recent conversation history for continuity
    const history = await ChatMessage.find({ session: session._id }).sort({ createdAt: 1 }).limit(10);

    // Call Gemini AI
    const aiResult = await generateAIResponse(message, history, scheduleContext);

    // Save AI Response Message
    const aiMsg = await ChatMessage.create({
      session: session._id,
      user: userId,
      sender: 'ai',
      text: aiResult.text,
      advice: aiResult.advice,
    });

    // Update Session Timestamp
    session.updatedAt = new Date();
    await session.save();

    res.status(200).json({
      sessionId: session._id.toString(),
      userMessage: userMsg,
      aiMessage: aiMsg,
      advice: aiResult.advice,
    });

  } catch (err) {
    console.error('Chatbot message error:', err.message);
    res.status(500).json({ message: 'Server error processing chat request' });
  }
};

// 2. Get All Sessions for User
exports.getSessions = async (req, res) => {
  const userId = req.user.id;
  try {
    const sessions = await ChatSession.find({ user: userId }).sort({ updatedAt: -1 });
    res.status(200).json({ sessions });
  } catch (err) {
    console.error('Get sessions error:', err.message);
    res.status(500).json({ message: 'Server error fetching chat sessions' });
  }
};

// 3. Create New Chat Session
exports.createSession = async (req, res) => {
  const userId = req.user.id;
  const { title } = req.body;
  try {
    const session = await ChatSession.create({
      user: userId,
      title: title || 'New Advice Session',
    });
    res.status(201).json({ session });
  } catch (err) {
    console.error('Create session error:', err.message);
    res.status(500).json({ message: 'Server error creating session' });
  }
};

// 4. Get Messages for a Session
exports.getSessionMessages = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  try {
    const session = await ChatSession.findOne({ _id: id, user: userId });
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const messages = await ChatMessage.find({ session: id }).sort({ createdAt: 1 });
    res.status(200).json({ session, messages });
  } catch (err) {
    console.error('Get messages error:', err.message);
    res.status(500).json({ message: 'Server error fetching messages' });
  }
};

// 5. Delete Session
exports.deleteSession = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  try {
    await ChatMessage.deleteMany({ session: id, user: userId });
    await ChatSession.deleteOne({ _id: id, user: userId });
    res.status(200).json({ message: 'Session deleted successfully' });
  } catch (err) {
    console.error('Delete session error:', err.message);
    res.status(500).json({ message: 'Server error deleting session' });
  }
};

// 6. Dedicated Schedule Analysis Endpoint
exports.analyzeSchedule = async (req, res) => {
  const userId = req.user.id;
  const { customTimetable, sleepTime, wakeTime, studyGoals } = req.body;

  try {
    const userTasks = await Task.find({ user: userId }).sort({ isoDate: 1, time: 1 });
    const userLogs = await ScreenLog.find({ user: userId }).sort({ logDate: -1 }).limit(7);

    let prompt = `Please perform a detailed schedule analysis and generate an improved timetable for me based on my profile:
- Sleep Schedule: ${sleepTime || '11:00 PM'} to ${wakeTime || '7:00 AM'}
- Goals: ${studyGoals || 'Improve focus and maintain academic balance'}\n`;

    if (customTimetable) {
      prompt += `- Current Timetable Input: ${customTimetable}\n`;
    }

    const userTasksSummary = userTasks.map(t => `${t.time} (${t.duration}m): ${t.title} [${t.type}]`).join(', ');
    const context = `Tasks: ${userTasksSummary || 'None recorded yet'}. Screen Logs Avg: ${userLogs.length ? Math.round(userLogs.reduce((a,b)=>a+b.totalMins,0)/userLogs.length) : 0} mins.`;

    const aiResult = await generateAIResponse(prompt, [], context);

    const suggestion = await ScheduleSuggestion.create({
      user: userId,
      originalScheduleSummary: { customTimetable, sleepTime, wakeTime, studyGoals },
      keep: aiResult.advice.keep,
      change: aiResult.advice.change,
      add: aiResult.advice.add,
      reduce: aiResult.advice.reduce,
      avoid: aiResult.advice.avoid,
      explanation: aiResult.advice.explanation || aiResult.text,
    });

    res.status(200).json({
      message: 'Schedule analyzed successfully',
      suggestion,
      fullAnalysis: aiResult.text,
      advice: aiResult.advice,
    });

  } catch (err) {
    console.error('Analyze schedule error:', err.message);
    res.status(500).json({ message: 'Server error analyzing schedule' });
  }
};
