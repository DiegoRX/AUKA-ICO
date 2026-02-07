import { queryBinanceOrder } from '../../lib/binance';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { merchantTradeNo } = req.body;

        if (!merchantTradeNo) {
            return res.status(400).json({ error: 'merchantTradeNo is required' });
        }

        const orderStatus = await queryBinanceOrder(merchantTradeNo);

        return res.status(200).json({
            success: true,
            data: orderStatus
        });

    } catch (error) {
        console.error('Query error:', error);
        return res.status(500).json({
            error: 'Failed to query order',
            message: error.message
        });
    }
}