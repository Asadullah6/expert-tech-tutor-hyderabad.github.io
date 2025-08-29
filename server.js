// Import required packages
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config();

// Import routes
const indexRoutes = require('./routes/index');

// Create Express application
const app = express();

// Set port
const PORT = process.env.PORT || 3000;

// Database connection
const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/expert-tech-tutors';
        
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        
        console.log('✅ MongoDB connected successfully');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};

// Connect to database
connectDB();

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
        },
    },
}));

// CORS configuration
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://yourdomain.com', 'https://www.yourdomain.com']
        : ['http://localhost:3000'],
    credentials: true
}));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'production') {
    app.use(morgan('combined'));
} else {
    app.use(morgan('dev'));
}

// Body parsing middleware
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json({ limit: '10mb' }));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/expert-tech-tutors',
        collectionName: 'sessions'
    }),
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
    }
}));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files middleware
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: process.env.NODE_ENV === 'production' ? '1y' : '0'
}));

// Global template variables
app.use((req, res, next) => {
    // CSS and JavaScript color variables
    res.locals.colors = {
        primaryBlue: '#1e40af',
        saffronAccent: '#ff9933',
        saffronLight: '#ffb366',
        saffronPale: '#fff4e6',
        white: '#ffffff',
        lightGray: '#f8fafc',
        textDark: '#1e293b',
        textGray: '#64748b'
    };
    
    // Company information
    res.locals.company = {
        name: 'Expert Tech Tutors Hyderabad',
        shortName: 'Expert Tech Tutors',
        tagline: 'Learn Programming & Technology with Industry Experts',
        phone: '+91 98765 43210',
        email: 'info@experttechtutor.com',
        whatsapp: '919876543210',
        address: 'Hitech City, Hyderabad, Telangana, India'
    };
    
    // Navigation items
    res.locals.navigation = [
        { name: 'Home', url: '/', page: 'home' },
        { name: 'About', url: '/about', page: 'about' },
        { name: 'Services', url: '/services', page: 'services' },
        { name: 'Subjects', url: '/subjects', page: 'subjects' },
        { name: 'Tutors', url: '/tutors', page: 'tutors' },
        { name: 'Areas', url: '/areas', page: 'areas' },
        { name: 'Contact', url: '/contact', page: 'contact' }
    ];
    
    // Social media links
    res.locals.socialMedia = {
        facebook: 'https://facebook.com/experttechtutor',
        instagram: 'https://instagram.com/experttechtutor',
        twitter: 'https://twitter.com/experttechtutor',
        linkedin: 'https://linkedin.com/company/experttechtutor',
        youtube: 'https://youtube.com/experttechtutor'
    };
    
    // Current year for footer
    res.locals.currentYear = new Date().getFullYear();
    
    // Helper functions
    res.locals.formatPhone = (phone) => {
        return phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
    };
    
    res.locals.generateWhatsAppLink = (phone, message = '') => {
        const encodedMessage = encodeURIComponent(message);
        return `https://wa.me/${phone}?text=${encodedMessage}`;
    };
    
    next();
});

// Request logging middleware (development)
if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        console.log(`📡 ${req.method} ${req.url} - ${new Date().toISOString()}`);
        next();
    });
}

// Routes
app.use('/', indexRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// API status endpoint
app.get('/api/status', (req, res) => {
    res.json({
        server: 'Expert Tech Tutors Hyderabad API',
        status: 'Active',
        version: '1.0.0',
        database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
        timestamp: new Date().toISOString()
    });
});

// Catch 404 and forward to error handler
app.use((req, res, next) => {
    const error = new Error(`Page not found - ${req.originalUrl}`);
    error.status = 404;
    next(error);
});

// Global error handler
app.use((error, req, res, next) => {
    console.error('🚨 Error:', error);
    
    // Set default error status
    const status = error.status || 500;
    
    // Don't leak error details in production
    const message = process.env.NODE_ENV === 'production' 
        ? (status === 404 ? 'Page not found' : 'Something went wrong')
        : error.message;
    
    // Render error page or send JSON for API requests
    if (req.originalUrl.startsWith('/api/')) {
        res.status(status).json({
            success: false,
            error: message,
            timestamp: new Date().toISOString()
        });
    } else {
        res.status(status).render('pages/error', {
            title: `Error ${status}`,
            page: 'error',
            error: {
                status,
                message,
                details: process.env.NODE_ENV === 'production' ? null : error.stack
            }
        });
    }
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('👋 SIGTERM received, shutting down gracefully...');
    server.close(() => {
        console.log('✅ Process terminated');
        mongoose.connection.close();
    });
});

process.on('SIGINT', () => {
    console.log('👋 SIGINT received, shutting down gracefully...');
    server.close(() => {
        console.log('✅ Process terminated');
        mongoose.connection.close();
    });
});

// Start server
const server = app.listen(PORT, () => {
    console.log('\n🚀 Server Started Successfully!');
    console.log('================================');
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📡 Server: http://localhost:${PORT}`);
    console.log(`📱 WhatsApp: https://wa.me/${res.locals?.company?.whatsapp || '919876543210'}`);
    console.log(`📧 Email: ${res.locals?.company?.email || 'info@experttechtutor.com'}`);
    console.log('================================');
    console.log('📋 Available Routes:');
    console.log('   GET  /              - Homepage');
    console.log('   GET  /about         - About Us');
    console.log('   GET  /services      - Our Services');
    console.log('   GET  /subjects      - Tech Subjects');
    console.log('   GET  /tutors        - Find Tutors');
    console.log('   GET  /areas         - Service Areas');
    console.log('   GET  /contact       - Contact Form');
    console.log('   POST /contact       - Submit Contact');
    console.log('   GET  /health        - Health Check');
    console.log('   GET  /api/status    - API Status');
    console.log('================================\n');
    
    if (process.env.NODE_ENV !== 'production') {
        console.log('💡 Development Tips:');
        console.log('   • Use "npm run dev" for auto-restart');
        console.log('   • Check MongoDB connection');
        console.log('   • Configure .env file');
        console.log('   • Test contact form functionality');
        console.log('================================\n');
    }
});

// Export app for testing
module.exports = app;