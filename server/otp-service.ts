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

// WhatsApp configuration (requires WhatsApp Business API setup)
interface WhatsAppConfig {
  accessToken: string;
  phoneNumberId: string;
  baseUrl: string;
}

const whatsappConfig: WhatsAppConfig = {
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
  baseUrl: 'https://graph.facebook.com/v18.0'
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

  // Send WhatsApp OTP
  async sendWhatsAppOTP(phoneNumber: string, purpose: string = 'verification'): Promise<{ success: boolean; message: string }> {
    try {
      if (!whatsappConfig.accessToken || !whatsappConfig.phoneNumberId) {
        return {
          success: false,
          message: 'WhatsApp API not configured. Please contact administrator.'
        };
      }

      const otpCode = await this.createOTP(phoneNumber, 'whatsapp', purpose);
      
      // Format phone number (remove any non-digits and ensure it starts with country code)
      const formattedPhone = phoneNumber.replace(/\D/g, '');
      
      const messageData = {
        messaging_product: "whatsapp",
        to: formattedPhone,
        type: "template",
        template: {
          name: "otp_verification", // You need to create this template in WhatsApp Business Manager
          language: {
            code: "en"
          },
          components: [
            {
              type: "body",
              parameters: [
                {
                  type: "text",
                  text: otpCode
                }
              ]
            }
          ]
        }
      };

      const response = await fetch(`${whatsappConfig.baseUrl}/${whatsappConfig.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${whatsappConfig.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(messageData)
      });

      if (response.ok) {
        return {
          success: true,
          message: 'OTP sent successfully to your WhatsApp'
        };
      } else {
        const errorData = await response.json();
        console.error('WhatsApp API Error:', errorData);
        return {
          success: false,
          message: 'Failed to send WhatsApp OTP. Please try again.'
        };
      }
    } catch (error) {
      console.error('WhatsApp OTP Error:', error);
      return {
        success: false,
        message: 'Failed to send WhatsApp OTP. Please try again.'
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