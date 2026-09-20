const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  const primaryUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/screenlytics';

  try {
    const conn = await mongoose.connect(primaryUri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Primary Connection Failed: ${error.message}`);

    // If SRV / Atlas query failed, attempt fallback to local MongoDB instance
    if (primaryUri.includes('mongodb+srv://')) {
      const fallbackUri = 'mongodb://127.0.0.1:27017/screenlytics';
      console.log(`🔄 Attempting fallback connection to local MongoDB: ${fallbackUri}`);
      try {
        const conn = await mongoose.connect(fallbackUri);
        console.log(`✅ MongoDB Fallback Connected: ${conn.connection.host}`);
        return;
      } catch (fallbackError) {
        console.error(`❌ Local MongoDB Fallback Failed: ${fallbackError.message}`);
      }
    }

    console.log(`
--- 💡 MONGODB ATLAS TROUBLESHOOTING TIPS ---
1. IP Whitelist: Go to MongoDB Atlas -> Network Access -> Add IP Address -> Select "Allow Access from Anywhere" (0.0.0.0/0).
2. URL Encoding: If your Atlas database password contains special characters (like @, #, %, :), URL-encode them (e.g. @ becomes %40).
3. DNS / Network Blocking: Your Wi-Fi or ISP may block DNS SRV queries (querySrv ECONNREFUSED). Try changing your PC DNS to Google DNS (8.8.8.8) or Cloudflare (1.1.1.1).
4. Local MongoDB Option: Install local MongoDB Community Edition and set MONGODB_URI=mongodb://127.0.0.1:27017/screenlytics in backend/.env.
---------------------------------------------
`);
  }
};

module.exports = connectDB;