import React from "react";


export default function TokenTable({ prices }) {
    const tokens = [
        {
            name: "ORIGEN",
            symbol: "ORIGEN",
            logo: "https://www.vetawallet.com/origen.png",
            price: prices.ORIGEN?.toFixed(2),
            change24h: 2.5,
        },
        {
            name: "ONDK",
            symbol: "ONDK",
            logo: "https://www.vetawallet.com/_next/image?url=%2Foknd.png&w=48&q=75",
            price: prices.ONDK?.toFixed(2),
            change24h: 2.5,
        },
        {
            name: "AUKA",
            symbol: "AUKA",
            logo: "https://www.vetawallet.com/_next/image?url=%2Fauka.png&w=48&q=75",
            price: prices.AUKA?.toFixed(2),
            change24h: -1.2,
        },
        {
            name: "AGKA",
            symbol: "AGKA",
            logo: "https://www.vetawallet.com/_next/image?url=%2Fagk.png&w=48&q=75",
            price: prices.AGKA?.toFixed(2),
            change24h: 4.3,
        },
    ];
    return (
        <div className="overflow-x-auto p-4">
            <table className="min-w-full text-sm text-left text-gray-400">
                <thead className="bg-gray-800 text-xs uppercase text-gray-300">
                    <tr>
                        <th className="px-4 py-3">Coin</th>
                        <th className="px-4 py-3">Price</th>
                        <th className="px-4 py-3">24h Variation</th>
                    </tr>
                </thead>
                <tbody className="bg-gray-900 divide-y divide-gray-700">
                    {tokens.map((token, idx) => (
                        <tr key={idx}>
                            <td className="px-4 py-3 flex items-center gap-2">
                                <img src={token.logo} alt={token.name} className="w-6 h-6" />
                                <span>{token.name} ({token.symbol})</span>
                            </td>
                            <td className="px-4 py-3">${token.price.toLocaleString()}</td>
                            <td
                                className={`px-4 py-3 font-medium ${token.change24h >= 0 ? "text-green-400" : "text-red-400"
                                    }`}
                            >
                                {token.change24h >= 0 ? "+" : ""}
                                {token.change24h}%
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}