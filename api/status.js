import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
app.use(cors());
app.use(express.json());

const REPLICATE_API_URL = 'https://api.replicate.com/v1/predictions';
const REPLICATE_TOKEN = process.env.REPLICATE_API_TOKEN || 'YOUR_REPLICATE_API_TOKEN_HERE';

app.get('/api/status/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (REPLICATE_TOKEN === 'YOUR_REPLICATE_API_TOKEN_HERE') {
      return res.status(500).json({ error: 'API token not configured' });
    }

    const response = await fetch(`${REPLICATE_API_URL}/${id}`, {
      headers: {
        'Authorization': `Token ${REPLICATE_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    res.status(response.ok ? 200 : response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

export default app;
