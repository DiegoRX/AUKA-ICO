import { ethers } from 'ethers';
import dotenv from 'dotenv';
dotenv.config();

const PROVIDER_URL = 'https://polygon-mainnet.g.alchemy.com/v2/FmIzG8DTVK5aZZPJFzmLFNPWcuLF5ZXs';
const USDT_ADDRESS = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F';
let ERC20_ABI = require("@config/abi/erc20.json");

export async function getWalletBalance(tokenHolder) {
  try {
    const privateKey = process.env.USDT_PRIVATE_KEY;
    const ethProvider = new ethers.JsonRpcProvider(PROVIDER_URL);
    console.log(ethProvider)
    const wallet = new ethers.Wallet(privateKey, ethProvider);

    const balanceETH = await ethProvider.getBalance(wallet.address);


    let usdtContract = new ethers.Contract(
      USDT_ADDRESS,
      ERC20_ABI,
      wallet
    );
    const balance = await usdtContract.balanceOf(wallet.address);
    console.log(`Balance ETH: ${balanceETH} ETH`);
    console.log(`Balance USDT: ${balance.toString()} USDT`);
    console.log('Wallet Address: ', wallet.address)
    return balance;
  } catch (error) {
    console.error('Error getting wallet balance:', error);
    throw error;
  }
}
