import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import mapboxgl from "mapbox-gl";
import Link from "next/link";
import { useAppContext } from "@context/state";
import { changeNetwork } from "@context/changeNetwork"
import networks from "@context/networks.json"
import Swal from 'sweetalert2'
import Cookies from "js-cookie";

const Home = () => {
  const [AUKAPrice, setAUKAPrice] = useState(0)
  const imgUrl = 'https://ico-frontend-62th.vercel.app/'
  const { connectWallet, walletAddress, transferAUKA, transferORIGEN, ondkBalance, transferUSDTfromAUKA, transferUSDTfromORIGEN } = useAppContext();
  const usdtRef = useRef(null);
  const ondkRef = useRef(null);
  const onkdReceiverAddressRef = useRef(null)
  console.log(walletAddress)
  const [selectedNetwork, setSelectedNetwork] = useState({
    "providerUrl": "https://rpc-mainnet.maticvigil.com/",
    "network": "polygon",
    "networkId": "137",
    "networkIdHex": "0x89",
    "usdtAddress": "0xc2132D05D31c914a87C6611C10748AEb04B58e8F"
  });


  const [selectedWallet, setSelectedWallet] = useState(0);

  const getAUKAPrice = async () => {
    const auka = Cookies.get("auka")
    setAUKAPrice(auka)
  }

  const transferForm = () => {
    const tokenName = selectedToken
    const usdtAmount = parseFloat(usdtRef.current.value);
    const tokenAmount = parseFloat(ondkRef.current.value);
    const tokenReceiverAddress = onkdReceiverAddressRef.current.value
    if (!isNaN(usdtAmount)) {
      ondkRef.current.value = (usdtAmount / 2.1).toFixed(2);
    } else if (!isNaN(tokenAmount)) {
      usdtRef.current.value = (tokenAmount * 2.1).toFixed(2);
    }
    const { providerUrl, network, networkId, usdtAddress } = selectedNetwork
    if (usdtAmount == 0 || tokenAmount == 0 || tokenReceiverAddress.lenght > 42) {
      alert('fill the gaps')
    } else {
      Swal.fire({
        title: "Verify your deposit address",
        text: tokenReceiverAddress,
        icon: "warning"
      });
      console.log(usdtAmount, tokenAmount, network, networkId, tokenReceiverAddress, providerUrl)
      let data = { usdtAmount, usdtAddress, tokenName, tokenAmount, network, networkId, tokenReceiverAddress, providerUrl }
      if (selectedToken === 'AUKA') {
        transferAUKA(data)
      } else if (selectedToken === 'ORIGEN') {
        transferORIGEN(data)
      }
    }
  };

  const handleUsdtChangeBuy = (e) => {
    getAUKAPrice()
    const usdtAmount = parseFloat(e.target.value);
    if (!isNaN(usdtAmount)) {
      if (selectedToken === 'AUKA') {
        ondkRef.current.value = (((usdtAmount / AUKAPrice))).toFixed(2);
      } else if (selectedToken === 'ORIGEN') {
        ondkRef.current.value = (usdtAmount / ORIGENPrice).toFixed(2);
      }
    } else {
      ondkRef.current.value = "";
    }
  };

  const handleTokenChangeBuy = (e) => {
    getAUKAPrice()
    const tokenAmount = parseFloat(e.target.value);
    if (!isNaN(tokenAmount)) {
      if (selectedToken === 'AUKA') {
        usdtRef.current.value = ((tokenAmount * AUKAPrice)).toFixed(2);
      } else if (selectedToken === 'ORIGEN') {
        usdtRef.current.value = (tokenAmount * ORIGENPrice).toFixed(2);
      }
    } else {
      usdtRef.current.value = "";
    }
  };
  const handleUsdtChangeSell = (e) => {
    getAUKAPrice()
    const usdtAmount = parseFloat(e.target.value);
    if (!isNaN(usdtAmount)) {
      if (selectedToken === 'AUKA') {
        ondkRef.current.value = (((usdtAmount / AUKAPrice) / 0.975)).toFixed(2);
      } else if (selectedToken === 'ORIGEN') {
        ondkRef.current.value = (usdtAmount / ORIGENPrice / 0.975).toFixed(2);
      }
    } else {
      ondkRef.current.value = "";
    }
  };

  const handleTokenChangeSell = (e) => {
    getAUKAPrice()
    const tokenAmount = parseFloat(e.target.value);
    if (!isNaN(tokenAmount)) {
      if (selectedToken === 'AUKA') {
        usdtRef.current.value = ((tokenAmount * AUKAPrice) * 0.975).toFixed(2);
      } else if (selectedToken === 'ORIGEN') {
        usdtRef.current.value = (tokenAmount * ORIGENPrice * 0.975).toFixed(2);
      }
    } else {
      usdtRef.current.value = "";
    }
  };
  const handleNetworkChange = (event) => {
    const selectedValue = event.target.value;
    const networkData = networks[selectedValue];
    setSelectedNetwork(networkData);
  };

  useEffect(() => {
    getAUKAPrice()
    console.log(selectedNetwork)
    if (selectedNetwork.network != '') {
      changeNetwork(selectedNetwork)
    }
  }, [selectedNetwork]);

  const handleImageClick = (index) => {
    setSelectedWallet(index);
    if (index == 0) {
      Swal.fire({
        title: "Add Orden Global blockchain and AUKA token to Metamask",
        text: "https://ordenglobal-rpc.com 0x6Facc8Df79cEDc6C5065442ce27e915Aa3a26B9B",
        icon: "warning"
      });
      onkdReceiverAddressRef.current.value = walletAddress
    } else if (index == 1) {
      Swal.fire({
        title: "Copy your wallet from VetaWallet",
        html: `
        <p>Make sure to type the correct VetaWallet Address</p>
        <a href="https://www.vetawallet.com/register" target="_blank" autofocus>New to VetaWallet? <b>Register</b></a>
      `,
        icon: "warning"
      });
      onkdReceiverAddressRef.current.value = ''
    }
    console.log(index)
  };

  const [selectedToken, setSelectedToken] = useState(null);

  const handleTokenClick = (token) => {
    usdtRef.current.value = 0
    ondkRef.current.value = 0
    setSelectedToken(token);
  };

  const ORIGENPrice = 1.83

  const [buySell, setBuySell] = useState('buy');

  const handleBuySell = (action) => {
    usdtRef.current.value = 0
    ondkRef.current.value = 0
    setBuySell(action);
  };
  const sellTokens = () => {
    const tokenName = selectedToken
    const usdtAmount = usdtRef.current.value;
    const tokenAmount = ondkRef.current.value;
    const tokenReceiverAddress = onkdReceiverAddressRef.current.value

    console.log(tokenAmount, usdtAmount, tokenName, tokenReceiverAddress.length)
    const { providerUrl, network, networkId, usdtAddress } = selectedNetwork
    if (usdtAmount == 0 || tokenAmount == 0 || tokenReceiverAddress.lenght >= 42) {
      alert('fill the gaps')
    } else {
      Swal.fire({
        title: "Verify your deposit address",
        text: tokenReceiverAddress,
        icon: "warning"
      });
      console.log(usdtAmount, tokenAmount, network, networkId, tokenReceiverAddress, providerUrl)
      let data = { usdtAmount, usdtAddress, tokenName, tokenAmount, network, networkId, tokenReceiverAddress, providerUrl }
      if (selectedToken === 'AUKA') {
        transferUSDTfromAUKA(data)
      } else if (selectedToken === 'ORIGEN') {
        transferUSDTfromORIGEN(data)
      }
    }
  };
  return (
    <div>
      <div className="header">
        <img src={imgUrl + 'WhatsApp Image 2024-06-12 at 10.44.57 AM_preview_rev_1.png'} alt="logo" />
        <div className="info">
          <a href="">Whitepaper</a>
          <a href="">About</a>
        </div>
        <div className="actions">
          <div className="social">
            <img src={imgUrl + "x.png"} alt="x" />
            <img src={imgUrl + "telegram.png"} alt="telegram" />
          </div>
          {walletAddress.length > 0 ? (
            <button className="actions_buy-now text-black" style={{ height: '45px' }}>
              {walletAddress[0].slice(0, 6)}...{walletAddress[0].slice(-4)}
            </button>
          ) : (
            <button className="actions_buy-now" onClick={connectWallet}>CONNECT WALLET</button>
          )}
        </div>
      </div>
      <div className="main__bg">
        <div className="main__info">
          <h2>Increase your profits with ORDEN KAPITAL: the best investment!</h2>
          <h3>GOLD IN YOUR HANDS</h3>
          <video
            autoPlay
            loop
            controls
            src="https://ico-frontend-62th.vercel.app/WhatsApp%20Video%202024-06-13%20at%2014.35.06.mp4"
          >
          </video>
        </div>
        <div className="main__info2">
          {buySell === 'buy' ? (<div className="main_box">
            <img src={imgUrl + "logo.png"} alt="x" />
            <h1>BUY TOKENS</h1>
            <p className="cursor-pointer" onClick={() => handleBuySell('sell')}>SELL TOKENS</p>

            <div className="divider flex justify-around w-100 align-center">
              <hr />
              {selectedToken === null ? (
                <p className="font-bold">Select a token to see the price information</p>
              ) : selectedToken === 'AUKA' ? (
                <p className="font-bold">1 $AUKA = {AUKAPrice} USDT</p>
              ) : (
                <p className="font-bold">1 $ORIGEN = {ORIGENPrice} USDT</p>
              )}
              <hr />
            </div>
            <div className="flex flex-col w-96 text-left ">
              <p className="font-bold mb-0 text-Left ">SELECT CURRENCY</p>
            </div>
            <div className="flex  w-96 justify-around ">
              <button
                className={`button-token ${selectedToken === 'AUKA' ? 'selected' : ''}`}
                onClick={() => handleTokenClick('AUKA')}
              >
                <img src="https://www.vetawallet.com/_next/image?url=%2Fauka.png&w=48&q=75" alt="AUKA" />
                <p>AUKA</p>
              </button>
              <button
                className={`button-token ${selectedToken === 'ORIGEN' ? 'selected' : ''}`}
                onClick={() => handleTokenClick('ORIGEN')}
              >
                <img src="https://www.vetawallet.com/_next/image?url=%2Forigen.png&w=48&q=75" alt="ORIGEN" />
                <p>ORIGEN</p>
              </button>
            </div>
            <div className="flex w-96 col-pay">
              <form action="">
                <div className="flex flex-col w-96 text-left ">
                  <p className="font-bold mb-0">SELECT NETWORK</p>
                  <select className="input-container" name="network" id="network" onChange={handleNetworkChange}>                    <option value="polygon">Polygon</option>
                    <option value="ethereum">Ethereum</option>
                    <option value="polygon">Polygon</option>
                    <option value="bnb">Binance Smart Chain</option>
                  </select>
                </div>
                <div className="flex flex-col w-96 text-left ">
                  <p className="font-bold mb-0">SELECT WALLET</p>
                  <div className="flex flex w-96 justify-center ">
                    <img
                      className="metamask_logo cursor-pointer"
                      src={'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/MetaMask_Fox.svg/2048px-MetaMask_Fox.svg.png'}
                      alt="MetaMask"
                      onClick={() => handleImageClick(0)}
                    />
                    <img
                      className="metamask_logo cursor-pointer"
                      src={'https://i.ibb.co/KN5YfY6/vetawallet.png'}
                      alt="VetaWallet"
                      onClick={() => handleImageClick(1)}
                    />
                  </div>
                </div>
                <div className="flex flex-col w-96 text-left ">
                  <p className="font-bold mb-0">  {selectedToken === 'AUKA' ? 'AUKA' : selectedToken === 'ORIGEN' ? 'ORIGEN' : ''} DEPOSIT ADDRESS</p>
                  {selectedWallet === 0 && walletAddress.length > 0 ? (
                    <input
                      className="input-container"
                      type="text"
                      placeholder="0x..."
                      required
                      readOnly
                      ref={onkdReceiverAddressRef}
                    />
                  ) : selectedWallet === 1 ? (
                    <input
                      className="input-container"
                      type="text"
                      placeholder="0x..."
                      required
                      ref={onkdReceiverAddressRef}
                    />) : null}
                </div>
                <div className="flex w-96">
                  <div className="flex flex-col w-48 text-left">
                    <p>USDT you pay</p>
                    <div className="flex w-50 input2-container">
                      <input
                        className="input2 86"
                        type="text" placeholder="0x..."
                        ref={usdtRef}
                        onChange={handleUsdtChangeBuy}
                      />
                      <img src={imgUrl + "tether-usdt-seeklogo.svg"} alt="x" />
                    </div>
                  </div>
                  <div className="flex flex-col w-48 text-left">
                    <p>
                      {selectedToken === 'AUKA' ? 'AUKA you receive' : selectedToken === 'ORIGEN' ? 'ORIGEN you receive' : 'Select a token'}
                    </p>                    <div className="flex w-50 input2-container">
                      <input
                        className="input2 86"
                        type="text" placeholder="0x..."
                        ref={ondkRef}
                        onChange={handleTokenChangeBuy}
                      />
                      {selectedToken === 'ORIGEN' ? (
                        <img src="https://www.vetawallet.com/_next/image?url=%2Forigen.png&w=48&q=75" alt="ORIGEN" />
                      ) : selectedToken === 'AUKA' ? (
                        <img src="https://www.vetawallet.com/_next/image?url=%2Fauka.png&w=48&q=75" alt="AUKA" />
                      ) : (
                        <></>
                      )}
                    </div>
                  </div>
                </div>
              </form>
            </div>
            <button className="button-usdt2 text-black w-60" onClick={transferForm}>BUY NOW ${selectedToken === 'AUKA' ? 'AUKA' : selectedToken === 'ORIGEN' ? 'ORIGEN' : ''}</button>
            <p>Powered by SHARK TECHNOLOGY</p>
          </div>) : (<div className="main_box">
            <img src={imgUrl + "logo.png"} alt="x" />
            <h1>SELL TOKENS</h1>
            <p className="cursor-pointer" onClick={() => handleBuySell('buy')}>BUY TOKENS</p>
            <div className="divider flex justify-around w-100 align-center">
              <hr />
              {selectedToken === null ? (
                <p className="font-bold">Select a token to see the price information</p>
              ) : selectedToken === 'AUKA' ? (
                buySell === 'buy' ? (
                  <p className="font-bold">1 $AUKA = {AUKAPrice} USDT</p>
                ) : (
                  <p className="font-bold">1 $AUKA = {(AUKAPrice * 0.975).toFixed(2)} USDT</p>
                )
              ) : (
                buySell === 'buy' ? (
                  <p className="font-bold">1 $ORIGEN = {ORIGENPrice} USDT</p>
                ) : (
                  <p className="font-bold">1 $ORIGEN = {(ORIGENPrice * 0.975).toFixed(2)} USDT</p>
                )
              )}
              <hr />
            </div>
            <div className="flex flex-col w-96 text-left ">
              <p className="font-bold mb-0 text-Left ">SELECT CURRENCY</p>
            </div>
            <div className="flex  w-96 justify-around ">
              <button
                className={`button-token ${selectedToken === 'AUKA' ? 'selected' : ''}`}
                onClick={() => handleTokenClick('AUKA')}
              >
                <img src="https://www.vetawallet.com/_next/image?url=%2Fauka.png&w=48&q=75" alt="AUKA" />
                <p>AUKA</p>
              </button>
              <button
                className={`button-token ${selectedToken === 'ORIGEN' ? 'selected' : ''}`}
                onClick={() => handleTokenClick('ORIGEN')}
              >
                <img src="https://www.vetawallet.com/_next/image?url=%2Forigen.png&w=48&q=75" alt="ORIGEN" />
                <p>ORIGEN</p>
              </button>
            </div>
            <div className="flex w-96 col-pay">
              <form action="">
                <div className="flex flex-col w-96 text-left ">
                  <p className="font-bold mb-0">  USDT RECEIVER ADDRESS</p>

                  <input
                    className="input-container"
                    type="text"
                    placeholder="0x..."
                    required
                    ref={onkdReceiverAddressRef}
                  />
                </div>
                <div className="flex w-96">

                  <div className="flex flex-col w-48 text-left">
                    <p>
                      {selectedToken === 'AUKA' ? 'AUKA you sell' : selectedToken === 'ORIGEN' ? 'ORIGEN you sell' : 'Select a token'}
                    </p>                    <div className="flex w-50 input2-container">
                      <input
                        className="input2 86"
                        type="text" placeholder="0x..."
                        ref={ondkRef}
                        onChange={handleTokenChangeSell}
                      />
                      {selectedToken === 'ORIGEN' ? (
                        <img src="https://www.vetawallet.com/_next/image?url=%2Forigen.png&w=48&q=75" alt="ORIGEN" />
                      ) : selectedToken === 'AUKA' ? (
                        <img src="https://www.vetawallet.com/_next/image?url=%2Fauka.png&w=48&q=75" alt="AUKA" />
                      ) : (
                        <p></p>
                      )}                    </div>
                  </div>
                  <div className="flex flex-col w-48 text-left">
                    <p>USDT you receive</p>
                    <div className="flex w-50 input2-container">
                      <input
                        className="input2 86"
                        type="text" placeholder="0x..."
                        ref={usdtRef}
                        onChange={handleUsdtChangeSell}
                      />
                      <img src={imgUrl + "tether-usdt-seeklogo.svg"} alt="x" />
                    </div>
                  </div>
                </div>
              </form>
            </div>
            <button className="button-usdt2 text-black w-60" onClick={sellTokens}>SELL NOW ${selectedToken === 'AUKA' ? 'AUKA' : selectedToken === 'ORIGEN' ? 'ORIGEN' : ''}</button>
            <p>Powered by SHARK TECHNOLOGY</p>
          </div>)}

        </div>
        <div className="partners">
          <img src={imgUrl + 'CoffeBeanSwap_Horizontal-1.png'} alt="logo" />
          <img src={imgUrl + 'crypto.png'} alt="logo" />
          <img src={imgUrl + 'logo-3.png'} alt="logo" />
          <img src={imgUrl + 'Logo-OrdenEx-Horizontal.png'} alt="logo" />
          <img src={imgUrl + 'Veta_Wallet_Horizontal-removebg-preview-2.png'} alt="logo" />
        </div>
      </div>
    </div>
  );
};

export default Home;
