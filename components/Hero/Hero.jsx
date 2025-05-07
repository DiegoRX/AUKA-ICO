import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import Cookies from "js-cookie";
import { useAppContext } from "@context/state";
import Swal from 'sweetalert2'

const Hero = ({ address, setShowModal }) => {
    const [init, setInit] = useState(false);
    const [mode, setMode] = useState('buy');
    const [AUKAPrice, setAUKAPrice] = useState(0);
    const [AGKAPrice, setAGKAPrice] = useState(0);
    const [ONDKPrice] = useState(1.8); // Precio fijo
    const [ORIGENPrice, setORIGENPrice] = useState(0);
    const [sellTokenAmount, setSellTokenAmount] = useState(""); // manejar como string

    const [sellUSDTAmount, setSellUSDTAmount] = useState(0);
    const [selectedToken, setSelectedToken] = useState("ORIGEN");
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
        // Esto es por tu animación, lo mantengo como ejemplo:
        initParticlesEngine(async (engine) => {
            await loadSlim(engine);
        }).then(() => {
            setInit(true);
        });
    }, []);

    // Obtener el precio según el token seleccionado
    const getTokenPrice = () => {
        switch (selectedToken) {
            case "AUKA": return AUKAPrice;
            case "AGKA": return AGKAPrice;
            case "ONDK": return ONDKPrice;
            case "ORIGEN": return ORIGENPrice;
            default: return 0;
        }
    };

    // Manejar cambios de amount o token
    const handleAmountChange = (e) => {
        const value = parseFloat(e.target.value) || 0;
        setSellTokenAmount(value);
        setSellUSDTAmount(value * getTokenPrice());
    };

    const handleTokenChange = (e) => {
        const token = e.target.value;
        setSellTokenAmount("")
        setSellUSDTAmount(0)
        setSelectedToken(token);
        setSellUSDTAmount(sellTokenAmount * getTokenPrice(token));
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
        if (usdtWalletBalance > sellUSDTAmount && sellUSDTAmount != 0) {
            transferUSDTfromAUKA(data)
        } else {
            Swal.fire({
                title: "Not enough liquidity",
                text: "Contact Orden Global Team",
                icon: "warning",
                background: "#101214",
                color: "white"
            });
        }
    }
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
            <main className="flex-1 overflow-y-auto p-10 bg-gradient-to-b from-black via-gray-900 to-gray-950 flex items-center">
                <Particles
                    id="tsparticles"
                    className="!absolute !inset-0 !h-full !w-full"
                    particlesLoaded={particlesLoaded}
                    options={options}
                />
                <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center lg:items-start justify-between gap-8 w-full z-20">
                    {/* Hero Text */}
                    <div className="max-w-xl text-center lg:text-left">
                        <h1 className="text-5xl sm:text-6xl md:text-6xl lg:text-[60px] font-bold leading-tight lg:leading-[1.2]">
                            Buy Crypto Tokens<br />
                            <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-transparent bg-clip-text">
                                By ORDEN EXCHANGE
                            </span>
                        </h1>
                        <p className="mt-4 text-gray-400 text-xl sm:text-2xl md:text-3xl lg:text-[42px]">
                            Use your credit card or Binance wallet to buy.
                        </p>
                    </div>

                    {/* Buy/Sell Card */}
                    <div className="w-[400px] rounded-xl shadow-lg overflow-hidden ">
                        <div className="flex">
                            <button
                                onClick={() => setMode('buy')}
                                className={`flex-1 py-3 text-sm font-semibold ${mode === 'buy'
                                    ? 'bg-[#16191C] text-white'
                                    : 'bg-[#101214] text-gray-400 hover:bg-[#16191C]'
                                    }`}
                            >
                                BUY
                            </button>
                            <button
                                onClick={() => setMode('sell')}
                                className={`flex-1 py-3 text-sm font-semibold ${mode === 'sell'
                                    ? 'bg-[#16191C] text-white'
                                    : 'bg-[#101214] text-gray-400 hover:bg-[#16191C]'
                                    }`}
                            >
                                SELL
                            </button>
                        </div>

                        <div className="bg-[#16191C] p-6 space-y-4">
                            {mode === 'buy' ? (
                                <div>
                                    <div>
                                        <label className="block text-sm text-gray-400">Buy</label>
                                        <select className="w-full mt-1 bg-[#16191C] text-white p-2 rounded border border-white/10">
                                            <option>USDT - Binance Pay</option>
                                            <option>BNB - Metamask</option>
                                            <option>Credit / Debit card</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm text-gray-400">Token</label>
                                        <select className="w-full mt-1 bg-[#16191C] text-white p-2 rounded border border-white/10">
                                            <option>ONDK - ${ONDKPrice} USDT</option>
                                            <option>AGKA - ${AGKAPrice} USDT</option>
                                            <option>AUKA - ${AUKAPrice} USDT</option>
                                            <option>ORIGEN - ${ORIGENPrice.toFixed(4)} USDT</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm text-gray-400">Spend</label>
                                        <input className="w-full mt-1 bg-[#16191C] text-white p-2 rounded border border-white/10" />
                                    </div>

                                    <div>
                                        <label className="block text-sm text-gray-400">Receive</label>
                                        <input className="w-full mt-1 bg-[#16191C] text-white p-2 rounded border border-white/10" />
                                    </div>

                                    <button className="w-full bg-gray-600 py-2 mt-3 rounded">Connect VetaWallet</button>
                                </div>
                            ) : (
                                <div>
                                    <div>
                                        <label className="block text-sm text-gray-400">Sell Token</label>
                                        <select
                                            className="w-full mt-1 bg-[#16191C] text-white p-2 rounded border border-white/10"
                                            value={selectedToken}
                                            onChange={handleTokenChange}
                                        >
                                            <option value="ORIGEN">ORIGEN</option>
                                            <option value="ONDK">ONDK</option>
                                            <option value="AGKA">AGKA</option>
                                            <option value="AUKA">AUKA</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-400">Amount</label>
                                        <input
                                            type="text"
                                            className="w-full mt-1 bg-[#16191C] text-white p-2 rounded border border-white/10"
                                            value={sellTokenAmount}
                                            onChange={handleAmountChange}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-400">USDT you receive</label>
                                        <div className="text-white mt-1">{sellUSDTAmount.toFixed(2)}</div>
                                    </div>
                                    {(address != '') ? <button onClick={() => sellTokens()} className="w-full bg-gray-600 py-2 mt-3 rounded">Buy Tokens</button> : <button onClick={() => setShowModal(true)} className="w-full bg-gray-600 py-2 mt-3 rounded">Connect VetaWallet</button>}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        );
    }
};

export default Hero;