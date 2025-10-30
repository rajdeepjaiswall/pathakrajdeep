import nodemailer from 'nodemailer';
import { db } from './db';
import { otps, type Otp, type InsertOtp } from '@shared/schema';
import { eq, and, lt } from 'drizzle-orm';

// Email configuration
const createEmailTransporter = () => {
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'your-email@gmail.com',
      pass: process.env.EMAIL_PASS || 'your-app-password'
    }
  });
};

// Fast2SMS configuration
interface Fast2SMSConfig {
  apiKey: string;
  baseUrl: string;
}

const fast2smsConfig: Fast2SMSConfig = {
  apiKey: process.env.FAST2SMS_API_KEY || '',
  baseUrl: 'https://www.fast2sms.com/dev/bulkV2'
};

export class OTPService {
  
  // Generate a 6-digit OTP
  generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Create OTP record in database
  async createOTP(identifier: string, type: 'email' | 'whatsapp', purpose: string = 'verification'): Promise<string> {
    // Clean up any existing OTPs for this identifier
    await db.delete(otps).where(
      and(
        eq(otps.identifier, identifier),
        eq(otps.type, type)
      )
    );

    const otpCode = this.generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

    const otpData: InsertOtp = {
      identifier,
      otp: otpCode,
      type,
      purpose,
      attempts: 0,
      isVerified: false,
      expiresAt
    };

    await db.insert(otps).values(otpData);
    return otpCode;
  }

  // Send Email OTP
  async sendEmailOTP(email: string, purpose: string = 'verification'): Promise<{ success: boolean; message: string }> {
    try {
      const otpCode = await this.createOTP(email, 'email', purpose);
      
      const transporter = createEmailTransporter();
      
      const mailOptions = {
        from: process.env.EMAIL_USER || 'Pathak Bhandar <noreply@pathakbhandar.com>',
        to: email,
        subject: 'Your OTP Verification Code - Pathak Bhandar',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0;">Pathak Bhandar</h1>
              <p style="color: #666; margin: 5px 0;">Premium Bakery & Confectionery</p>
            </div>
            
            <h2 style="color: #333; text-align: center;">Email Verification</h2>
            <p style="color: #666; font-size: 16px;">Your OTP verification code is:</p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <h1 style="color: #2563eb; font-size: 32px; margin: 0; letter-spacing: 8px; font-weight: bold;">${otpCode}</h1>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              • This code will expire in <strong>5 minutes</strong><br>
              • Use this code to complete your ${purpose} process<br>
              • If you didn't request this code, please ignore this email
            </p>
            
            <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center;">
              <p style="color: #999; font-size: 12px;">
                This is an automated message from Pathak Bhandar<br>
                Prayagraj, Uttar Pradesh
              </p>
            </div>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      
      return {
        success: true,
        message: 'OTP sent successfully to your email'
      };
    } catch (error) {
      console.error('Email OTP Error:', error);
      return {
        success: false,
        message: 'Failed to send OTP. Please try again.'
      };
    }
  }

  // Send SMS OTP via Fast2SMS
  async sendWhatsAppOTP(phoneNumber: string, purpose: string = 'verification'): Promise<{ success: boolean; message: string }> {
    try {
      if (!fast2smsConfig.apiKey) {
        return {
          success: false,
          message: 'SMS API not configured. Please contact administrator.'
        };
      }

      const otpCode = await this.createOTP(phoneNumber, 'whatsapp', purpose);
      
      // Format phone number (remove any non-digits, remove leading +91 or 91 if present)
      let formattedPhone = phoneNumber.replace(/\D/g, '');
      if (formattedPhone.startsWith('91') && formattedPhone.length > 10) {
        formattedPhone = formattedPhone.slice(2);
      }
      
      // Fast2SMS API request
      const response = await fetch(fast2smsConfig.baseUrl, {
        method: 'POST',
        headers: {
          'authorization': fast2smsConfig.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          variables_values: otpCode,
          route: 'otp',
          numbers: formattedPhone
        })
      });

      const responseData = await response.json();

      if (response.ok && responseData.return) {
        return {
          success: true,
          message: 'OTP sent successfully to your phone'
        };
      } else {
        console.error('Fast2SMS API Error:', responseData);
        return {
          success: false,
          message: 'Failed to send OTP. Please try again.'
        };
      }
    } catch (error) {
      console.error('SMS OTP Error:', error);
      return {
        success: false,
        message: 'Failed to send OTP. Please try again.'
      };
    }
  }
  
