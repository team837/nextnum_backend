import Referral from '../models/Referral.js';
import User from '../models/User.js';

export const getReferralStats = async (req, res) => {
    try {
        const userId = req.user._id;

        const totalReferrals = await Referral.countDocuments({ referrerId: userId });
        const activeReferrals = await Referral.countDocuments({ referrerId: userId, status: 'active' });
        
        const referrals = await Referral.find({ referrerId: userId });
        const earnedCredits = referrals.reduce((sum, ref) => sum + ref.rewardAmount, 0);

        // Conversion rate calculation
        const conversionRate = totalReferrals > 0 ? (activeReferrals / totalReferrals) * 100 : 0;

        res.json({
            totalReferrals,
            activeReferrals,
            earnedCredits,
            conversionRate: Math.round(conversionRate)
        });
    } catch (error) {
        console.error('Fetch referral stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getRecentReferrals = async (req, res) => {
    try {
        const userId = req.user._id;

        const referrals = await Referral.find({ referrerId: userId })
            .populate('referredId', 'name email createdAt')
            .sort({ createdAt: -1 })
            .limit(10);

        const formattedReferrals = referrals.map(ref => ({
            name: ref.referredId.name || ref.referredId.email,
            date: ref.createdAt.toISOString().split('T')[0],
            status: ref.status,
            earned: `$${ref.rewardAmount.toFixed(2)}`
        }));

        res.json(formattedReferrals);
    } catch (error) {
        console.error('Fetch recent referrals error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
