import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";

const Hero = () => {
    const [init, setInit] = useState(false);

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
                    <div className="bg-gray-800 rounded-xl shadow-lg w-[400px] p-6 space-y-4">
                        <div className="flex space-x-2">
                            <button className="flex-1 bg-gray-700 rounded py-2 font-bold">Comprar</button>
                            <button className="flex-1 hover:bg-gray-700 rounded py-2 text-gray-400">Vender</button>
                        </div>

                        <div className="mt-6">
                            <label className="block text-sm text-gray-400">Compra con</label>
                            <select className="w-full mt-1 bg-gray-700 text-white p-2 rounded">
                                <option>USD - US Dollar</option>
                            </select>
                        </div>

                        <div className="mt-6">
                            <label className="block text-sm text-gray-400">Activo</label>
                            <div className="mt-1 bg-gray-700 p-2 rounded flex items-center justify-between">
                                <span>Ethereum</span>
                                <span>→</span>
                            </div>
                        </div>

                        <button className="w-full bg-gray-600 py-2 rounded mt-6">Conectar Billetera</button>

                        <div className="mt-6">
                            <p className="text-sm text-gray-400 mb-2">Proveedores Disponibles</p>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between bg-gray-700 p-2 rounded">
                                    <span>Banxa</span> <span>→</span>
                                </div>
                                <div className="flex items-center justify-between bg-gray-700 p-2 rounded">
                                    <span>Rampa de entrada</span>
                                    <span className="bg-gray-600 text-xs px-2 py-0.5 rounded-full">AGGREGATOR</span>
                                </div>
                                <div className="flex items-center justify-between bg-gray-700 p-2 rounded">
                                    <span>Mt Pelerin</span>
                                    <div className="flex gap-1">
                                        <span className="bg-gray-600 text-xs px-2 py-0.5 rounded-full">SIN KYC</span>
                                        <span className="bg-gray-600 text-xs px-2 py-0.5 rounded-full">NO-USA</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

        );
    };
}

export default Hero;
