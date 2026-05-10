require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const passport = require('passport');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const connectDB = require('./config/db');
require('./config/passport'); // Passport configured

// Routes
const authRoutes = require('./routes/auth');
const assignmentRoutes = require('./routes/assignments');
const submissionRoutes = require('./routes/submissions');
const classroomRoutes = require('./routes/classrooms');

// Initialize app
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174', process.env.CLIENT_URL].filter(Boolean),
    credentials: true
  }
});

// Attach io to req for real-time emissions in controllers
app.use((req, res, next) => {
  req.io = io;
  next();
});

io.on('connection', (socket) => {
  socket.on('join_assignment', (assignmentId) => {
    socket.join(assignmentId);
  });
  
  socket.on('join_classroom', (classroomId) => {
    socket.join(`classroom_${classroomId}`);
  });
});

// Connect DB
// Only try connecting if URI is actually set to avoid crash when users test without env via mock
if (process.env.MONGODB_URI && process.env.MONGODB_URI !== 'your_mongodb_atlas_uri') {
  connectDB();
}

// Middleware
// 1. CORS should be first to handle preflight requests properly
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', process.env.CLIENT_URL].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// 2. Helmet for security headers (disable CORP to allow cross-origin requests from frontend)
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

// 3. Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. Rate limiting: 100 requests per 15 mins for API routes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again in 15 minutes'
});
app.use('/api', limiter);

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent HTTP Parameter Pollution
app.use(hpp());
app.use(passport.initialize());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/classrooms', classroomRoutes);
app.use('/api/tutor', require('./routes/tutor'));
app.use('/api/admin', require('./routes/admin'));

// Root Endpoint
app.get('/', (req, res) => {
  res.send('AssignGuard API is running');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Server Error' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
