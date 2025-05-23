const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const mongoUri = process.env.MONGO_URI;
const dbName = process.env.DB_NAME || 'projectA';
const collectionName = process.env.COLLECTION_NAME || 'visitors';

app.use(cors());
app.use(express.json());

let db, collection;

MongoClient.connect(mongoUri, { useUnifiedTopology: true })
  .then(client => {
    db = client.db(dbName);
    collection = db.collection(collectionName);
    console.log('✅ Connected to MongoDB');

    // ✅ Server จะเริ่มรับ request ก็ต่อเมื่อเชื่อม Mongo ได้แล้ว
    app.listen(port, () => {
      console.log(`🚀 Server running on port ${port}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1); // ❌ ถ้าเชื่อมไม่ได้ ก็ไม่ควรรัน server
  });

app.post('/api/track', async (req, res) => {
  try {
    const log = {
      ip: req.body.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      ua: req.body.ua || req.headers['user-agent'],
      ref: req.body.ref || '-',
      time: req.body.time || new Date().toISOString()
    };

    console.log('📩 Incoming log:', log);

    await collection.insertOne(log);
    console.log('✅ Log inserted');
    res.status(200).json({ message: 'Logged successfully' });
  } catch (error) {
    console.error('❌ Error inserting log:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/', (req, res) => {
  res.send('MongoDB Logger API is running ✅');
});
