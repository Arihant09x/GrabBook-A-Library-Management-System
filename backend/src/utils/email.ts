import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendOTP = async (email: string, otp: string) => {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Library <onboarding@resend.dev>', // Use resend's default test domain if user hasn't verified theirs
      to: email, // Resend SDK accepts string or string[]
      subject: 'Your Library Access OTP',
      html: `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee;">
        <h2>Library Login</h2>
        <p>Your one-time password for the Library System is:</p>
        <h1 style="color: #2563eb; letter-spacing: 5px;">${otp}</h1>
        <p>This code expires in 10 minutes.</p>
      </div>
      `,
    });

    if (error) {
      console.error('Resend Error:', error);
      throw new Error(`Resend SDK Error: ${error.message}`);
    }

    console.log(`Message sent: ${data?.id}`);
  } catch (error: any) {
    console.error('Error sending email:', error.message || error);
    throw new Error('Failed to send OTP email');
  }
};
