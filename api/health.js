import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());

const REPLICATE_TOKEN = process.env.REPLICATE_API_TOKEN || 'YOUR_REPLICATE_API_TOKEN_HERE';

app.get('/api/health', (req, res) => {
  const configured = REPLICATE_TOKEN !== 'YOUR_REPLICATE_API_TOKEN_HERE';
  res.json({
    status: 'ok',
    configured,
    message: configured ? 'Server ready' : 'Please configure REPLICATE_API_TOKEN'
  });
});

export default app;
