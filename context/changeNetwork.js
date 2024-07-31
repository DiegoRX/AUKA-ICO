import detectEthereumProvider from '@metamask/detect-provider';

  export const changeNetwork = async (networkData) => {
    const provider = await detectEthereumProvider();
console.log(networkData.chainIdHex)
      try {
          await  provider.request({
              "method": "wallet_switchEthereumChain",
              "params": [
                {
                  "chainId": networkData.chainIdHex
                }
              ]
            });
        
       //   await getBlockchain(networkData);
    } catch (error) {
      console.error('Failed to switch network:', error);
    }
  };

  export const addNetwork = async () => {
    const provider = await detectEthereumProvider();

      try {
          await  provider.request({
              "method": "wallet_addEthereumChain",
  "params": [
    {
      "chainId": "0x2154",
      "chainName": "Orden Global",
      "rpcUrls": [
        "https://rpc.ordenglobal-rpc.com"
      ],
      "nativeCurrency": {
        "name": "ORIGEN",
        "symbol": "ORIGEN",
        "decimals": 18
      },
      "blockExplorerUrls": [
        "https://www.ordenscan.com"
      ]
    }
  ]
            });
        
       //   await getBlockchain(networkData);
    } catch (error) {
      console.error('Failed to switch network:', error);
    }
  };