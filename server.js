// Backend Proxy Server untuk Replicate API
// File: server.js

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('.')); // Serve static files

// Configuration
const REPLICATE_API_TOKEN = 'r8_28oRUg1UwsSaUCtWxUa4VKv4lWPxRAc3R7pRi'; // Ganti dengan token Anda
const REPLICATE_API_ENDPOINT = 'https://api.replicate.com/v1/predictions';
const MODEL_VERSION = 'cfd0f86fbcd03df45fca7ce83af9bb9c07850a3317303fe8dcf677038541db8a';

// Route: Create Prediction
app.post('/api/generate', async (req, res) => {
    try {
        const { prompt, negativePrompt } = req.body;

        console.log('Creating prediction...');
        console.log('Prompt:', prompt);

        const response = await fetch(REPLICATE_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${REPLICATE_API_TOKEN}`
            },
            body: JSON.stringify({
                version: MODEL_VERSION,
                input: {
                    prompt: prompt,
                    negative_prompt: negativePrompt || 'nsfw, lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry',
                    width: 832,
                    height: 1216,
                    num_outputs: 1,
                    guidance_scale: 7,
                    num_inference_steps: 28,
                    seed: Math.floor(Math.random() * 1000000)
                }
            })
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('Replicate API Error:', error);
            return res.status(response.status).json({ error: error });
        }

        const prediction = await response.json();
        console.log('Prediction created:', prediction.id);

        res.json(prediction);

    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Route: Check Prediction Status
app.get('/api/prediction/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const response = await fetch(`${REPLICATE_API_ENDPOINT}/${id}`, {
            headers: {
                'Authorization': `Token ${REPLICATE_API_TOKEN}`
            }
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('Status check error:', error);
            return res.status(response.status).json({ error: error });
        }

        const prediction = await response.json();
        console.log('Status:', prediction.status);

        res.json(prediction);

    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Anime AI Generator API is running' });
});

// Start server
app.listen(PORT, () => {
    console.log(`
    ========================================
    🎨 Anime AI Generator Server
    ========================================
    Server running on: http://localhost:${PORT}
    API endpoint: http://localhost:${PORT}/api
    
    IMPORTANT:
    - Edit REPLICATE_API_TOKEN in this file
    - Open http://localhost:${PORT} in browser
    ========================================
    `);
});