const express = require('express');
const router = express.Router();

// Home page route
router.get('/', (req, res) => {
    res.render('pages/index', { 
        title: 'Expert Tech Tutor Hyderabad - Professional CS & Programming Tutoring',
        page: 'home',
        description: 'Learn Web Development, AI, Python, Data Science from industry experts in Hyderabad'
    });
});

// About page route
router.get('/about', (req, res) => {
    res.render('pages/about', { 
        title: 'About Us - Expert Tech Tutor Hyderabad',
        page: 'about',
        description: 'Meet our team of experienced technology tutors and instructors'
    });
});

// Services page route
router.get('/services', (req, res) => {
    res.render('pages/services', { 
        title: 'Tech Tutoring Services - Web Development, AI, Python | Expert Tech Tutor Hyderabad',
        page: 'services',
        description: 'Comprehensive tutoring services for Web Development, App Development, AI, Python, Data Science and Software Engineering'
    });
});

// Contact page route
router.get('/contact', (req, res) => {
    res.render('pages/contact', { 
        title: 'Contact Us - Expert Tech Tutor Hyderabad',
        page: 'contact',
        description: 'Get in touch with Expert Tech Tutor Hyderabad for personalized technology tutoring'
    });
});

// Optional: Add more routes for future pages
// Courses page route (for future use)
router.get('/courses', (req, res) => {
    res.render('pages/courses', { 
        title: 'Technology Courses - Expert Tech Tutor Hyderabad',
        page: 'courses',
        description: 'Browse our comprehensive technology courses and learning programs'
    });
});

// Blog page route (for future use) 
router.get('/blog', (req, res) => {
    res.render('pages/blog', { 
        title: 'Tech Blog - Expert Tech Tutor Hyderabad',
        page: 'blog',
        description: 'Read latest articles on web development, programming, and technology trends'
    });
});

// 404 Error handler - should be last
router.get('*', (req, res) => {
    res.status(404).render('pages/404', {
        title: 'Page Not Found - Expert Tech Tutor Hyderabad',
        page: '404'
    });
});

module.exports = router;