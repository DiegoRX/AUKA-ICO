"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Cookie from "js-cookie";

function useFetch(endpoint) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(null);
  const [cookie, setCookie] = useState(null);
  async function getCookie() {
    const token = await Cookie.get();

    setCookie(token.token);
  }
  const headers = {
    Authorization: `Bearer ${cookie}`,
  };
  useEffect(() => {
    setData(null);
    setError(null);
    getCookie();
    if (loading == null) {
    setInterval(() => {
      setLoading('load')
    }, 500);
  }
    if (cookie != null) {
      axios
        .get(endpoint, { headers })
        .then((res) => {
          setData(res);
        })
        .catch((err) => {
         
          setError("An error occurred. Awkward..");
        });
    }
  }, [loading]);
  if (data != null) {
    return { data };
  }
}
export default useFetch;
