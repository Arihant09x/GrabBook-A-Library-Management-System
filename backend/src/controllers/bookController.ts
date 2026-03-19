import { Request, Response } from 'express';
import { prisma } from '../index';

import { AuthRequest } from '../middleware/authMiddleware';

export const getBooks = async (req: AuthRequest, res: Response) => {
  try {
    const { publisher } = req.query;
    let filter = {};
    if (publisher === 'me' && req.user && req.user.role === 'ADMIN') {
      filter = { adminId: req.user.id };
    }

    const books = await prisma.book.findMany({ 
      where: filter,
      include: {
        publisher: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' } 
    });
    res.json(books);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const addBook = async (req: AuthRequest, res: Response) => {
  try {
    const { title, author, isbn, total_copies } = req.body;
    
    const existing = await prisma.book.findUnique({ where: { isbn } });
    if (existing) return res.status(400).json({ message: 'Book with ISBN already exists' });

    const book = await prisma.book.create({
      data: {
        title,
        author,
        isbn,
        total_copies,
        available_copies: total_copies,
        status: total_copies > 0 ? 'AVAILABLE' : 'OUT_OF_STOCK',
        adminId: req.user!.id
      },
    });
    res.status(201).json(book);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const updateBook = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { title, author, isbn, total_copies, available_copies } = req.body;

    const book = await prisma.book.update({
      where: { id },
      data: {
        title,
        author,
        isbn,
        total_copies,
        available_copies,
        status: available_copies > 0 ? 'AVAILABLE' : 'OUT_OF_STOCK',
      },
    });
    res.json(book);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const deleteBook = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.book.delete({ where: { id } });
    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
