const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const contactController = require('../controllers/ContactController');

// Validation middleware for contact form
const validateContactForm = [
    body('studentName')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Student name must be between 2-50 characters')
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage('Student name can only contain letters and spaces'),
    
    body('parentName')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('Parent name must be less than 50 characters')
        .matches(/^[a-zA-Z\s]*$/)
        .withMessage('Parent name can only contain letters and spaces'),
    
    body('phone')
        .trim()
        .isMobilePhone('en-IN')
        .withMessage('Please enter a valid Indian mobile number')
        .isLength({ min: 10, max: 10 })
        .withMessage('Phone number must be exactly 10 digits'),
    
    body('email')
        .trim()
        .isEmail()
        .normalizeEmail()
        .withMessage('Please enter a valid email address'),
    
    body('age')
        .optional()
        .isIn(['10-14', '15-18', '18-22', '22+'])
        .withMessage('Please select a valid age group'),
    
    body('subjects')
        .custom((value) => {
            if (!value || (Array.isArray(value) && value.length === 0)) {
                throw new Error('Please select at least one tech subject');
            }
            
            const validSubjects = [
                'Python', 'JavaScript', 'Java', 'C++', 'React', 'Node.js',
                'Data Science', 'Mobile Apps', 'DSA', 'Databases', 'AI', 'Cloud'
            ];
            
            const selectedSubjects = Array.isArray(value) ? value : [value];
            const invalidSubjects = selectedSubjects.filter(subject => !validSubjects.includes(subject));
            
            if (invalidSubjects.length > 0) {
                throw new Error('Invalid subject selection');
            }
            
            return true;
        }),
    
    body('learningGoal')
        .isIn(['beginner', 'school-project', 'job-prep', 'career-switch', 'skill-upgrade', 'certification', 'portfolio'])
        .withMessage('Please select a valid learning goal'),
    
    body('area')
        .isIn(['Hitech City', 'Gachibowli', 'Madhapur', 'Banjara Hills', 'Jubilee Hills', 
               'Kondapur', 'Miyapur', 'Kukatpally', 'Ameerpet', 'Somajiguda', 
               'Begumpet', 'Secunderabad', 'Other'])
        .withMessage('Please select a valid area in Hyderabad'),
    
    body('tutorGender')
        .optional()
        .isIn(['male', 'female', ''])
        .withMessage('Please select a valid tutor preference'),
    
    body('sessionType')
        .optional()
        .isIn(['home', 'online', 'both'])
        .withMessage('Please select a valid session type'),
    
    body('budget')
        .optional()
        .isIn(['500-800', '800-1200', '1200-1800', '1800+', ''])
        .withMessage('Please select a valid budget range'),
    
    body('experience')
        .optional()
        .isIn(['complete-beginner', 'some-basics', 'intermediate', 'advanced'])
        .withMessage('Please select a valid experience level'),
    
    body('message')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Message must be less than 500 characters')
];

// Rate limiting middleware (optional - implement if needed)
const rateLimit = require('express-rate-limit');

const contactRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3, // Limit each IP to 3 requests per windowMs
    message: 'Too many contact form submissions, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

// Routes

// GET /contact - Display contact form
router.get('/', contactController.showContactPage);

// POST /contact - Handle contact form submission
router.post('/', 
    contactRateLimit, // Apply rate limiting
    validateContactForm, // Apply validation
    (req, res, next) => {
        // Handle validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(error => error.msg).join('. ');
            return res.redirect(`/contact?error=${encodeURIComponent(errorMessages)}`);
        }
        next();
    },
    contactController.handleContactForm
);

// API Routes for AJAX calls (optional)

// POST /contact/api - Handle AJAX form submission
router.post('/api', 
    contactRateLimit,
    validateContactForm,
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        next();
    },
    async (req, res) => {
        try {
            // Use the same controller logic but return JSON
            await contactController.handleContactForm(req, res);
            res.json({
                success: true,
                message: 'Thank you! We\'ve received your request and will contact you within 2 hours.'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Something went wrong. Please try again.'
            });
        }
    }
);

// GET /contact/success - Success page (optional)
router.get('/success', (req, res) => {
    res.render('pages/contact-success', {
        title: 'Request Submitted - Expert Tech Tutors Hyderabad',
        page: 'contact-success'
    });
});

