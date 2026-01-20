import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware (Security & Parsing)
app.use(helmet()); // Secure HTTP headers
app.use(cors()); // Allow React Frontend to connect
app.use(express.json()); // Parse JSON bodies (for Form Data)

// Basic Test Route (To verify API is working)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'active',
    system: 'E-Serbisyo Business Logic Layer',
    timestamp: new Date().toISOString()
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`[E-Serbisyo] Server running on http://localhost:${PORT}`);
  console.log(`[Architecture] Business Logic Layer Active`);
});