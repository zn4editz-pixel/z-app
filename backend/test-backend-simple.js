// Simple backend test without Prisma
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 5001;

// Basic middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health/ping', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'Backend is running successfully!',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Basic API endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API is working!',
    backend: 'Railway/Render Free Tier',
    database: 'Supabase PostgreSQL'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Simple Backend running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health/ping`);
  console.log(`🔗 API test: http://localhost:${PORT}/api/test`);
});

export default app;