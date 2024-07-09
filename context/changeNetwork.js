import detectEthereumProvider from '@metamask/detect-provider';

  export const changeNetwork = async (networkData) => {
    const provider = await detectEthereumProvider();

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