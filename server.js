const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('.')); // Serve static files

// Configuration
const REPLICATE_API_URL = 'https://api.replicate.com/v1/predictions';
const REPLICATE_TOKEN = process.env.REPLICATE_API_TOKEN || 'YOUR_REPLICATE_API_TOKEN_HERE';
const MODEL_VERSION = '25d2f75ecda0c0bed34c806b7b70319a53a1bccad3ade1a7496524f013f48983'; // Animagine XL V4

// Health check endpoint
app.get('/api/health', (req, res) => {
    const isConfigured = REPLICATE_TOKEN !== 'YOUR_REPLICATE_API_TOKEN_HERE';
    res.json({ 
        status: 'ok',
        configured: isConfigured,
        message: isConfigured ? 'Server ready' : 'Please configure REPLICATE_API_TOKEN'
    });
});

// Generate anime endpoint
app.post('/api/generate', async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        // Check if API token is configured
        if (REPLICATE_TOKEN === 'YOUR_REPLICATE_API_TOKEN_HERE') {
            return res.status(500).json({ 
                error: 'API token not configured',
                message: 'Please set REPLICATE_API_TOKEN in .env file'
            });
        }

        console.log('📡 Creating prediction...');
        console.log('📝 Prompt:', prompt.substring(0, 100) + '...');

        // Step 1: Create prediction
        const createResponse = await fetch(REPLICATE_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${REPLICATE_TOKEN}`
            },
            body: JSON.stringify({
                version: MODEL_VERSION,
                input: {
                    prompt: prompt,
                    negative_prompt: 'nsfw, lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry, artist name, ugly, duplicate, morbid, mutilated, extra limbs, deformed, disfigured',
                    width: 832,
                    height: 1216,
                    num_outputs: 1,
                    guidance_scale: 7,
                    num_inference_steps: 28,
                    seed: Math.floor(Math.random() * 1000000)
                }
            })
        });

        if (!createResponse.ok) {
            const errorData = await createResponse.json();
            console.error('❌ Replicate API Error:', errorData);
            return res.status(createResponse.status).json({
                error: 'Replicate API error',
                details: errorData
            });
        }

        const prediction = await createResponse.json();
        console.log('✅ Prediction created:', prediction.id);

        res.json({
            id: prediction.id,
            status: prediction.status
        });

    } catch (error) {
        console.error('❌ Server error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
});

// Check prediction status endpoint
app.get('/api/status/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (REPLICATE_TOKEN === 'YOUR_REPLICATE_API_TOKEN_HERE') {
            return res.status(500).json({ 
                error: 'API token not configured',
                message: 'Please set REPLICATE_API_TOKEN in .env file'
            });
        }

        const response = await fetch(`${REPLICATE_API_URL}/${id}`, {
            headers: {
                'Authorization': `Token ${REPLICATE_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            return res.status(response.status).json({
                error: 'Replicate API error',
                details: errorData
            });
        }

        const prediction = await response.json();
        
        // Log status changes
        if (prediction.status === 'succeeded') {
            console.log('✅ Generation completed:', id);
        } else if (prediction.status === 'failed') {
            console.log('❌ Generation failed:', id);
        } else {
            console.log('⏳ Status:', prediction.status, '-', id);
        }

        res.json(prediction);

    } catch (error) {
        console.error('❌ Server error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log('\n🎨 ================================');
    console.log('   Anime AI Generator Backend');
    console.log('   ================================\n');
    console.log(`✅ Server running on: http://localhost:${PORT}`);
    console.log(`📡 API endpoint: http://localhost:${PORT}/api`);
    
    if (REPLICATE_TOKEN === 'YOUR_REPLICATE_API_TOKEN_HERE') {
        console.log('\n⚠️  WARNING: API Token not configured!');
        console.log('📝 Create .env file with:');
        console.log('   REPLICATE_API_TOKEN=your_token_here\n');
    } else {
        console.log('\n✅ API Token configured');
        console.log('🚀 Ready to generate anime art!\n');
    }
});