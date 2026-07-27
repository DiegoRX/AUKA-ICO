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
    usdtAddress: "0xc2132d05d31c914a87c6611c10748aeb04b58e8f",
    chainId: "0x89", // 137 en hexadecimal
    chainName: "Polygon Mainnet",
    nativeCurrency: {
        name: "MATIC",
        symbol: "MATIC",
        decimals: 18,
    },
    rpcUrls: ["https://polygon-rpc.com/"],
    blockExplorerUrls: ["https://polygonscan.com/"],
};
export const ordenGlobalNetworkConfig = {
    chainId: "0x2154", // 8532 en hexadecimal
    chainName: "Orden Global",
    nativeCurrency: {
        name: "ORIGEN", // CAMBIAR: El nombre de tu moneda nativa
        symbol: "ORIGEN",   // CAMBIAR: El símbolo/ticker de tu moneda
        decimals: 18,
    },
    rpcUrls: ["https://ordenglobal-rpc.com/"],
    blockExplorerUrls: ["https://www.ordenscan.com"], // Opcional: si tienes un explorador de bloques
};
export const switchOrAddNetwork = async (networkConfig) => {
    // Comprueba si MetaMask está instalado
    if (!window.ethereum) {
        alert("Por favor, instala MetaMask para usar esta función.");
        return;
    }

    try {
        // Intenta cambiar a la red
        await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: networkConfig.chainId }],
        });
    } catch (switchError) {
        // Este error (código 4902) indica que la red no está agregada a MetaMask.
        if (switchError.code === 4902) {
            try {
                // Pide al usuario que agregue la nueva red
                await window.ethereum.request({
                    method: "wallet_addEthereumChain",
                    params: [networkConfig],
                });
            } catch (addError) {
                // El usuario rechazó agregar la red
                console.error("El usuario rechazó agregar la red:", addError);
                alert("No se pudo agregar la red a tu billetera.");
            }
        } else {
            // Otro tipo de error (ej: el usuario canceló la solicitud)
            console.error("No se pudo cambiar de red:", switchError);
        }
    }
};

