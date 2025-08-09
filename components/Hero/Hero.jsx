import React, { useEffect, useMemo, useState } from "react";
// import Image from "next/image"; // No se usa en este componente
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import Cookies from "js-cookie";
import { useAppContext } from "@context/state";
import Swal from 'sweetalert2';
import TokenSelect from "@components/TokenSelect";
import TokenTable from "@components/TokenTable";

const Hero = ({ address, setShowModal: setShowParentModal }) => { // Renombrar para evitar confusiones
    const [init, setInit] = useState(false);
    const [mode, setMode] = useState('buy');
    const [AUKAPrice, setAUKAPrice] = useState(0);
    const [AGKAPrice, setAGKAPrice] = useState(0);
    const [ONDKPrice] = useState(1.8); // Precio fijo
    const [ORIGENPrice, setORIGENPrice] = useState(0);
    const [sellTokenAmount, setSellTokenAmount] = useState(""); // manejar como string
    const [sellUSDTAmount, setSellUSDTAmount] = useState(0);
    const [selectedToken, setSelectedToken] = useState("ORIGEN");

    // Estados para el formulario de Compra
    const [buyMethod, setBuyMethod] = useState("USDT - Binance Pay"); // Método de pago por defecto
    const [showCardModal, setShowCardModal] = useState(false); // Estado para mostrar/ocultar el modal
    const [spendUSDTInput, setSpendUSDTInput] = useState(""); // Estado para el input de 'Spend USDT' en modo 'buy'

    // Estados para la dirección de recepción en compras con tarjeta
    const [receiveOption, setReceiveOption] = useState('connect'); // 'connect' o 'manual'
    const [manualReceiveAddress, setManualReceiveAddress] = useState(''); // Dirección ingresada manualmente

    const { connectWallet, walletAddress, transferAUKA, transferORIGEN, ondkBalance, transferUSDTfromAUKA, transferUSDTfromORIGEN, aukaWalletBalance, origenWalletBalance, usdtWalletBalance } = useAppContext();

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
    }, [sellTokenAmount]);

    useEffect(() => {
        initParticlesEngine(async (engine) => {
            await loadSlim(engine);
        }).then(() => {
            setInit(true);
        });
    }, []);

    const tokenPrices = {
        ORIGEN: ORIGENPrice,
        ONDK: ONDKPrice,
        AGKA: AGKAPrice,
        AUKA: AUKAPrice,
    };

    const getTokenPrice = (token = selectedToken) => tokenPrices[token] || 0;

    const handleAmountChange = (e) => {
        const value = parseFloat(e.target.value) || 0;
        setSellTokenAmount(value);
        setSellUSDTAmount(value * getTokenPrice());
    };

    const handleTokenChange = (e) => {
        const token = e.target.value;
        setSellTokenAmount("");
        setSellUSDTAmount(0);
        setSelectedToken(token);
        // Nota: Esta línea podría causar problemas si 'sellTokenAmount' aún no se ha actualizado
        setSellUSDTAmount(parseFloat(sellTokenAmount || 0) * getTokenPrice(token));
    };

    const handleSpendUSDTChange = (e) => {
        const value = e.target.value;
        setSpendUSDTInput(value);

        const usdtValue = parseFloat(value) || 0;
        const tokenPrice = getTokenPrice();
        if (tokenPrice > 0) {
            const tokensReceived = usdtValue / tokenPrice;
            setSellTokenAmount(tokensReceived);
        } else {
            setSellTokenAmount(0);
        }
        setSellUSDTAmount(usdtValue);
    };

    const handleBuyMethodChange = (e) => {
        setBuyMethod(e.target.value);
    };

    // Manejar el clic en el botón principal de 'Buy'
    const handleBuyProceed = () => {
        if (buyMethod === "Credit / Debit card") {
            const amount = parseFloat(spendUSDTInput);
            if (isNaN(amount) || amount <= 0) {
                Swal.fire({
                    title: "Monto Inválido",
                    text: "Por favor, ingresa un monto válido en USDT para gastar.",
                    icon: "warning",
                    background: "#101214",
                    color: "white"
                });
                return;
            }

            // Verificar dirección de recepción antes de mostrar el modal
            if (receiveOption === 'connect' && !walletAddress) {
                 Swal.fire({
                    title: "Billetera No Conectada",
                    text: "Por favor, conecta tu VetaWallet o ingresa una dirección manualmente.",
                    icon: "warning",
                    background: "#101214",
                    color: "white"
                });
                return; // No mostrar el modal si no hay dirección
            }
            if (receiveOption === 'manual' && (!manualReceiveAddress || manualReceiveAddress.trim() === '')) {
                 Swal.fire({
                    title: "Dirección Requerida",
                    text: "Por favor, ingresa una dirección de billetera para recibir los tokens.",
                    icon: "warning",
                    background: "#101214",
                    color: "white"
                });
                return; // No mostrar el modal si no hay dirección
            }

            setShowCardModal(true);
        } else {
            Swal.fire({
                title: "Método de Pago Seleccionado",
                text: `Seleccionaste: ${buyMethod}. La integración para este método aún no está implementada.`,
                icon: "info",
                background: "#101214",
                color: "white"
            });
        }
    };

    // Manejar el clic en "Conectar VetaWallet" dentro del modal
    const handleConnectInModal = async () => {
         try {
            await connectWallet(); // Intenta conectar la billetera
             // La dirección se actualizará automáticamente en `walletAddress` gracias al contexto
             // El modal se cierra, y el usuario puede hacer clic en "Proceed to Payment" nuevamente
             setShowCardModal(false);
             Swal.fire({
                title: "Billetera Conectada",
                text: "Tu VetaWallet ha sido conectada. Ahora puedes proceder con el pago.",
                icon: "success",
                background: "#101214",
                color: "white"
            });
         } catch (err) {
             console.error("Error connecting wallet:", err);
             Swal.fire({
                title: "Error",
                text: "No se pudo conectar la billetera. Inténtalo de nuevo.",
                icon: "error",
                background: "#101214",
                color: "white"
            });
         }
    };

    useEffect(() => {
        const numericAmount = parseFloat(sellTokenAmount);
        if (!isNaN(numericAmount)) {
            setSellUSDTAmount(numericAmount * getTokenPrice());
        } else {
            setSellUSDTAmount(0);
        }
    }, [sellTokenAmount, selectedToken]);

    const sellTokens = () => {
        // Asegúrate de que 'data' esté definido
        if (usdtWalletBalance > sellUSDTAmount && sellUSDTAmount != 0) {
            // transferUSDTfromAUKA(data)
            console.log("Lógica de venta de tokens iría aquí");
        } else {
            Swal.fire({
                title: "No hay suficiente liquidez",
                text: "Contacta al Equipo de Orden Global",
                icon: "warning",
                background: "#101214",
                color: "white"
            });
        }
    };

    const handleCardPaymentSubmit = (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);
        const paymentData = Object.fromEntries(formData.entries());

        // Determinar la dirección de recepción final
        let finalReceiveAddress;
        if (receiveOption === 'connect') {
            finalReceiveAddress = walletAddress;
        } else { // receiveOption === 'manual'
            finalReceiveAddress = manualReceiveAddress.trim();
        }

        console.log("Datos de Pago Enviados:", {
            ...paymentData,
            token: selectedToken,
            amountUSDT: sellUSDTAmount,
            receiveAddress: finalReceiveAddress
        });

        // --- Aquí se integraría con la API de n1co ---
        // Enviar `finalReceiveAddress`, `selectedToken`, `sellUSDTAmount`, y `paymentData` a tu backend.

        alert(`Procesando pago de ${sellUSDTAmount} USDT para comprar ${selectedToken}. Los tokens se enviarán a: ${finalReceiveAddress}. Revisa la consola para los datos.`);
        setShowCardModal(false);
    };

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

    if (init) {
        return (
            <main className="h-screen overflow-y-auto bg-[#05071c] flex flex-col">
                <Particles
                    id="tsparticles"
                    className="!absolute !inset-0 !h-full !w-full"
                    particlesLoaded={particlesLoaded}
                    options={options}
                />
                {/* Contenido principal: Texto + Card */}
                <div className="relative z-10 flex-1 flex flex-col lg:flex-row items-center justify-between max-w-6xl mx-auto w-full px-4 py-10 h-[100vh]">
                    {/* Hero Text */}
                    <div className="max-w-xl text-center lg:text-left ">
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
                        <div className="flex">
                            <button
                                onClick={() => setMode('buy')}
                                className={`flex-1 py-3 text-xl font-semibold ${mode === 'buy'
                                    ? 'bg-[#05071c] text-white'
                                    : 'bg-[#101214] text-gray-400 hover:bg-[#16191C]'
                                    }`}
                            >
                                BUY
                            </button>
                            <button
                                onClick={() => setMode('sell')}
                                className={`flex-1 py-3 text-xl font-semibold ${mode === 'sell'
                                    ? 'bg-[#05071c] text-white'
                                    : 'bg-[#101214] text-gray-400 hover:bg-[#16191C]'
                                    }`}
                            >
                                SELL
                            </button>
                        </div>
                        <div className="bg-[rgb(11,17,51)] p-6 space-y-4">
                            {mode === 'buy' ? (
                                <div>
                                    <div>
                                        <label className="block text-xl text-gray-400">Buy</label>
                                        <select
                                            className="w-full mt-1 bg-[#05071c] text-white p-2 rounded border border-white/10"
                                            value={buyMethod}
                                            onChange={handleBuyMethodChange}
                                        >
                                            <option>USDT - Binance Pay</option>
                                            <option>BNB - Metamask</option>
                                            <option>Credit / Debit card</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xl text-gray-400">Token</label>
                                        <TokenSelect
                                            selectedToken={selectedToken}
                                            onChange={handleTokenChange}
                                            prices={tokenPrices}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xl text-gray-400">Spend USDT</label>
                                        <input
                                            type="number"
                                            className="w-full mt-1 bg-[#05071c] text-white p-2 rounded border border-white/10"
                                            value={spendUSDTInput}
                                            onChange={handleSpendUSDTChange}
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xl text-gray-400">Receive (Estimated)</label>
                                        <input
                                            className="w-full mt-1 bg-[#05071c] text-white p-2 rounded border border-white/10"
                                            value={sellTokenAmount ? sellTokenAmount.toFixed(6) : '0.000000'}
                                            readOnly
                                        />
                                    </div>
                                    <button
                                        onClick={handleBuyProceed}
                                        className="w-full bg-[rgb(0,190,255)] text-white py-2 mt-3 rounded-full"
                                    >
                                        {buyMethod === "Credit / Debit card" ? "Proceed to Payment" : "Connect VetaWallet"}
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    <div>
                                        <label className="block text-xl text-gray-400">Sell Token</label>
                                        <TokenSelect
                                            selectedToken={selectedToken}
                                            onChange={handleTokenChange}
                                            prices={tokenPrices}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xl text-gray-400">Spend</label>
                                        <input
                                            type="text"
                                            className="w-full mt-1 bg-[#05071c] text-white p-2 rounded border border-white/10 text-xl "
                                            value={sellTokenAmount}
                                            onChange={handleAmountChange}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xl text-gray-400">USDT you receive</label>
                                        <div className="text-white mt-0 text-right text-3xl ">${sellUSDTAmount.toFixed(2)}</div>
                                    </div>
                                    {(address != '') ? (<>
                                        <div>
                                            <label className="block text-xl text-gray-400">VetaWallet Receiver Address</label>
                                            <div className="text-white mt-1">{address}</div>
                                        </div>
                                    </>) : (<></>)}
                                    {(address != '') ?
                                        <button onClick={() => sellTokens()} className="w-full bg-[rgb(0,190,255)] text-white py-2 mt-3 rounded-full ">Buy Tokens</button>
                                        :
                                        <button onClick={() => setShowParentModal(true)} className="w-full bg-[rgb(0,190,255)] text-white py-2 mt-3 rounded-full ">Connect VetaWallet</button>
                                    }
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                {/* TokenTable debajo del contenido principal */}
                <div className="relative z-10 w-full max-w-6xl mx-auto px-4 pb-20">
                    <TokenTable prices={tokenPrices} />
                </div>

                {/* Modal de Pago con Tarjeta de Crédito */}
                {showCardModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
                        <div className="bg-[#05071c] rounded-lg shadow-xl p-6 w-full max-w-md border border-gray-700">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-white">Pago con Tarjeta de Crédito/Débito</h2>
                                <button
                                    onClick={() => setShowCardModal(false)}
                                    className="text-gray-400 hover:text-white text-2xl"
                                >
                                    &times;
                                </button>
                            </div>
                            {/* Mostrar detalles de la compra */}
                            <div className="mb-4 p-3 bg-[#16191C] rounded">
                                <p className="text-gray-300 text-sm">Estás comprando:</p>
                                <p className="text-white font-semibold">{selectedToken}</p>
                                <p className="text-gray-300 text-sm">Monto a pagar:</p>
                                <p className="text-white font-semibold">{sellUSDTAmount.toFixed(2)} USDT</p>
                                <p className="text-gray-300 text-sm">Tokens estimados a recibir:</p>
                                <p className="text-white font-semibold">{sellTokenAmount ? sellTokenAmount.toFixed(6) : '0.000000'} {selectedToken}</p>
                            </div>

                            {/* Sección para elegir la dirección de recepción */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Dirección para recibir los tokens:
                                </label>
                                <div className="space-y-2">
                                    <div className="flex items-center">
                                        <input
                                            type="radio"
                                            id="receiveConnect"
                                            name="receiveOption"
                                            value="connect"
                                            checked={receiveOption === 'connect'}
                                            onChange={() => setReceiveOption('connect')}
                                            className="mr-2"
                                        />
                                        <label htmlFor="receiveConnect" className="text-gray-300">
                                            Conectar VetaWallet
                                        </label>
                                    </div>
                                    {receiveOption === 'connect' && (
                                        <div className="ml-6">
                                            {walletAddress ? (
                                                 <p className="text-green-400 text-sm">
    Conectado: {typeof walletAddress === 'string' ? `${walletAddress.substring(0, 10)}...${walletAddress.substring(walletAddress.length - 4)}` : 'Dirección inválida'}
</p>

                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={handleConnectInModal}
                                                    className="px-3 py-1 bg-[#16191C] text-white text-sm rounded border border-gray-600 hover:bg-gray-700"
                                                >
                                                    Conectar VetaWallet
                                                </button>
                                            )}
                                        </div>
                                    )}
                                    <div className="flex items-center">
                                        <input
                                            type="radio"
                                            id="receiveManual"
                                            name="receiveOption"
                                            value="manual"
                                            checked={receiveOption === 'manual'}
                                            onChange={() => setReceiveOption('manual')}
                                            className="mr-2"
                                        />
                                        <label htmlFor="receiveManual" className="text-gray-300">
                                            Ingresar Dirección Manualmente
                                        </label>
                                    </div>
                                    {receiveOption === 'manual' && (
                                        <div className="ml-6">
                                            <input
                                                type="text"
                                                placeholder="Ingrese la dirección de su billetera"
                                                value={manualReceiveAddress}
                                                onChange={(e) => setManualReceiveAddress(e.target.value)}
                                                className="w-full px-3 py-1 bg-[#16191C] text-white text-sm rounded border border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <form onSubmit={handleCardPaymentSubmit}>
                                {/* Campos de ejemplo - ajusta según los requisitos de la API de n1co */}
                                <div className="mb-4">
                                    <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-300 mb-1">
                                        Número de Tarjeta
                                    </label>
                                    <input
                                        type="text"
                                        id="cardNumber"
                                        name="cardNumber"
                                        required
                                        className="w-full px-3 py-2 bg-[#16191C] text-white rounded border border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="1234 5678 9012 3456"
                                    />
                                </div>
                                <div className="flex space-x-4 mb-4">
                                    <div className="flex-1">
                                        <label htmlFor="expiry" className="block text-sm font-medium text-gray-300 mb-1">
                                            Fecha de Vencimiento (MM/YY)
                                        </label>
                                        <input
                                            type="text"
                                            id="expiry"
                                            name="expiry"
                                            required
                                            className="w-full px-3 py-2 bg-[#16191C] text-white rounded border border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            placeholder="MM/YY"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label htmlFor="cvv" className="block text-sm font-medium text-gray-300 mb-1">
                                            CVV
                                        </label>
                                        <input
                                            type="text"
                                            id="cvv"
                                            name="cvv"
                                            required
                                            className="w-full px-3 py-2 bg-[#16191C] text-white rounded border border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            placeholder="123"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowCardModal(false)}
                                        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 focus:outline-none"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        // Verificar dirección antes de enviar
                                        disabled={
                                            (receiveOption === 'connect' && !walletAddress) ||
                                            (receiveOption === 'manual' && (!manualReceiveAddress || manualReceiveAddress.trim() === ''))
                                        }
                                        className={`px-4 py-2 rounded focus:outline-none ${((receiveOption === 'connect' && !walletAddress) || (receiveOption === 'manual' && (!manualReceiveAddress || manualReceiveAddress.trim() === ''))) ? 'bg-gray-500 text-gray-300 cursor-not-allowed' : 'bg-[rgb(0,190,255)] text-white hover:bg-blue-600'}`}
                                    >
                                        Pagar Ahora
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        );
    }
};

export default Hero;