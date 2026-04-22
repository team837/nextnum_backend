import BitcoinWallet from '../models/BitcoinWallet.js';

export const getBitcoinWallets = async (req, res) => {
    try {
        const wallets = await BitcoinWallet.find({ isActive: true }, 'id address label createdAt');
        res.json(wallets);
    } catch (error) {
        console.error('Bitcoin wallets fetch error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const createBitcoinWallet = async (req, res) => {
    try {
        const { address, label } = req.body;

        const wallet = await BitcoinWallet.create({
            address,
            label
        });

        res.json(wallet);
    } catch (error) {
        console.error('Bitcoin wallet creation error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
