import React from "react";
// import "../styles/global.css";
import "../styles/backup.css"
import Layout from "@components/Layout/Layout";
import "semantic-ui-css/semantic.min.css";
import { AppWrapper } from "../context/state";

import "bootstrap/dist/css/bootstrap.css";
import Head from "next/head";
import Home from "pages/backup2";
import { ProviderAuth } from "@hooks/useAuth";
import { Provider } from "../components/ui/provider"

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>ORDENEX SALE</title>
      </Head>
      <ProviderAuth>
        <AppWrapper>
          <Provider>
            <Layout>
              <Component {...pageProps} />
            </Layout>
          </Provider>
        </AppWrapper>
      </ProviderAuth>
    </>
  );
}
