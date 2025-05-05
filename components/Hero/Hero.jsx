import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";

const Hero = () => {
    const [init, setInit] = useState(false);
    const [mode, setMode] = useState('buy');

    // this should be run only once per application lifetime
    useEffect(() => {
        initParticlesEngine(async (engine) => {
            // you can initiate the tsParticles instance (engine) here, adding custom shapes or presets
            // this loads the tsparticles package bundle, it's the easiest method for getting everything ready
            // starting from v2 you can add only the features you need reducing the bundle size
            //await loadAll(engine);
            //await loadFull(engine);
            await loadSlim(engine);
            //await loadBasic(engine);
        }).then(() => {
            setInit(true);
        });
    }, []);

    const particlesLoaded = (container) => {
        // console.log(container);
    };

    const options = useMemo(
        () => ({
            background: {
                color: {
                    value: "transparent",
                },
            },
            fpsLimit: 120,
            interactivity: {
                events: {
                    onClick: {
                        enable: true,
                        mode: "push",
                    },
                    onHover: {
                        enable: true,
                        mode: "repulse",
                    },
                },
                modes: {
                    push: {
                        quantity: 4,
                    },
                    repulse: {
                        distance: 200,
                        duration: 0.4,
                    },
                },
            },
            particles: {
                color: {
                    value: "#ffffff",
                },
                links: {
                    enable: false, // 👈 esto desactiva las líneas
                    color: "#ffffff",
                    distance: 150,
                    opacity: 0.5,
                    width: 1,
                },
                move: {
                    direction: "none",
                    enable: true,
                    outModes: {
                        default: "bounce",
                    },
                    random: false,
                    speed: 3,
                    straight: false,
                },
                number: {
                    density: {
                        enable: true,
                    },
                    value: 80,
                },
                opacity: {
                    value: 0.5,
                },
                shape: {
                    type: "circle",
                },
                size: {
                    value: { min: 1, max: 5 },
                },
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
                    {/* Left: Hero Text */}
                    <div className="max-w-xl text-center lg:text-left">
                        <h1 className="text-5xl sm:text-6xl md:text-6xl lg:text-[60px] font-bold leading-tight lg:leading-[1.2]">
                            Buy Crypto Tokens<br />
                            <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-transparent bg-clip-text">
                                By ORDEN GLOBAL
                            </span>
                        </h1>
                        <p className="mt-4 text-gray-400 text-xl sm:text-2xl md:text-3xl lg:text-[42px]">
                            Use your credit card or Binance wallet to buy.
                        </p>

                        {/* <p className="mt-2 text-xs text-gray-500 italic">
                *También puede vender cripto directamente en efectivo hacia su cuenta bancaria.
              </p> */}
                    </div>

                    {/* Right: Card */}
                    <div className="w-[400px] rounded-xl shadow-lg overflow-hidden ">
                        {/* Tabs */}
                        <div className="flex">
                            <button
                                onClick={() => setMode('buy')}
                                className={`flex-1 py-3 text-sm font-semibold ${mode === 'buy'
                                    ? 'bg-[#16191C] text-white'
                                    : 'bg-[#101214] text-gray-400 hover:bg-[#16191C]'
                                    }`}
                            >
                                buy
                            </button>
                            <button
                                onClick={() => setMode('sell')}
                                className={`flex-1 py-3 text-sm font-semibold ${mode === 'sell'
                                    ? 'bg-[#16191C] text-white'
                                    : 'bg-[#101214] text-gray-400 hover:bg-[#16191C]'
                                    }`}
                            >
                                sell
                            </button>
                        </div>

                        {/* Contenido de la tarjeta */}
                        <div className="bg-[#16191C] p-6 space-y-4">
                            {mode === 'buy' ? (
                                <div>
                                    <div>
                                        <label className="block text-sm text-gray-400">
                                            Buy
                                        </label>
                                        <select className="w-full mt-1 bg-[#16191C] text-white p-2 rounded border-[1px] border-[rgba(255,255,255,0.16)]">
                                            <option>USDT - Binance Pay</option>
                                            <option>BNB - Metamask</option>
                                            <option>Credit / Debit card</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm text-gray-400">Token</label>
                                        <select className="w-full mt-1 bg-[#16191C] text-white p-2 rounded border-[1px] border-[rgba(255,255,255,0.16)]">
                                            <option>ONDK</option>
                                            <option>AGKA</option>
                                            <option>AUKA</option>
                                            <option>ORIGEN</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-400">
                                            Spend
                                        </label>
                                        <input className="w-full mt-1 bg-[#16191C] text-white p-2 rounded border-[1px] border-[rgba(255,255,255,0.16)]" />

                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-400">
                                            Receive
                                        </label>
                                        <input className="w-full mt-1 bg-[#16191C] text-white p-2 rounded border-[1px] border-[rgba(255,255,255,0.16)]" />

                                    </div>
                                    <button className="w-full bg-gray-600 py-2 mt-3 rounded">Conect Wallet</button>


                                </div>
                            ) : (
                                <div>
                                    <div>
                                        <label className="block text-sm text-gray-400">
                                            SELL
                                        </label>
                                        <select className="w-full mt-1 bg-[#16191C] text-white p-2 rounded border-[1px] border-[rgba(255,255,255,0.16)]">
                                            <option>USDT - Binance Pay</option>
                                            <option>BNB - Metamask</option>
                                            <option>Credit / Debit card</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm text-gray-400">Activo</label>
                                        <select className="w-full mt-1 bg-[#16191C] text-white p-2 rounded border-[1px] border-[rgba(255,255,255,0.16)]">                                    <option>ORIGEN</option>
                                            <option>ONDK</option>
                                            <option>AGKA</option>
                                            <option>AUKA</option>
                                        </select>
                                    </div>

                                    <button className="w-full bg-gray-600 py-2 rounded mt-3 ">Conect Wallet</button>


                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </main>

        );
    };
}

export default Hero;
