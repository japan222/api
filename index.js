const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const mongoUri = process.env.MONGO_URI;
const dbName = process.env.DB_NAME || 'projectA';
const collectionName = process.env.COLLECTION_NAME || 'visitors';

app.use(cors());
app.use(express.json());

let db, collection;

async function getCountry(ip) {
  const res = await fetch(`https://ipapi.co/${ip}/country_name/`);
  const country = await res.text();
  return country || 'Unknown';
}

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
    const ipRaw = req.body.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const ip = ipRaw.split(',')[0].trim(); // เอาเฉพาะ IP แรก
    const ua = req.body.ua || req.headers['user-agent'];
    const ref = req.body.ref || '-';
    const time = req.body.time || new Date().toISOString();

    const country = await getCountry(ip); // 👈 ตรวจประเทศจาก IP

    const log = { ip, ua, ref, time, country };

    console.log('📩 Incoming log:', log);

    await collection.insertOne(log);
    console.log('✅ Logged:', log);
    res.status(200).json({ message: 'Logged successfully', country });
  } catch (error) {
    console.error('❌ Error inserting log:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/', (req, res) => {
  res.send('MongoDB Logger API is running ✅');
});
