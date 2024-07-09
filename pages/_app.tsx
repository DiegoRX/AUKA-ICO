import React from "react";
import "../styles/global.css";
import Layout from "@components/Layout/Layout";
import "semantic-ui-css/semantic.min.css";
import { AppWrapper } from "../context/state";

import "bootstrap/dist/css/bootstrap.css";
import Head from "next/head";
import Home from "pages";
import { ProviderAuth } from "@hooks/useAuth";

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>ONDK SALE</title>
      </Head>
      <ProviderAuth>
        <AppWrapper>
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </AppWrapper>
      </ProviderAuth>
    </>
  );
}
