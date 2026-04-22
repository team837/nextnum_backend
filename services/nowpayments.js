const NOWPAYMENTS_API_URL = 'https://api.nowpayments.io/v1';

export class NowPaymentsService {
    constructor() {
        this.apiKey = (process.env.NowPayments_API_Key || process.env.NOWPAYMENTS_API_KEY || '').trim();
    }

    async createPayment(params) {
        if (!this.apiKey) {
            throw new Error('NowPayments API key is not configured');
        }

        const response = await fetch(`${NOWPAYMENTS_API_URL}/payment`, {
            method: 'POST',
            headers: {
                'x-api-key': this.apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(params),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`NowPayments API Error: ${JSON.stringify(error)}`);
        }

        return await response.json();
    }

    async createInvoice(params) {
        if (!this.apiKey) {
            throw new Error('NowPayments API key is not configured');
        }

        const response = await fetch(`${NOWPAYMENTS_API_URL}/invoice`, {
            method: 'POST',
            headers: {
                'x-api-key': this.apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(params),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`NowPayments API Error: ${JSON.stringify(error)}`);
        }

        return await response.json();
    }

    async getPaymentStatus(paymentId) {
        const response = await fetch(`${NOWPAYMENTS_API_URL}/payment/${paymentId}`, {
            method: 'GET',
            headers: {
                'x-api-key': this.apiKey,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch payment status');
        }

        return await response.json();
    }
}

export const nowPayments = new NowPaymentsService();
