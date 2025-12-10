import crypto from 'crypto';

const PHONEPE_CLIENT_ID = process.env.PHONEPE_CLIENT_ID;
const PHONEPE_CLIENT_SECRET = process.env.PHONEPE_CLIENT_SECRET;
const PHONEPE_CLIENT_VERSION = process.env.PHONEPE_CLIENT_VERSION || '1';
const PHONEPE_MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID;

const IS_TEST_MODE = true;
const BASE_URL = IS_TEST_MODE
  ? 'https://api-preprod.phonepe.com/apis/pg-sandbox'
  : 'https://api.phonepe.com/apis/hermes';

const OAUTH_URL = IS_TEST_MODE
  ? 'https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token'
  : 'https://api.phonepe.com/apis/identity-manager/v1/oauth/token';

interface PhonePeTokenResponse {
  access_token: string;
  encrypted_access_token: string;
  expires_in: number | null;
  issued_at: number;
  expires_at: number;
  session_expires_at: number;
  token_type: string;
}

interface PhonePePaymentResponse {
  success: boolean;
  code: string;
  message: string;
  data?: {
    merchantId: string;
    merchantTransactionId: string;
    instrumentResponse?: {
      type: string;
      redirectInfo?: {
        url: string;
        method: string;
      };
    };
  };
}

interface PhonePeStatusResponse {
  success: boolean;
  code: string;
  message: string;
  data?: {
    merchantId: string;
    merchantTransactionId: string;
    transactionId: string;
    amount: number;
    state: string;
    responseCode: string;
    paymentInstrument?: {
      type: string;
      utr?: string;
      cardNetwork?: string;
    };
  };
}

let cachedToken: { token: string; expiresAt: number } | null = null;

export async function getPhonePeAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60000) {
    return cachedToken.token;
  }

  console.log('Generating new PhonePe access token...');
  console.log('Client ID configured:', !!PHONEPE_CLIENT_ID);
  console.log('Client Secret configured:', !!PHONEPE_CLIENT_SECRET);
  console.log('Merchant ID configured:', !!PHONEPE_MERCHANT_ID);

  if (!PHONEPE_CLIENT_ID || !PHONEPE_CLIENT_SECRET) {
    throw new Error('PhonePe credentials not configured. Check PHONEPE_CLIENT_ID and PHONEPE_CLIENT_SECRET');
  }

  const params = new URLSearchParams({
    client_id: PHONEPE_CLIENT_ID,
    client_version: PHONEPE_CLIENT_VERSION,
    client_secret: PHONEPE_CLIENT_SECRET,
    grant_type: 'client_credentials',
  });

  console.log('OAuth URL:', OAUTH_URL);
  const response = await fetch(OAUTH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  console.log('PhonePe OAuth Response Status:', response.status);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('PhonePe OAuth Error Response:', response.status, errorText);
    throw new Error(`Failed to get PhonePe access token: ${response.status} ${errorText}`);
  }

  const data: PhonePeTokenResponse = await response.json();
  console.log('PhonePe OAuth Success, token expires in:', data.expires_in, 'seconds');
  
  cachedToken = {
    token: data.access_token,
    expiresAt: data.expires_at * 1000,
  };

  return data.access_token;
}

export async function initiatePhonePePayment(params: {
  orderId: number;
  merchantTransactionId: string;
  userId: number;
  amount: number;
  phone?: string;
  redirectUrl: string;
  callbackUrl: string;
}): Promise<{ success: boolean; redirectUrl?: string; error?: string }> {
  try {
    const accessToken = await getPhonePeAccessToken();

    const payload = {
      merchantId: PHONEPE_MERCHANT_ID,
      merchantTransactionId: params.merchantTransactionId,
      merchantOrderId: `ORD${params.orderId}`,
      merchantUserId: `MUID${params.userId}`,
      amount: Math.round(params.amount * 100),
      redirectUrl: params.redirectUrl,
      redirectMode: 'POST',
      callbackUrl: params.callbackUrl,
      mobileNumber: params.phone || '9999999999',
      paymentInstrument: {
        type: 'PAY_PAGE',
      },
    };

    console.log('PhonePe Payment Payload:', JSON.stringify(payload, null, 2));

    const response = await fetch(`${BASE_URL}/checkout/v2/pay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'X-MERCHANT-ID': PHONEPE_MERCHANT_ID || '',
      },
      body: JSON.stringify(payload),
    });

    console.log('PhonePe Payment Response Status:', response.status);
    let data: PhonePePaymentResponse;
    
    try {
      data = await response.json();
      console.log('PhonePe Payment Response:', JSON.stringify(data, null, 2));
    } catch (e) {
      const responseText = await response.text();
      console.error('Failed to parse PhonePe response:', responseText);
      return {
        success: false,
        error: `Invalid response from PhonePe: ${responseText}`,
      };
    }

    if (!response.ok) {
      console.error('PhonePe API Error:', response.status, JSON.stringify(data, null, 2));
      return {
        success: false,
        error: data.message || `PhonePe API error: ${response.status}`,
      };
    }

    if (data.success && data.data?.instrumentResponse?.redirectInfo?.url) {
      return {
        success: true,
        redirectUrl: data.data.instrumentResponse.redirectInfo.url,
      };
    }

    return {
      success: false,
      error: data.message || 'Payment initiation failed',
    };
  } catch (error) {
    console.error('PhonePe Payment Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function checkPhonePePaymentStatus(merchantTransactionId: string): Promise<{
  success: boolean;
  status?: 'SUCCESS' | 'PENDING' | 'FAILED';
  transactionId?: string;
  paymentInstrumentType?: string;
  data?: any;
  error?: string;
}> {
  try {
    const accessToken = await getPhonePeAccessToken();

    const response = await fetch(
      `${BASE_URL}/pg/v1/status/${PHONEPE_MERCHANT_ID}/${merchantTransactionId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-MERCHANT-ID': PHONEPE_MERCHANT_ID || '',
        },
      }
    );

    const data: PhonePeStatusResponse = await response.json();
    console.log('PhonePe Status Response:', JSON.stringify(data, null, 2));

    if (data.success && data.data) {
      let status: 'SUCCESS' | 'PENDING' | 'FAILED' = 'PENDING';
      
      if (data.code === 'PAYMENT_SUCCESS' || data.data.state === 'COMPLETED') {
        status = 'SUCCESS';
      } else if (data.code === 'PAYMENT_ERROR' || data.code === 'PAYMENT_DECLINED' || data.data.state === 'FAILED') {
        status = 'FAILED';
      }

      return {
        success: true,
        status,
        transactionId: data.data.transactionId,
        paymentInstrumentType: data.data.paymentInstrument?.type,
        data: data.data,
      };
    }

    return {
      success: false,
      status: 'PENDING',
      error: data.message || 'Status check failed',
    };
  } catch (error) {
    console.error('PhonePe Status Check Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export function isPhonePeConfigured(): boolean {
  return !!(PHONEPE_CLIENT_ID && PHONEPE_CLIENT_SECRET && PHONEPE_MERCHANT_ID);
}

export function getPhonePeConfig() {
  return {
    provider: 'phonepe',
    displayName: 'PhonePe',
    isTestMode: IS_TEST_MODE,
    isConfigured: isPhonePeConfigured(),
  };
}
