import crypto from 'crypto';
import getRawBody from 'raw-body';

const BINANCE_SECRET_KEY = process.env.BINANCE_PAY_SECRET_KEY?.trim();

/**
 * Webhook para recibir notificaciones de Binance Pay
 * Documentación: https://developers.binance.com/docs/binance-pay/webhook
 */
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Obtener el body raw para verificar firma
        const rawBodyBuffer = await getRawBody(req);
        const rawBody = rawBodyBuffer.toString('utf8');
        const body = JSON.parse(rawBody);

        const signature = req.headers['binancepay-signature'];
        const timestamp = req.headers['binancepay-timestamp'];
        const nonce = req.headers['binancepay-nonce'];

        console.log('=== Webhook Received ===');
        console.log('Event:', body.bizType);
        console.log('Status:', body.bizStatus);
        console.log('Order:', body.merchantTradeNo);

        // Verificar firma
        if (!verifyWebhookSignature(rawBody, signature, timestamp, nonce)) {
            console.error('Invalid webhook signature');
            return res.status(401).json({ error: 'Invalid signature' });
        }

        // Procesar según tipo de evento
        switch (body.bizType) {
            case 'PAY':
                await handlePaymentNotification(body);
                break;
            case 'REFUND':
                await handleRefundNotification(body);
                break;
            default:
                console.log('Unknown event type:', body.bizType);
        }

        // SIEMPRE responder 200 para que Binance no reintente
        return res.status(200).json({ success: true });

    } catch (error) {
        console.error('Webhook processing error:', error);
        // Aún así responder 200
        return res.status(200).json({ success: true });
    }
}

/**
 * Verifica la firma del webhook
 * Documentación: https://developers.binance.com/docs/binance-pay/webhook#verify-webhook-signature
 */
function verifyWebhookSignature(rawBody, signature, timestamp, nonce) {
    if (!signature || !timestamp || !nonce) {
        return false;
    }

    // Firma = HMAC_SHA512(secret, timestamp + nonce + body)
    const payload = timestamp + '\n' + nonce + '\n' + rawBody + '\n';

    const computedSignature = crypto
        .createHmac('sha512', BINANCE_SECRET_KEY)
        .update(payload)
        .digest('hex')
        .toUpperCase();

    return signature === computedSignature;
}

async function handlePaymentNotification(data) {
    const {
        merchantTradeNo,
        transactionId,
        orderAmount,
        currency,
        status, // PAID, CANCELED, ERROR
        transactTime
    } = data;

    console.log('Processing payment:', {
        order: merchantTradeNo,
        status: status,
        amount: orderAmount,
        txId: transactionId
    });

    if (status === 'PAID') {
        // TODO: Implementar tu lógica de negocio
        // 1. Actualizar estado en base de datos
        // 2. Acreditar USDT al usuario
        // 3. Enviar notificación por email/Socket
        // 4. Registrar en blockchain si aplica

        console.log('✅ Payment confirmed for order:', merchantTradeNo);
    } else if (status === 'CANCELED') {
        console.log('❌ Payment cancelled:', merchantTradeNo);
        // TODO: Liberar reserva de fondos, etc.
    }
}

async function handleRefundNotification(data) {
    console.log('Refund processed:', data.merchantTradeNo);
    // TODO: Implementar lógica de reembolso
}

// Helper para obtener raw body en Next.js
export const config = {
    api: {
        bodyParser: false, // Necesario para verificar firma
    },
};
