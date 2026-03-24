require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Path to save messages
const messagesFile = path.join(__dirname, 'messages.json');

// Ensure messages file exists
if (!fs.existsSync(messagesFile)) {
    fs.writeFileSync(messagesFile, JSON.stringify([]));
}

// Nodemailer Transporter Setup
// Note: To make this work, you need to provide your email credentials in the .env file.
const transporter = nodemailer.createTransport({
    service: 'gmail', // or your preferred email service
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Endpoint to handle form submission
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ success: false, error: 'Please provide all required fields' });
        }

        const newMessage = {
            id: Date.now().toString(),
            name,
            email,
            message,
            date: new Date().toISOString()
        };

        // 1. Save data to project file
        const messagesData = JSON.parse(fs.readFileSync(messagesFile, 'utf8'));
        messagesData.push(newMessage);
        fs.writeFileSync(messagesFile, JSON.stringify(messagesData, null, 2));

        // 2. Send Email
        // If EMAIL_USER and EMAIL_PASS are set and not the default placeholders, send the email
        if (
            process.env.EMAIL_USER && 
            process.env.EMAIL_PASS && 
            process.env.EMAIL_USER !== 'your-email@gmail.com'
        ) {
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: process.env.EMAIL_USER, // sending to yourself
                subject: `New Contact Form Message from ${name}`,
                text: `You have received a new message from your portfolio website.\n\nName: ${name}\nEmail: ${email}\nMessage:\n${message}`
            };

            await transporter.sendMail(mailOptions);
            console.log('Email sent successfully');
        } else {
            console.log('Email not sent: Please configure EMAIL_USER and EMAIL_PASS with real credentials in .env file.');
        }

        res.status(200).json({ success: true, message: 'Message saved successfully.' });
    } catch (error) {
        console.error('Error handling contact form:', error);
        res.status(500).json({ success: false, error: 'An error occurred while sending the message.' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