const Hero = ({ address, setShowModal }) => {
    const [init, setInit] = useState(false);
    const [mode, setMode] = useState('buy');

    // Precios de los tokens
    const [AUKAPrice, setAUKAPrice] = useState(0);
    const [AGKAPrice, setAGKAPrice] = useState(0);
    const [ONDKPrice] = useState(1.8);
    const [ORIGENPrice, setORIGENPrice] = useState(1.97);
    const [USDKPrice, setUSDKPrice] = useState(1);

    // --- ESTADOS PARA LOS FORMULARIOS ---
    // Estados para el formulario de COMPRA (BUY)
    const [buyUsdtAmount, setBuyUsdtAmount] = useState(""); // Lo que el usuario paga en USDT
    const [buyTokenAmount, setBuyTokenAmount] = useState(""); // Lo que el usuario recibe en el token seleccionado

    // Estados para el formulario de VENTA (SELL)
    const [sellTokenAmount, setSellTokenAmount] = useState(""); // Lo que el usuario vende en el token seleccionado
    const [sellUSDTAmount, setSellUSDTAmount] = useState(""); // Lo que el usuario recibe en USDT

    const [selectedToken, setSelectedToken] = useState("ORIGEN");
    const [selectedNetwork, setSelectedNetwork] = useState({
        "providerUrl": "https://polygon-bor-rpc.publicnode.com",
        "network": "Polygon Mainnet",
        "networkId": "137",
        "networkIdHex": "0x89",
        "usdtAddress": "0xc2132D05D31c914a87C6611C10748AEb04B58e8F"
    });
    // --- CONTEXTO DE LA APP ---
    // Importamos las funciones y saldos del contexto global
    const {
        walletAddress,
        transferAUKA,
        buyORIGEN,
        sellOrigen,
        ondkBalance,
        transferUSDTfromAUKA,
        transferUSDTfromORIGEN,
        aukaWalletBalance,
        origenWalletBalance,
        currentChainId,
        setCurrentChainId,
        usdtWalletBalance,
        OGbalanceORIGEN,
        OGUSDTBalance,
        OGbalanceUSDK,
        buyUSDK,
        usdkWalletBalance,
        sellUSDK,
        switchNetwork,
        connectWallet
    } = useAppContext();

    const handleSwitchToPolygon = async () => {
        try {
            await switchNetwork('0x89');
            connectWallet('137');
        } catch (e) {
            console.error("Error switching to Polygon:", e);
        }
    };

    const handleSwitchToOrdenGlobal = async () => {
        try {
            await switchNetwork('0x2154');
            connectWallet('8532');
        } catch (e) {
            console.error("Error switching to Orden Global:", e);
        }
    };

    // --- LÓGICA DE PRECIOS ---
    const tokenPrices = {
        ORIGEN: ORIGENPrice,
        ONDK: ONDKPrice,
        AGKA: AGKAPrice,
        AUKA: AUKAPrice,
        USDK: USDKPrice,
    };
    // --- AÑADIDO: Mapa de balances para la venta ---
    // Esto hace que la pestaña "SELL" sea dinámica
    const sellBalances = useMemo(() => ({
        ORIGEN: origenWalletBalance,
        AUKA: aukaWalletBalance,
        USDK: usdkWalletBalance,
        ONDK: ondkBalance,
        // AGKA no parece tener balance en tu contexto
    }), [origenWalletBalance, aukaWalletBalance, usdkWalletBalance, ondkBalance]);

    // --- AÑADIDO: Obtener el balance del token seleccionado ---
    const currentSellBalance = parseFloat(sellBalances[selectedToken] || 0);

    const getTokenPrice = (token = selectedToken) => tokenPrices[token] || 0;

    const fetchPrices = async () => { };
    useEffect(() => {
        fetchPrices();
    }, []);
    // --- MANEJADORES DE CAMBIOS EN LOS INPUTS ---

    // Lógica para el formulario de COMPRA
    const handleSetMaxUsdt = () => {
        // Si no hay balance o es cero, no hacemos nada.
        if (!usdtWalletBalance || parseFloat(usdtWalletBalance) <= 0) {
            return;
        }

        // Creamos un evento sintético para pasarlo al manejador onChange existente.
        // Esto asegura que el campo "Receive Token" también se calcule y actualice.
        const syntheticEvent = {
            target: { value: usdtWalletBalance.toString() }
        };
        handleBuyUsdtChange(syntheticEvent);
    };

    // 2. Modificamos la función onChange de USDT para añadir la validación
    const handleBuyUsdtChange = (e) => {
        let usdtValue = e.target.value;
        const maxAllowed = parseFloat(usdtWalletBalance);

        // Si el valor introducido es mayor que el balance, lo ajustamos al máximo.
        if (usdtWalletBalance && usdtValue !== "" && parseFloat(usdtValue) > maxAllowed) {
            usdtValue = maxAllowed.toString();
        }

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
        const sellPrice = price
        // * 0.975;
        if (price > 0 && tokenValue !== "") {
            const usdtValue = (parseFloat(tokenValue) / sellPrice).toFixed(2);
            setSellUSDTAmount(usdtValue);
        } else {
            setSellUSDTAmount("");
        }
    };

    const handleSetMaxSellToken = () => {
        // Usa el balance dinámico
        const balance = currentSellBalance;

        // El gas solo se resta si es la moneda nativa (ORIGEN)
        const gasFee = selectedToken === 'ORIGEN' ? 0.04 : 0;
        const maxAmount = balance - gasFee;

        if (!balance || maxAmount <= 0) {
            setSellUSDTAmount("0");
            setSellTokenAmount("0");
            return;
        }

        const syntheticEvent = {
            target: { value: maxAmount.toString() }
        };
        // Llama al manejador de input modificado
        handleSellAmountChange(syntheticEvent);
    };


    // 2. Modificamos la función onChange para añadir la validación
    const handleSellAmountChange = (e) => {
        let newAmount = e.target.value;

        // Lógica de balance dinámico
        const balance = currentSellBalance;
        const gasFee = selectedToken === 'ORIGEN' ? 0.04 : 0;
        const maxAllowed = balance - gasFee;

        if (balance && newAmount !== "" && parseFloat(newAmount) > maxAllowed) {
            newAmount = maxAllowed.toString();
        }

        setSellUSDTAmount(newAmount); // El estado de este input

        const price = getTokenPrice();
        const sellPrice = price;

        if (price > 0 && newAmount !== "") {
            const tokenValue = (parseFloat(newAmount) * sellPrice).toFixed(2);
            setSellTokenAmount(tokenValue);
        } else {
            setSellTokenAmount("");
        }
    };

    const handleModeSelection = async (newMode) => {
        setMode(newMode);
        if (walletAddress && walletAddress.length > 0) {
            if (newMode === 'buy') {
                Swal.fire({
                    title: "Switching to BUY mode",
                    text: "Preparing Payment Network (Polygon). Please accept any network switch request.",
                    icon: "info",
                    timer: 2500,
                    showConfirmButton: false,
                    background: '#1E2329',
                    color: '#ffffff',
                    customClass: {
                        popup: 'border-none rounded-[24px]'
                    }
                });
                await handleSwitchToPolygon();
            } else {
                Swal.fire({
                    title: "Switching to SELL mode",
                    text: "Preparing Orden Global Network. Please accept any network switch request.",
                    icon: "info",
                    timer: 2500,
                    showConfirmButton: false,
                    background: '#1E2329',
                    color: '#ffffff',
                    customClass: {
                        popup: 'border-none rounded-[24px]'
                    }
                });
                // Proactive switch based on selected token
                if (selectedToken === 'ORIGEN') {
                    await handleSwitchToOrdenGlobal();
                } else {
                    await handleSwitchToPolygon();
                }
            }
        }
    };

    // Resetea los campos cuando cambia el token
    const handleTokenSelectionChange = async (e) => {
        const newToken = e.target.value;
        setSelectedToken(newToken);
        setBuyUsdtAmount("");
        setBuyTokenAmount("");
        setSellTokenAmount("");
        setSellUSDTAmount("");

        // Proactive network switch on token change in SELL mode
        if (mode === 'sell' && walletAddress && walletAddress.length > 0) {
            if (newToken === 'ORIGEN') {
                await handleSwitchToOrdenGlobal();
            } else {
                await handleSwitchToPolygon();
            }
        }
    };

    // --- FUNCIONES DE TRANSACCIÓN ---

    const handleSellToken = () => {
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
        const tokenReceiverAddress = walletAddress
        const { providerUrl, network, networkId, usdtAddress } = selectedNetwork

        if (usdtAmount == 0 || tokenAmount == 0 || tokenReceiverAddress.lenght > 42) {
            alert('fill the gaps')
        } else {
            let data = { usdtAmount, usdtAddress, tokenName, tokenAmount, network, networkId, tokenReceiverAddress, providerUrl }
            console.log(data)

            if (OGUSDTBalance < usdtAmount) { // Comprobación de liquidez primero
                Swal.fire({
                    title: "Not enough liquidity",
                    text: "Contact Orden Global Team",
                    icon: "warning"
                });
                return;
            }

            // --- INICIO DE LA LÓGICA FALTANTE ---
            // Necesitas llamar a la función de venta correcta
            if (selectedToken === 'ORIGEN') {
                sellOrigen(data);
            } else if (selectedToken === 'AUKA') {
                // Tu contexto usa 'transferUSDTfromAUKA' para vender AUKA
                transferUSDTfromAUKA(data);
            } else if (selectedToken === 'USDK') {
                sellUSDK(data); // Usar la función importada
            }
            // --- FIN DE LA LÓGICA FALTANTE ---
        }
    };
    const handleBuyToken = () => { // MODIFICADO: Nombre (antes handleBuyOrigen)

        if (currentChainId != '0x89') {
            Swal.fire({
                title: "Chage to Polygon Network",
                icon: "warning"
            });
            return;
        }
        // Esta lógica ya era genérica
        const tokenName = selectedToken
        const tokenAmount = buyTokenAmount
        const usdtAmount = buyUsdtAmount
        const tokenReceiverAddress = walletAddress
        const { providerUrl, network, networkId, usdtAddress } = selectedNetwork

        if (usdtAmount == 0 || tokenAmount == 0 || tokenReceiverAddress.lenght > 42) {
            alert('fill the gaps')
        } else {
            let data = { usdtAmount, usdtAddress, tokenName, tokenAmount, network, networkId, tokenReceiverAddress, providerUrl }
            console.log(data)

            // --- MODIFICADO: Añadido el caso para USDK ---
            if (selectedToken === 'AUKA') {
                if (aukaWalletBalance > tokenAmount) {
                    transferAUKA(data)
                } else {
                    // ... (alerta de liquidez)
                }

            } else if (selectedToken === 'ORIGEN') {
                if (OGbalanceORIGEN > tokenAmount) {
                    buyORIGEN(data)
                } else {
                    // ... (alerta de liquidez)
                }

            } else if (selectedToken === 'USDK') { // <-- AÑADIDO ESTE BLOQUE
                // Usamos los nuevos valores del contexto
                if (OGbalanceUSDK > tokenAmount) {
                    buyUSDK(data); // Llama a la nueva función de compra
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

    useEffect(() => {
        const { ethereum } = window;

        // Asegúrate de que MetaMask/ethereum esté disponible
        if (ethereum) {
            // Esta función se ejecutará cada vez que el usuario cambie de red en MetaMask
            const handleChainChanged = (chainId) => {
                console.log("MetaMask reportó un cambio de red a:", chainId);
                setCurrentChainId(chainId); // Actualiza el estado global
            };

            // Suscribirse al evento
            ethereum.on('chainChanged', handleChainChanged);

            // Es una buena práctica limpiar el listener cuando el componente se desmonte
            return () => {
                ethereum.removeListener('chainChanged', handleChainChanged);
            };
        }
    }, []); // El array vacío asegura que esto solo se ejecute una vez

    if (!init) return null; // Previene renderizado antes de inicializar partículas

    return (
        <main className="h-screen overflow-y-auto bg-gradient-to-b from-[#05071c] via-[#0a1a3a] to-[#020617] flex flex-col">
            {/* <Particles
                id="tsparticles"
                className="!absolute !inset-0 !h-full !w-full"
                particlesLoaded={particlesLoaded}
                options={options}
            /> */}

            {/* Contenido principal: Texto + Card */}
            <div className="relative z-10 flex-1 flex flex-col lg:flex-row items-center justify-start lg:justify-between max-w-6xl mx-auto w-full px-4 py-10 ">                <div className="max-w-xl text-center lg:text-left ">
                <h1 className="text-5xl sm:text-6xl md:text-6xl lg:text-[60px] font-bold leading-tight lg:leading-[1.2] pb-6">
                    Buy Crypto Tokens<br />
                    <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 text-transparent bg-clip-text">
                        By ORDEN EXCHANGE
                    </span>
                </h1>
                {/* <p className="mt-4 text-gray-400 text-xl sm:text-2xl md:text-3xl lg:text-[42px]">
                    Use your credit card or Binance wallet to buy.
                </p> */}
            </div>

                {/* Buy/Sell Card */}
                <div className="w-[400px] rounded-xl shadow-lg overflow-hidden">
                    {/* Buy/Sell Card */}
                    <div className="w-[400px] rounded-xl shadow-lg overflow-hidden ">
                        <div className="flex">
                            <button
                                onClick={() => handleModeSelection('buy')}
                                className={`flex-1 py-3 text-xl font-semibold ${mode === 'buy'
                                    ? 'bg-[#05071c] text-white'
                                    : 'bg-[#0A1A3A] text-gray-400 hover:bg-[#05071c]'
                                    }`}
                            >
                                BUY
                            </button>
                            <button
                                onClick={() => handleModeSelection('sell')}
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
                                            {/* <option>Binance Pay</option>
                                            <option>Credit / Debit card</option> */}
                                        </select>
                                    </div>


                                    <div>
                                        <div className="flex justify-between items-center">
                                            <label className="block text-xl text-gray-400">Spend USDT</label>

                                            {walletAddress && currentChainId === '0x89' && (
                                                <span className="text-sm text-gray-500">
                                                    Balance: {parseFloat(usdtWalletBalance).toFixed(2)}
                                                </span>
                                            )}
                                        </div>

                                        {/* 1. Contenedor con posición relativa */}
                                        <div className="relative mt-1">
                                            <input
                                                value={buyUsdtAmount}
                                                onChange={handleBuyUsdtChange}
                                                placeholder="0.00"
                                                type="number"
                                                // 2. Padding a la derecha para el botón
                                                className="w-full bg-[#0A1A3A] text-white p-2 pr-14 rounded border border-white/10"
                                            />
                                            {/* 3. Botón MAX con posición absoluta */}
                                            <button
                                                onClick={handleSetMaxUsdt}
                                                className="absolute inset-y-0 right-0 px-3 flex items-center bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-r"
                                            >
                                                MAX
                                            </button>
                                        </div>
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
                                                <button onClick={handleBuyToken} className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 font-bold py-3 mt-3 rounded text-xl">
                                                    BUY {selectedToken}
                                                </button>
                                            ) : (
                                                // NO, está en la red incorrecta. Mostramos el botón para cambiar de red.
                                                <button onClick={handleSwitchToPolygon} className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 font-bold py-3 mt-3 rounded text-xl">
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
                                        <div className="flex justify-between items-center">
                                            <label className="block text-xl text-gray-400">Spend {selectedToken}</label>
                                            {walletAddress && currentChainId === '0x2154' && (
                                                <span className="text-sm text-gray-500">
                                                    Balance: {currentSellBalance.toFixed(4)}                                                </span>
                                            )}
                                        </div>

                                        {/* 1. Contenedor con posición relativa */}
                                        <div className="relative mt-1">
                                            <input
                                                value={sellUSDTAmount}
                                                onChange={handleSellAmountChange}
                                                placeholder="0.00"
                                                type="number"
                                                // 2. Padding a la derecha para hacer espacio al botón
                                                className="w-full bg-[#0A1A3A] text-white p-2 pr-14 rounded border border-white/10"
                                            />
                                            {/* 3. Botón con posición absoluta */}
                                            <button
                                                onClick={handleSetMaxSellToken}
                                                className="absolute inset-y-0 right-0 px-3 flex items-center bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-r"
                                            >
                                                MAX
                                            </button>
                                        </div>
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
                                                <button onClick={handleSellToken} className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 font-bold py-3 mt-3 rounded text-xl">
                                                    SELL {selectedToken}
                                                </button>
                                            ) : (
                                                // NO, está en la red incorrecta. Mostramos el botón para cambiar de red.
                                                <button onClick={handleSwitchToOrdenGlobal} className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 font-bold py-3 mt-3 rounded text-xl">
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