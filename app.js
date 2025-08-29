const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const expressLayouts = require('express-ejs-layouts');
require('dotenv').config();

const app = express();

// Security middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(cors());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use(express.static('public'));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'expert-tutor-hyderabad-secret-key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/expert-tutor-hyderabad'
  }),
  cookie: {
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// View engine setup
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layouts/main');
app.set('views', './views');

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/expert-tutor-hyderabad')
  .then(() => {
    console.log('✅ Connected to MongoDB');
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
  });

// Routes
app.get('/', (req, res) => {
  res.render('pages/index', { 
    title: 'Expert Tutors Hyderabad - Home Tutoring Services',
    page: 'home'
  });
});

app.get('/about', (req, res) => {
  res.render('pages/about', { 
    title: 'About Us - Expert Tutors Hyderabad',
    page: 'about'
  });
});

app.get('/contact', (req, res) => {
  res.render('pages/contact', { 
    title: 'Contact Us - Expert Tutors Hyderabad',
    page: 'contact'
  });
});

// Error handling middleware
app.use((req, res, next) => {
  res.status(404).render('pages/404', { 
    title: '404 - Page Not Found',
    page: '404'
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('pages/500', { 
    title: '500 - Server Error',
    page: '500'
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Expert Tutors Hyderabad server running on port ${PORT}`);
  console.log(`📱 Local: http://localhost:${PORT}`);
});