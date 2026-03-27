/**
 * Ejuma External Email Service
 * This utility handles custom email delivery (verification, welcome, notifications)
 * bypassing Supabase default email to allow for better branding and deliverability.
 *
 * Production: do not ship a Resend (or other) secret in `VITE_*` — call email APIs
 * from a server or Supabase Edge Function so API keys stay off the client.
 */

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const sendEmail = async ({ to, subject, html, text }: EmailOptions): Promise<{ success: boolean; message: string }> => {
  console.log(`[3juma-Email] Sending to ${to}: ${subject}`);
  if (html) console.log(`[3juma-Email] HTML Content Snippet: ${html.substring(0, 50)}...`);
  
  // TODO: Replace with your actual Email API key in .env
  const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY;
  
  if (RESEND_API_KEY) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'Ejuma <noreply@ejuma.com>',
          to: [to],
          subject: subject,
          html: html,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to send email');
      
      return { success: true, message: 'Email sent successfully via Resend' };
    } catch (error: any) {
      console.error('[Ejuma-Email] Error:', error);
      return { success: false, message: error.message };
    }
  }

  // Mock success for development if no API key is provided
  return { success: true, message: 'Email sent successfully (Mock)' };
};

export const sendEmailConfirmation = async (email: string, token: string) => {
  const confirmationUrl = `${window.location.origin}/verify?token=${token}`;
  
  return sendEmail({
    to: email,
    subject: 'Confirm your Ejuma Account',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h1 style="color: #111; font-weight: 900; letter-spacing: -1px;">Welcome to Ejuma!</h1>
        <p style="color: #666; line-height: 1.6;">Please confirm your email address to start using the platform.</p>
        <a href="${confirmationUrl}" style="display: inline-block; background: #111; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 20px;">Confirm Email Address</a>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">If you didn't create an account, you can safely ignore this email.</p>
      </div>
    `,
  });
};
