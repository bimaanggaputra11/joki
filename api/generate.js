import cors from 'cors';
import express from 'express';
import fetch from 'node-fetch';

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const REPLICATE_API_URL = 'https://api.replicate.com/v1/predictions';
const REPLICATE_TOKEN = process.env.REPLICATE_API_TOKEN || 'YOUR_REPLICATE_API_TOKEN_HERE';
const MODEL_VERSION = '25d2f75ecda0c0bed34c806b7b70319a53a1bccad3ade1a7496524f013f48983';

// POST /api/generate
app.post('/api/generate', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    if (REPLICATE_TOKEN === 'YOUR_REPLICATE_API_TOKEN_HERE') {
      return res.status(500).json({
        error: 'API token not configured',
        message: 'Please set REPLICATE_API_TOKEN in .env file'
      });
    }

    console.log('📝 Generating:', prompt.substring(0, 80));

    const createResponse = await fetch(REPLICATE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${REPLICATE_TOKEN}`
      },
      body: JSON.stringify({
        version: MODEL_VERSION,
        input: {
          prompt,
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

    const data = await createResponse.json();
    if (!createResponse.ok) return res.status(createResponse.status).json(data);
    res.json({ id: data.id, status: data.status });

  } catch (err) {
    console.error('❌ Error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default app;