  // Helper method to send order confirmation SMS
  async sendOrderConfirmation(phoneNumber: string, orderNumber: string, trackingLink: string): Promise<{ success: boolean; message: string }> {
    try {
      if (!fast2smsConfig.apiKey) {
        return {
          success: false,
          message: 'SMS API not configured.'
        };
      }

      // Format phone number
      let formattedPhone = phoneNumber.replace(/\D/g, '');
      if (formattedPhone.startsWith('91') && formattedPhone.length > 10) {
        formattedPhone = formattedPhone.slice(2);
      }

      const message = `Your Pathak Bhandar order ${orderNumber} has been confirmed! Track your order: ${trackingLink}`;
      
      // For custom messages, Fast2SMS requires DLT template
      // For now, we'll use a simple notification approach
      const response = await fetch(fast2smsConfig.baseUrl, {
        method: 'POST',
        headers: {
          'authorization': fast2smsConfig.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sender_id: 'PATHAK',
          message: message,
          route: 'q',
          numbers: formattedPhone
        })
      });

      const responseData = await response.json();

      if (response.ok && responseData.return) {
        return {
          success: true,
          message: 'Order confirmation sent successfully'
        };
      } else {
        console.error('Fast2SMS Order Confirmation Error:', responseData);
        return {
          success: false,
          message: 'Failed to send order confirmation SMS'
        };
      }
    } catch (error) {
      console.error('Order Confirmation SMS Error:', error);
      return {
        success: false,
        message: 'Failed to send order confirmation SMS'
      };
    }
  }

  // Verify OTP
  async verifyOTP(identifier: string, inputOTP: string, type: 'email' | 'whatsapp'): Promise<{ success: boolean; message: string }> {
    try {
      // Find the OTP record
      const [otpRecord] = await db
        .select()
        .from(otps)
        .where(
          and(
            eq(otps.identifier, identifier),
            eq(otps.type, type),
            eq(otps.isVerified, false)
          )
        )
        .limit(1);

      if (!otpRecord) {
        return {
          success: false,
          message: 'OTP not found or already verified. Please request a new one.'
        };
      }

      // Check if OTP is expired
      if (new Date() > otpRecord.expiresAt) {
        await db.delete(otps).where(eq(otps.id, otpRecord.id));
        return {
          success: false,
          message: 'OTP has expired. Please request a new one.'
        };
      }

      // Check attempts limit
      if (otpRecord.attempts >= 3) {
        await db.delete(otps).where(eq(otps.id, otpRecord.id));
        return {
          success: false,
          message: 'Too many incorrect attempts. Please request a new OTP.'
        };
      }

      // Verify OTP
      if (otpRecord.otp !== inputOTP) {
        // Increment attempts
        await db
          .update(otps)
          .set({ attempts: otpRecord.attempts + 1 })
          .where(eq(otps.id, otpRecord.id));

        return {
          success: false,
          message: `Invalid OTP. ${3 - (otpRecord.attempts + 1)} attempts remaining.`
        };
      }

      // OTP is correct - mark as verified and clean up
      await db.delete(otps).where(eq(otps.id, otpRecord.id));

      return {
        success: true,
        message: 'OTP verified successfully'
      };
    } catch (error) {
      console.error('Verify OTP Error:', error);
      return {
        success: false,
        message: 'Failed to verify OTP. Please try again.'
      };
    }
  }

  // Resend OTP with cooldown check
  async resendOTP(identifier: string, type: 'email' | 'whatsapp', purpose: string = 'verification'): Promise<{ success: boolean; message: string; waitTime?: number }> {
    try {
      // Check for existing OTP and cooldown
      const [existingOTP] = await db
        .select()
        .from(otps)
        .where(
          and(
            eq(otps.identifier, identifier),
            eq(otps.type, type)
          )
        )
        .limit(1);

      if (existingOTP) {
        const timeDiff = Date.now() - existingOTP.createdAt!.getTime();
        const cooldownPeriod = 60000; // 1 minute cooldown

        if (timeDiff < cooldownPeriod) {
          const waitTime = Math.ceil((cooldownPeriod - timeDiff) / 1000);
          return {
            success: false,
            message: `Please wait ${waitTime} seconds before requesting a new OTP`,
            waitTime
          };
        }
      }

      // Send new OTP based on type
      if (type === 'email') {
        return await this.sendEmailOTP(identifier, purpose);
      } else {
        return await this.sendWhatsAppOTP(identifier, purpose);
      }
    } catch (error) {
      console.error('Resend OTP Error:', error);
      return {
        success: false,
        message: 'Failed to resend OTP. Please try again.'
      };
    }
  }

  // Cleanup expired OTPs (run this periodically)
  async cleanupExpiredOTPs(): Promise<void> {
    try {
      await db.delete(otps).where(lt(otps.expiresAt, new Date()));
      console.log('Cleaned up expired OTPs');
    } catch (error) {
      console.error('Cleanup expired OTPs error:', error);
    }
  }
}

export const otpService = new OTPService();