"use client";
/* eslint-disable no-unused-vars */
import React, { useState, useContext, createContext, useEffect } from "react";
import Cookie from "js-cookie";
import axios from "axios";
import endPoints from "@context/api/";
import { useRouter } from "next/navigation";

const AuthContext = createContext("light");

export function ProviderAuth({ children }) {
  const auth = useProvideAuth();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  return useContext(AuthContext);
};

function useProvideAuth() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [contractAccounts, setContractAccounts] = useState([]);
  const [cetifarmaContract, setCetifarmaContract] = useState(null);
  const getUser = async (address) => {
    const options = {
      headers: {
        accept: "*/*",
        "Content-Type": "application/json",
      },
    };
    try {
      const resp = await axios.get(
        endPoints.users.getUserByWalletAddress + address
      );
      setUser(resp.data);
      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(resp.data));
      }
      return switchCase(resp);
    } catch (error) {
      return switchCase(error.request);
    }
  };
  const register = async (payload) => {
    const options = {
      headers: {
        accept: "*/*",
        "Content-Type": "application/json",
      },
    };

    try {
      const resp = await axios.post(endPoints.users.postUsers, payload);
      return switchCase(resp);
    } catch (error) {
      return switchCase(error.request);
    }
  };

  const signIn = async (email, password) => {
    // eslint-disable-next-line no-unused-vars
    const options = {
      headers: {
        accept: "*/*",
        "Content-Type": "application/json",
      },
    };
    const { data } = await axios.post(endPoints.auth.login, {
      email,
      password,
    });
    const userData = data.user;
    setUser(userData);
    if (typeof window !== "undefined") {
      localStorage.setItem("user", JSON.stringify(data.user));
    }
    if (data) {
      const token = data.accessToken;
      Cookie.set("token", token, { expires: 5 });
      axios.defaults.headers.Authorization = `Bearer ${token}`;
      if (typeof window !== "undefined") {
        localStorage.setItem("token", token);
      }
    }
  };
  const contractAddress = "0xe4fA50f31C00573dccA00c231B033b49AB4968BB";
  const initCetifarmaContract = async () => {
    const { accounts } = await getBlockchain();
    let provider = await detectEthereumProvider();

    if (provider) {
      const web3Provider = new Web3(window.ethereum);
      const options = {
        from: accounts[0],
        gas: web3Provider.utils.toWei("1000000", "wei"),
        value: "0",
      };

      const cetifarmaContract = new web3Provider.eth.Contract(
        cetifarmaContractABI,
        contractAddress
      );

      setCetifarmaContract(cetifarmaContract);
      let contractAccounts = [];
      contractAccounts = await cetifarmaContract.methods
        .getAllowedWallets()
        .call();
      setContractAccounts(contractAccounts);
    }
  };

  const erraseAccount = () => localStorage.removeItem("accounts");
  //  if(accounts.length === 0){erraseAccount()}
  const setUserIf = () => {
    if (typeof window !== "undefined") {
      const userString = localStorage.getItem("user");
      if (userString != "undefined") {
        const user = JSON.parse(userString);
        setUser(user);
      }
      const accountsString = localStorage.getItem("accounts");
      if (accountsString != "undefined") {
        // const accounts = JSON.parse(accountsString);
        // setAccounts(accounts);
      }
    }
  };
  const logout = () => {
    Cookie.remove("token");
    setUser(null);
    setAccounts([]);
    delete axios.defaults.headers.Authorization;
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    router.push("/");
  };

  const switchCase = (resp) => {
    const { status } = resp;
    const respuesta = {
      data: resp.data,
      status: 0,
      mensaje: "",
    };
    switch (status) {
      case 200:
        respuesta.status = 200;
        return respuesta;
      case 201:
        respuesta.status = 201;
        respuesta.mensaje = "Registro exitoso";
        return respuesta;
      case 202:
        respuesta.status = 202;
        respuesta.mensaje = "Acepted";
        return respuesta;
      case 400:
        respuesta.status = 400;
        respuesta.mensaje =
          JSON.parse(resp.responseText).message || "Registro duplicado";
        return respuesta;
      case 401:
        respuesta.status = 401;
        respuesta.mensaje = "Acceso no autorizado";
        return respuesta;
      case 404:
        respuesta.status = 404;
        respuesta.mensaje = "Ruta no encontrada";
        return respuesta;
      case 500:
        respuesta.status = 500;
        respuesta.mensaje = "Error en el servidor";
        return respuesta;
      default:
        break;
    }
  };

  return {
    user,
    signIn,
    register,
    logout,
    accounts,
    setAccounts,
    getUser,
    setUser,
    contractAccounts,
    cetifarmaContract,
    initCetifarmaContract
  };
}

export default function ClientAuth() {
  return (
    <ProviderAuth>
      <AuthContext.Consumer>{() => null}</AuthContext.Consumer>
    </ProviderAuth>
  );
}
