import { createContext, useContext, useEffect, useRef, useState } from "react";
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

  // Ref to remember last selected payment network (prevents MetaMask events from overwriting)
  const lastPreferredChainIdRef = useRef('137');

  const [treasuryUsdtBalance, setTreasuryUsdtBalance] = useState(0);

  // ... (previous state variables)

  // Fetch Treasury USDT Balance on the selected payout network
  const fetchTreasuryBalance = async (networkId = '137') => {
    // Immediately reset to 0 to block sell button while fetching
    setTreasuryUsdtBalance(0);
    try {
      const RPC_URLS = {
        '137': 'https://polygon-rpc.com/',
        '56': 'https://bsc-dataseed.binance.org',
        '1': 'https://eth.llamarpc.com'
      };
      const USDT_CONTRACTS = {
        '137': '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
        '56': '0x55d398326f99059fF775485246999027B3197955',
        '1': '0xdAC17F958D2ee523a2206206994597C13D831ec7'
      };

      const rpc = RPC_URLS[networkId] || RPC_URLS['137'];
      const usdtAddr = USDT_CONTRACTS[networkId] || USDT_CONTRACTS['137'];

      const web3Net = new Web3(rpc);
      const DECIMALS_ABI = [
        { "constant": true, "inputs": [], "name": "decimals", "outputs": [{ "name": "", "type": "uint8" }], "type": "function" },
        { "constant": true, "inputs": [{ "name": "_owner", "type": "address" }], "name": "balanceOf", "outputs": [{ "name": "balance", "type": "uint256" }], "type": "function" }
      ];

      const contract = new web3Net.eth.Contract(DECIMALS_ABI, usdtAddr);
      const rawBalance = await contract.methods.balanceOf(USDT_RECEIVER_ADDRESS).call();

      // Query actual decimals to format correctly
      let decimals = 6;
      try {
        decimals = Number(await contract.methods.decimals().call());
      } catch (e) { /* fallback 6 */ }

      // Convert raw balance to human-readable
      const formatted = decimals === 18
        ? web3Net.utils.fromWei(rawBalance, 'ether')
        : web3Net.utils.fromWei(rawBalance, 'mwei'); // 6 decimals

      setTreasuryUsdtBalance(parseFloat(formatted));
      console.log(`Treasury USDT Balance on ${networkId}: ${formatted}`);
    } catch (e) {
      console.error("Error fetching treasury balance:", e);
      setTreasuryUsdtBalance(0);
    }
  };

  const connectWallet = async (preferredChainId = null, usdtPayoutNetworkId = null) => {
    try {
      const {
        currentChainId,
        accounts,
        WMATIC_ADDRESS,
        web3Provider,
      } = await getBlockchain();

      // Remember the preferred chain so MetaMask events use it
      if (preferredChainId) {
        lastPreferredChainIdRef.current = preferredChainId;
      }
      const targetChainId = preferredChainId || lastPreferredChainIdRef.current || currentChainId;

      const {
        balanceUSDT,
        balanceORIGEN,
        balanceAUKA,
        userAUKA,
        OGbalanceORIGEN,
        OGUSDTBalance,
        balanceUSDK,
        OGbalanceUSDK,
      } = await getWalletBalances(targetChainId, accounts[0], usdtPayoutNetworkId);

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

      // Treasury balance is fetched by useEffect in index.tsx based on paymentNetworkId
      // Do NOT call fetchTreasuryBalance here — connectWallet is called from MetaMask
      // event listeners without the payout network context, which would overwrite the balance.

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

    // Switch to the network where USDT exists (Polygon 137, BSC 56, ETH 1)
    if (networkId) {
      try {
        await switchNetwork(networkId);
      } catch (e) {
        console.error("Switch network failed", e);
        Swal.fire({
          title: "Network Switch Failed",
          text: "Please manually switch to the correct network in your wallet.",
          icon: "error",
          background: '#1E2329',
          color: '#ffffff',
          confirmButtonColor: '#fcd436'
        });
        return;
      }
    }

    if (isNaN(usdtAmount) || isNaN(tokenAmount)) {
      console.error("Invalid input: usdtAmount or tokenAmount is not a number");
      return;
    }

    let web3Temp = new Web3(); // For utility functions
    // Tokens have 18 decimals — use toWei for precision
    let weiTokenValue = web3Temp.utils.toWei(String(tokenAmount), 'ether');

    // ABI with transfer (no outputs — safe for ETH USDT) + decimals (to query actual decimals)
    const SAFE_USDT_ABI = [
      {
        "constant": false,
        "inputs": [
          { "name": "_to", "type": "address" },
          { "name": "_value", "type": "uint256" }
        ],
        "name": "transfer",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "decimals",
        "outputs": [{ "name": "", "type": "uint8" }],
        "stateMutability": "view",
        "type": "function"
      }
    ];

    let provider = await detectEthereumProvider();

    if (provider) {
      const web3Provider = new Web3(window.ethereum);
      let USDTContract = new web3Provider.eth.Contract(SAFE_USDT_ABI, usdtAddress);

      // Query actual decimals from the contract (6 on Polygon/ETH, 18 on BSC)
      let tokenDecimals = 6; // fallback
      try {
        tokenDecimals = Number(await USDTContract.methods.decimals().call());
        console.log(`USDT decimals on this network: ${tokenDecimals}`);
      } catch (e) {
        console.warn("Could not query decimals(), defaulting to 6", e);
      }

      // Calculate the raw amount using the actual decimals
      let weiUSDTValue;
      if (tokenDecimals <= 15) {
        weiUSDTValue = Math.floor(Number(usdtAmount) * 10 ** tokenDecimals).toString();
      } else {
        // For 18+ decimals, use BigInt to avoid JS floating point issues
        weiUSDTValue = (BigInt(Math.floor(Number(usdtAmount) * 10 ** 6)) * BigInt(10 ** (tokenDecimals - 6))).toString();
      }
      console.log(`weiUSDTValue: ${weiUSDTValue} (${tokenDecimals} decimals)`);


      // --- Gas Price with per-network minimums ---
      let gasPrice;
      try {
        gasPrice = await web3Provider.eth.getGasPrice();
        console.log("Fetched Gas Price (wei):", gasPrice);

        const chainId = await web3Provider.eth.getChainId();
        console.log("Current Chain ID:", chainId);

        // BSC needs >= 3 Gwei
        if (String(chainId) === '56') {
          const minGas = web3Temp.utils.toWei('3', 'gwei');
          if (BigInt(gasPrice) < BigInt(minGas)) {
            console.log("Boosting BSC gas to 3 Gwei");
            gasPrice = minGas;
          }
        }
        // Polygon needs >= 30 Gwei
        else if (String(chainId) === '137') {
          const minGas = web3Temp.utils.toWei('30', 'gwei');
          if (BigInt(gasPrice) < BigInt(minGas)) {
            console.log("Boosting Polygon gas to 30 Gwei");
            gasPrice = minGas;
          }
        }
        // Ethereum: dynamic pricing, no minimum needed
      } catch (e) {
        console.warn("Gas price fetch failed, letting provider decide", e);
        gasPrice = undefined;
      }

      // --- Gas Estimation ---
      let estimatedGas;
      try {
        estimatedGas = await USDTContract.methods.transfer(USDT_RECEIVER_ADDRESS, weiUSDTValue).estimateGas({
          from: walletAddress[0]
        });
        // Add 20% buffer
        estimatedGas = Math.floor(Number(estimatedGas) * 1.2).toString();
        console.log("Estimated Gas:", estimatedGas);
      } catch (e) {
        console.warn("Gas estimation failed, using safe default:", e);
        estimatedGas = '100000';
      }

      // --- Build tx params ---
      const txParams = {
        from: walletAddress[0],
        type: '0x0', // Legacy tx type (works on all networks)
        gas: estimatedGas
      };
      if (gasPrice) txParams.gasPrice = gasPrice;

      console.log("Sending Buy TX:", { to: USDT_RECEIVER_ADDRESS, value: weiUSDTValue, ...txParams });

      // --- Send Transaction ---
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
          connectWallet();
        })
        .on("error", function (error) {
          console.error("Buy Transaction Error:", error);
          const errorString = String(error.message || error).toLowerCase();

          let title = "Transaction Failed";
          let msg = "An error occurred during the transaction. Please try again.";

          if (errorString.includes("insufficient funds") || errorString.includes("gas required exceeds")) {
            title = "Insufficient Funds";
            msg = "You do not have enough native tokens to pay gas fees.";
          } else if (errorString.includes("user denied") || errorString.includes("rejected")) {
            title = "Transaction Rejected";
            msg = "You rejected the transaction in MetaMask.";
          } else if (errorString.includes("internal json-rpc")) {
            title = "Network Error";
            msg = "RPC error. Try increasing gas price manually in MetaMask.";
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
          connectWallet();
        });
    } else {
      console.error("No Ethereum provider detected");
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
    treasuryUsdtBalance,
    fetchTreasuryBalance
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