
import React from 'react';

const BlockchainLogos = () => {
    const blockchains = [
        { name: 'Ethereum', symbol: 'ETH' },
        { name: 'BNB Chain', symbol: 'BNB' },
        { name: 'Polygon', symbol: 'MATIC' },
        { name: 'Solana', symbol: 'SOL' },
        { name: 'Avalanche', symbol: 'AVAX' },
        { name: 'Cardano', symbol: 'ADA' },
        { name: 'Polkadot', symbol: 'DOT' },
        { name: 'Cosmos', symbol: 'ATOM' }
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-6">
            {blockchains.map((blockchain) => (
                <div
                    key={blockchain.name}
                    className="flex flex-col items-center justify-center p-4 bg-white rounded-lg border border-brand-gray-200 hover:shadow-md transition-shadow duration-200"
                >
                    <div className="w-12 h-12 bg-brand-gray-100 rounded-full flex items-center justify-center mb-2">
                        <span className="text-brand-gray-600 font-bold text-sm">
                            {blockchain.symbol}
                        </span>
                    </div>
                    <span className="text-brand-gray-700 text-sm font-medium text-center">
                        {blockchain.name}
                    </span>
                </div>
            ))}
        </div>
    );
};

export default BlockchainLogos;