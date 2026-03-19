// src/utils/quotes.js — connected to backend

import { awarenessAPI } from './api';

// Fallback quotes if API fails
const FALLBACK = {
  normal: { text: "You're doing well. Balance is a skill, and you're practising it.", author: 'Screenlytics', band: 'normal' },
  mid:    { text: 'Almost everything will work again if you unplug it for a few minutes — including you.', author: 'Anne Lamott', band: 'mid' },
  excess: { text: "You can't pour from an empty cup. Take care of yourself first.", author: 'Unknown', band: 'excess' },
};

export async function fetchQuoteByScore(score) {
  try {
    const data = await awarenessAPI.getQuote(score);
    return data; // { text, author, band, score }
  } catch (err) {
    console.error('Quote fetch error:', err.message);
    // Return fallback based on score
    const band = score <= 3.5 ? 'normal' : score <= 6.5 ? 'mid' : 'excess';
    return FALLBACK[band];
  }
}
