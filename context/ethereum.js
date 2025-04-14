import detectEthereumProvider from "@metamask/detect-provider";
// import COFFEE_ABI from "@config/abi/Coffee.json";
import Web3 from "web3";

const BSC_PARAMS = {
  chainId: "0x38", // 56 en decimal
  chainName: "Binance Smart Chain",
  nativeCurrency: {
    name: "BNB",
    symbol: "BNB",
    decimals: 18,
  },
  rpcUrls: ["https://bsc-dataseed.binance.org/"],
  blockExplorerUrls: ["https://bscscan.com/"],
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
      if (currentChainId !== BSC_PARAMS.chainId) {
        try {
          await provider.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: BSC_PARAMS.chainId }],
          });
        } catch (switchError) {
          // Si la red no está agregada, intenta agregarla
          if (switchError.code === 4902) {
            try {
              await provider.request({
                method: "wallet_addEthereumChain",
                params: [BSC_PARAMS],
              });
            } catch (addError) {
              return reject("Failed to add BSC network to MetaMask.");
            }
          } else {
            return reject("Failed to switch to BSC network.");
          }
        }
      }

      // Una vez en la red correcta, continúa
      const web3Provider = new Web3(window.ethereum);
      const addresses = await web3Provider.eth.getAccounts();

      console.log("Connected to Binance Smart Chain!");

      resolve({
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
