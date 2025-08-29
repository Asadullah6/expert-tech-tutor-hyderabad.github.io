const nodemailer = require('nodemailer');

// Contact Model (we'll create this later)
// const Contact = require('../models/Contact');

// Email configuration
const createTransporter = () => {
    return nodemailer.createTransporter({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};

// Display contact page
const showContactPage = (req, res) => {
    try {
        res.render('pages/contact', {
            title: 'Contact Us - Expert Tech Tutors Hyderabad',
            page: 'contact',
            success: req.query.success,
            error: req.query.error
        });
    } catch (error) {
        console.error('Error rendering contact page:', error);
        res.status(500).send('Server Error');
    }
};

// Handle contact form submission
const handleContactForm = async (req, res) => {
    try {
        const {
            studentName,
            parentName,
            phone,
            email,
            age,
            subjects,
            learningGoal,
            area,
            tutorGender,
            sessionType,
            budget,
            experience,
            message
        } = req.body;

        // Validation
        if (!studentName || !phone || !email || !area || !learningGoal) {
            return res.redirect('/contact?error=Please fill in all required fields');
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.redirect('/contact?error=Please enter a valid email address');
        }

        // Validate phone number (Indian format)
        const phoneRegex = /^[6-9]\d{9}$/;
        if (!phoneRegex.test(phone.replace(/\s+/g, ''))) {
            return res.redirect('/contact?error=Please enter a valid 10-digit phone number');
        }

        // Check if at least one subject is selected
        const selectedSubjects = Array.isArray(subjects) ? subjects : [subjects];
        if (!selectedSubjects || selectedSubjects.length === 0) {
            return res.redirect('/contact?error=Please select at least one tech subject');
        }

        // Create contact data object
        const contactData = {
            studentName: studentName.trim(),
            parentName: parentName ? parentName.trim() : '',
            phone: phone.replace(/\s+/g, ''),
            email: email.toLowerCase().trim(),
            age: age || 'Not specified',
            subjects: selectedSubjects,
            learningGoal,
            area,
            tutorGender: tutorGender || 'No preference',
            sessionType: sessionType || 'home',
            budget: budget || 'Not specified',
            experience: experience || 'complete-beginner',
            message: message ? message.trim() : '',
            submittedAt: new Date(),
            status: 'new'
        };

        // TODO: Save to database (uncomment when Contact model is ready)
        // const newContact = new Contact(contactData);
        // await newContact.save();

        // For now, just log the data (remove this when database is connected)
        console.log('New contact form submission:', contactData);

        // Send confirmation email to student/parent
        await sendConfirmationEmail(contactData);

        // Send notification email to admin
        await sendAdminNotification(contactData);

        // Send WhatsApp notification (optional - you can integrate WhatsApp API later)
        // await sendWhatsAppNotification(contactData);

        // Redirect with success message
        res.redirect('/contact?success=Thank you! We\'ve received your request and will contact you within 2 hours with suitable tech tutor matches.');

    } catch (error) {
        console.error('Error processing contact form:', error);
        res.redirect('/contact?error=Something went wrong. Please try again or call us directly.');
    }
};

// Send confirmation email to student/parent
const sendConfirmationEmail = async (contactData) => {
    try {
        const transporter = createTransporter();

        const subjectsText = contactData.subjects.join(', ');
        
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: contactData.email,
            subject: '✅ Request Received - Expert Tech Tutors Hyderabad',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%); padding: 2rem; text-align: center;">
                        <h1 style="color: white; margin: 0;">Expert Tech Tutors Hyderabad</h1>
                        <p style="color: #ff9933; font-size: 1.2rem; margin: 0.5rem 0;">Request Confirmed! 🚀</p>
                    </div>
                    
                    <div style="padding: 2rem; background-color: #f8fafc;">
                        <h2 style="color: #1e40af;">Hi ${contactData.studentName}!</h2>
                        <p>Thank you for choosing Expert Tech Tutors Hyderabad. We've received your request for tech tutoring and our team is already working to find you the perfect match!</p>
                        
                        <div style="background: white; padding: 1.5rem; border-radius: 10px; margin: 1rem 0; border-left: 4px solid #ff9933;">
                            <h3 style="color: #1e40af; margin-top: 0;">Your Request Summary:</h3>
                            <p><strong>Student:</strong> ${contactData.studentName}</p>
                            <p><strong>Tech Subjects:</strong> ${subjectsText}</p>
                            <p><strong>Learning Goal:</strong> ${contactData.learningGoal}</p>
                            <p><strong>Area:</strong> ${contactData.area}</p>
                            <p><strong>Experience Level:</strong> ${contactData.experience}</p>
                            <p><strong>Session Type:</strong> ${contactData.sessionType}</p>
                            ${contactData.budget !== 'Not specified' ? `<p><strong>Budget:</strong> ${contactData.budget}/hour</p>` : ''}
                        </div>
                        
                        <div style="background: #fff4e6; padding: 1.5rem; border-radius: 10px; margin: 1rem 0;">
                            <h3 style="color: #1e40af; margin-top: 0;">What Happens Next?</h3>
                            <ul style="color: #374151;">
                                <li>📋 Our team will review your requirements</li>
                                <li>🔍 We'll match you with 2-3 suitable tech tutors</li>
                                <li>📞 We'll call you within 2 hours with tutor profiles</li>
                                <li>🎯 You can choose your preferred tutor</li>
                                <li>🚀 Start learning as early as tomorrow!</li>
                            </ul>
                        </div>
                        
                        <div style="text-align: center; margin: 2rem 0;">
                            <p style="margin-bottom: 1rem;">Need immediate assistance?</p>
                            <a href="https://wa.me/919876543210" style="background: #ff9933; color: white; padding: 1rem 2rem; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">
                                💬 WhatsApp Us
                            </a>
                        </div>
                    </div>
                    
                    <div style="background: #1e40af; color: white; padding: 1rem; text-align: center; font-size: 0.9rem;">
                        <p>Expert Tech Tutors Hyderabad | Hyderabad's #1 Programming Tutoring Service</p>
                        <p>📧 info@experttechtutor.com | 📱 +91 98765 43210</p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('Confirmation email sent to:', contactData.email);

    } catch (error) {
        console.error('Error sending confirmation email:', error);
        // Don't throw error - form submission should still succeed
    }
};

// Send notification email to admin
const sendAdminNotification = async (contactData) => {
    try {
        const transporter = createTransporter();

        const subjectsText = contactData.subjects.join(', ');
        
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
            subject: '🚨 New Tech Tutor Request - Expert Tech Tutors Hyderabad',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: #dc2626; padding: 1.5rem; text-align: center;">
                        <h1 style="color: white; margin: 0;">🚨 NEW TUTOR REQUEST</h1>
                        <p style="color: #fca5a5; margin: 0.5rem 0;">Immediate Action Required</p>
                    </div>
                    
                    <div style="padding: 2rem; background-color: #f8fafc;">
                        <h2 style="color: #1e40af;">Request Details:</h2>
                        
                        <div style="background: white; padding: 1.5rem; border-radius: 10px; margin: 1rem 0; border: 2px solid #ff9933;">
                            <h3 style="color: #dc2626; margin-top: 0;">Student Information:</h3>
                            <p><strong>Student Name:</strong> ${contactData.studentName}</p>
                            ${contactData.parentName ? `<p><strong>Parent/Guardian:</strong> ${contactData.parentName}</p>` : ''}
                            <p><strong>Phone:</strong> <a href="tel:+91${contactData.phone}">+91 ${contactData.phone}</a></p>
                            <p><strong>Email:</strong> <a href="mailto:${contactData.email}">${contactData.email}</a></p>
                            <p><strong>Age Group:</strong> ${contactData.age}</p>
                            <p><strong>Area:</strong> ${contactData.area}</p>
                        </div>
                        
                        <div style="background: white; padding: 1.5rem; border-radius: 10px; margin: 1rem 0; border: 2px solid #10b981;">
                            <h3 style="color: #059669; margin-top: 0;">Learning Requirements:</h3>
                            <p><strong>Tech Subjects:</strong> ${subjectsText}</p>
                            <p><strong>Learning Goal:</strong> ${contactData.learningGoal}</p>
                            <p><strong>Experience Level:</strong> ${contactData.experience}</p>
                            <p><strong>Session Type:</strong> ${contactData.sessionType}</p>
                            <p><strong>Budget Range:</strong> ${contactData.budget}</p>
                            <p><strong>Tutor Preference:</strong> ${contactData.tutorGender}</p>
                            ${contactData.message ? `<p><strong>Special Requirements:</strong> ${contactData.message}</p>` : ''}
                        </div>
                        
                        <div style="background: #fee2e2; padding: 1.5rem; border-radius: 10px; margin: 1rem 0;">
                            <h3 style="color: #dc2626; margin-top: 0;">⚡ Action Required:</h3>
                            <ul style="color: #374151;">
                                <li>📞 Call the student within 2 hours</li>
                                <li>🔍 Find 2-3 matching tech tutors</li>
                                <li>📧 Send tutor profiles to student</li>
                                <li>✅ Update CRM with request details</li>
                            </ul>
                        </div>
                        
                        <div style="text-align: center; margin: 2rem 0;">
                            <a href="tel:+91${contactData.phone}" style="background: #dc2626; color: white; padding: 1rem 2rem; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold; margin: 0.5rem;">
                                📞 Call Student
                            </a>
                            <a href="https://wa.me/91${contactData.phone}" style="background: #16a34a; color: white; padding: 1rem 2rem; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold; margin: 0.5rem;">
                                💬 WhatsApp
                            </a>
                        </div>
                        
                        <p style="text-align: center; color: #6b7280; font-size: 0.9rem;">
                            Request submitted on: ${new Date(contactData.submittedAt).toLocaleString('en-IN')}
                        </p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('Admin notification sent successfully');

    } catch (error) {
        console.error('Error sending admin notification:', error);
        // Don't throw error - form submission should still succeed
    }
};

// Get all contact requests (for admin panel)
const getAllContacts = async (req, res) => {
    try {
        // TODO: Implement when Contact model is ready
        // const contacts = await Contact.find().sort({ submittedAt: -1 });
        
        // For now, return empty array
        const contacts = [];
        
        res.render('admin/contacts', {
            title: 'Contact Requests - Admin Panel',
            contacts,
            page: 'admin-contacts'
        });
        
    } catch (error) {
        console.error('Error fetching contacts:', error);
        res.status(500).send('Server Error');
    }
};

// Update contact status (for admin)
const updateContactStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        // TODO: Implement when Contact model is ready
        // await Contact.findByIdAndUpdate(id, { status });
        
        res.json({ success: true });
        
    } catch (error) {
        console.error('Error updating contact status:', error);
        res.status(500).json({ error: 'Server Error' });
    }
};

module.exports = {
    showContactPage,
    handleContactForm,
    getAllContacts,
    updateContactStatus
};