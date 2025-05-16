import express from 'express';
import { body, validationResult } from 'express-validator';
import { isAuthenticated } from '../middleware/auth.js';
import db from '../models/database.js';
import { OpenAI } from 'openai';
import axios from 'axios';

const router = express.Router();

// Initialize OpenAI with error handling
let openai = null;
try {
    if (process.env.OPENAI_API_KEY) {
        openai = new OpenAI(process.env.OPENAI_API_KEY);
    } else {
        console.warn('⚠️ OpenAI API key not found. Chat features will be disabled.');
    }
} catch (error) {
    console.error('Error initializing OpenAI:', error);
}

// Initialize Heygen client with error handling
let heygenApi = null;
try {
    if (process.env.HEYGEN_API_KEY) {
        heygenApi = axios.create({
            baseURL: 'https://api.heygen.com/v1',
            headers: {
                'Authorization': `Bearer ${process.env.HEYGEN_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
    } else {
        console.warn('⚠️ Heygen API key not found. Video avatar features will be disabled.');
    }
} catch (error) {
    console.error('Error initializing Heygen:', error);
}

// Start a new consultation
router.post('/consultation/start', 
    isAuthenticated,
    [
        body('type').isIn(['free', 'paid']).withMessage('Invalid consultation type')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const consultationId = await db.createConsultation(req.user.id, req.body.type);
            res.json({ consultationId });
        } catch (error) {
            console.error('Error starting consultation:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
);

// Send a message in consultation
router.post('/chat/send',
    isAuthenticated,
    [
        body('consultationId').isInt().withMessage('Invalid consultation ID'),
        body('message').notEmpty().withMessage('Message cannot be empty')
    ],
    async (req, res) => {
        try {
            // Check if OpenAI is initialized
            if (!openai) {
                return res.status(503).json({ 
                    error: 'Chat service is currently unavailable. Please check API configuration.' 
                });
            }

            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { consultationId, message } = req.body;

            // Save user message
            await db.addChatMessage(consultationId, 'user', message);

            // Get AI response
            const completion = await openai.chat.completions.create({
                model: "gpt-4-turbo-preview",
                messages: [
                    {
                        role: "system",
                        content: "You are an AI business coach for Indonesian SMEs. Provide helpful, practical advice in Bahasa Indonesia. Be empathetic and professional."
                    },
                    {
                        role: "user",
                        content: message
                    }
                ],
                temperature: 0.7,
                max_tokens: 500
            });

            const aiResponse = completion.choices[0].message.content;

            // Generate video response if paid consultation and Heygen is available
            let videoUrl = null;
            const consultation = await db.getConsultationById(consultationId);
            
            if (consultation.type === 'paid' && heygenApi) {
                try {
                    const videoResponse = await heygenApi.post('/videos', {
                        avatar_id: process.env.HEYGEN_AVATAR_ID,
                        text: aiResponse,
                        voice_type: "neural",
                        language: "id-ID"
                    });
                    videoUrl = videoResponse.data.video_url;
                } catch (error) {
                    console.error('Error generating video:', error);
                }
            }

            // Save AI response
            await db.addChatMessage(consultationId, 'ai', aiResponse, videoUrl);

            res.json({
                message: aiResponse,
                videoUrl
            });
        } catch (error) {
            console.error('Error in chat:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
);

// Generate consultation report
router.post('/report/generate',
    isAuthenticated,
    [
        body('consultationId').isInt().withMessage('Invalid consultation ID')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { consultationId } = req.body;
            
            // Generate report logic will be implemented here
            // This will include:
            // 1. Fetching all chat messages
            // 2. Generating PDF using PDFKit
            // 3. Uploading to Cloudinary
            // 4. Saving report URL to database

            res.json({ message: 'Report generation started' });
        } catch (error) {
            console.error('Error generating report:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
);

export default router; 