import SMS from '../models/SMS.js';

export const getSMS = async (req, res) => {
    try {
        const { virtualNumberId } = req.query;

        if (!virtualNumberId) {
            return res.status(400).json({ error: 'Virtual number ID required' });
        }

        const smsMessages = await SMS.find({ virtualNumberId }).sort({ receivedAt: -1 });
        res.json(smsMessages);
    } catch (error) {
        console.error('SMS fetch error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const receiveSMS = async (req, res) => {
    try {
        const { virtualNumberId, from, to, message } = req.body;

        const sms = await SMS.create({
            virtualNumberId,
            from,
            to,
            message
        });

        res.json(sms);
    } catch (error) {
        console.error('SMS creation error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
