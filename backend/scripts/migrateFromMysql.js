const mysql = require('mysql2/promise');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const User = require('../models/User');
const ScreenLog = require('../models/ScreenLog');
const BurnoutScore = require('../models/BurnoutScore');
const NotificationSettings = require('../models/NotificationSettings');
const Task = require('../models/Task');

async function migrate() {
  console.log('🔄 Starting Migration from MySQL to MongoDB...');

  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/screenlytics';
  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB Atlas');

  let pool;
  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'screenlytics',
      waitForConnections: true,
      connectionLimit: 5,
    });

    const [mysqlUsers] = await pool.query('SELECT * FROM users');
    console.log(`📦 Found ${mysqlUsers.length} users in MySQL.`);

    const userIdMap = new Map(); // MySQL ID -> MongoDB _id

    for (const u of mysqlUsers) {
      let mongoUser = await User.findOne({ email: u.email.toLowerCase() });
      if (!mongoUser) {
        mongoUser = await User.create({
          name: u.name,
          email: u.email.toLowerCase(),
          password: u.password,
          createdAt: u.created_at || new Date(),
        });
        console.log(`👤 Migrated User: ${u.email}`);
      }
      userIdMap.set(u.id, mongoUser._id);
    }

    // Migrate Screen Logs
    try {
      const [logs] = await pool.query('SELECT * FROM screen_logs');
      for (const l of logs) {
        const mongoUserId = userIdMap.get(l.user_id);
        if (!mongoUserId) continue;

        const dateStr = l.log_date instanceof Date ? l.log_date.toISOString().split('T')[0] : String(l.log_date);

        await ScreenLog.findOneAndUpdate(
          { user: mongoUserId, logDate: dateStr },
          {
            user: mongoUserId,
            logDate: dateStr,
            totalMins: l.total_mins || l.duration_minutes || 0,
            studyMins: l.study_mins || 0,
            socialMins: l.social_mins || 0,
            entMins: l.ent_mins || 0,
            otherMins: l.other_mins || 0,
            score: l.score || 0,
            category: l.category || 'Normal',
          },
          { upsert: true }
        );
      }
      console.log(`📊 Migrated ${logs.length} screen logs.`);
    } catch (e) {
      console.log('ℹ️ Screen logs table skip or not found:', e.message);
    }

    // Migrate Tasks
    try {
      const [tasks] = await pool.query('SELECT * FROM tasks');
      for (const t of tasks) {
        const mongoUserId = userIdMap.get(t.user_id);
        if (!mongoUserId) continue;

        const dateStr = t.iso_date instanceof Date ? t.iso_date.toISOString().split('T')[0] : String(t.iso_date);

        await Task.create({
          user: mongoUserId,
          title: t.title,
          type: t.type || 'study',
          isoDate: dateStr,
          displayDate: t.display_date || dateStr,
          time: t.time || '10:00',
          duration: t.duration || 30,
          done: Boolean(t.done),
        });
      }
      console.log(`📅 Migrated ${tasks.length} tasks.`);
    } catch (e) {
      console.log('ℹ️ Tasks table skip or not found:', e.message);
    }

    console.log('🎉 Migration completed successfully!');
  } catch (err) {
    console.error('⚠️ MySQL migration skipped or encountered error:', err.message);
  } finally {
    if (pool) await pool.end();
    await mongoose.disconnect();
    process.exit(0);
  }
}

migrate();
