// /lib/binance.js
import crypto from 'crypto';

const BINANCE_API_KEY = process.env.BINANCE_PAY_API_KEY?.trim();
const BINANCE_SECRET_KEY = process.env.BINANCE_PAY_SECRET_KEY?.trim();
const BINANCE_MERCHANT_ID = process.env.BINANCE_PAY_MERCHANT_ID?.trim();

// Endpoints según documentación oficial
const BINANCE_PAY_API = process.env.BINANCE_PAY_SANDBOX === 'true'
    ? 'https://bpay.binanceapi.com/binancepay/openapi/sandbox/v2/order'
    : 'https://bpay.binanceapi.com/binancepay/openapi/v2/order';
const BINANCE_QUERY_API = 'https://bpay.binanceapi.com/binancepay/openapi/v2/order/query';

/**
 * Crea una orden de pago en Binance Pay
 * Documentación: https://developers.binance.com/docs/binance-pay/api-order-create
 */
export async function createBinanceOrder({
    amount,
    currency,
    description,
    userId,
    returnUrl,
    cancelUrl
}) {
    if (!BINANCE_API_KEY || !BINANCE_SECRET_KEY) {
        throw new Error('Binance Pay credentials not configured');
    }

    const timestamp = Date.now().toString();
    const nonce = crypto.randomUUID().replace(/-/g, '');

    const merchantTradeNo = `${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    // Payload según documentación oficial v2
    const payload = {
        env: {
            terminalType: 'WEB' // WEB, APP, WAP, MINI_PROGRAM, OTHERS
        },
        merchantTradeNo: merchantTradeNo.slice(0, 32), // Máx 32 chars
        orderAmount: amount.toString(),
        currency: currency, // Fiat: USD, EUR, COP, etc. | Crypto: USDT, BTC, etc.
        goods: {
            goodsType: '01', // 01 = Virtual goods, 02 = Physical goods
            goodsCategory: 'Z000', // Código de categoría
            referenceGoodsId: 'USDT_PURCHASE',
            goodsName: (description || 'USDT Purchase').slice(0, 256), // Máx 256 chars
            goodsDetail: (description || 'Purchase of USDT via Binance Pay').slice(0, 512) // Máx 512 chars
        },
        // Opcionales pero recomendados:
        returnUrl: returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
        cancelUrl: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancel`
    };

    const body = JSON.stringify(payload);

    // Firma según documentación: Timestamp + \n + Nonce + \n + Body + \n
    const signatureString = timestamp + '\n' + nonce + '\n' + body + '\n';

    const signature = crypto
        .createHmac('sha512', BINANCE_SECRET_KEY)
        .update(signatureString)
        .digest('hex')
        .toUpperCase();

    console.log('=== Binance Pay Request ===');
    console.log('Timestamp:', timestamp);
    console.log('Nonce:', nonce);
    console.log('MerchantTradeNo:', payload.merchantTradeNo);
    console.log('Signature (first 20 chars):', signature.slice(0, 20) + '...');

    const response = await fetch(BINANCE_PAY_API, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'BinancePay-Timestamp': timestamp,
            'BinancePay-Nonce': nonce,
            'BinancePay-Certificate-SN': BINANCE_API_KEY,
            'BinancePay-Signature': signature
        },
        body: body
    });

    const data = await response.json();

    console.log('=== Binance Pay Response ===');
    console.log('Status:', data.status);
    console.log('Code:', data.code);

    if (data.status !== 'SUCCESS' || data.code !== '000000') {
        console.error('Binance Pay Error Details:', data);
        throw new Error(data.errorMessage || `Binance error code: ${data.code}`);
    }

    return {
        success: true,
        merchantTradeNo: payload.merchantTradeNo,
        prepayId: data.data?.prepayId,
        transactionId: data.data?.transactionId,
        checkoutUrl: data.data?.checkoutUrl,      // URL para checkout web
        deeplink: data.data?.deeplink,            // Deep link para app móvil
        universalUrl: data.data?.universalUrl,    // URL universal (app/web)
        qrCode: data.data?.qrCode,                // QR code en base64
        qrContent: data.data?.qrContent,          // Contenido del QR
        expireTime: data.data?.expireTime         // Timestamp de expiración
    };
}

/**
 * Consulta el estado de una orden
 * Documentación: https://developers.binance.com/docs/binance-pay/api-order-query
 */
export async function queryBinanceOrder(merchantTradeNo) {
    const timestamp = Date.now().toString();
    const nonce = crypto.randomUUID().replace(/-/g, '');

    const payload = {
        merchantTradeNo: merchantTradeNo
    };

    const body = JSON.stringify(payload);
    const signatureString = timestamp + '\n' + nonce + '\n' + body + '\n';

    const signature = crypto
        .createHmac('sha512', BINANCE_SECRET_KEY)
        .update(signatureString)
        .digest('hex')
        .toUpperCase();

    const response = await fetch(BINANCE_QUERY_API, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'BinancePay-Timestamp': timestamp,
            'BinancePay-Nonce': nonce,
            'BinancePay-Certificate-SN': BINANCE_API_KEY,
            'BinancePay-Signature': signature
        },
        body: body
    });

    const data = await response.json();

    if (data.status !== 'SUCCESS') {
        throw new Error(data.errorMessage || 'Failed to query order');
    }

    return {
        status: data.data?.status, // INITIAL, PENDING, PAID, CANCELED, ERROR
        orderAmount: data.data?.orderAmount,
        currency: data.data?.currency,
        transactionId: data.data?.transactionId,
        createTime: data.data?.createTime,
        transactTime: data.data?.transactTime // Hora de confirmación del pago
    };
}