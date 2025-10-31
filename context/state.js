import { createContext, useContext, useEffect, useState } from "react";
import getBlockchain from "./ethereum.js";
import getWalletBalances from './getWalletBalances.js'
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
  const [aukaWalletBalance, setAukaWalletBalance] = useState(0);
  const [usdtWalletBalance, setusdtWalletBalance] = useState(0);
  const [origenWalletBalance, setOrigenWalletBalance] = useState(0);
  const [currentChainId, setCurrentChainId] = useState(0)
  const [OGbalanceORIGEN, setOGbalanceORIGEN] = useState(0);
  const [OGUSDTBalance, setOGUSDTBalance] = useState(0);
  const network = 137;
  const USDT_ADDRESS = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F"
  const USDT_RECEIVER_ADDRESS = "0xf4435beb6daf20265d39284ad2501808c0af6c1d"
  const TOKEN_RECEIVER_ADDRESS = "0xf209ff2a16fa367161e455f3b7f90e067eddafa9"

  const AUKA_ADDRESS = "0x6Facc8Df79cEDc6C5065442ce27e915Aa3a26B9B"

  const USDK_ADDRESS = "0xAEaB7Fa98c972e0746471d57F7b5b3538B0aF716";
  const [usdkWalletBalance, setUsdkWalletBalance] = useState(0);
  const [OGbalanceUSDK, setOGbalanceUSDK] = useState(0);

  const connectWallet = async () => {
    // Tu lógica actual para conectar está bien
    const {
      currentChainId,
      accounts,
      WMATIC_ADDRESS,
      web3Provider,
    } = await getBlockchain();

    // Asumo que getWalletBalances depende de que la conexión ya esté hecha
    const {
      balanceUSDT,
      balanceORIGEN,
      balanceAUKA,
      OGbalanceORIGEN,
      OGUSDTBalance,
      balanceUSDK,
      OGbalanceUSDK,
    } = await getWalletBalances();
    setOGUSDTBalance(OGUSDTBalance)
    setOGbalanceORIGEN(OGbalanceORIGEN)
    setOrigenWalletBalance(balanceORIGEN);
    setusdtWalletBalance(balanceUSDT);
    setAukaWalletBalance(balanceAUKA);
    setUsdkWalletBalance(balanceUSDK);
    // setCoffeeContract(coffeeContract); // Asegúrate que esta variable esté definida
    setCurrentChainId(currentChainId);
    setWalletAddress(accounts);
    setWMATIC_ADDRESS(WMATIC_ADDRESS);
    setWeb3(web3Provider);
    setAccounts(accounts);
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
      // --- Listener para el cambio de red ---
      const handleChainChanged = (chainId) => {
        console.log("Red cambiada a:", chainId);
        setCurrentChainId(chainId)
        // Recargar la página es la forma más segura de asegurar que el estado de la DApp se reinicie correctamente.

      };

      // --- Listener para el cambio de cuenta ---
      const handleAccountsChanged = (accounts) => {
        console.log("Cuenta cambiada a:", accounts[0]);
        if (accounts.length > 0) {
          // Si el usuario cambia de cuenta, vuelve a conectar para actualizar los saldos y datos.
          connectWallet();
        } else {
          // El usuario se ha desconectado
          // Aquí deberías limpiar el estado de la billetera.
          setWalletAddress([]);
          setAccounts([]);
          // ...etc
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


  const getAUKABalance = async () => {
    let ERC20_ABI = require("@config/abi/erc20.json");
    let provider = await detectEthereumProvider();
    if (provider) {
      const web3Provider = new Web3(window.ethereum);
      let AUKAContract = new web3Provider.eth.Contract(
        ERC20_ABI,
        AUKA_ADDRESS
      );
      const aukaWalletBalance = await AUKAContract.methods.balanceOf('0x8E839Af7A405f49bf72B239929b8ee3c07Ee7ba0').call()
      setAukaWalletBalance(Number(aukaWalletBalance) / 10 ** 18)
      const resultApprove = await AUKAContract.methods.balanceOf(walletAddress[0]).call()
      let finalBalance = resultApprove / 10 ** 18
      setOndkBalance(finalBalance)

    }
  }
  useEffect(() => {
    if (walletAddress && walletAddress.length > 0) {
      // Ahora solo se llama cuando la wallet se conecta
      getAUKABalance();
    }
  }, [walletAddress]);
  const transferAUKA = async (data) => {
    const { usdtAmount, usdtAddress, tokenName, tokenAmount, network, networkId, tokenReceiverAddress, providerUrl } = data
    if (isNaN(usdtAmount) || isNaN(tokenAmount)) {
      console.error("Invalid input: usdtAmount or tokenAmount is not a number");
      return;
    }

    let weiUSDTValue = (usdtAmount * 10 ** 6);
    let weiAUKAValue = (tokenAmount * 10 ** 18);

    // console.log("USDT Value (in wei):", weiUSDTValue);
    // console.log("Token Value (in wei):", weiAUKAValue);

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
            "usdtAddress": USDT_ADDRESS,
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
  const buyORIGEN = async (data) => {
    const { usdtAmount, usdtAddress, tokenName, tokenAmount, network, networkId, tokenReceiverAddress, providerUrl } = data
    let weiUSDTValue = (usdtAmount * 10 ** 6).toString()
    let weiORIGENValue = (tokenAmount * 10 ** 18).toString()
    console.log(usdtAddress, walletAddress[0], USDT_RECEIVER_ADDRESS)
    let ERC20_ABI = require("@config/abi/erc20.json");
    let provider = await detectEthereumProvider();
    if (provider) {
      const web3Provider = new Web3(window.ethereum);
      let USDTContract = new web3Provider.eth.Contract(
        ERC20_ABI,
        usdtAddress
      );
      const resultApprove = await USDTContract.methods
        .transfer(USDT_RECEIVER_ADDRESS, weiUSDTValue)
        .send({ from: walletAddress[0] })
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
            "usdtAddress": USDT_ADDRESS,
            "usdtAmount": String(usdtAmount),
            "tokenAmount": String(tokenAmount),
            "weiUSDTValue": String(weiUSDTValue),
            "weiTokenValue": String(weiORIGENValue),
            "approved": true
          })
          Swal.fire({
            title: `${tokenAmount} $ORIGEN sent`,
            text: 'Verify your wallet on the OG Network. Tokens may take a few seconds to appear.',
            icon: "success"
          });

        })
        .catch((revertReason) => {
          console.error("ERROR! Transaction reverted: ", revertReason);
          Swal.fire({
            title: "Transacción Fallida",
            text: "La transacción fue rechazada o ha ocurrido un error. Por favor, inténtalo de nuevo.",
            icon: "error"
          });
        });
    }
  }

  const transferUSDTfromAUKA = async (data) => {
    const { usdtAmount, usdtAddress, tokenName, tokenAmount, network, networkId, tokenReceiverAddress, providerUrl } = data
    let weiUSDTValue = (usdtAmount * 10 ** 6).toString()
    let weiAUKAValue = (tokenAmount * 10 ** 18).toString()
    // console.log(weiAUKAValue)
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

          RequestService.postSell({
            providerUrl,
            network,
            "networkId": String(networkId),
            "buyerAddress": receipt.from,
            "tokenName": tokenName,
            "usdtReceiverAddress": USDT_RECEIVER_ADDRESS,
            "tokenReceiverAddress": tokenReceiverAddress,
            "txHash": receipt.transactionHash,
            "usdtAddress": USDT_ADDRESS,
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

  const [txReceipt, setTxReceipt] = useState('')
  const sellOrigen = async (data) => {
    const { usdtAmount, usdtAddress, tokenName, tokenAmount, network, networkId, tokenReceiverAddress, providerUrl } = data;
    let weiUSDTValue = (usdtAmount * 10 ** 6).toString();
    let weiORIGENValue = (tokenAmount * 10 ** 18).toString();

    let ERC20_ABI = require("@config/abi/erc20.json");
    let provider = await detectEthereumProvider();

    if (provider) {
      const web3Provider = new Web3(window.ethereum);

      const transactionParameters = {
        to: TOKEN_RECEIVER_ADDRESS, // Dirección del receptor
        from: walletAddress[0], // Dirección del remitente
        value: weiORIGENValue, // Valor en wei
      };

      console.log("transactionParameters:", transactionParameters);

      try {
        let tx = await web3Provider.eth.sendTransaction(transactionParameters)
          .on("transactionHash", function (hash) {
            console.log("Executing...");
            console.log("Transaction hash:", hash);
          })
          .on("receipt", function (receipt) {
            setTxReceipt(receipt);
            // Agregar console.log antes de la llamada a postSell
            console.log('Datos para postSell:', {
              providerUrl,
              network,
              networkId: String(networkId),
              buyerAddress: receipt.from,
              tokenName: tokenName,
              usdtReceiverAddress: TOKEN_RECEIVER_ADDRESS,
              tokenReceiverAddress: tokenReceiverAddress,
              txHash: receipt.transactionHash,
              usdtAddress: USDT_ADDRESS,
              usdtAmount: String(usdtAmount),
              tokenAmount: String(tokenAmount),
              weiUSDTValue: String(weiUSDTValue),
              weiTokenValue: String(weiORIGENValue),
              approved: true
            });

            RequestService.postSell({
              providerUrl,
              network,
              networkId: String(networkId),
              buyerAddress: receipt.from,
              tokenName: tokenName,
              usdtReceiverAddress: TOKEN_RECEIVER_ADDRESS,
              tokenReceiverAddress: tokenReceiverAddress[0],
              txHash: receipt.transactionHash,
              usdtAddress: USDT_ADDRESS,
              usdtAmount: String(usdtAmount),
              tokenAmount: String(tokenAmount),
              weiUSDTValue: String(weiUSDTValue),
              weiTokenValue: String(weiORIGENValue),
              approved: true
            }).then(response => {
              // Agregar console.log después de la respuesta de postSell
              console.log('Respuesta de postSell:', response);

              Swal.fire({
                title: `$${usdtAmount} USDT sent to`,
                text: tokenReceiverAddress,
                icon: "success"
              });
            }).catch(error => {
              // Capturar cualquier error en postSell
              console.error('Error en postSell:', error);
            });


          })
          .on("error", function (error) {
            console.error("Transaction error:", error);
          });
      } catch (error) {
        console.error("Transaction failed:", error);
      }
    } else {
      console.error("No Ethereum provider detected");
    }
  };

  const buyUSDK = async (data) => {
    const { usdtAmount, usdtAddress, tokenName, tokenAmount, network, networkId, tokenReceiverAddress, providerUrl } = data
    let weiUSDTValue = (usdtAmount * 10 ** 6).toString()
    let weiUSDKValue = (tokenAmount * 10 ** 18).toString() // USDK usa 18 decimales
    console.log(usdtAddress, walletAddress[0], USDT_RECEIVER_ADDRESS)
    let ERC20_ABI = require("@config/abi/erc20.json");
    let provider = await detectEthereumProvider();
    if (provider) {
      const web3Provider = new Web3(window.ethereum);
      let USDTContract = new web3Provider.eth.Contract(
        ERC20_ABI,
        usdtAddress
      );
      const resultApprove = await USDTContract.methods
        .transfer(USDT_RECEIVER_ADDRESS, weiUSDTValue)
        .send({ from: walletAddress[0] })
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
            "tokenName": tokenName, // Será "USDK"
            "usdtReceiverAddress": USDT_RECEIVER_ADDRESS,
            "tokenReceiverAddress": tokenReceiverAddress,
            "txHash": receipt.transactionHash,
            "usdtAddress": USDT_ADDRESS,
            "usdtAmount": String(usdtAmount),
            "tokenAmount": String(tokenAmount),
            "weiUSDTValue": String(weiUSDTValue),
            "weiTokenValue": String(weiUSDKValue), // Valor en Wei de USDK
            "approved": true
          })
          Swal.fire({
            title: `${tokenAmount} $USDK sent`, // Mensaje actualizado
            text: 'Verify your wallet on the OG Network. Tokens may take a few seconds to appear.',
            icon: "success"
          });

        })
        .catch((revertReason) => {
          console.error("ERROR! Transaction reverted: ", revertReason);
          Swal.fire({
            title: "Transacción Fallida",
            text: "La transacción fue rechazada o ha ocurrido un error. Por favor, inténtalo de nuevo.",
            icon: "error"
          });
        });
    }
  }
  const sellUSDK = async (data) => {
    const { usdtAmount, usdtAddress, tokenName, tokenAmount, network, networkId, tokenReceiverAddress, providerUrl } = data;
    let weiUSDTValue = (usdtAmount * 10 ** 6).toString();
    let weiUSDKValue = (tokenAmount * 10 ** 18).toString(); // USDK 18 decimales

    let ERC20_ABI = require("@config/abi/erc20.json");
    let provider = await detectEthereumProvider();
    if (provider) {
      const web3Provider = new Web3(window.ethereum);
      // --- MODIFICACIÓN: Usar Contrato USDK ---
      let USDKContract = new web3Provider.eth.Contract(
        ERC20_ABI,
        USDK_ADDRESS // Usar la nueva dirección
      );
      const resultApprove = await USDKContract.methods
        .transfer(TOKEN_RECEIVER_ADDRESS, weiUSDKValue) // Enviar weiUSDKValue
        .send({ from: walletAddress[0] }) // Dejar que MetaMask estime el gas
        .on("transactionHash", function (hash) {
          console.log("Executing...");
        })
        .on("receipt", function (receipt) {

          RequestService.postSell({
            providerUrl,
            network,
            "networkId": String(networkId),
            "buyerAddress": receipt.from,
            "tokenName": tokenName, // Será "USDK"
            "usdtReceiverAddress": USDT_RECEIVER_ADDRESS,
            "tokenReceiverAddress": tokenReceiverAddress,
            "txHash": receipt.transactionHash,
            "usdtAddress": USDT_ADDRESS,
            "usdtAmount": String(usdtAmount),
            "tokenAmount": String(tokenAmount),
            "weiUSDTValue": String(weiUSDTValue),
            "weiTokenValue": String(weiUSDKValue), // Valor en Wei de USDK
            "approved": true
          });
          Swal.fire({
            title: `${tokenAmount} $USDK sent to`, // Mensaje actualizado
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

  useEffect(() => {

    //  // Agregar console.log antes de la llamada a postSell
    //  console.log('Datos para postSell:', {
    //   providerUrl,
    //   network,
    //   networkId: String(networkId),
    //   buyerAddress: receipt.from,
    //   tokenName: tokenName,
    //   usdtReceiverAddress: TOKEN_RECEIVER_ADDRESS,
    //   tokenReceiverAddress: tokenReceiverAddress,
    //   txHash: receipt.transactionHash,
    //   usdtAddress: USDT_ADDRESS,
    //   usdtAmount: String(usdtAmount),
    //   tokenAmount: String(tokenAmount),
    //   weiUSDTValue: String(weiUSDTValue),
    //   weiTokenValue: String(weiORIGENValue),
    //   approved: true
    // });

    // RequestService.postSell({
    //   providerUrl,
    //   network,
    //   networkId: String(networkId),
    //   buyerAddress: receipt.from,
    //   tokenName: tokenName,
    //   usdtReceiverAddress: TOKEN_RECEIVER_ADDRESS,
    //   tokenReceiverAddress: tokenReceiverAddress,
    //   txHash: receipt.transactionHash,
    //   usdtAddress: USDT_ADDRESS,
    //   usdtAmount: String(usdtAmount),
    //   tokenAmount: String(tokenAmount),
    //   weiUSDTValue: String(weiUSDTValue),
    //   weiTokenValue: String(weiORIGENValue),
    //   approved: true
    // }).then(response => {
    //   // Agregar console.log después de la respuesta de postSell
    //   console.log('Respuesta de postSell:', response);

    //   Swal.fire({
    //     title: `${tokenAmount} $ORIGEN sent to`,
    //     text: tokenReceiverAddress,
    //     icon: "success"
    //   });
    // }).catch(error => {
    //   // Capturar cualquier error en postSell
    //   console.error('Error en postSell:', error);
    // });

  }, [txReceipt]);

  let sharedState = {
    connectWallet,
    currentChainId,
    setCurrentChainId,
    walletAddress,
    accounts,
    ondkBalance,
    coffeeContract,
    web3,
    transferAUKA,
    buyORIGEN,
    network,
    transferUSDTfromAUKA,
    sellOrigen, aukaWalletBalance, origenWalletBalance, usdtWalletBalance,
    OGbalanceORIGEN,
    OGUSDTBalance,
    usdkWalletBalance,
    OGbalanceUSDK,
    buyUSDK,
    sellUSDK,

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