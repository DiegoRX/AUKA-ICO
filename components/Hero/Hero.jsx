import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import Cookies from "js-cookie";
import { useAppContext } from "@context/state";
import Swal from 'sweetalert2'
import TokenSelect from "@components/TokenSelect";
import TokenTable from "@components/TokenTable";
import getBlockchain from "@context/ethereum";

// --- CONFIGURACIÓN DE LA RED POLYGON ---
// Información necesaria para interactuar con USDT en la red Polygon.
const polygonNetworkConfig = {
    providerUrl: "https://polygon-rpc.com/",
    network: "polygon",
    networkId: "137",
    networkIdHex: "0x89",
    usdtAddress: "0xc2132d05d31c914a87c6611c10748aeb04b58e8f" // Dirección del contrato de USDT en Polygon
};


const Hero = ({ address, setShowModal }) => {
    const [init, setInit] = useState(false);
    const [mode, setMode] = useState('buy');

    // Precios de los tokens
    const [AUKAPrice, setAUKAPrice] = useState(0);
    const [AGKAPrice, setAGKAPrice] = useState(0);
    const [ONDKPrice] = useState(1.8);
    const [ORIGENPrice, setORIGENPrice] = useState(1.97);

    // --- ESTADOS PARA LOS FORMULARIOS ---
    // Estados para el formulario de COMPRA (BUY)
    const [buyUsdtAmount, setBuyUsdtAmount] = useState(""); // Lo que el usuario paga en USDT
    const [buyTokenAmount, setBuyTokenAmount] = useState(""); // Lo que el usuario recibe en el token seleccionado

    // Estados para el formulario de VENTA (SELL)
    const [sellTokenAmount, setSellTokenAmount] = useState(""); // Lo que el usuario vende en el token seleccionado
    const [sellUSDTAmount, setSellUSDTAmount] = useState(""); // Lo que el usuario recibe en USDT

    const [selectedToken, setSelectedToken] = useState("ORIGEN");
    const [selectedNetwork, setSelectedNetwork] = useState({
        "providerUrl": "polygon-mainnet.infura.io",
        "network": "Polygon Mainnet",
        "networkId": "137",
        "networkIdHex": "0x38",
        "usdtAddress": "0xc2132D05D31c914a87C6611C10748AEb04B58e8F"
    });
    // --- CONTEXTO DE LA APP ---
    // Importamos las funciones y saldos del contexto global
    const { connectWallet, walletAddress, transferAUKA, buyORIGEN, sellOrigen, ondkBalance, transferUSDTfromAUKA, transferUSDTfromORIGEN, aukaWalletBalance, origenWalletBalance, currentChainId, usdtWalletBalance } = useAppContext();

    // --- LÓGICA DE PRECIOS ---
    const tokenPrices = {
        ORIGEN: ORIGENPrice,
        ONDK: ONDKPrice,
        AGKA: AGKAPrice,
        AUKA: AUKAPrice,
    };

    const getTokenPrice = (token = selectedToken) => tokenPrices[token] || 0;

    const fetchPrices = async () => {
        const auka = parseFloat(Cookies.get("auka") || 0);
        const agka = parseFloat(Cookies.get("agka") || 0);
        setAUKAPrice(auka);
        setAGKAPrice(agka);
        const origen = auka * 0.032151 / 55;
        setORIGENPrice(origen);
    };

    useEffect(() => {
        fetchPrices();
    }, []);

    // --- MANEJADORES DE CAMBIOS EN LOS INPUTS ---

    // Lógica para el formulario de COMPRA
    const handleBuyUsdtChange = (e) => {
        const usdtValue = e.target.value;
        setBuyUsdtAmount(usdtValue);
        const price = getTokenPrice();
        if (price > 0 && usdtValue !== "") {
            const tokenValue = (parseFloat(usdtValue) / price).toFixed(2);
            setBuyTokenAmount(tokenValue);
        } else {
            setBuyTokenAmount("");
        }
    };

    const handleBuyTokenChange = (e) => {
        const tokenValue = e.target.value;
        setBuyTokenAmount(tokenValue);
        const price = getTokenPrice();
        if (price > 0 && tokenValue !== "") {
            const usdtValue = (parseFloat(tokenValue) * price).toFixed(2);
            setBuyUsdtAmount(usdtValue);
        } else {
            setBuyUsdtAmount("");
        }
    };

    // Lógica para el formulario de VENTA
    const handleSellTokenChange = (e) => {
        const tokenValue = e.target.value;
        setSellTokenAmount(tokenValue);
        const price = getTokenPrice();
        // Aplicamos un slippage/comisión del 2.5% al vender
        const sellPrice = price * 0.975;
        if (price > 0 && tokenValue !== "") {
            const usdtValue = (parseFloat(tokenValue) / sellPrice).toFixed(2);
            setSellUSDTAmount(usdtValue);
        } else {
            setSellUSDTAmount("");
        }
    };

    const handleSellUsdtChange = (e) => {
        const usdtValue = e.target.value;
        setSellUSDTAmount(usdtValue);
        const price = getTokenPrice();
        const sellPrice = price * 0.975;
        if (price > 0 && usdtValue !== "") {
            const tokenValue = (parseFloat(usdtValue) * sellPrice).toFixed(2);
            setSellTokenAmount(tokenValue);
        } else {
            setSellTokenAmount("");
        }
    };

    // Resetea los campos cuando cambia el token
    const handleTokenSelectionChange = (e) => {
        setSelectedToken(e.target.value);
        setBuyUsdtAmount("");
        setBuyTokenAmount("");
        setSellTokenAmount("");
        setSellUSDTAmount("");
    };

    // --- FUNCIONES DE TRANSACCIÓN ---

    const handleSellOrigen = () => {

        if (currentChainId != '0x2154') {
            Swal.fire({
                title: "Chage to Orden Global",
                icon: "warning"
            });
            return;
        }
        const tokenName = selectedToken
        const tokenAmount = sellUSDTAmount
        const usdtAmount = sellTokenAmount
        // console.log(usdtRef.current.value, ondkRef.current.value)
        const tokenReceiverAddress = walletAddress

        const { providerUrl, network, networkId, usdtAddress } = selectedNetwork
        if (usdtAmount == 0 || tokenAmount == 0 || tokenReceiverAddress.lenght > 42) {
            alert('fill the gaps')
        } else {
            Swal.fire({
                title: "Verify your deposit address",
                text: tokenReceiverAddress,
                icon: "warning"
            });
            // console.log(usdtAmount, tokenAmount, network, networkId, tokenReceiverAddress, providerUrl)
            let data = { usdtAmount, usdtAddress, tokenName, tokenAmount, network, networkId, tokenReceiverAddress, providerUrl }
            console.log(data)


            if (origenWalletBalance > tokenAmount) {
                sellOrigen(data)
            } else {
                Swal.fire({
                    title: "Not enough liquidity",
                    text: "Contact Orden Global Team",
                    icon: "warning"
                });
            }

        }
    };

    const handleBuyOrigen = () => {
        getBlockchain()
        if (currentChainId != '0x89') {
            Swal.fire({
                title: "Chage to Polygon Network",
                icon: "warning"
            });
            return;
        }
        const tokenName = selectedToken
        const tokenAmount = buyTokenAmount
        const usdtAmount = buyUsdtAmount
        // console.log(usdtRef.current.value, ondkRef.current.value)
        const tokenReceiverAddress = walletAddress

        const { providerUrl, network, networkId, usdtAddress } = selectedNetwork
        if (usdtAmount == 0 || tokenAmount == 0 || tokenReceiverAddress.lenght > 42) {
            alert('fill the gaps')
        } else {
            Swal.fire({
                title: "Verify your deposit address",
                text: tokenReceiverAddress,
                icon: "warning"
            });
            // console.log(usdtAmount, tokenAmount, network, networkId, tokenReceiverAddress, providerUrl)
            let data = { usdtAmount, usdtAddress, tokenName, tokenAmount, network, networkId, tokenReceiverAddress, providerUrl }
            console.log(data)
            // console.log(data)
            if (selectedToken === 'AUKA') {
                if (aukaWalletBalance > tokenAmount) {
                    transferAUKA(data)
                } else {
                    Swal.fire({
                        title: "Not enough liquidity",
                        text: "Contact Orden Global Team",
                        icon: "warning"
                    });
                }

            } else if (selectedToken === 'ORIGEN') {

                if (origenWalletBalance > tokenAmount) {
                    buyORIGEN(data)
                } else {
                    Swal.fire({
                        title: "Not enough liquidity",
                        text: "Contact Orden Global Team",
                        icon: "warning"
                    });
                }
            }
        }
    };
    // --- Efectos de Inicialización y Partículas (sin cambios) ---
    useEffect(() => {
        initParticlesEngine(async (engine) => {
            await loadSlim(engine);
        }).then(() => {
            setInit(true);
        });
    }, []);

    const particlesLoaded = (container) => { };
    const options = useMemo(
        () => ({
            background: { color: { value: "transparent" } },
            fpsLimit: 120,
            interactivity: {
                events: {
                    onClick: { enable: true, mode: "push" },
                    onHover: { enable: true, mode: "repulse" },
                },
                modes: {
                    push: { quantity: 4 },
                    repulse: { distance: 200, duration: 0.4 },
                },
            },
            particles: {
                color: { value: "#ffffff" },
                links: {
                    enable: false,
                    color: "#ffffff",
                    distance: 150,
                    opacity: 0.5,
                    width: 1,
                },
                move: {
                    direction: "none",
                    enable: true,
                    outModes: { default: "bounce" },
                    random: false,
                    speed: 3,
                    straight: false,
                },
                number: {
                    density: { enable: true },
                    value: 80,
                },
                opacity: { value: 0.5 },
                shape: { type: "circle" },
                size: { value: { min: 1, max: 5 } },
            },
            detectRetina: true,
        }),
        [],
    );
    if (!init) return null; // Previene renderizado antes de inicializar partículas

    return (
        <main className="h-screen overflow-y-auto bg-gradient-to-b from-[#05071c] via-[#0a1a3a] to-[#020617] flex flex-col">
            <Particles
                id="tsparticles"
                className="!absolute !inset-0 !h-full !w-full"
                particlesLoaded={particlesLoaded}
                options={options}
            />

            {/* Contenido principal: Texto + Card */}
            <div className="relative z-10 flex-1 flex flex-col lg:flex-row items-center justify-between max-w-6xl mx-auto w-full px-4 py-10">                <div className="max-w-xl text-center lg:text-left ">
                <h1 className="text-5xl sm:text-6xl md:text-6xl lg:text-[60px] font-bold leading-tight lg:leading-[1.2]">
                    Buy Crypto Tokens<br />
                    <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 text-transparent bg-clip-text">
                        By ORDEN EXCHANGE
                    </span>
                </h1>
                <p className="mt-4 text-gray-400 text-xl sm:text-2xl md:text-3xl lg:text-[42px]">
                    Use your credit card or Binance wallet to buy.
                </p>
            </div>

                {/* Buy/Sell Card */}
                <div className="w-[400px] rounded-xl shadow-lg overflow-hidden">
                    {/* Buy/Sell Card */}
                    <div className="w-[400px] rounded-xl shadow-lg overflow-hidden ">
                        <div className="flex">
                            <button
                                onClick={() => setMode('buy')}
                                className={`flex-1 py-3 text-xl font-semibold ${mode === 'buy'
                                    ? 'bg-[#05071c] text-white'
                                    : 'bg-[#0A1A3A] text-gray-400 hover:bg-[#05071c]'
                                    }`}
                            >
                                BUY
                            </button>
                            <button
                                onClick={() => setMode('sell')}
                                className={`flex-1 py-3 text-xl font-semibold ${mode === 'sell'
                                    ? 'bg-[#05071c] text-white'
                                    : 'bg-[#0A1A3A] text-gray-400 hover:bg-[#05071c]'
                                    }`}
                            >
                                SELL
                            </button>
                        </div>

                        <div className="bg-[#05071c] p-6 space-y-4">
                            {mode === 'buy' ? (
                                <div>
                                    <div>
                                        <label className="block text-xl text-gray-400">Token</label>
                                        <TokenSelect
                                            selectedToken={selectedToken}
                                            onChange={handleTokenSelectionChange}
                                            prices={tokenPrices}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xl text-gray-400">Payment Method</label>
                                        <select className="w-full mt-1 bg-[#05071c] text-white p-2 rounded border border-white/10">
                                            <option>USDT Polygon - Metamask</option>
                                            <option>Binance Pay</option>
                                            <option>Credit / Debit card</option>
                                        </select>
                                    </div>


                                    <div>
                                        <label className="block text-xl text-gray-400">Spend USDT</label>
                                        <input value={buyUsdtAmount} onChange={handleBuyUsdtChange} placeholder="0.00" type="number" className="w-full mt-1 bg-[#0A1A3A] text-white p-2 rounded border border-white/10" />
                                    </div>
                                    <div>
                                        <label className="block text-xl text-gray-400">Receive {selectedToken}</label>
                                        <input value={buyTokenAmount} onChange={handleBuyTokenChange} placeholder="0.00" type="number" className="w-full mt-1 bg-[#0A1A3A] text-white p-2 rounded border border-white/10" />
                                    </div>

                                    {
                                        // 1. ¿Hay una dirección de billetera?
                                        walletAddress.length > 0 ? (
                                            // SÍ, la billetera está conectada. Ahora verificamos la red.
                                            // 2. ¿La red es Polygon ('0x89')?
                                            currentChainId === '0x89' ? (
                                                // SÍ, está en la red correcta. Mostramos el botón de compra.
                                                <button onClick={handleBuyOrigen} className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 font-bold py-3 mt-3 rounded text-xl">
                                                    BUY {selectedToken}
                                                </button>
                                            ) : (
                                                // NO, está en la red incorrecta. Mostramos el botón para cambiar de red.
                                                <button onClick={connectWallet} className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 font-bold py-3 mt-3 rounded text-xl">
                                                    Change Network to Polygon
                                                </button>
                                            )
                                        ) : (
                                            // NO, la billetera no está conectada. Mostramos el botón para conectar.
                                            <button onClick={connectWallet} className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 font-bold py-3 mt-3 rounded text-xl">
                                                Connect Wallet
                                            </button>
                                        )
                                    }
                                </div>
                            ) : (
                                <div>
                                    <div>
                                        <label className="block text-xl text-gray-400">Sell Token</label>
                                        <TokenSelect
                                            selectedToken={selectedToken}
                                            onChange={handleTokenSelectionChange}
                                            prices={tokenPrices}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xl text-gray-400">Spend ORIGEN</label>
                                        <input value={sellUSDTAmount} onChange={handleSellUsdtChange} placeholder="0.00" type="number" className="w-full mt-1 bg-[#0A1A3A] text-white p-2 rounded border border-white/10" />

                                    </div>
                                    <div>
                                        <label className="block text-xl text-gray-400">USDT you receive</label>
                                        <input value={sellTokenAmount} onChange={handleSellTokenChange} placeholder="0.00" type="number" className="w-full mt-1 bg-[#0A1A3A] text-white p-2 rounded border border-white/10" />
                                    </div>
                                    {
                                        // 1. ¿Hay una dirección de billetera?
                                        walletAddress.length > 0 ? (
                                            // SÍ, la billetera está conectada. Ahora verificamos la red.
                                            // 2. ¿La red es Polygon ('0x89')?
                                            currentChainId === '0x2154' ? (
                                                // SÍ, está en la red correcta. Mostramos el botón de compra.
                                                <button onClick={handleSellOrigen} className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 font-bold py-3 mt-3 rounded text-xl">
                                                    SELL {selectedToken}
                                                </button>
                                            ) : (
                                                // NO, está en la red incorrecta. Mostramos el botón para cambiar de red.
                                                <button onClick={connectWallet} className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 font-bold py-3 mt-3 rounded text-xl">
                                                    Change Network to Orden Global
                                                </button>
                                            )
                                        ) : (
                                            // NO, la billetera no está conectada. Mostramos el botón para conectar.
                                            <button onClick={connectWallet} className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 font-bold py-3 mt-3 rounded text-xl">
                                                Connect Wallet
                                            </button>
                                        )
                                    }
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* TokenTable debajo del contenido principal
            <div className="relative z-10 w-full max-w-6xl mx-auto px-4 pb-20">
                <TokenTable prices={tokenPrices} />
            </div> */}
        </main>
    );
};

export default Hero;