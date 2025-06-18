import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import Image from "next/image";
import Hero from "@components/Hero/Hero"
import { jwtVerify } from "jose";
import Swal from "sweetalert2";
import { IoCloseSharp } from "react-icons/io5";
import { FaRegEye } from "react-icons/fa";
import { FaRegEyeSlash } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { MdOutlineCurrencyExchange, MdAccountBalanceWallet, MdSearch, MdSettings } from 'react-icons/md';
const Home = () => {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [address, setAddress] = useState('')
  const { register, handleSubmit, formState: { errors } } = useForm({
    mode: "onBlur",
  });
  const [showPassword, setShowPassword] = useState(false); // Estado para controlar la visibilidad de la contraseña
  const togglePasswordVisibility = () => setShowPassword((prev) => !prev); // Función para alternar la visibilidad

  const submitHandler = async (data) => {
    Swal.fire({
      background: "transparent",
      showConfirmButton: false,
      allowOutsideClick: false,
      showCloseButton: false,
      backdrop: false, // 🔥 quita el fondo oscuro
      html: `
      <div class="flex items-center justify-center">
        <div style="
          width: 48px;
          height: 48px;
          border: 4px solid #3b82f6;
          border-top: 4px solid transparent;
          border-radius: 9999px;
          animation: spin 1s linear infinite;
        "></div>
      </div>
    `,
      customClass: {
        popup: 'shadow-none',
      },
    });
    try {
      const res = await fetch("https://vetawallet-1a2e38ac52b1.herokuapp.com/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),

      });
      switch (res.status) {
        case 200:
          const json = await res.json();
          const decrypt = await jwtVerify(json.token, new TextEncoder().encode("secreto"));
          const address = decrypt.payload.address;
          if (typeof address === "string") {
            setAddress(address);
          }
          Swal.close();
          setShowModal(false);
          setShowLoginForm(false);
          break;
        case 401:
          console.log("Incorrect email or password");
          Swal.fire("Error", "Incorrect email or password", "error");
          break;
        default:
          console.log("Server error");
          Swal.fire("Error", "Server error", "error");
          break;
      }
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <aside className="fixed bottom-0 left-0 w-full h-16 bg-[#0D0F11] flex justify-around items-center z-30 md:hidden">
        <button className="flex flex-col items-center text-white text-sm">
          <MdOutlineCurrencyExchange className="text-2xl" />
          <span className="text-xs">Trade</span>

        </button>
        <button className="flex flex-col items-center text-white text-sm">
          <MdAccountBalanceWallet className="text-2xl" />
          <span className="text-xs">Wallet</span>
        </button>
        <button className="flex flex-col items-center text-white text-sm">
          <MdSearch className="text-2xl" />
          <span className="text-xs">Scan</span>
        </button>
        <button className="flex flex-col items-center text-white text-sm">
          <MdSettings className="text-2xl" />
          <span className="text-xs">Ajustes</span>
        </button>
      </aside>

      <aside className="hidden md:flex flex-col bg-[#0D0F11] h-screen w-20 lg:w-64 p-4 space-y-4 z-30">
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <Image src="https://i.ibb.co/ZJKFjCd/ordenex-logo.png" height={80} width={80} alt="ordenex-logo" />
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-2 w-full">
          <button className="flex items-center gap-2 bg-white/10 text-white font-semibold p-2 rounded justify-center lg:justify-start text-xl">
            <MdOutlineCurrencyExchange className="text-3xl" />
            <span className="hidden lg:inline">Buy/Sell Crypto</span>
          </button>
          <button className="flex items-center gap-2 hover:bg-gray-700 p-2 rounded justify-center lg:justify-start text-xl">
            <MdAccountBalanceWallet className="text-3xl" />
            <span className="hidden lg:inline">VetaWallet</span>
          </button>
          <button className="flex items-center gap-2 hover:bg-gray-700 p-2 rounded justify-center lg:justify-start text-xl">
            <MdSearch className="text-3xl" />
            <span className="hidden lg:inline">Orden Scan</span>
          </button>
        </nav>

        {/* Ajustes */}
        <div className="mt-auto w-full">
          <button className="flex items-center gap-2 hover:bg-gray-700 p-2 rounded justify-center lg:justify-start text-xl w-full">
            <MdSettings className="text-3xl" />
            <span className="hidden lg:inline">Ajustes</span>
          </button>
        </div>
      </aside>



      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden ">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 bg-[#0D0F11] border-b border-gray-700  z-20">
          <input
            type="text"
            placeholder="🔍 Búsqueda"
            className="bg-gray-700 text-white px-4 py-2 rounded w-1/2 placeholder-gray-400"
          />
          <button
            onClick={() => setShowModal(true)}
            className="bg-gray-700 px-4 py-2 rounded"
          >   Connect Wallet
          </button>
        </header>

        <Hero address={address} setShowModal={setShowModal} />
        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50">
            <div className="bg-gray-800 rounded-xl shadow-lg w-[400px] p-6 space-y-4 relative">
              {/* Close Button */}
              <button
                className="absolute top-3 right-4 text-gray-400 hover:text-white text-3xl"
                onClick={() => {
                  setShowModal(false);
                  setShowLoginForm(false); // Reset form view
                }}
              >
                <IoCloseSharp />
              </button>

              {/* Condicional: vista de login o selección inicial */}
              {!showLoginForm ? (
                <>
                  <h2 className="text-xl font-bold text-white mb-4">Connect VetaWallet</h2>

                  <button className="w-full bg-gray-700 py-2 rounded font-semibold hover:bg-gray-600">
                    Continue with Google
                  </button>

                  <button
                    className="w-full bg-gray-600 py-2 rounded font-semibold hover:bg-gray-500"
                    onClick={() => setShowLoginForm(true)}
                  >
                    Continue with VetaWallet
                  </button>

                  <div className="border-t border-gray-700 mt-4 pt-4 text-sm text-gray-400 text-center">
                    Al continuar, aceptas nuestros <a className="underline" href="#">términos de servicio</a> y <a className="underline" href="#">política de privacidad</a>.
                  </div>
                </>
              ) : (
                // Formulario de login
                <>
                  <h2 className="text-xl font-bold text-white mb-4">Long In</h2>

                  <div className="space-y-3">
                    <form onSubmit={handleSubmit(submitHandler)} className="login__container--form">
                      {/* Campo de correo electrónico */}
                      <input
                        type="email"
                        placeholder="Email"
                        className="login__input"
                        name="email"
                        id="email"
                        {...register("email", {
                          required: {
                            value: true,
                            message: "Required",
                          },
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i,
                            message: "The format is incorrect",
                          },
                        })}
                      />
                      {errors.email && <span>{errors.email?.message as string}</span>}

                      {/* Campo de contraseña con ícono de ojo */}
                      <div style={{ position: "relative" }}>
                        <input
                          type={showPassword ? "text" : "password"}
                          className="login__input"
                          placeholder="Password"
                          name="password"
                          id="password"
                          {...register("password", {
                            required: {
                              value: true,
                              message: "Required",
                            },
                          })}
                        />
                        <div className="login__container--remember-me">
                          Don&apos;t remember your password?
                          <span className="" onClick={(_) => router.push("/recovery")}>
                            Recover account
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={togglePasswordVisibility}
                          style={{
                            position: "absolute",
                            right: "10px",
                            top: "33%",
                            transform: "translateY(-50%)",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          {showPassword ? (
                            <FaRegEyeSlash style={{ fontSize: "1.2rem", color: "#aaa" }} />
                          ) : (
                            <FaRegEye style={{ fontSize: "1.2rem", color: "#aaa" }} />
                          )}
                        </button>
                      </div>
                      {errors.password && <span>{errors.password?.message as string}</span>}

                      {/* Botón de inicio de sesión */}
                      <button type="submit" className="login-button">
                        Login
                      </button>
                    </form>
                  </div>

                  <div className="text-sm text-gray-400 mt-4 text-center">
                    New to VetaWallet?{" "}
                    <a
                      href="https://www.vetawallet.com/register"
                      className="underline cursor-pointer"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Register
                    </a>                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
