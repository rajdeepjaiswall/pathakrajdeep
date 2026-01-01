import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

interface PhonePeConfig {
  clientId: string;
  clientSecret: string;
  clientVersion: string;
  merchantId: string;
  saltKey?: string;
  saltIndex?: string;
  isTestMode: boolean;
}

interface PaymentInitiateRequest {
  orderId: number;
  orderNumber: string;
  amount: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  redirectUrl: string;
  callbackUrl: string;
}

interface PaymentInitiateResponse {
  success: boolean;
  redirectUrl?: string;
  merchantTransactionId?: string;
  error?: string;
}

interface PaymentStatusResponse {
  success: boolean;
  status: 'SUCCESS' | 'PENDING' | 'FAILED' | 'PAYMENT_ERROR';
  transactionId?: string;
  amount?: number;
  message?: string;
}

export class PhonePeService {
  private config: PhonePeConfig;
  private baseUrl: string;

  constructor() {
    this.config = {
      clientId: process.env.PHONEPE_CLIENT_ID || '',
      clientSecret: process.env.PHONEPE_CLIENT_SECRET || '',
      clientVersion: process.env.PHONEPE_CLIENT_VERSION || '1',
      merchantId: process.env.PHONEPE_MERCHANT_ID || '',
      saltKey: process.env.PHONEPE_SALT_KEY || process.env.PHONEPE_CLIENT_SECRET || '',
      saltIndex: process.env.PHONEPE_SALT_INDEX || '1',
      isTestMode: process.env.PHONEPE_ENV !== 'PRODUCTION',
    };

    this.baseUrl = this.config.isTestMode
      ? 'https://api-preprod.phonepe.com/apis/pg-sandbox'
      : 'https://api.phonepe.com/apis/hermes';
  }

  isConfigured(): boolean {
    return !!(this.config.clientId && this.config.clientSecret && this.config.merchantId);
  }

  getConfig(): { isTestMode: boolean; merchantId: string } {
    return {
      isTestMode: this.config.isTestMode,
      merchantId: this.config.merchantId,
    };
  }

  private generateChecksum(payload: string, endpoint: string): string {
    const stringToHash = payload + endpoint + this.config.saltKey;
    const sha256 = crypto.createHash('sha256').update(stringToHash).digest('hex');
    return `${sha256}###${this.config.saltIndex}`;
  }

  async initiatePayment(request: PaymentInitiateRequest): Promise<PaymentInitiateResponse> {
    if (!this.isConfigured()) {
      return { success: false, error: 'PhonePe is not configured' };
    }

    try {
      const merchantTransactionId = `PB${request.orderId}_${Date.now()}`;
      const amountInPaise = Math.round(request.amount * 100);

      const payloadData = {
        merchantId: this.config.merchantId,
        merchantTransactionId,
        merchantUserId: `MUID_${uuidv4().substring(0, 8)}`,
        amount: amountInPaise,
        redirectUrl: `${request.redirectUrl}?txnId=${merchantTransactionId}&orderId=${request.orderId}`,
        redirectMode: 'POST',
        callbackUrl: request.callbackUrl,
        mobileNumber: request.customerPhone.replace(/\D/g, '').slice(-10),
        paymentInstrument: {
          type: 'PAY_PAGE',
        },
      };

      const payloadBase64 = Buffer.from(JSON.stringify(payloadData)).toString('base64');
      const endpoint = '/pg/v1/pay';
      const checksum = this.generateChecksum(payloadBase64, endpoint);

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-VERIFY': checksum,
        },
        body: JSON.stringify({ request: payloadBase64 }),
      });

      const data = await response.json();

      if (data.success && data.data?.instrumentResponse?.redirectInfo?.url) {
        return {
          success: true,
          redirectUrl: data.data.instrumentResponse.redirectInfo.url,
          merchantTransactionId,
        };
      } else {
        console.error('PhonePe initiation failed:', data);
        return {
          success: false,
          error: data.message || 'Payment initiation failed',
        };
      }
    } catch (error: any) {
      console.error('PhonePe initiation error:', error);
      return {
        success: false,
        error: error.message || 'Failed to connect to PhonePe',
      };
    }
  }

  async checkPaymentStatus(merchantTransactionId: string): Promise<PaymentStatusResponse> {
    if (!this.isConfigured()) {
      return { success: false, status: 'PAYMENT_ERROR', message: 'PhonePe is not configured' };
    }

    try {
      const endpoint = `/pg/v1/status/${this.config.merchantId}/${merchantTransactionId}`;
      const checksum = this.generateChecksum('', endpoint);

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-VERIFY': checksum,
          'X-MERCHANT-ID': this.config.merchantId,
        },
      });

      const data = await response.json();

      if (data.success && data.code === 'PAYMENT_SUCCESS') {
        return {
          success: true,
          status: 'SUCCESS',
          transactionId: data.data?.transactionId,
          amount: data.data?.amount ? data.data.amount / 100 : undefined,
        };
      } else if (data.code === 'PAYMENT_PENDING') {
        return {
          success: false,
          status: 'PENDING',
          message: 'Payment is still being processed',
        };
      } else {
        return {
          success: false,
          status: 'FAILED',
          message: data.message || 'Payment verification failed',
        };
      }
    } catch (error: any) {
      console.error('PhonePe status check error:', error);
      return {
        success: false,
        status: 'PAYMENT_ERROR',
        message: error.message || 'Failed to check payment status',
      };
    }
  }
}

export const phonePeService = new PhonePeService();
