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

export const OG_PARAMS = {
  chainId: "0x2154", // 8532 en hexadecimal
  chainName: "Orden Global Network",
  nativeCurrency: {
    name: "ORIGEN",
    symbol: "ORIGEN",
    decimals: 18,
  },
  rpcUrls: ["https://rpc.ordenglobal-rpc.com"],
  blockExplorerUrls: ["https://scan.ordenglobal.io"],
};

export const BSC_PARAMS = {
  chainId: "0x38", // 56 en hexadecimal
  chainName: "Binance Smart Chain",
  nativeCurrency: {
    name: "BNB",
    symbol: "BNB",
    decimals: 18,
  },
  rpcUrls: ["https://bsc-dataseed.binance.org/"],
  blockExplorerUrls: ["https://bscscan.com/"],
};

export const ETH_PARAMS = {
  chainId: "0x1", // 1 en hexadecimal
  chainName: "Ethereum Mainnet",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: ["https://mainnet.infura.io/v3/"],
  blockExplorerUrls: ["https://etherscan.io/"],
};

export const switchNetwork = async (chainId) => {
  if (!window.ethereum) return;

  let params;
  if (chainId === OG_PARAMS.chainId) params = OG_PARAMS;
  else if (chainId === "0x38" || chainId === "56") params = BSC_PARAMS;
  else if (chainId === "0x1" || chainId === "1") params = ETH_PARAMS;
  else params = POLYGON_PARAMS; // Default to Polygon

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: params.chainId }],
    });
  } catch (switchError) {
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [params],
        });
      } catch (addError) {
        console.error("Failed to add network:", addError);
      }
    } else {
      console.error("Failed to switch network:", switchError);
    }
  }
};

const getBlockchain = () =>
  new Promise(async (resolve, reject) => {
    const provider = await detectEthereumProvider();

    if (!provider) {
      alert("Please install MetaMask.");
      return reject("MetaMask not detected.");
    }

    try {
      // Request access to accounts
      const accounts = await provider.request({
        method: "eth_requestAccounts",
      });

      // Verify and change network if necessary
      const currentChainId = await provider.request({ method: "eth_chainId" });

      // We don't force switch here anymore, we do it in action.
      // But we could optionally check.

      // Once on the correct network, continue
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
