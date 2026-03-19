import { Request, Response } from 'express';
import { prisma } from '../index';
import { hashPassword, comparePassword, generateToken, generateOTP } from '../utils/auth';
import { sendOTP } from '../utils/email';
import { AuthRequest } from '../middleware/authMiddleware';

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, adminCode } = req.body;
    const existingUser = await prisma.user.findUnique({ where: { email } });
    
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await hashPassword(password);
    const role = 'USER'; // Default to user, upgrade handles escalation
    
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role },
    });

    const token = generateToken(user.id, user.role);
    res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.password) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = generateToken(user.id, user.role);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const requestOtp = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Auto register for passwordless
      user = await prisma.user.create({
        data: { name: email.split('@')[0], email },
      });
    }

    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.user.update({
      where: { id: user.id },
      data: { otp, otpExpiresAt },
    });

    await sendOTP(email, otp);

    res.json({ message: 'OTP sent to email' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.otp !== otp || !user.otpExpiresAt) {
      return res.status(401).json({ message: 'Invalid OTP' });
    }

    if (new Date() > user.otpExpiresAt) {
      return res.status(401).json({ message: 'OTP expired' });
    }

    // Clear OTP
    await prisma.user.update({
      where: { id: user.id },
      data: { otp: null, otpExpiresAt: null },
    });

    const token = generateToken(user.id, user.role);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const upgrade = async (req: AuthRequest, res: Response) => {
  try {
    const { adminCode } = req.body;
    if (adminCode !== process.env.ADMIN_SECRET_CODE) {
      return res.status(400).json({ message: 'Invalid Admin Code' });
    }
    
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { role: 'ADMIN' }
    });

    const token = generateToken(user.id, user.role);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
