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

  const [txPending, setTxPending] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [txReceipt, setTxReceipt] = useState(null);

  const AUKA_ADDRESS = "0x6Facc8Df79cEDc6C5065442ce27e915Aa3a26B9B"

  const USDK_ADDRESS = "0xAEaB7Fa98c972e0746471d57F7b5b3538B0aF716";
  const [usdkWalletBalance, setUsdkWalletBalance] = useState(0);
  const [OGbalanceUSDK, setOGbalanceUSDK] = useState(0);

  const [treasuryUsdtBalance, setTreasuryUsdtBalance] = useState(0);

  // ... (previous state variables)

  // Fetch Treasury USDT Balance (Polygon)
  const fetchTreasuryBalance = async () => {
    try {
      const web3Polygon = new Web3("https://polygon-rpc.com/");
      const USDT_CONTRACT_ADDR = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F"; // Polygon USDT
      const ERC20_ABI = require("@config/abi/erc20.json");

      const contract = new web3Polygon.eth.Contract(ERC20_ABI, USDT_CONTRACT_ADDR);
      // Assuming USDT_RECEIVER_ADDRESS is the Treasury
      const rawBalance = await contract.methods.balanceOf(USDT_RECEIVER_ADDRESS).call();
      const formatted = web3Polygon.utils.fromWei(rawBalance, 'mwei'); // USDT has 6 decimals

      setTreasuryUsdtBalance(parseFloat(formatted));
      console.log("Treasury Balance:", formatted);
    } catch (e) {
      console.error("Error fetching treasury balance:", e);
    }
  };

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

      // Also fetch Treasury Balance (New Logic)
      fetchTreasuryBalance();

    } catch (error) {
      console.error("connectWallet error:", error);
    }
  };

  // ... (existing code)


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
        // window.location.reload(); // RAM: Disabled as per user request to prevent full app reload
      };

      // --- Account change listener ---
      const handleAccountsChanged = (accounts) => {
        console.log("Account changed to:", accounts[0]);
        if (accounts.length > 0) {
          // Prevent infinite loop if account is same
          // if (walletAddress && accounts[0].toLowerCase() === walletAddress[0]?.toLowerCase()) return; 

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

  // Efecto 3: Prevenir recarga/cierre de página durante transacciones pendientes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (txPending) {
        e.preventDefault();
        // Chrome requiere que returnValue sea asignado
        e.returnValue = '¿Estás seguro? Tienes una transacción pendiente que se perderá si sales de esta página.';
        return e.returnValue;
      }
    };

    if (txPending) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [txPending]);



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

    // Fix floating point issues by ensuring integer string
    let weiUSDTValue = Math.floor(Number(usdtAmount) * 10 ** 6).toString();
    // Assuming all tokens (AUKA, ORIGEN, USDK) have 18 decimals
    let weiTokenValue = (Number(tokenAmount) * 10 ** 18).toString(); // Only for backend record

    let ERC20_ABI = require("@config/abi/erc20.json");
    let provider = await detectEthereumProvider();

    if (provider) {
      const web3Provider = new Web3(window.ethereum);
      let USDTContract = new web3Provider.eth.Contract(
        ERC20_ABI,
        usdtAddress
      );

      // Estimate gas to avoid "out of gas" or "likely to fail" errors
      let estimatedGas;
      let gasPrice;
      try {
        gasPrice = await web3Provider.eth.getGasPrice();
        estimatedGas = await USDTContract.methods.transfer(USDT_RECEIVER_ADDRESS, weiUSDTValue).estimateGas({
          from: walletAddress[0],
          value: '0x0'
        });
        // Add 20% buffer
        estimatedGas = Math.floor(Number(estimatedGas) * 1.2).toString();
      } catch (e) {
        console.warn("Gas estimation failed, using default", e);
        estimatedGas = '200000'; // Increased safe default
        // If gasPrice fetch failed, let provider decide
        gasPrice = undefined;
      }

      // Sending USDT to Treasury
      const txParams = {
        from: walletAddress[0],
        type: '0x0',
        gas: estimatedGas
      };
      if (gasPrice) txParams.gasPrice = gasPrice;

      USDTContract.methods
        .transfer(USDT_RECEIVER_ADDRESS, weiUSDTValue)
        .send(txParams)
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
          connectWallet();
        })
        .catch((revertReason) => {
          console.error("Transaction Error:", revertReason);
          let title = "Transaction Failed";
          let msg = "An error occurred during the transaction. Please try again.";

          // Check for common errors
          const errorString = String(revertReason).toLowerCase();
          if (errorString.includes("insufficient funds") || errorString.includes("gas required exceeds allowance")) {
            title = "Insufficient Funds (Gas)";
            msg = "You do not have enough POL/MATIC to pay for the gas fees. Please deposit POL and try again.";
          } else if (errorString.includes("user denied") || errorString.includes("rejected")) {
            title = "Transaction Rejected";
            msg = "You rejected the transaction in MetaMask.";
          }

          Swal.fire({
            title: title,
            text: msg,
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
    try {
      // Check current chain before switching to avoid unnecessary modal
      const currentChain = window.ethereum.chainId; // Hex string e.g. 0x2154
      if (currentChain !== '0x2154') {
        console.log(`Switching from ${currentChain} to 0x2154...`);
        await switchNetwork('0x2154');
      }
    } catch (e) {
      console.error("Failed to switch to Orden Global", e);
      Swal.fire({
        title: "Network Switch Failed",
        text: "Please manually switch to Orden Global network in your wallet.",
        icon: "error",
        background: '#1E2329',
        color: '#ffffff',
        confirmButtonColor: '#fcd436'
      });
      return;
    }

    let web3Temp = new Web3(); // For utils
    let weiUSDTValue = Math.floor(Number(usdtAmount) * 10 ** 6).toString();
    // Use toWei for accurate token amount (handles 18 decimals correctly)
    let weiTokenValue = web3Temp.utils.toWei(String(tokenAmount), 'ether');

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
          // Refresh balances after successful DB update
          connectWallet();
        }).catch(error => {
          console.error('PostSell Error:', error);
          setTxPending(false);
          // Even if backend fails, on-chain tx succeeded, so refresh balances
          connectWallet();
        });
      };

      const updateTxStatus = (hash) => {
        console.log("Executing Sell...");
        setTxPending(true);
        setTxHash(hash);
      };

      const handleError = (error) => {
        console.error("Transaction error:", error);
        // Extract inner message if available
        const msg = error.message || "An error occurred.";

        Swal.fire({
          title: "Transaction Failed",
          text: msg.includes('Internal JSON-RPC error') ? 'Network error (RPC). Try increasing gas price manually in MetaMask.' : msg,
          icon: "error",
          background: '#1E2329',
          color: '#ffffff',
          confirmButtonColor: '#fcd436'
        });
        setTxPending(false);
      };

      try {
        // Fetch Gas Price
        let gasPrice = await web3Provider.eth.getGasPrice();
        console.log("Fetched Gas Price (wei):", gasPrice);

        // Ensure gasPrice is at least 10 Gwei for Orden Global (sometimes needed)
        const minGasPrice = web3Temp.utils.toWei('10', 'gwei');
        if (BigInt(gasPrice) < BigInt(minGasPrice)) {
          console.log("Gas price too low, boosting to 10 Gwei");
          gasPrice = minGasPrice;
        }

        if (tokenName === 'ORIGEN') {
          // Native Token Transfer
          const transactionParameters = {
            to: TOKEN_RECEIVER_ADDRESS,
            from: walletAddress[0],
            value: weiTokenValue,
            type: '0x0', // Force legacy transaction for Orden Global
            gasPrice: gasPrice,
            gas: '21000' // Fixed gas for native transfer
          };

          console.log("Sending ORIGEN (Native):", transactionParameters);

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

          // Estimate gas to avoid "out of gas" or "gas limit" errors
          let estimatedGas;
          try {
            estimatedGas = await TokenContract.methods.transfer(TOKEN_RECEIVER_ADDRESS, weiTokenValue).estimateGas({
              from: walletAddress[0],
            });
            console.log("Estimated Gas:", estimatedGas);
            // Add 30% buffer
            estimatedGas = Math.floor(Number(estimatedGas) * 1.3).toString();
          } catch (e) {
            console.warn("Gas estimation failed, using safe default", e);
            estimatedGas = '300000'; // Increased safe default
          }

          const txParams = {
            from: walletAddress[0],
            type: '0x0', // Force legacy transaction for Orden Global
            gasPrice: gasPrice,
            gas: estimatedGas
          };
          console.log("Sending ERC20 (Params):", txParams);

          TokenContract.methods
            .transfer(TOKEN_RECEIVER_ADDRESS, weiTokenValue)
            .send(txParams)
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
    txReceipt,
    switchNetwork,
    treasuryUsdtBalance
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