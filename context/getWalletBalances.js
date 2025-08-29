import { ethers } from 'ethers';
import dotenv from 'dotenv';
dotenv.config();
import detectEthereumProvider from "@metamask/detect-provider";

const PROVIDER_URL = 'https://polygon-mainnet.g.alchemy.com/v2/FmIzG8DTVK5aZZPJFzmLFNPWcuLF5ZXs';
const OG_RPC = 'https://rpc.ordenglobal-rpc.com';
const USDT_ADDRESS = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F';
const AUKA_ADDRESS = '0x6Facc8Df79cEDc6C5065442ce27e915Aa3a26B9B';

let ERC20_ABI = require("@config/abi/erc20.json");

const getWalletBalances = () =>
  // if (netId == NETWORK_ID) {
  new Promise(async (resolve, reject) => {
    const provider = await detectEthereumProvider();
    const accounts = await provider.request({
      method: "eth_requestAccounts",
    });
    const privateKey = process.env.USDT_PRIVATE_KEY;
    const privateKeyAUKA = process.env.AUKA_PRIVATE_KEY;
    const ethProvider = new ethers.JsonRpcProvider(PROVIDER_URL);
    const ogProvider = new ethers.JsonRpcProvider(OG_RPC);
    console.log('ogProvider', ogProvider)
    const wallet = new ethers.Wallet(privateKey, ethProvider);
    const walletAUKA = new ethers.Wallet(privateKeyAUKA, ogProvider);
    const balanceORIGENWei = await ogProvider.getBalance(accounts[0]);
    const balanceORIGEN = Number(balanceORIGENWei) / 10 ** 18;
    const OGbalanceORIGENWei = await ogProvider.getBalance('0xf209ff2a16FA367161E455F3B7f90E067EDDafa9');
    const OGbalanceORIGEN = Number(OGbalanceORIGENWei) / 10 ** 18;

    let usdtContract = new ethers.Contract(
      USDT_ADDRESS,
      ERC20_ABI,
      wallet
    );

    let aukaContract = new ethers.Contract(
      AUKA_ADDRESS,
      ERC20_ABI,
      walletAUKA
    );
    const balanceAUKAwei = await aukaContract.balanceOf('0x8E839Af7A405f49bf72B239929b8ee3c07Ee7ba0');;
    const balanceAUKA = Number(balanceAUKAwei) / 10 ** 18;
    const OGUSDTBalancewei = await usdtContract.balanceOf('0xF4435beB6dAF20265d39284AD2501808c0af6C1D');
    const OGUSDTBalance = Number(OGUSDTBalancewei) / 10 ** 6
    const balanceUSDTwei = await usdtContract.balanceOf(accounts[0]);
    const balanceUSDT = Number(balanceUSDTwei) / 10 ** 6

    console.log(`Balance ORIGEN: ${balanceORIGEN} ORIGEN`);
    console.log(`Balance USDT: ${balanceUSDT.toString()} USDT`);
    console.log(`Balance AUKA: ${balanceAUKA.toString()} AUKA`);
    console.log('Wallet Address: ', accounts)
    console.log('OG balances origen usdt: ', OGbalanceORIGEN,
      OGUSDTBalance,)


    resolve({
      balanceUSDT,
      OGbalanceORIGEN,
      OGUSDTBalance,
      balanceORIGEN
    });

    return {
      balanceUSDT,
      OGbalanceORIGEN,
      OGUSDTBalance,
      balanceORIGEN
    };

  });

export default getWalletBalances;