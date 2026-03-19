import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
export const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: ["https://library-frontend-nl13.onrender.com", "http://localhost:4173", "http://localhost:5173"],
  credentials: true
}));
import authRoutes from './routes/authRoutes';

import bookRoutes from './routes/bookRoutes';
import borrowRoutes from './routes/borrowRoutes';

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/borrowings', borrowRoutes);

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', message: 'Library API is running' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
