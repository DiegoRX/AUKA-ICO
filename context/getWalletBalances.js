import { ethers } from 'ethers';
import dotenv from 'dotenv';
dotenv.config();

const PROVIDER_URL = 'https://polygon-mainnet.g.alchemy.com/v2/FmIzG8DTVK5aZZPJFzmLFNPWcuLF5ZXs';
const USDT_ADDRESS = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F';
const AUKA_ADDRESS = '0x6Facc8Df79cEDc6C5065442ce27e915Aa3a26B9B';

let ERC20_ABI = require("@config/abi/erc20.json");

const getWalletBalances = () =>
  // if (netId == NETWORK_ID) {
  new Promise(async (resolve, reject) => {
    const privateKey = process.env.USDT_PRIVATE_KEY;
    const privateKeyAUKA = process.env.AUKA_PRIVATE_KEY;
    const ethProvider = new ethers.JsonRpcProvider(PROVIDER_URL);
    console.log(ethProvider)
    const wallet = new ethers.Wallet(privateKey, ethProvider);
    const walletAUKA = new ethers.Wallet(privateKeyAUKA, ethProvider);
    const balanceORIGEN = await ethProvider.getBalance(walletAUKA.address);


    let usdtContract = new ethers.Contract(
      USDT_ADDRESS,
      ERC20_ABI,
      wallet
    );

    // let aukaContract = new ethers.Contract(
    //   AUKA_ADDRESS,
    //   ERC20_ABI,
    //   walletAUKA
    // );
    // const balanceAUKA = await aukaContract.balanceOf(wallet.address);;
    const balanceUSDT = await usdtContract.balanceOf(wallet.address);
    console.log(`Balance ORIGEN: ${balanceORIGEN} ORIGEN`);
    console.log(`Balance USDT: ${balanceUSDT.toString()} USDT`);
    console.log('Wallet Address: ', wallet.address)


      resolve({
        balanceUSDT,
        // balanceAUKA,
        balanceORIGEN
      });

      return {
        balanceUSDT,
        // balanceAUKA,
        balanceORIGEN
      };

  });

export default getWalletBalances;