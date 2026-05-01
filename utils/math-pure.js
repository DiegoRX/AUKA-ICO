/**
 * Calculates raw wei value for USDT based on decimals.
 * Handles 6 decimals (Polygon/ETH) and 18 decimals (BSC).
 */
export const calculateWeiUSDTValue = (usdtAmount, tokenDecimals) => {
  if (tokenDecimals <= 15) {
    return Math.floor(Number(usdtAmount) * 10 ** tokenDecimals).toString();
  } else {
    // For 18+ decimals, use BigInt to avoid JS floating point issues
    // Using a safer approach: split amount into integer and decimals parts
    const amountStr = String(usdtAmount).replace(',', '.');
    const [integerPart, decimalPart = ''] = amountStr.split('.');
    
    const pad = '0'.repeat(tokenDecimals);
    const combined = integerPart + decimalPart.padEnd(tokenDecimals, '0').slice(0, tokenDecimals);
    return BigInt(combined).toString();
  }
};
