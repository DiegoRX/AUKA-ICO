import detectEthereumProvider from "@metamask/detect-provider";
// import COFFEE_ABI from "@config/abi/Coffee.json";
import Web3 from "web3";

const POLYGON_PARAMS = {
  chainId: "0x89", // 137 en decimal
  chainName: "Polygon Mainnet",
  nativeCurrency: {
    name: "MATIC",
    symbol: "MATIC",
    decimals: 18,
  },
  rpcUrls: ["https://polygon-rpc.com/"],
  blockExplorerUrls: ["https://polygonscan.com/"],
};

const getBlockchain = () =>
  new Promise(async (resolve, reject) => {
    const provider = await detectEthereumProvider();

    if (!provider) {
      alert("Please install MetaMask.");
      return reject("MetaMask not detected.");
    }

    try {
      // Solicita acceso a las cuentas
      const accounts = await provider.request({
        method: "eth_requestAccounts",
      });

      // Verifica y cambia la red a BNB Smart Chain si es necesario
      const currentChainId = await provider.request({ method: "eth_chainId" });
      // if (currentChainId !== POLYGON_PARAMS.chainId) {
      //   try {
      //     await provider.request({
      //       method: "wallet_switchEthereumChain",
      //       params: [{ chainId: POLYGON_PARAMS.chainId }],
      //     });
      //   } catch (switchError) {
      //     // Si la red no está agregada, intenta agregarla
      //     if (switchError.code === 4902) {
      //       try {
      //         await provider.request({
      //           method: "wallet_addEthereumChain",
      //           params: [POLYGON_PARAMS],
      //         });
      //       } catch (addError) {
      //         return reject("Failed to add BSC network to MetaMask.");
      //       }
      //     } else {
      //       return reject("Failed to switch to BSC network.");
      //     }
      //   }
      // }

      // Una vez en la red correcta, continúa
      const web3Provider = new Web3(window.ethereum);
      const addresses = await web3Provider.eth.getAccounts();

      console.log("Connected to blockchain!");

      resolve({
        currentChainId,
        accounts,
        addresses,
        web3Provider,
      });

    } catch (error) {
      console.error("Blockchain connection error:", error);
      reject("Error connecting to blockchain.");
    }
  });

export default getBlockchain;
