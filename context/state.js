import { createContext, useContext, useEffect, useState } from "react";
import getBlockchain from "./ethereum.js";

import detectEthereumProvider from "@metamask/detect-provider";

import Swal from 'sweetalert2'
import RequestService from '@context/axios';

const AppContext = createContext();

export function AppWrapper({ children }) {
  const [coffeeContract, setCoffeeContract] = useState(null);

  const [walletAddress, setWalletAddress] = useState([]);

  const [web3, setWeb3] = useState();
  const [accounts, setAccounts] = useState();
  const [WMATIC_ADDRESS, setWMATIC_ADDRESS] = useState('');
  const [ondkBalance, setOndkBalance] = useState(0);
  const network = 137;
  const USDC_ADDRESS = "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582"
  const USDT_RECEIVER_ADDRESS = "0x3E531Ce4fd73b5a3EA86E37fbcd92e2c36490909"
  const TOKEN_RECEIVER_ADDRESS = "0x3E531Ce4fd73b5a3EA86E37fbcd92e2c36490909"

  const AUKA_ADDRESS = "0x6Facc8Df79cEDc6C5065442ce27e915Aa3a26B9B"

  const connectWallet = async () => {
    const {
      accounts,

      WMATIC_ADDRESS,

      web3Provider,



    } = await getBlockchain();
    setCoffeeContract(coffeeContract);

    setWalletAddress(accounts);
    setWMATIC_ADDRESS(WMATIC_ADDRESS);

    setWeb3(web3Provider);
    setAccounts(accounts);

  };



  useEffect(() => {
    connectWallet();

  }, []);



  const getAUKABalance = async () => {
    let ERC20_ABI = require("@config/abi/erc20.json");
    let provider = await detectEthereumProvider();
    if (provider) {
      const web3Provider = new Web3(window.ethereum);
      let AUKAContract = new web3Provider.eth.Contract(
        ERC20_ABI,
        AUKA_ADDRESS
      );
      const resultApprove = await AUKAContract.methods.balanceOf(walletAddress[0]).call()
      let finalBalance = resultApprove / 10 ** 18
      setOndkBalance(finalBalance)

      console.log(finalBalance)
    }
  }
  getAUKABalance()
  const transferAUKA = async (data) => {
    const {usdtAmount, usdtAddress, tokenName, tokenAmount, network, networkId, tokenReceiverAddress, providerUrl} = data
    if (isNaN(usdtAmount) || isNaN(tokenAmount)) {
      console.error("Invalid input: usdtAmount or tokenAmount is not a number");
      return;
    }
  
    let weiUSDTValue = (usdtAmount * 10 ** 6);
    let weiAUKAValue = (tokenAmount * 10 ** 18);
  
    console.log("USDT Value (in wei):", weiUSDTValue);
    console.log("Token Value (in wei):", weiAUKAValue);
  
    let ERC20_ABI = require("@config/abi/erc20.json");
    let provider = await detectEthereumProvider();
    if (provider) {
      const web3Provider = new Web3(window.ethereum);
      let USDCContract = new web3Provider.eth.Contract(
        ERC20_ABI,
        usdtAddress
      );
      const resultApprove = await USDCContract.methods
        .transfer(USDT_RECEIVER_ADDRESS, weiUSDTValue)
        .send({ from: walletAddress[0], gas: 0, value: 0 })
        .on("transactionHash", function (hash) {
          console.log("Executing...");
        })
        .on("receipt", function (receipt) {
          console.log(receipt);
          RequestService.post({
            providerUrl,
            network,
            "networkId": String(networkId),
            "buyerAddress": receipt.from,
            "tokenName": tokenName,
            "usdtReceiverAddress": USDT_RECEIVER_ADDRESS,
            "tokenReceiverAddress": tokenReceiverAddress,
            "txHash": receipt.transactionHash,
            "usdtAddress": USDC_ADDRESS,
            "usdtAmount": String(usdtAmount),
            "tokenAmount": String(tokenAmount),
            "weiUSDTValue": String(weiUSDTValue),
            "weiTokenValue": String(weiAUKAValue),
            "approved": true
          })
          Swal.fire({
            title: `${tokenAmount} $AUKA sent to`,
            text: tokenReceiverAddress,
            icon: "success"
          });
          getAUKABalance()
        })
        .catch((revertReason) => {
          console.log(
            "ERROR! Transaction reverted: " +
            revertReason.receipt
          );
        });
    }
  }
  const transferORIGEN = async (data) => {
    const {usdtAmount, usdtAddress, tokenName, tokenAmount, network, networkId, tokenReceiverAddress, providerUrl} = data
    let weiUSDTValue = (usdtAmount * 10 ** 6).toString()
    let weiORIGENValue = (tokenAmount * 10 ** 18).toString()

    let ERC20_ABI = require("@config/abi/erc20.json");
    let provider = await detectEthereumProvider();
    if (provider) {
      const web3Provider = new Web3(window.ethereum);
      let USDCContract = new web3Provider.eth.Contract(
        ERC20_ABI,
        usdtAddress
      );
      const resultApprove = await USDCContract.methods
        .transfer(USDT_RECEIVER_ADDRESS, weiUSDTValue)
        .send({ from: walletAddress[0], gas: 0, value: 0 })
        .on("transactionHash", function (hash) {
          console.log("Executing...");
        })
        .on("receipt", function (receipt) {
          console.log(receipt);
          RequestService.post({
            providerUrl,
            network,
            "networkId": String(networkId),
            "buyerAddress": receipt.from,
            "tokenName": tokenName,
            "usdtReceiverAddress": USDT_RECEIVER_ADDRESS,
            "tokenReceiverAddress": tokenReceiverAddress,
            "txHash": receipt.transactionHash,
            "usdtAddress": USDC_ADDRESS,
            "usdtAmount": String(usdtAmount),
            "tokenAmount": String(tokenAmount),
            "weiUSDTValue": String(weiUSDTValue),
            "weiTokenValue": String(weiORIGENValue),
            "approved": true
          })
          Swal.fire({
            title: `${tokenAmount} $ORIGEN sent to`,
            text: tokenReceiverAddress,
            icon: "success"
          });

        })
        .catch((revertReason) => {
          console.log(
            "ERROR! Transaction reverted: " +
            revertReason.receipt
          );
        });
    }
  }

  const transferUSDTfromAUKA = async (data) => {
    const {usdtAmount, usdtAddress, tokenName, tokenAmount, network, networkId, tokenReceiverAddress, providerUrl} = data
    let weiUSDTValue = (usdtAmount * 10 ** 6).toString()
    let weiAUKAValue = (tokenAmount * 10 ** 18).toString()
console.log(weiAUKAValue)
    let ERC20_ABI = require("@config/abi/erc20.json");
    let provider = await detectEthereumProvider();
    if (provider) {
      const web3Provider = new Web3(window.ethereum);
      let USDCContract = new web3Provider.eth.Contract(
        ERC20_ABI,
        AUKA_ADDRESS
      );
      const resultApprove = await USDCContract.methods
        .transfer(TOKEN_RECEIVER_ADDRESS, weiAUKAValue)
        .send({ from: walletAddress[0], gas: 200000, value: 0, gasLimit: 21000 })
        .on("transactionHash", function (hash) {
          console.log("Executing...");
        })
        .on("receipt", function (receipt) {
          console.log(receipt);
          RequestService.postSell({
            providerUrl,
            network,
            "networkId": String(networkId),
            "buyerAddress": receipt.from,
            "tokenName": tokenName,
            "usdtReceiverAddress": USDT_RECEIVER_ADDRESS,
            "tokenReceiverAddress": tokenReceiverAddress,
            "txHash": receipt.transactionHash,
            "usdtAddress": USDC_ADDRESS,
            "usdtAmount": String(usdtAmount),
            "tokenAmount": String(tokenAmount),
            "weiUSDTValue": String(weiUSDTValue),
            "weiTokenValue": String(weiAUKAValue),
            "approved": true
          })
          Swal.fire({
            title: `${tokenAmount} $AUKA sent to`,
            text: tokenReceiverAddress,
            icon: "success"
          });
          getAUKABalance()
        })
        .catch((revertReason) => {
          console.log(
            "ERROR! Transaction reverted: " +
            revertReason.receipt
          );
        });
    }
  }
  const transferUSDTfromORIGEN = async (data) => {
    const {usdtAmount, usdtAddress, tokenName, tokenAmount, network, networkId, tokenReceiverAddress, providerUrl} = data
    let weiUSDTValue = (usdtAmount * 10 ** 6).toString()
    let weiORIGENValue = (tokenAmount * 10 ** 18).toString()

    let ERC20_ABI = require("@config/abi/erc20.json");
    let provider = await detectEthereumProvider();
    if (provider) {
      const web3Provider = new Web3(window.ethereum);

      const transactionParameters = {
        to: TOKEN_RECEIVER_ADDRESS, // Dirección del receptor
        from: walletAddress[0], // Dirección del remitente
        value: weiORIGENValue, // Valor en wei
        gas: 210000, // Límite de gas estándar para transferencias de ETH
        gasPrice: 5000000000000, // Valor del gas 
      };
console.log(transactionParameters)
      let tx = new web3Provider.eth.sendTransaction(
        transactionParameters
      ).on("transactionHash", function (hash) {
          console.log("Executing...");
        })
        .on("receipt", function (receipt) {
          console.log(receipt);
          RequestService.postSell({
            providerUrl,
            network,
            "networkId": String(networkId),
            "buyerAddress": receipt.from,
            "tokenName": tokenName,
            "usdtReceiverAddress": TOKEN_RECEIVER_ADDRESS,
            "tokenReceiverAddress": tokenReceiverAddress,
            "txHash": receipt.transactionHash,
            "usdtAddress": USDC_ADDRESS,
            "usdtAmount": String(usdtAmount),
            "tokenAmount": String(tokenAmount),
            "weiUSDTValue": String(weiUSDTValue),
            "weiTokenValue": String(weiORIGENValue),
            "approved": true
          })
          Swal.fire({
            title: `${tokenAmount} $ORIGEN sent to`,
            text: tokenReceiverAddress,
            icon: "success"
          });

        })
        .catch((revertReason) => {
          console.log(
            "ERROR! Transaction reverted: " +
            revertReason.receipt
          );
        });
    }
  }

  let sharedState = {
    connectWallet,
    walletAddress,
    accounts,
    ondkBalance,
    coffeeContract,
    web3,
    transferAUKA,
    transferORIGEN,
    network,
    transferUSDTfromAUKA,
    transferUSDTfromORIGEN

  };


  return (
    <AppContext.Provider value={sharedState}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}