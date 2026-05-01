import Web3 from 'web3';

/**
 * Calculates raw wei value for USDT based on decimals.
 * Handles 6 decimals (Polygon/ETH) and 18 decimals (BSC).
 */
export const calculateWeiUSDTValue = (usdtAmount, tokenDecimals) => {
  if (tokenDecimals <= 15) {
    return Math.floor(Number(usdtAmount) * 10 ** tokenDecimals).toString();
  } else {
    // For 18+ decimals, use BigInt to avoid JS floating point issues
    const base = Math.floor(Number(usdtAmount) * 10 ** 6);
    return (BigInt(base) * BigInt(10 ** (tokenDecimals - 6))).toString();
  }
};

/**
 * Builds gas params for different networks.
 */
export const getGasParamsForChain = async (web3Provider, chainId) => {
  const chainStr = String(chainId);
  const LEGACY_CHAINS = ['56', '8532']; // BSC, Orden Global
  const web3Util = new Web3();

  if (LEGACY_CHAINS.includes(chainStr)) {
    let gasPrice = await web3Provider.eth.getGasPrice();
    const minimums = { '56': '3', '8532': '10' };
    const minGwei = minimums[chainStr];
    if (minGwei) {
      const minWei = web3Util.utils.toWei(minGwei, 'gwei');
      if (BigInt(gasPrice) < BigInt(minWei)) {
        gasPrice = minWei;
      }
    }
    return { gasPrice: String(gasPrice) };
  } else {
    try {
      const block = await web3Provider.eth.getBlock('latest');
      if (block && block.baseFeePerGas) {
        const baseFee = BigInt(block.baseFeePerGas);
        const priorityGwei = chainStr === '137' ? '30' : '1.5';
        const priorityFee = BigInt(web3Util.utils.toWei(priorityGwei, 'gwei'));
        const maxFee = (baseFee * 2n + priorityFee).toString();
        return {
          maxFeePerGas: maxFee,
          maxPriorityFeePerGas: priorityFee.toString()
        };
      }
    } catch (e) {
      console.warn("EIP-1559 gas estimation failed, using legacy gasPrice", e);
    }
    const gp = await web3Provider.eth.getGasPrice();
    return { gasPrice: String(gp) };
  }
};
