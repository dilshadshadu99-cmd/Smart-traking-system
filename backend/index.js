require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const admin = require('firebase-admin');

// -------------------------------------------------------------
// 1. FIREBASE ADMIN SETUP (Uncomment after adding firebase-admin.json)
// -------------------------------------------------------------
// try {
//   var serviceAccount = require("./firebase-admin.json");
//   admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount)
//   });
//   console.log("🔥 Firebase Admin Initialized successfully.");
// } catch (error) {
//   console.warn("⚠️ Firebase Admin failing to init. Make sure you placed firebase-admin.json safely as per the SETUP GUIDE.");
// }

// -------------------------------------------------------------
// 2. EXPRESS API & SERVER SETUP
// -------------------------------------------------------------
const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

// -------------------------------------------------------------
// 3. SOCKET.IO REAL-TIME TRACKING SETUP
// -------------------------------------------------------------
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Cache the latest locations per bus to avoid querying DB for immediate fetches
const liveLocationsMap = new Map(); 

io.on('connection', (socket) => {
  console.log(`🔌 New client connected: ${socket.id}`);

  // Driver App Action: Emits their location every 10-15s
  socket.on('update_location', (data) => {
    // data payload: { busId, lat, lng, timestamp, status }
    const { busId, lat, lng, timestamp } = data;
    
    // Cache it locally on server memory
    liveLocationsMap.set(busId, { lat, lng, timestamp });

    // Broadcast to only parents who have joined the bus tracking room
    io.to(`bus_${busId}`).emit('bus_location_update', { busId, lat, lng, timestamp });
    
    // OPTIONAL: Persist to Firebase Firestore periodically
    // (e.g. only save to DB every 60 seconds to save heavy Firebase Writes, 
    // while sockets handle 10s updates for totally free low-latency real-time).
    // admin.firestore().collection('buses').doc(busId).update({ lastLocation: {lat, lng}, updatedAt: timestamp });
  });

  // Parent App Action: Enter the 'room' for a specific bus
  socket.on('join_bus_room', (busId) => {
    socket.join(`bus_${busId}`);
    console.log(`📡 Parent joined tracking room: bus_${busId}`);

    // If cache exists, send the latest location immediately to prevent UI loading screens!
    if (liveLocationsMap.has(busId)) {
      socket.emit('bus_location_update', { busId, ...liveLocationsMap.get(busId) });
    }
  });

  // Admin App Action: Listen to ALL buses globally
  socket.on('join_admin_dashboard', () => {
    socket.join('admin_dashboard');
    socket.emit('all_buses_update', Array.from(liveLocationsMap.entries()));
  });

  // Parent App Action: Leaving tracking room
  socket.on('leave_bus_room', (busId) => {
    socket.leave(`bus_${busId}`);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// -------------------------------------------------------------
// 4. REST API ROUTES (For basic functions before Socket handoff)
// -------------------------------------------------------------
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: Date.now() }));

// Example API: Send Custom Admin Push Notification via FCM
app.post('/api/notifications/send', async (req, res) => {
  const { title, body, topic } = req.body;
  
  if (!admin.apps.length) return res.status(500).json({ error: "Firebase not initialized. Check Guide." });

  try {
    const response = await admin.messaging().send({
      notification: { title, body },
      topic: topic || 'parents' // parents subscribe to FCM topics
    });
    res.json({ success: true, response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------------------------------------------
// 5. BOOTSTRAP
// -------------------------------------------------------------
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 Smart Tracking Backend & Realtime Sockets running on port ${PORT}`);
});