// Admin routes (protect with authentication middleware later)

// GET /contact/admin - View all contact requests
router.get('/admin', 
    // TODO: Add authentication middleware
    // authenticateAdmin,
    contactController.getAllContacts
);

// PUT /contact/admin/:id/status - Update contact status
router.put('/admin/:id/status',
    // TODO: Add authentication middleware
    // authenticateAdmin,
    body('status').isIn(['new', 'contacted', 'matched', 'closed']).withMessage('Invalid status'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        next();
    },
    contactController.updateContactStatus
);

// Utility routes

// POST /contact/quick-call - Quick call request (WhatsApp integration)
router.post('/quick-call', 
    contactRateLimit,
    [
        body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name is required'),
        body('phone').isMobilePhone('en-IN').withMessage('Valid phone number required'),
        body('subject').optional().trim().isLength({ max: 100 })
    ],
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        next();
    },
    async (req, res) => {
        try {
            const { name, phone, subject } = req.body;
            
            // Log quick call request
            console.log('Quick call request:', { name, phone, subject, timestamp: new Date() });
            
            // TODO: Send WhatsApp notification or SMS
            // await sendQuickCallNotification({ name, phone, subject });
            
            res.json({
                success: true,
                message: 'We\'ll call you back within 30 minutes!'
            });
            
        } catch (error) {
            console.error('Quick call request error:', error);
            res.status(500).json({
                success: false,
                message: 'Something went wrong. Please try again.'
            });
        }
    }
);

// GET /contact/subjects - Get available subjects (API endpoint)
router.get('/subjects', (req, res) => {
    const subjects = [
        { id: 'python', name: 'Python Programming', category: 'Programming', popular: true },
        { id: 'javascript', name: 'JavaScript & Web Dev', category: 'Web Development', popular: true },
        { id: 'java', name: 'Java Programming', category: 'Programming', popular: true },
        { id: 'cpp', name: 'C++ Programming', category: 'Programming', popular: false },
        { id: 'react', name: 'React Development', category: 'Web Development', popular: true },
        { id: 'nodejs', name: 'Node.js & Backend', category: 'Web Development', popular: true },
        { id: 'data-science', name: 'Data Science & ML', category: 'Data Science', popular: true },
        { id: 'mobile-apps', name: 'Mobile App Development', category: 'Mobile Development', popular: true },
        { id: 'dsa', name: 'Data Structures & Algorithms', category: 'Computer Science', popular: true },
        { id: 'databases', name: 'Database Management', category: 'Database', popular: false },
        { id: 'ai', name: 'Artificial Intelligence', category: 'AI/ML', popular: true },
        { id: 'cloud', name: 'Cloud Computing (AWS/Azure)', category: 'Cloud', popular: false }
    ];
    
    res.json({
        success: true,
        subjects
    });
});

// GET /contact/areas - Get service areas (API endpoint)
router.get('/areas', (req, res) => {
    const areas = [
        { id: 'hitech-city', name: 'Hitech City', zone: 'West', popular: true },
        { id: 'gachibowli', name: 'Gachibowli', zone: 'West', popular: true },
        { id: 'madhapur', name: 'Madhapur', zone: 'West', popular: true },
        { id: 'banjara-hills', name: 'Banjara Hills', zone: 'Central', popular: true },
        { id: 'jubilee-hills', name: 'Jubilee Hills', zone: 'Central', popular: true },
        { id: 'kondapur', name: 'Kondapur', zone: 'West', popular: false },
        { id: 'miyapur', name: 'Miyapur', zone: 'West', popular: false },
        { id: 'kukatpally', name: 'Kukatpally', zone: 'North', popular: false },
        { id: 'ameerpet', name: 'Ameerpet', zone: 'Central', popular: false },
        { id: 'somajiguda', name: 'Somajiguda', zone: 'Central', popular: false },
        { id: 'begumpet', name: 'Begumpet', zone: 'Central', popular: false },
        { id: 'secunderabad', name: 'Secunderabad', zone: 'North', popular: false }
    ];
    
    res.json({
        success: true,
        areas
    });
});

module.exports = router;