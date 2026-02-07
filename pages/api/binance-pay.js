import { createBinanceOrder } from '../../lib/binance';

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { amount, currency, description, userId, returnUrl, cancelUrl } = req.body;

        // Validaciones según documentación Binance
        if (!amount || isNaN(parseFloat(amount))) {
            return res.status(400).json({ error: 'Invalid amount. Must be a number.' });
        }

        if (!currency || currency.length > 10) {
            return res.status(400).json({ error: 'Invalid currency. Max 10 characters.' });
        }

        // Crear orden
        const order = await createBinanceOrder({
            amount: parseFloat(amount).toFixed(2), // 2 decimales para fiat
            currency: currency.toUpperCase(),
            description: description?.slice(0, 256),
            userId: userId || 'GUEST',
            returnUrl,
            cancelUrl
        });

        // Guardar en tu base de datos (ejemplo con placeholder)
        // await saveOrderToDatabase({
        //   merchantTradeNo: order.merchantTradeNo,
        //   userId: userId || 'GUEST',
        //   amount,
        //   currency,
        //   status: 'PENDING',
        //   createdAt: new Date()
        // });

        return res.status(200).json({
            success: true,
            data: order
        });

    } catch (error) {
        console.error('Binance Pay API Error:', error);

        // Mapeo de errores comunes según documentación
        const errorResponses = {
            '400001': { status: 400, message: 'Invalid request parameters' },
            '400002': { status: 400, message: 'Invalid merchant' },
            '400003': { status: 400, message: 'Invalid signature - check API credentials' },
            '400004': { status: 403, message: 'Invalid API-key, IP, or permissions' },
            '400005': { status: 400, message: 'Invalid nonce or timestamp' },
            '400006': { status: 409, message: 'Order already exists' },
            '400007': { status: 400, message: 'Order amount too small' },
            '400008': { status: 400, message: 'Order amount too large' },
            '400009': { status: 400, message: 'Currency not supported' },
            '500001': { status: 500, message: 'Internal server error' }
        };

        // Extraer código de error del mensaje si existe
        const errorCode = error.message.match(/code:?\s*(\d+)/)?.[1];
        const knownError = errorResponses[errorCode];

        if (knownError) {
            return res.status(knownError.status).json({
                error: knownError.message,
                code: errorCode,
                details: error.message
            });
        }

        return res.status(500).json({
            error: 'Failed to create payment order',
            message: error.message
        });
    }
}