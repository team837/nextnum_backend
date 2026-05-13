const MAXELPAY_API_URL = 'https://api.maxelpay.com/api/v1';

export class MaxelPayService {
    constructor() {
        this.apiKey = (process.env.MAXELPAY_API_KEY || '').trim();
    }

    async createSession(params) {
        if (!this.apiKey) {
            throw new Error('MaxelPay API key is not configured');
        }

        const response = await fetch(`${MAXELPAY_API_URL}/payments/sessions`, {
            method: 'POST',
            headers: {
                'X-API-KEY': this.apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(params),
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('MaxelPay API Create Session Failed:', JSON.stringify(error));
            throw new Error(`MaxelPay API Error: ${JSON.stringify(error)}`);
        }

        return await response.json();
    }

    async getSessionStatus(sessionId) {
        if (!this.apiKey) {
            throw new Error('MaxelPay API key is not configured');
        }

        const response = await fetch(`${MAXELPAY_API_URL}/payments/sessions/${sessionId}/status`, {
            method: 'GET',
            headers: {
                'X-API-KEY': this.apiKey,
            },
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('MaxelPay API Get Status Failed:', JSON.stringify(error));
            throw new Error(`MaxelPay API Error: ${JSON.stringify(error)}`);
        }

        return await response.json();
    }
}

export const maxelPay = new MaxelPayService();
