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
  const USDT_RECEIVER_ADDRESS = "0x316747dddD12840b29b87B7AF16Ba6407C17F19b"
  const ONDK_ADDRESS = "0x961e742066e3d1cAD863A45a82C7B6e87bB3A02F"

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

 

  const getONDKBalance = async () => {
let ERC20_ABI = require("@config/abi/erc20.json");
  let provider = await detectEthereumProvider();
  if (provider) {
    const web3Provider = new Web3(window.ethereum);
    let ONDKContract = new web3Provider.eth.Contract(
      ERC20_ABI,
      ONDK_ADDRESS
    );
    const resultApprove = await ONDKContract.methods.balanceOf(walletAddress[0]).call()
   let finalBalance =resultApprove/10**18
    setOndkBalance(finalBalance)

    console.log(finalBalance)
  }
  }
   getONDKBalance()
  const transfer = async (usdtAmount,usdtAddress,tokenName, ondkAmount, network, networkId, ondkReceiverAddress, providerUrl) => {
    let weiUSDTValue = usdtAmount * 10 ** 6
    let weiONDKValue = ondkAmount * 10 ** 18

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
            "ondkReceiverAddress": ondkReceiverAddress,
            "txHash": receipt.transactionHash,
            "usdtAddress": USDC_ADDRESS,
            "usdtAmount": String(usdtAmount),
            "ondkAmount": String(ondkAmount),
            "weiUSDTValue": String(weiUSDTValue),
            "weiONDKValue": String(weiONDKValue),
            "approved": true
          })
          Swal.fire({
            title: `${ondkAmountONDK} $ONDK sent to`,
            text: ondkReceiverAddress,
            icon: "success"
          });
          getONDKBalance()
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
    transfer,
    network,


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