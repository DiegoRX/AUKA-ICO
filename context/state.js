import { createContext, useContext, useEffect, useState } from "react";
import getBlockchain, { switchNetwork } from "./ethereum.js";
import getWalletBalances from './getWalletBalances.js'
import detectEthereumProvider from "@metamask/detect-provider";
import Web3 from "web3";

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
  const [aukaWalletBalance, setAukaWalletBalance] = useState(0);
  const [usdtWalletBalance, setusdtWalletBalance] = useState(0);
  const [origenWalletBalance, setOrigenWalletBalance] = useState(0);
  const [currentChainId, setCurrentChainId] = useState(0)
  const [OGbalanceORIGEN, setOGbalanceORIGEN] = useState(0);
  const [OGUSDTBalance, setOGUSDTBalance] = useState(0);
  const network = 137;
  const USDT_RECEIVER_ADDRESS = "0xf4435beb6daf20265d39284ad2501808c0af6c1d"
  const TOKEN_RECEIVER_ADDRESS = "0xf209ff2a16fa367161e455f3b7f90e067eddafa9"

  const AUKA_ADDRESS = "0x6Facc8Df79cEDc6C5065442ce27e915Aa3a26B9B"

  const USDK_ADDRESS = "0xAEaB7Fa98c972e0746471d57F7b5b3538B0aF716";
  const [usdkWalletBalance, setUsdkWalletBalance] = useState(0);
  const [OGbalanceUSDK, setOGbalanceUSDK] = useState(0);

  const [txPending, setTxPending] = useState(false);
  const [txHash, setTxHash] = useState('');

  const connectWallet = async (preferredChainId = null) => {
    try {
      const {
        currentChainId,
        accounts,
        WMATIC_ADDRESS,
        web3Provider,
      } = await getBlockchain();

      const targetChainId = preferredChainId || currentChainId;

      const {
        balanceUSDT,
        balanceORIGEN,
        balanceAUKA,
        userAUKA,
        OGbalanceORIGEN,
        OGUSDTBalance,
        balanceUSDK,
        OGbalanceUSDK,
      } = await getWalletBalances(targetChainId, accounts[0]);

      setOGUSDTBalance(OGUSDTBalance);
      setOGbalanceORIGEN(OGbalanceORIGEN);
      setOGbalanceUSDK(OGbalanceUSDK);
      setOrigenWalletBalance(balanceORIGEN);
      setusdtWalletBalance(balanceUSDT);
      setAukaWalletBalance(balanceAUKA); // Treasury
      setOndkBalance(userAUKA); // User AUKA
      setUsdkWalletBalance(balanceUSDK);
      setCurrentChainId(currentChainId);
      setWalletAddress(accounts);
      setWMATIC_ADDRESS(WMATIC_ADDRESS);
      setWeb3(web3Provider);
      setAccounts(accounts);
    } catch (error) {
      console.error("connectWallet error:", error);
    }
  };

  // --- REEMPLAZA TU USEEFFECT CON ESTOS DOS ---

  // Efecto 1: Intenta conectar la billetera al cargar la página
  useEffect(() => {
    // Intenta conectar automáticamente si el usuario ya ha dado permisos
    if (window.ethereum && window.ethereum.selectedAddress) {
      connectWallet();
    }
  }, []); // Se ejecuta solo una vez al montar el componente

  // Efecto 2: Escucha los cambios de red y de cuenta
  useEffect(() => {
    // Verifica si MetaMask está instalado
    if (window.ethereum) {
      // --- Network change listener ---
      const handleChainChanged = (chainId) => {
        console.log("Network changed to:", chainId);
        setCurrentChainId(chainId);
        // Refresh balances when network changes
        connectWallet();
      };

      // --- Account change listener ---
      const handleAccountsChanged = (accounts) => {
        console.log("Account changed to:", accounts[0]);
        if (accounts.length > 0) {
          // If the user changes account, reconnect to update balances and data.
          connectWallet();
        } else {
          // The user has disconnected
          setWalletAddress([]);
          setAccounts([]);
        }
      };

      // Adjuntar los listeners
      window.ethereum.on('chainChanged', handleChainChanged);
      window.ethereum.on('accountsChanged', handleAccountsChanged);

      // Función de limpieza para remover los listeners cuando el componente se desmonte
      return () => {
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, []);



  // --- GENERIC TRANSACTION METHODS ---

  const getTokenAddress = (symbol) => {
    switch (symbol) {
      case 'AUKA': return AUKA_ADDRESS;
      case 'USDK': return USDK_ADDRESS;
      default: return null;
    }
  };

  const buyToken = async (data) => {
    const { usdtAmount, usdtAddress, tokenName, tokenAmount, network, networkId, tokenReceiverAddress, providerUrl } = data;

    // Always switch to the network where USDT exists (Polygon 137) for buying
    if (networkId) await switchNetwork(networkId);

    if (isNaN(usdtAmount) || isNaN(tokenAmount)) {
      console.error("Invalid input: usdtAmount or tokenAmount is not a number");
      return;
    }

    let weiUSDTValue = (Number(usdtAmount) * 10 ** 6).toString();
    // Assuming all tokens (AUKA, ORIGEN, USDK) have 18 decimals
    let weiTokenValue = (Number(tokenAmount) * 10 ** 18).toString();

    let ERC20_ABI = require("@config/abi/erc20.json");
    let provider = await detectEthereumProvider();

    if (provider) {
      const web3Provider = new Web3(window.ethereum);
      let USDTContract = new web3Provider.eth.Contract(
        ERC20_ABI,
        usdtAddress
      );

      // Sending USDT to Treasury
      USDTContract.methods
        .transfer(USDT_RECEIVER_ADDRESS, weiUSDTValue)
        .send({ from: walletAddress[0], type: '0x0' })
        .on("transactionHash", function (hash) {
          console.log("Executing Buy...");
          setTxPending(true);
          setTxHash(hash);
        })
        .on("receipt", function (receipt) {
          console.log("Buy Receipt:", receipt);

          RequestService.post({
            providerUrl,
            network,
            "networkId": String(networkId),
            "buyerAddress": receipt.from,
            "tokenName": tokenName,
            "usdtReceiverAddress": USDT_RECEIVER_ADDRESS,
            "tokenReceiverAddress": tokenReceiverAddress,
            "txHash": receipt.transactionHash,
            "usdtAddress": usdtAddress,
            "usdtAmount": String(usdtAmount),
            "tokenAmount": String(tokenAmount),
            "weiUSDTValue": String(weiUSDTValue),
            "weiTokenValue": String(weiTokenValue),
            "approved": true
          });

          Swal.fire({
            title: `${tokenAmount} $${tokenName} purchase initiated`,
            text: 'Verify your wallet on the OG Network. Tokens may take a few seconds to appear.',
            icon: "success",
            background: '#1E2329',
            color: '#ffffff',
            confirmButtonColor: '#fcd436'
          });

          setTxPending(false);
          // Refresh balances
          getAUKABalance();
        })
        .catch((revertReason) => {
          console.error("ERROR! Transaction reverted: ", revertReason);
          Swal.fire({
            title: "Transaction Failed",
            text: "The transaction was rejected or an error occurred. Please try again.",
            icon: "error",
            background: '#1E2329',
            color: '#ffffff',
            confirmButtonColor: '#fcd436'
          });
          setTxPending(false);
        });
    }
  };

  const sellToken = async (data) => {
    const { usdtAmount, usdtAddress, tokenName, tokenAmount, network, networkId, tokenReceiverAddress, providerUrl } = data;

    // Always switch to Orden Global (8532) for selling (sending tokens back to Treasury)
    // Note: If selling AUKA spans Polygon, logic might differ.
    // Based on legacy code 'transferUSDTfromAUKA' (selling AUKA), it switched to '0x2154' (Orden Global).
    // So all sells happen on Orden Global network.
    await switchNetwork('0x2154');

    let weiUSDTValue = (Number(usdtAmount) * 10 ** 6).toString();
    let weiTokenValue = (Number(tokenAmount) * 10 ** 18).toString();

    let ERC20_ABI = require("@config/abi/erc20.json");
    let provider = await detectEthereumProvider();

    if (provider) {
      const web3Provider = new Web3(window.ethereum);

      const onReceipt = (receipt) => {
        setTxReceipt(receipt);
        console.log('Sell Receipt:', receipt);

        RequestService.postSell({
          providerUrl,
          network,
          "networkId": String(networkId),
          "buyerAddress": receipt.from,
          "tokenName": tokenName,
          "usdtReceiverAddress": USDT_RECEIVER_ADDRESS,
          "tokenReceiverAddress": tokenReceiverAddress, // Address to receive USDT
          "txHash": receipt.transactionHash,
          "usdtAddress": usdtAddress,
          "usdtAmount": String(usdtAmount),
          "tokenAmount": String(tokenAmount),
          "weiUSDTValue": String(weiUSDTValue),
          "weiTokenValue": String(weiTokenValue),
          "approved": true
        }).then(response => {
          console.log('PostSell Response:', response);
          Swal.fire({
            title: `$${usdtAmount} USDT sent to`,
            text: tokenReceiverAddress,
            icon: "success",
            background: '#1E2329',
            color: '#ffffff',
            confirmButtonColor: '#fcd436'
          });
          setTxPending(false);
        }).catch(error => {
          console.error('PostSell Error:', error);
          setTxPending(false);
        });
      };

      const updateTxStatus = (hash) => {
        console.log("Executing Sell...");
        setTxPending(true);
        setTxHash(hash);
      };

      const handleError = (error) => {
        console.error("Transaction error:", error);
        Swal.fire({
          title: "Transaction Failed",
          text: error.message || "An error occurred.",
          icon: "error",
          background: '#1E2329',
          color: '#ffffff',
          confirmButtonColor: '#fcd436'
        });
        setTxPending(false);
      };

      try {
        if (tokenName === 'ORIGEN') {
          // Native Token Transfer
          const transactionParameters = {
            to: TOKEN_RECEIVER_ADDRESS,
            from: walletAddress[0],
            value: weiTokenValue,
          };

          await web3Provider.eth.sendTransaction(transactionParameters)
            .on("transactionHash", updateTxStatus)
            .on("receipt", onReceipt)
            .on("error", handleError);

        } else {
          // ERC20 Token Transfer (AUKA, USDK)
          const tokenAddr = getTokenAddress(tokenName);
          if (!tokenAddr) {
            throw new Error(`Address for token ${tokenName} not found`);
          }

          let TokenContract = new web3Provider.eth.Contract(ERC20_ABI, tokenAddr);

          TokenContract.methods
            .transfer(TOKEN_RECEIVER_ADDRESS, weiTokenValue)
            .send({ from: walletAddress[0] }) // Let MetaMask estimate gas
            .on("transactionHash", updateTxStatus)
            .on("receipt", onReceipt)
            .on("error", handleError); // Catch contract errors
        }
      } catch (error) {
        handleError(error);
      }
    } else {
      console.error("No Ethereum provider detected");
    }
  };

  // ... useEffect for txReceipt if needed, but we handled it in callback ...

  let sharedState = {
    connectWallet,
    currentChainId,
    setCurrentChainId,
    walletAddress,
    accounts,
    ondkBalance,
    coffeeContract,
    web3,
    buyToken, // Generic Buy
    sellToken, // Generic Sell
    network,
    aukaWalletBalance, origenWalletBalance, usdtWalletBalance,
    OGbalanceORIGEN,
    OGUSDTBalance,
    usdkWalletBalance,
    OGbalanceUSDK,
    txPending,
    txHash,
    switchNetwork
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