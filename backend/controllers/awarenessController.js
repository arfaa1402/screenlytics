// ✅ Quotes bank organized by burnout band
const QUOTES = {
  normal: [
    { text: "Balance is not something you find, it's something you create.", author: 'Jana Kingsford' },
    { text: "Take care of your body. It's the only place you have to live.", author: 'Jim Rohn' },
    { text: "Almost everything will work again if you unplug it for a few minutes — including you.", author: 'Anne Lamott' },
    { text: "The time to relax is when you don't have time for it.", author: 'Sydney J. Harris' },
    { text: "Happiness is not a matter of intensity but of balance and order.", author: 'Thomas Merton' },
    { text: "Nature does not hurry, yet everything is accomplished.", author: 'Lao Tzu' },
  ],
  mid: [
    { text: "You can't pour from an empty cup. Take care of yourself first.", author: 'Unknown' },
    { text: "Burnout is nature's way of telling you you've been going through the motions.", author: 'Sam Keen' },
    { text: "Rest is not idleness — it is the key to a more productive tomorrow.", author: 'John Lubbock' },
    { text: "Slow down and everything you are chasing will come around and catch you.", author: 'John De Paola' },
    { text: "The most productive thing you can do sometimes is rest.", author: 'Mark Black' },
    { text: "Do not confuse having a career with having a life.", author: 'Hillary Clinton' },
  ],
  excess: [
    { text: "Almost everything will work again if you unplug it — including you. Stop. Now.", author: 'Anne Lamott' },
    { text: "You must learn to let go. Release the stress. You were never in control anyway.", author: 'Steve Maraboli' },
    { text: "When you recover or discover something that nourishes your soul, care for it.", author: 'Mary Oliver' },
    { text: "Your calm mind is the ultimate weapon against your challenges. Put your phone down.", author: 'Bryant McGill' },
    { text: "Tension is who you think you should be. Relaxation is who you are.", author: 'Chinese Proverb' },
    { text: "Rest when you're weary. Refresh and renew yourself, your body and your mind.", author: 'Ralph Marston' },
  ]
};

// ✅ GET QUOTE BY BURNOUT SCORE
exports.getQuote = async (req, res) => {
  const { score } = req.params;
  const numScore  = parseFloat(score);

  // Validate score
  if (isNaN(numScore) || numScore < 0 || numScore > 10) {
    return res.status(400).json({ message: 'Score must be between 0 and 10' });
  }

  try {
    // Determine band from score
    const band =
      numScore <= 3 ? 'normal' :
      numScore <= 6 ? 'mid'    : 'excess';

    // Pick a random quote from the band
    const pool  = QUOTES[band];
    const quote = pool[Math.floor(Math.random() * pool.length)];

    res.status(200).json({
      text:   quote.text,
      author: quote.author,
      band,
      score:  numScore
    });

  } catch (err) {
    console.error('Get quote error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ✅ GET ALL QUOTES FOR A BAND (optional - useful for frontend variety)
exports.getQuotesByBand = async (req, res) => {
  const { band } = req.params;

  if (!['normal', 'mid', 'excess'].includes(band)) {
    return res.status(400).json({ message: 'Band must be normal, mid or excess' });
  }

  try {
    const quotes = QUOTES[band];
    res.status(200).json({ band, quotes });

  } catch (err) {
    console.error('Get quotes by band error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};