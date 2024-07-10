
import { NextResponse } from "next/server";

export async function middleware(req) {
  const jwt = req.cookies.get("token")?.value;

    try {

        const AukaValue = await fetch(
          "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=XAUt",
          {
            headers: {
              "X-CMC_PRO_API_KEY": process.env.API_CM,
              Accept: "application/json",
            },
          }
        ).then((res) => res.json());
        const response = NextResponse.next();
        response.cookies.set(
          "tokenn",
          JSON.stringify(AukaValue.data.XAUt.quote.USD.percent_change_24h, null, 2)
        );
        response.cookies.set(
          "auka",
          AukaValue.data.XAUt.quote.USD.price.toFixed(2)
        );
        return response;
    } catch (error) {
      console.log(error);

    }
  
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: "/((?!api|_next/static|_next/image|favicon.ico).*)",
};
