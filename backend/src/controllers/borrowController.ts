import { Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/authMiddleware';

const FINE_RATE_PER_DAY = 1;

export const borrowBook = async (req: AuthRequest, res: Response) => {
  const { bookId, dueDate } = req.body;
  const userId = req.user!.id;

  try {
    const result = await prisma.$transaction(async (tx: any) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      const activeBorrowings = await tx.borrowing.count({
        where: { userId, returnDate: null },
      });

      if (activeBorrowings >= user!.membership_limit) {
        throw new Error('Membership limit reached');
      }

      const existingBorrowing = await tx.borrowing.findFirst({
        where: { userId, bookId, returnDate: null }
      });
      if (existingBorrowing) {
        throw new Error('You have already borrowed a copy of this exact book');
      }

      const book = await tx.book.findUnique({ where: { id: bookId } });
      if (!book || book.available_copies <= 0 || book.status !== 'AVAILABLE') {
        throw new Error('Book is currently out of stock');
      }

      const newAvailableCopies = book.available_copies - 1;
      await tx.book.update({
        where: { id: bookId },
        data: {
          available_copies: newAvailableCopies,
          status: newAvailableCopies === 0 ? 'OUT_OF_STOCK' : 'AVAILABLE',
        },
      });

      const borrowing = await tx.borrowing.create({
        data: {
          userId,
          bookId,
          dueDate: new Date(dueDate),
        },
      });

      return borrowing;
    });

    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const returnBook = async (req: AuthRequest, res: Response) => {
  const { borrowingId } = req.body;

  try {
    const result = await prisma.$transaction(async (tx: any) => {
      const borrowing = await tx.borrowing.findUnique({ where: { id: borrowingId } });

      if (!borrowing || borrowing.returnDate) {
        throw new Error('Invalid borrowing record or already returned');
      }

      if (req.user!.role !== 'ADMIN' && borrowing.userId !== req.user!.id) {
        throw new Error('Not authorized to return this book');
      }

      const currentDate = new Date();
      let fineAmount = 0;
      if (currentDate > borrowing.dueDate) {
        const diffMs = currentDate.getTime() - borrowing.dueDate.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        fineAmount = diffDays * FINE_RATE_PER_DAY;
      }

      const updatedBorrowing = await tx.borrowing.update({
        where: { id: borrowingId },
        data: {
          returnDate: currentDate,
          fineAmount,
        },
      });

      const book = await tx.book.findUnique({ where: { id: borrowing.bookId } });
      if (book) {
        await tx.book.update({
          where: { id: book.id },
          data: {
            available_copies: book.available_copies + 1,
            status: 'AVAILABLE',
          },
        });
      }

      return updatedBorrowing;
    });

    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getBorrowings = async (req: AuthRequest, res: Response) => {
  try {
    const { all, publisher } = req.query;
    let filter: any = { userId: req.user!.id };

    if (req.user!.role === 'ADMIN') {
      if (publisher === 'me') {
        filter = { book: { adminId: req.user!.id } };
      } else if (all === 'true') {
        filter = {};
      }
    }
    
    let borrowings = await prisma.borrowing.findMany({
      where: filter,
      include: {
        book: { select: { title: true, author: true } },
        user: { select: { name: true, email: true } }
      },
      orderBy: { borrowDate: 'desc' },
    });

    const currentDate = new Date();
    const enrichedBorrowings = borrowings.map((b: any) => {
      let currentFine = b.fineAmount;
      if (!b.returnDate && currentDate > b.dueDate) {
        const diffMs = currentDate.getTime() - b.dueDate.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        currentFine = diffDays * FINE_RATE_PER_DAY;
      }
      return { ...b, currentFine };
    });

    res.json(enrichedBorrowings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
