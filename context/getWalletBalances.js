import { ethers } from 'ethers';
import detectEthereumProvider from "@metamask/detect-provider";

const POLYGON_RPC = 'https://polygon-mainnet.g.alchemy.com/v2/FmIzG8DTVK5aZZPJFzmLFNPWcuLF5ZXs';
const OG_RPC = 'https://rpc.ordenglobal-rpc.com';

const USDT_ADDRESSES = {
  '137': '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', // Polygon
  '56': '0x55d398326f99059fF775485246999027B3197955',  // BSC
  '1': '0xdAC17F958D2ee523a2206206994597C13D831ec7',   // ETH
};

const AUKA_ADDRESS = '0x6Facc8Df79cEDc6C5065442ce27e915Aa3a26B9B';
const USDK_ADDRESS = "0xAEaB7Fa98c972e0746471d57F7b5b3538B0aF716";
const ERC20_ABI = require("@config/abi/erc20.json");

const getWalletBalances = (chainId, userAddress) =>
  new Promise(async (resolve) => {
    try {
      const provider = await detectEthereumProvider();
      let activeAddress = userAddress;
      let activeChainId = chainId;

      if (provider) {
        if (!activeAddress) {
          const accounts = await provider.request({ method: "eth_accounts" });
          activeAddress = accounts[0];
        }
        if (!activeChainId) {
          activeChainId = await provider.request({ method: "eth_chainId" });
        }
      }

      // Convert hex chainId to decimal string if needed
      const decimalChainId = activeChainId?.toString().startsWith('0x')
        ? parseInt(activeChainId, 16).toString()
        : activeChainId?.toString();

      const polygonProvider = new ethers.JsonRpcProvider(POLYGON_RPC);
      const ogProvider = new ethers.JsonRpcProvider(OG_RPC);
      const bscProvider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
      const ethProvider = new ethers.JsonRpcProvider('https://cloudflare-eth.com');

      // 1. ORIGEN Balance (Native Coin on OG Network)
      let balanceORIGEN = 0;
      if (activeAddress) {
        try {
          const balanceORIGENWei = await ogProvider.getBalance(activeAddress);
          balanceORIGEN = Number(ethers.formatEther(balanceORIGENWei));
        } catch (e) { console.error("Error fetching ORIGEN balance:", e); }
      }

      // 2. AUKA Balance (Treasury?)
      let balanceAUKA = 0;
      try {
        const aukaContract = new ethers.Contract(AUKA_ADDRESS, ERC20_ABI, ogProvider);
        const balanceAUKAwei = await aukaContract.balanceOf('0x8E839Af7A405f49bf72B239929b8ee3c07Ee7ba0');
        balanceAUKA = Number(ethers.formatEther(balanceAUKAwei));
      } catch (e) { console.error("Error fetching AUKA balance:", e); }

      // 3. User USDT Balance (Multi-chain via RPC)
      let balanceUSDT = 0;
      if (activeAddress && decimalChainId && USDT_ADDRESSES[decimalChainId]) {
        try {
          const usdtAddress = USDT_ADDRESSES[decimalChainId];
          let rpcProvider = polygonProvider;
          if (decimalChainId === '56') rpcProvider = bscProvider;
          else if (decimalChainId === '1') rpcProvider = ethProvider;

          const usdtContract = new ethers.Contract(usdtAddress, ERC20_ABI, rpcProvider);
          const balanceUSDTwei = await usdtContract.balanceOf(activeAddress);
          const decimals = decimalChainId === '137' || decimalChainId === '1' ? 6 : 18; // USDT is 6 on Poly/ETH, 18 on BSC (Bridged)
          balanceUSDT = Number(ethers.formatUnits(balanceUSDTwei, decimals));
        } catch (e) { console.error("Error fetching USDT balance:", e); }
      }

      // 4. USDK Balance (Polygon - User)
      let balanceUSDK = 0;
      if (activeAddress) {
        try {
          const usdkContract = new ethers.Contract(USDK_ADDRESS, ERC20_ABI, polygonProvider);
          const balanceUSDKwei = await usdkContract.balanceOf(activeAddress);
          balanceUSDK = Number(ethers.formatEther(balanceUSDKwei));
        } catch (e) { console.error("Error fetching USDK balance:", e); }
      }

      // 5. AUKA Balance (Orden Global - User)
      let userAUKA = 0;
      if (activeAddress) {
        try {
          const aukaContract = new ethers.Contract(AUKA_ADDRESS, ERC20_ABI, ogProvider);
          const aukaWei = await aukaContract.balanceOf(activeAddress);
          userAUKA = Number(ethers.formatEther(aukaWei));
        } catch (e) { console.error("Error fetching User AUKA balance:", e); }
      }

      // 6. OG Treasury Balances
      let OGUSDTBalance = 0;
      try {
        const polygonUsdtContract = new ethers.Contract(USDT_ADDRESSES['137'], ERC20_ABI, polygonProvider);
        const OGUSDTBalancewei = await polygonUsdtContract.balanceOf('0xF4435beB6dAF20265d39284AD2501808c0af6C1D');
        OGUSDTBalance = Number(ethers.formatUnits(OGUSDTBalancewei, 6));
      } catch (e) { console.error("Error fetching OG USDT treasury balance:", e); }

      let OGbalanceORIGEN = 0;
      try {
        const OGbalanceORIGENWei = await ogProvider.getBalance('0xf209ff2a16FA367161E455F3B7f90E067EDDafa9');
        OGbalanceORIGEN = Number(ethers.formatEther(OGbalanceORIGENWei));
      } catch (e) { console.error("Error fetching OG ORIGEN treasury balance:", e); }

      let OGbalanceUSDK = 0;
      try {
        const polygonUsdkContract = new ethers.Contract(USDK_ADDRESS, ERC20_ABI, polygonProvider);
        const OGbalanceUSDKWei = await polygonUsdkContract.balanceOf('0xF4435beB6dAF20265d39284AD2501808c0af6C1D');
        OGbalanceUSDK = Number(ethers.formatEther(OGbalanceUSDKWei));
      } catch (e) { console.error("Error fetching OG USDK treasury balance:", e); }

      resolve({
        balanceUSDT,
        OGbalanceORIGEN,
        OGUSDTBalance,
        balanceORIGEN,
        balanceAUKA, // This is Treasury AUKA in current code, but we'll map correctly in state
        userAUKA,
        balanceUSDK,
        OGbalanceUSDK
      });

    } catch (error) {
      console.error("getWalletBalances error:", error);
      resolve({
        balanceUSDT: 0,
        OGbalanceORIGEN: 0,
        OGUSDTBalance: 0,
        balanceORIGEN: 0,
        balanceAUKA: 0,
        balanceUSDK: 0
      });
    }
  });

export default getWalletBalances;