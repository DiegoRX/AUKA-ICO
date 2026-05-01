import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import Image from "next/image";
import { jwtVerify } from "jose";
import Swal from "sweetalert2";
import { IoCloseSharp } from "react-icons/io5";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";
import { useRouter } from "next/navigation";
import {
    MdOutlineCurrencyExchange,
    MdAccountBalanceWallet,
    MdSearch,
    MdSwapVert,
    MdExpandMore,
    MdInfoOutline,
    MdChevronRight,
    MdPayments,
    MdBolt,
    MdClose,
    MdDarkMode,
    MdPersonOutline,
    MdContentCopy,
    MdCheckCircle,
    MdError,
    MdRefresh,
} from 'react-icons/md';
import { useAppContext } from "@context/state";

// Backend API URL - usar variable de entorno o fallback
import { API_BASE_URL } from "@config/api";


// Tokens disponibles para compra
// Tokens disponibles para compra
const AVAILABLE_TOKENS = [
    { symbol: 'ORIGEN', name: 'Origen', color: '#3B82F6', image: '/assets/tokens/origen.png' },
    { symbol: 'AUKA', name: 'Auka', color: '#10B981', image: '/assets/tokens/auka.png' },
    { symbol: 'USDK', name: 'USDK', color: '#8B5CF6', image: '/assets/tokens/usdk.png' },
];

// Polygon USDT address
const USDT_ADDRESSES: Record<string, string> = {
    '137': "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
    '56': "0x55d398326f99059fF775485246999027B3197955",
    '1': "0xdAC17F958D2ee523a2206206994597C13D831ec7",
};

const Home = () => {
    const router = useRouter();
    const [showModal, setShowModal] = useState(false);
    const [showLoginForm, setShowLoginForm] = useState(false);
    const [address, setAddress] = useState('');
    const [mode, setMode] = useState<'buy' | 'sell'>('buy');

    // Token selection
    const [selectedToken, setSelectedToken] = useState(AVAILABLE_TOKENS[0]);
    const [showTokenSelector, setShowTokenSelector] = useState(false);

    // Amounts
    const [tokenAmount, setTokenAmount] = useState('0');
    const [usdtAmount, setUsdtAmount] = useState('0');
    const [exchangeRate, setExchangeRate] = useState('0');
    const [goldPrice, setGoldPrice] = useState<any>(null);
    const [quoteLoading, setQuoteLoading] = useState(false);

    // Payment method
    const [paymentMethod, setPaymentMethod] = useState<'metamask' | 'binance'>('metamask');
    const [paymentCurrency, setPaymentCurrency] = useState<'USDT' | 'BNB'>('USDT');
    const [paymentNetworkId, setPaymentNetworkId] = useState<string>('137'); // 137=Polygon, 56=BSC, 1=ETH

    // Order state
    const [orderLoading, setOrderLoading] = useState(false);
    const [currentOrder, setCurrentOrder] = useState<any>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [orderPolling, setOrderPolling] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm({
        mode: "onBlur",
    });

    const [showPassword, setShowPassword] = useState(false);
    const togglePasswordVisibility = () => setShowPassword((prev) => !prev);

    const {
        connectWallet,
        walletAddress,
        buyToken,
        sellToken,
        aukaWalletBalance,
        origenWalletBalance,
        usdtWalletBalance,
        usdkWalletBalance,
        ondkBalance,
        OGbalanceORIGEN,
        currentChainId,
        txPending,
        txHash,
        switchNetwork,
        treasuryUsdtBalance, // New state
        fetchTreasuryBalance
    } = useAppContext();

    const [lastChanged, setLastChanged] = useState<'token' | 'usdt'>('token');

    // Check if Treasury has enough funds for the sell
    const isTreasurySolvent = useMemo(() => {
        if (mode === 'buy') return true;
        if (!usdtAmount || parseFloat(usdtAmount) <= 0) return true;
        return parseFloat(usdtAmount) <= (treasuryUsdtBalance || 0);
    }, [mode, usdtAmount, treasuryUsdtBalance]);

    // --- LOGIC FROM USER REQUEST ---
    const sellBalances = useMemo(() => ({
        ORIGEN: origenWalletBalance,
        AUKA: ondkBalance,
        USDK: usdkWalletBalance,
    }), [origenWalletBalance, ondkBalance, usdkWalletBalance]);

    const currentSellBalance = useMemo(() => {
        return parseFloat((sellBalances as any)[selectedToken.symbol] || '0');
    }, [sellBalances, selectedToken.symbol]);

    // Helper to get balance for UI
    const getCurrentBalance = () => {
        if (mode === 'buy') return parseFloat(usdtWalletBalance as any || '0');
        return currentSellBalance;
    };


    // --- PERSISTENCIA (Phase 7) ---
    // Cargar orden activa al montar el componente
    useEffect(() => {
        const savedOrderId = localStorage.getItem('activeOrderId');
        const savedMethod = localStorage.getItem('paymentMethod');
        const savedWallet = localStorage.getItem('activeOrderWallet');

        if (savedOrderId && savedMethod && savedWallet) {
            // Restauramos los estados necesarios para que el polling comience
            setCurrentOrder({ orderId: savedOrderId, status: 'PENDING' });
            setPaymentMethod(savedMethod as any);
            setOrderPolling(true);
            setShowPaymentModal(true);
        }
    }, []);

    // Guardar cambios en la orden activa
    useEffect(() => {
        if (orderPolling && currentOrder?.orderId) {
            localStorage.setItem('activeOrderId', currentOrder.orderId);
            localStorage.setItem('paymentMethod', paymentMethod);
            if (walletAddress) localStorage.setItem('activeOrderWallet', walletAddress[0]);
        }
    }, [orderPolling, currentOrder?.orderId, paymentMethod, walletAddress]);

    // Update balances when payment network or wallet changes
    // In sell mode, MetaMask is on Orden Global (8532) but USDT is read from paymentNetworkId (Polygon/BSC/ETH)
    // Pass paymentNetworkId as 2nd arg so getWalletBalances reads USDT from the correct payout network
    useEffect(() => {
        if (paymentMethod === 'metamask' && walletAddress.length > 0) {
            if (mode === 'sell') {
                // Sell mode: MetaMask on Orden Global, USDT payout on paymentNetworkId
                connectWallet(null, paymentNetworkId);
            } else {
                // Buy mode: MetaMask network = USDT payment network
                connectWallet(paymentNetworkId);
            }
        }
        // Removing walletAddress from dependencies to prevent infinite loop
        // connectWallet updates walletAddress, which triggers this effect again
    }, [paymentNetworkId, paymentMethod, mode]);

    // Fetch treasury balance on the selected payout network
    // Runs on network change and mode change — needed for sell mode validation
    useEffect(() => {
        if (fetchTreasuryBalance) {
            fetchTreasuryBalance(paymentNetworkId);
        }
    }, [paymentNetworkId, mode]);

    // Limpiar persistencia
    const clearOrderPersistence = useCallback(() => {
        setOrderPolling(false);
        setShowPaymentModal(false);
        setCurrentOrder(null);
        setOrderLoading(false);
        localStorage.removeItem('activeOrderId');
        localStorage.removeItem('paymentMethod');
        localStorage.removeItem('activeOrderWallet');
    }, []);

    // Fetch quote when token or amount changes
    const fetchQuote = useCallback(async (forceUpdate = false) => {
        // Obtenemos la cotización incluso si el monto es 0 para actualizar el exchangeRate
        const amountForQuote = (!tokenAmount || parseFloat(tokenAmount) <= 0) ? '1' : tokenAmount;

        try {
            const response = await fetch(`${API_BASE_URL}/api/orders/quote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tokenSymbol: selectedToken.symbol,
                    tokenAmount: amountForQuote,
                    paymentCurrency: paymentCurrency,
                    paymentMethod: paymentMethod,
                    type: mode,
                }),
            });

            if (response.ok) {
                const quote = await response.json();

                // Only update amount if the original token input was valid (>0)
                const isZeroAmount = !tokenAmount || parseFloat(tokenAmount) <= 0;

                // Si el usuario cambió los tokens, actualizamos el pago
                if ((lastChanged === 'token' || forceUpdate) && !isZeroAmount) {
                    setUsdtAmount(parseFloat(quote.paymentAmount).toFixed(2));
                }
                // Si el usuario cambió el pago, el quote del server manda
                // porque el server tiene la precisión final del oráculo.
                else if (lastChanged === 'usdt' && !isZeroAmount) {
                    // Opcional: Podrías actualizar el tokenAmount aquí si el server
                    // hiciera el cálculo inverso, pero nuestro API recibe tokenAmount.
                    // Así que el usdtAmount devuelto por el servidor es el "real" 
                    // para ese tokenAmount que calculamos localmente.
                    setUsdtAmount(parseFloat(quote.paymentAmount).toFixed(2));
                }

                setExchangeRate(quote.exchangeRate);
                if (quote.goldPrice) {
                    setGoldPrice(quote.goldPrice);
                }
            }
        } catch (error) {
            console.error('Failed to fetch quote:', error);
        } finally {
            setQuoteLoading(false);
        }
    }, [tokenAmount, selectedToken.symbol, lastChanged, paymentCurrency, paymentMethod]);

    useEffect(() => {
        fetchQuote(true);
    }, [selectedToken.symbol, paymentMethod, paymentCurrency]);

    useEffect(() => {
        const debounce = setTimeout(() => {
            fetchQuote(false);
        }, 300);
        return () => clearTimeout(debounce);
    }, [tokenAmount]);

    // Force Orden Global in MetaMask for Sell, default payout to Polygon
    useEffect(() => {
        if (mode === 'sell') {
            setPaymentMethod('metamask');
            setPaymentNetworkId('137'); // Default payout network = Polygon
            switchNetwork('0x2154');    // Switch MetaMask to Orden Global for token transfer
        }
    }, [mode]);

    // Handle USDT Input Change
    const handleUsdtChange = (value: string) => {
        let newValue = value;

        setUsdtAmount(newValue);
        setLastChanged('usdt');

        if (newValue === '') {
            setTokenAmount('');
            return;
        }

        const rate = parseFloat(exchangeRate);
        if (rate > 0 && newValue && !isNaN(parseFloat(newValue))) {
            const tokens = parseFloat(newValue) / rate;
            setTokenAmount(tokens.toFixed(2));
        } else {
            // Rate missing or invalid - force fetch to get rate
            // We can't calc tokens yet, but fetching will update rate
            fetchQuote(true);
        }
    };

    // Handle Token Input Change
    const handleTokenChange = (value: string) => {
        let newValue = value;

        setTokenAmount(newValue);
        setLastChanged('token');

        // CALCULO BIDIRECCIONAL LOCAL (Feedback instantáneo)
        const rate = parseFloat(exchangeRate);
        if (rate > 0 && newValue && !isNaN(parseFloat(newValue))) {
            const total = parseFloat(newValue) * rate;
            setUsdtAmount(total.toFixed(paymentCurrency === 'BNB' ? 6 : 2));
        } else if (newValue === '') {
            setUsdtAmount('');
        } else {
            // Force fetch if rate missing
            // fetchQuote will be called by useEffect[tokenAmount] anyway because setTokenAmount happened
            // but explicit call doesn't hurt if debounce is slow
        }
    };

    // Se quita el auto-set max por petición del usuario

    const handleSetMax = () => {
        if (mode === 'buy') {
            // Max USDT
            const max = parseFloat(usdtWalletBalance as any || '0');
            if (max > 0) handleUsdtChange(max.toString());
        } else {
            // Max Token (Sell)
            const gasFee = selectedToken.symbol === 'ORIGEN' ? 0.04 : 0;
            const max = Math.max(0, currentSellBalance - gasFee);
            if (max > 0) handleTokenChange(max.toString());
        }
    };

    // Shorten wallet address
    const shortenAddress = (addr: string) => {
        if (typeof addr !== 'string' || !addr) return "";
        if (addr.length < 12) return addr;
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    // Handle MetaMask purchase
    const handleMetaMaskPurchase = async () => {
        if (!walletAddress || walletAddress.length === 0) {
            Swal.fire({
                title: 'Error',
                text: 'Please connect your wallet first',
                icon: 'error',
                background: '#1E2329',
                color: '#ffffff',
                confirmButtonColor: '#fcd436'
            });
            return;
        }

        // Network Check (Warning only, state.js handles the switch)
        const chainId = String(currentChainId).toLowerCase();
        const targetNetworkName = paymentNetworkId === '137' ? 'Polygon' : paymentNetworkId === '56' ? 'BSC' : 'Ethereum';
        const targetChainIdHex = paymentNetworkId === '137' ? '0x89' : paymentNetworkId === '56' ? '0x38' : '0x1';

        if (mode === 'buy') {
            if (chainId !== targetChainIdHex) {
                Swal.fire({
                    title: `Switching to ${targetNetworkName}`,
                    text: "Please accept the network switch in MetaMask.",
                    icon: "info",
                    timer: 2000,
                    showConfirmButton: false,
                    background: '#1E2329',
                    color: '#ffffff'
                });
            }
        } else {
            if (chainId !== '8532' && chainId !== '0x2154') {
                Swal.fire({
                    title: "Switching to Orden Global",
                    text: "Please accept the network switch in MetaMask.",
                    icon: "info",
                    timer: 2000,
                    showConfirmButton: false,
                    background: '#1E2329',
                    color: '#ffffff'
                });
            }
        }

        const txData = {
            usdtAmount: parseFloat(usdtAmount),
            usdtAddress: USDT_ADDRESSES[paymentNetworkId] || USDT_ADDRESSES['137'],
            tokenName: selectedToken.symbol,
            tokenAmount: parseFloat(tokenAmount),
            network: paymentNetworkId === '137' ? 'Polygon' : paymentNetworkId === '56' ? 'BSC' : 'Ethereum',
            networkId: paymentNetworkId,
            tokenReceiverAddress: walletAddress[0],
            providerUrl: '', // Not used by backend as it has its own
        };

        if (mode === 'buy') {
            await buyToken(txData);
        } else {
            await sellToken(txData);
        }
    };

    // Handle Binance Pay purchase
    const handleBinancePayPurchase = async () => {
        if (!walletAddress || walletAddress.length === 0) {
            Swal.fire({
                title: 'Error',
                text: 'Please connect your wallet first to receive tokens',
                icon: 'error',
                background: '#1E2329',
                color: '#ffffff',
                confirmButtonColor: '#fcd436'
            });
            return;
        }

        setOrderLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/orders/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tokenSymbol: selectedToken.symbol,
                    tokenAmount: tokenAmount,
                    userWalletAddress: walletAddress[0],
                    paymentCurrency: paymentCurrency,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to create order');
            }

            const order = await response.json();
            setCurrentOrder(order);
            setShowPaymentModal(true);
            setOrderPolling(true);

        } catch (error: any) {
            console.error('Binance Pay error:', error);
            Swal.fire({
                title: 'Error',
                text: error.message || 'Failed to create payment',
                icon: 'error',
                background: '#1E2329',
                color: '#ffffff',
                confirmButtonColor: '#fcd436'
            });
        } finally {
            setOrderLoading(false);
        }
    };

    // Poll order status
    useEffect(() => {
        if (!orderPolling || !currentOrder?.orderId) return;

        const interval = setInterval(async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/orders/${currentOrder.orderId}`);
                if (response.ok) {
                    const status = await response.json();

                    // Double check we are still polling before update
                    if (!orderPolling) return;

                    setCurrentOrder((prev: any) => ({ ...prev, ...status }));

                    if (status.status === 'TOKENS_SENT') {
                        setOrderPolling(false);
                        clearOrderPersistence();
                        // Reload balances
                        connectWallet();
                        Swal.fire({
                            icon: 'success',
                            title: 'Tokens Sent!',
                            html: `Your <strong>${tokenAmount} ${selectedToken.symbol}</strong> have been sent to your wallet.<br/><br/>
                                   <a href="https://polygonscan.com/tx/${status.txHash}" target="_blank" class="text-blue-500">View Transaction</a>`,
                            background: '#1E2329',
                            color: '#ffffff',
                            confirmButtonColor: '#fcd436'
                        });
                    } else if (status.status === 'FAILED') {
                        setOrderPolling(false);
                        clearOrderPersistence();
                        Swal.fire({
                            title: 'Error',
                            text: status.failureReason || 'Transaction failed',
                            icon: 'error',
                            background: '#1E2329',
                            color: '#ffffff',
                            confirmButtonColor: '#fcd436'
                        });
                    }
                }
            } catch (error) {
                console.error('Polling error:', error);
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [orderPolling, currentOrder?.orderId, tokenAmount, selectedToken.symbol]);

    // Handle main action button
    // (Consolidated into the single handleAction definition below)

    // Login handler
    const submitHandler = async (data: any) => {
        Swal.fire({
            background: "transparent",
            showConfirmButton: false,
            allowOutsideClick: false,
            html: `<div class="flex items-center justify-center">
              <div style="width:48px;height:48px;border:4px solid #fcd436;border-top-color:transparent;border-radius:50%;animation:spin 1s linear infinite;"></div>
            </div>`,
            customClass: { popup: 'shadow-none' },
        });

        try {
            const res = await fetch(`${API_BASE_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (res.status === 200) {
                const json = await res.json();
                const decrypt = await jwtVerify(json.token, new TextEncoder().encode("secreto"));
                if (typeof decrypt.payload.address === "string") {
                    setAddress(decrypt.payload.address);
                }
                Swal.close();
                setShowModal(false);
                setShowLoginForm(false);
            } else if (res.status === 401) {
                Swal.fire({
                    title: "Error",
                    text: "Incorrect email or password",
                    icon: "error",
                    background: '#1E2329',
                    color: '#ffffff',
                    confirmButtonColor: '#fcd436'
                });
            } else {
                Swal.fire({
                    title: "Error",
                    text: "Server error",
                    icon: "error",
                    background: '#1E2329',
                    color: '#ffffff',
                    confirmButtonColor: '#fcd436'
                });
            }
        } catch (error) {
            console.error(error);
            Swal.fire({
                title: "Error",
                text: "Connection error",
                icon: "error",
                background: '#1E2329',
                color: '#ffffff',
                confirmButtonColor: '#fcd436'
            });
        }
    };

    // Get status badge color
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'text-yellow-500';
            case 'PAID': return 'text-blue-500';
            case 'TOKENS_SENT': return 'text-green-500';
            case 'FAILED': return 'text-red-500';
            default: return 'text-gray-500';
        }
    };

    // --- UI HELPERS FROM USER REQUEST ---
    const handleSwitchToPolygon = async () => {
        try {
            await switchNetwork('0x89'); // Polygon 137
        } catch (e) {
            console.error("Switch to Polygon failed", e);
        }
    };

    const handleSwitchToOrdenGlobal = async () => {
        try {
            await switchNetwork('0x2154'); // Orden Global 8532
        } catch (e) {
            console.error("Switch to Orden Global failed", e);
        }
    };

    // --- RESTORED COMPONENTS ---
    // Buy/Sell Switch Component
    const BuySellSwitch = () => (
        <div className="bg-black/40 p-1.5 rounded-2xl flex mb-8">
            <button
                onClick={() => setMode('buy')}
                className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${mode === 'buy'
                    ? 'bg-[#1E2329] shadow-sm text-white'
                    : 'text-gray-400 hover:text-gray-200'
                    }`}
            >
                Buy
            </button>
            <button
                onClick={() => setMode('sell')}
                className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${mode === 'sell'
                    ? 'bg-[#1E2329] shadow-sm text-white'
                    : 'text-gray-400 hover:text-gray-200'
                    }`}
            >
                Sell
            </button>
        </div>
    );

    // Token Selector Component
    const TokenSelector = () => (
        <div className="relative">
            <div
                onClick={() => setShowTokenSelector(!showTokenSelector)}
                className="flex items-center space-x-2 cursor-pointer hover:bg-gray-800 p-1.5 rounded-lg transition-colors ml-2"
            >
                <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center bg-transparent">
                    <Image
                        src={(selectedToken as any).image}
                        alt={selectedToken.symbol}
                        width={24}
                        height={24}
                        className="object-cover"
                    />
                </div>
                <span className="font-bold text-white">{selectedToken.symbol}</span>
                <MdExpandMore className="text-gray-400" />
            </div>

            {showTokenSelector && (
                <div className="absolute right-0 top-full mt-2 bg-[#1E2329] rounded-xl border border-gray-700 overflow-hidden z-50 min-w-[180px] shadow-xl">
                    {AVAILABLE_TOKENS.map((token) => (
                        <div
                            key={token.symbol}
                            onClick={() => {
                                setSelectedToken(token);
                                setShowTokenSelector(false);
                            }}
                            className={`flex items-center space-x-3 p-3 cursor-pointer hover:bg-gray-800 transition-colors ${selectedToken.symbol === token.symbol ? 'bg-gray-800' : ''
                                }`}
                        >
                            <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-transparent">
                                <Image
                                    src={(token as any).image}
                                    alt={token.symbol}
                                    width={32}
                                    height={32}
                                    className="object-cover"
                                />
                            </div>
                            <div>
                                <div className="font-bold text-white">{token.symbol}</div>
                                <div className="text-xs text-gray-400">{token.name}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    // Recalculate Token Amount when Exchange Rate loads (if user started with USDT)
    useEffect(() => {
        if (lastChanged === 'usdt' && usdtAmount && parseFloat(usdtAmount) > 0) {
            const rate = parseFloat(exchangeRate);
            // Only calc if we have a rate and tokenAmount is empty or needs update (optional logic)
            // But main case: rate was 0, now it's X.
            if (rate > 0) {
                const tokens = parseFloat(usdtAmount) / rate;
                // Avoid infinite loop if values are close enough? 
                // formatted strings comparison might be enough
                const formatted = tokens.toFixed(2);
                if (tokenAmount !== formatted) {
                    setTokenAmount(formatted);
                }
            }
        }
    }, [exchangeRate, usdtAmount, lastChanged]); // Dependencies

    // --- MAIN ACTION HANDLERS ---
    // (Removed duplicate handleAction here, relying on the one below or consolidating)

    const handleAction = () => {
        if (mode === 'buy') {
            // BUY LOGIC (User pays USDT on Polygon)
            // Automatic switch handled by buyToken/handleMetaMaskPurchase
            if (paymentMethod === 'metamask') {
                handleMetaMaskPurchase();
            } else {
                handleBinancePayPurchase();
            }
        } else {
            // SELL LOGIC (User pays Token on Orden Global)
            if (String(currentChainId) !== '8532' && String(currentChainId) !== '0x2154') {
                Swal.fire({
                    title: "Change to Orden Global",
                    text: "Please switch your wallet to Orden Global to sell tokens.",
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonText: "Switch Network",
                    background: '#1E2329',
                    color: '#ffffff',
                    confirmButtonColor: '#fcd436'
                }).then((result) => {
                    if (result.isConfirmed) handleSwitchToOrdenGlobal();
                });
                return;
            }
            // Sell logic
            handleMetaMaskPurchase();
        }
    };

    return (
        <div className="min-h-screen bg-[#0B0E11] text-white font-sans">
            {/* Navigation Header */}
            <nav className="bg-[#0B0E11] sticky top-0 z-50 shadow-md">
                <div className="max-w-[1440px] mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center space-x-8">
                        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => router.push('/')}>
                            <Image src="/logo-white.png" height={30} width={30} alt="ordenex-logo" />
                            <span className="text-xl font-bold tracking-tight">
                                ORDEN<span className="text-[#fcd436]">EX</span>
                            </span>
                        </div>
                        <div className="hidden md:flex items-center space-x-6 text-sm font-medium text-gray-400">
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">


                        {walletAddress && walletAddress.length > 0 ? (
                            <button
                                onClick={() => connectWallet()}
                                className="text-sm font-medium bg-[#fcd436] text-black px-5 py-2 rounded-md hover:bg-opacity-90 transition-all font-semibold"
                            >
                                {shortenAddress(walletAddress[0])}
                            </button>
                        ) : (
                            <button
                                onClick={() => connectWallet()}
                                className="text-sm font-medium bg-[#fcd436] text-black px-5 py-2 rounded-md hover:bg-opacity-90 transition-all font-semibold"
                            >
                                Connect Wallet
                            </button>
                        )}

                        <div className="hidden md:flex items-center space-x-2 ml-4 border-l border-gray-800 pl-4">
                        </div>
                    </div>
                </div>
            </nav>

            {/* Transaction Pending Banner */}
            {txPending && (
                <div className="bg-[#fcd436] text-black py-2.5 px-4 text-center font-bold sticky top-16 z-40 flex items-center justify-center space-x-3 shadow-lg border-b border-black/10">
                    <MdRefresh className="animate-spin text-xl" />
                    <span>Transaction Processing on Blockchain...</span>
                    {txHash && (
                        <a
                            href={String(currentChainId) === '137' || String(currentChainId) === '0x89'
                                ? `https://polygonscan.com/tx/${txHash}`
                                : `https://explorer.ordenglobal.com/tx/${txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-black/10 hover:bg-black/20 px-3 py-1 rounded-full text-xs transition-colors flex items-center ml-2"
                        >
                            View on Explorer <MdChevronRight className="ml-0.5" />
                        </a>
                    )}
                </div>
            )}



            {/* Main Content */}
            <main className="max-w-[1440px] mx-auto px-4 pt-16 pb-24 grid grid-cols-1 lg:grid-cols-2 items-start gap-12">
                {/* Left Column - Info */}
                <div className="space-y-12">
                    <div className="space-y-6">
                        <h1 className="text-6xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight text-white">
                            Buy Crypto <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#fcd436] to-[#f08c0b]">Instantly</span><br />
                            <span className="text-[#fcd436]">in 3 Easy Steps</span>
                        </h1>
                        <p className="text-gray-300 text-xl max-w-md font-medium leading-relaxed">
                            Buy {selectedToken.symbol} with USDT using MetaMask. Fast, secure, and easy.
                        </p>
                    </div>

                    {/* Wallet Balances */}
                    {walletAddress && walletAddress.length > 0 && (
                        <div className="bg-[#1E2329] rounded-2xl p-6 shadow-xl">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-[#fcd436]">Your Balances</h3>
                                <button
                                    onClick={() => {
                                        const btn = document.getElementById('refresh-balances-btn');
                                        if (btn) btn.classList.add('animate-spin');
                                        connectWallet();
                                        setTimeout(() => {
                                            if (btn) btn.classList.remove('animate-spin');
                                        }, 1500);
                                    }}
                                    className="p-1.5 rounded-lg bg-[#0B0E11] hover:bg-[#2B3139] transition-all duration-200 group"
                                    title="Refresh Balances"
                                >
                                    <MdRefresh id="refresh-balances-btn" className="text-lg text-gray-400 group-hover:text-[#fcd436] transition-colors" />
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-[#0B0E11] rounded-xl p-4 shadow-inner relative group">
                                    <div className="text-gray-400 text-xs font-semibold mb-1 uppercase tracking-wider flex items-center space-x-1">
                                        <span>USDT ({paymentNetworkId === '137' ? 'Polygon' : paymentNetworkId === '56' ? 'BSC' : 'Ethereum'})</span>
                                        <MdInfoOutline
                                            className="cursor-pointer hover:text-[#fcd436] transition-colors"
                                            onClick={() => {
                                                const addr = paymentNetworkId === '137' ? '0xc2132D05D31c914a87C6611C10748AEb04B58e8F' : paymentNetworkId === '56' ? '0x55d398326f99059fF775485246999027B3197955' : '0xdAC17F958D2ee523a2206206994597C13D831ec7';
                                                Swal.fire({
                                                    title: 'USDT Address',
                                                    text: addr,
                                                    icon: 'info',
                                                    showCancelButton: true,
                                                    confirmButtonText: 'Copy Address',
                                                    cancelButtonText: 'Close',
                                                    background: '#1E2329',
                                                    color: '#ffffff',
                                                    confirmButtonColor: '#fcd436',
                                                    customClass: {
                                                        popup: 'border-none rounded-[24px]'
                                                    }
                                                }).then((result) => {
                                                    if (result.isConfirmed) {
                                                        navigator.clipboard.writeText(addr);
                                                        Swal.fire({ toast: true, position: 'top', icon: 'success', title: 'Address Copied!', showConfirmButton: false, timer: 1500, background: '#1E2329', color: '#ffffff' });
                                                    }
                                                });
                                            }}
                                        />
                                    </div>
                                    <div className="text-2xl font-bold">{usdtWalletBalance?.toFixed(2) || '0.00'}</div>
                                    <div className="text-xs text-gray-400">≈ ${usdtWalletBalance?.toFixed(2) || '0.00'} USD</div>
                                </div>
                                <div className="bg-[#0B0E11] rounded-xl p-4 shadow-inner relative group">
                                    <div className="text-gray-400 text-xs font-semibold mb-1 uppercase tracking-wider">ORIGEN (Orden Global)</div>
                                    <div className="text-2xl font-bold">{origenWalletBalance?.toFixed(2) || '0.00'}</div>
                                    <div className="text-xs text-gray-400">
                                        {goldPrice ? `≈ $${(parseFloat(origenWalletBalance as any || '0') * ((parseFloat(goldPrice.ounce) / 31.1035) / 55)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD` : 'Loading...'}
                                    </div>
                                </div>
                                <div className="bg-[#0B0E11] rounded-xl p-4 shadow-inner relative group">
                                    <div className="text-gray-400 text-xs font-semibold mb-1 uppercase tracking-wider flex items-center space-x-1">
                                        <span>AUKA (Orden Global)</span>
                                        <MdInfoOutline
                                            className="cursor-pointer hover:text-[#fcd436] transition-colors"
                                            onClick={() => {
                                                const addr = '0x6Facc8Df79cEDc6C5065442ce27e915Aa3a26B9B';
                                                Swal.fire({
                                                    title: 'AUKA Address',
                                                    text: addr,
                                                    icon: 'info',
                                                    showCancelButton: true,
                                                    confirmButtonText: 'Copy Address',
                                                    cancelButtonText: 'Close',
                                                    background: '#1E2329',
                                                    color: '#ffffff',
                                                    confirmButtonColor: '#fcd436',
                                                    customClass: {
                                                        popup: 'border-none rounded-[24px]'
                                                    }
                                                }).then((result) => {
                                                    if (result.isConfirmed) {
                                                        navigator.clipboard.writeText(addr);
                                                        Swal.fire({ toast: true, position: 'top', icon: 'success', title: 'Address Copied!', showConfirmButton: false, timer: 1500, background: '#1E2329', color: '#ffffff' });
                                                    }
                                                });
                                            }}
                                        />
                                    </div>
                                    <div className="text-2xl font-bold">{ondkBalance?.toFixed(2) || '0.00'}</div>
                                    <div className="text-xs text-gray-400">
                                        {goldPrice ? `≈ $${(parseFloat(ondkBalance as any || '0') * parseFloat(goldPrice.ounce)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD` : 'Loading...'}
                                    </div>
                                </div>
                                <div className="bg-[#0B0E11] rounded-xl p-4 shadow-inner relative group">
                                    <div className="text-gray-400 text-xs font-semibold mb-1 uppercase tracking-wider flex items-center space-x-1">
                                        <span>USDK (Polygon)</span>
                                        <MdInfoOutline
                                            className="cursor-pointer hover:text-[#fcd436] transition-colors"
                                            onClick={() => {
                                                const addr = '0xAEaB7Fa98c972e0746471d57F7b5b3538B0aF716';
                                                Swal.fire({
                                                    title: 'USDK Address',
                                                    text: addr,
                                                    icon: 'info',
                                                    showCancelButton: true,
                                                    confirmButtonText: 'Copy Address',
                                                    cancelButtonText: 'Close',
                                                    background: '#1E2329',
                                                    color: '#ffffff',
                                                    confirmButtonColor: '#fcd436',
                                                    customClass: {
                                                        popup: 'border-none rounded-[24px]'
                                                    }
                                                }).then((result) => {
                                                    if (result.isConfirmed) {
                                                        navigator.clipboard.writeText(addr);
                                                        Swal.fire({ toast: true, position: 'top', icon: 'success', title: 'Address Copied!', showConfirmButton: false, timer: 1500, background: '#1E2329', color: '#ffffff' });
                                                    }
                                                });
                                            }}
                                        />
                                    </div>
                                    <div className="text-2xl font-bold">{usdkWalletBalance?.toFixed(2) || '0.00'}</div>
                                    <div className="text-xs text-gray-400">≈ ${usdkWalletBalance?.toFixed(2) || '0.00'} USD</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Payment Methods Info */}
                    <div className="flex flex-wrap gap-4 opacity-70">
                        <div className="bg-gray-800 p-2 rounded-md h-10 w-14 flex items-center justify-center">
                            <span className="text-xs font-bold text-white">USDT</span>
                        </div>
                        <div className="bg-gray-800 p-2 rounded-md h-10 w-14 flex items-center justify-center">
                            <MdAccountBalanceWallet className="text-2xl text-orange-500" />
                        </div>
                        <div className="bg-gray-800 p-2 rounded-md h-10 w-14 flex items-center justify-center">
                            <MdBolt className="text-2xl text-yellow-500" />
                        </div>
                    </div>
                </div>

                {/* Right Column - Trading Card */}
                <div className="flex justify-center lg:justify-end">
                    <div className="bg-[#1E2329] w-full max-w-lg rounded-[32px] p-8 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#fcd436] to-[#f08c0b]"></div>
                        <BuySellSwitch />

                        <div className="space-y-4">
                            {/* Token Amount Input */}
                            <div className="group">
                                <div className="flex justify-between items-center mb-1 ml-1">
                                    <label className="text-xs font-medium text-gray-400">
                                        {mode === 'buy' ? 'You Receive' : 'You Sell'}
                                    </label>
                                    {walletAddress.length > 0 && (
                                        <span className="text-xs text-gray-400 cursor-pointer hover:text-[#fcd436]" onClick={handleSetMax}>
                                            Balance: {currentSellBalance.toFixed(4)} {selectedToken.symbol}
                                        </span>
                                    )}
                                </div>
                                <div className="bg-[#0B0E11] rounded-2xl p-4 flex items-center focus-within:ring-2 focus-within:ring-[#fcd436]/30 transition-all shadow-inner">
                                    <input
                                        type="number"
                                        value={tokenAmount}
                                        onChange={(e) => handleTokenChange(e.target.value)}
                                        className="bg-transparent border-none focus:ring-0 text-2xl font-bold flex-1 w-full p-0 text-white outline-none"
                                        placeholder="0"
                                    />
                                    {mode === 'sell' && (
                                        <button onClick={handleSetMax} className="px-2 text-xs font-bold text-[#fcd436] hover:text-white transition-colors mr-2 border border-[#fcd436]/30 rounded bg-[#fcd436]/10">MAX</button>
                                    )}
                                    <TokenSelector />
                                </div>
                            </div>

                            {/* Swap Button */}
                            <div className="flex justify-center -my-3 relative z-10">
                                <button
                                    onClick={() => setMode(mode === 'buy' ? 'sell' : 'buy')}
                                    className="bg-[#1E2329] p-2.5 rounded-full shadow-xl text-[#fcd436] hover:rotate-180 transition-transform duration-500 hover:text-white"
                                >
                                    <MdSwapVert className="text-2xl" />
                                </button>
                            </div>

                            {/* USDT Amount Display */}
                            <div className="group">
                                <div className="flex justify-between items-center mb-1 ml-1">
                                    <label className="text-xs font-medium text-gray-400 flex items-center">
                                        {mode === 'buy' ? 'You Pay' : 'You Receive'} <MdInfoOutline className="text-[14px] ml-1 opacity-60" />
                                    </label>
                                    {paymentMethod === 'metamask' && walletAddress.length > 0 && (
                                        <span className="text-xs text-gray-400 cursor-pointer hover:text-[#fcd436]" onClick={handleSetMax}>
                                            Balance: {parseFloat(usdtWalletBalance as any || '0').toFixed(2)} USDT
                                        </span>
                                    )}
                                </div>
                                <div className="bg-[#0B0E11] rounded-2xl p-4 flex items-center shadow-inner">
                                    <input
                                        type="number"
                                        value={quoteLoading && lastChanged === 'token' ? '...' : usdtAmount}
                                        onChange={(e) => handleUsdtChange(e.target.value)}
                                        className="bg-transparent border-none text-2xl font-bold flex-1 w-full p-0 text-white outline-none"
                                        placeholder="0.00"
                                    />
                                    {mode === 'buy' && (
                                        <button onClick={handleSetMax} className="px-2 text-xs font-bold text-[#fcd436] hover:text-white transition-colors mr-2 border border-[#fcd436]/30 rounded bg-[#fcd436]/10">MAX</button>
                                    )}
                                    <div className="flex items-center space-x-2 ml-2">
                                        <div className="w-10 h-10 flex items-center justify-center overflow-hidden bg-black rounded-full">
                                            {paymentMethod === 'binance' && paymentCurrency === 'BNB' ? (
                                                <img src="https://cryptologos.cc/logos/binance-coin-bnb-logo.svg" alt="BNB" className="w-6 h-6 object-contain" />
                                            ) : (
                                                <img src="https://cryptologos.cc/logos/tether-usdt-logo.svg" alt="USDT" className="w-6 h-6 object-contain" />
                                            )}
                                        </div>
                                        <span className="font-bold text-white tracking-widest">{paymentMethod === 'binance' ? paymentCurrency : 'USDT'}</span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center mt-1 ml-1">
                                    <div className="text-xs text-gray-400">
                                        Rate: 1 {selectedToken.symbol} = {exchangeRate} {paymentMethod === 'binance' ? paymentCurrency : 'USDT'}
                                    </div>
                                    {paymentMethod === 'binance' && (
                                        <div className="text-[10px] text-[#fcd436]/70 italic flex items-center space-x-1">
                                            <MdInfoOutline size={12} />
                                            <span>Includes 1.5% Binance fee</span>
                                        </div>
                                    )}
                                </div>
                                {goldPrice && (
                                    <div className="flex justify-between items-center mt-1 ml-1 text-xs text-gray-500">
                                        <span>Gold Ref: ${parseFloat(goldPrice.ounce).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/oz</span>
                                        <span className="text-[10px] opacity-70">Updated: {new Date(goldPrice.timestamp).toLocaleTimeString()}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Payment Methods */}
                        <div className="pt-4 space-y-3">
                            <label className="block text-xs font-medium text-gray-400 mb-2 ml-1">
                                Payment Method
                            </label>

                            {/* MetaMask Option */}
                            <div
                                onClick={() => setPaymentMethod('metamask')}
                                className={`bg-[#0B0E11] rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all duration-300 ${paymentMethod === 'metamask' ? 'ring-2 ring-[#fcd436] shadow-[0_0_15px_rgba(252,212,54,0.1)]' : 'hover:bg-gray-800/50'}`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="w-12 h-12 flex items-center justify-center">
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="MetaMask" className="w-11 h-11 object-contain" />
                                    </div>
                                    <div>
                                        <span className="font-medium text-white">MetaMask</span>
                                        <div className="flex space-x-2 mt-1">
                                            {mode === 'sell' ? (
                                                <>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setPaymentNetworkId('137');
                                                            setPaymentMethod('metamask');
                                                        }}
                                                        className={`px-2 py-0.5 text-[10px] font-bold rounded border transition-all ${paymentNetworkId === '137' && paymentMethod === 'metamask' ? 'bg-purple-600 text-white border-purple-600' : 'text-gray-400 border-gray-700'}`}
                                                    >
                                                        Polygon
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setPaymentNetworkId('56');
                                                            setPaymentMethod('metamask');
                                                        }}
                                                        className={`px-2 py-0.5 text-[10px] font-bold rounded border transition-all ${paymentNetworkId === '56' && paymentMethod === 'metamask' ? 'text-yellow-500 border-yellow-500' : 'text-gray-400 border-gray-700'}`}
                                                    >
                                                        BSC
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setPaymentNetworkId('1');
                                                            setPaymentMethod('metamask');
                                                        }}
                                                        className={`px-2 py-0.5 text-[10px] font-bold rounded border transition-all ${paymentNetworkId === '1' && paymentMethod === 'metamask' ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-400 border-gray-700'}`}
                                                    >
                                                        Ethereum
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setPaymentNetworkId('137');
                                                            setPaymentMethod('metamask');
                                                            switchNetwork('0x89');
                                                            connectWallet('137');
                                                        }}
                                                        className={`px-2 py-0.5 text-[10px] font-bold rounded border transition-all ${paymentNetworkId === '137' && paymentMethod === 'metamask' ? 'bg-purple-600 text-white border-purple-600' : 'text-gray-400 border-gray-700'}`}
                                                    >
                                                        Polygon
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setPaymentNetworkId('56');
                                                            setPaymentMethod('metamask');
                                                            switchNetwork('0x38');
                                                            connectWallet('56');
                                                        }}
                                                        className={`px-2 py-0.5 text-[10px] font-bold rounded border transition-all ${paymentNetworkId === '56' && paymentMethod === 'metamask' ? 'text-yellow-500 border-yellow-500' : 'text-gray-400 border-gray-700'}`}
                                                    >
                                                        BSC
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setPaymentNetworkId('1');
                                                            setPaymentMethod('metamask');
                                                            switchNetwork('0x1');
                                                            connectWallet('1');
                                                        }}
                                                        className={`px-2 py-0.5 text-[10px] font-bold rounded border transition-all ${paymentNetworkId === '1' && paymentMethod === 'metamask' ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-400 border-gray-700'}`}
                                                    >
                                                        Ethereum
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {paymentMethod === 'metamask' && <MdCheckCircle className="text-[#fcd436] text-xl" />}
                            </div>

                            {/* Binance Pay Option (DISABLED) */}
                            {/* {mode === 'buy' && (
                                <div
                                    onClick={() => setPaymentMethod('binance')}
                                    className={`bg-[#0B0E11] rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all duration-300 ${paymentMethod === 'binance' ? 'ring-2 ring-[#fcd436] shadow-[0_0_15px_rgba(252,212,54,0.1)]' : 'hover:bg-gray-800/50'}`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="w-12 h-12 flex items-center justify-center bg-black rounded-lg">
                                            <img src="https://cryptologos.cc/logos/binance-coin-bnb-logo.svg" alt="Binance Pay" className="w-8 h-8 object-contain" />
                                        </div>
                                        <div>
                                            <span className="font-medium text-white">Binance Pay</span>
                                            <div className="text-xs text-gray-500">Pay from your Binance account</div>
                                        </div>
                                    </div>
                                    {paymentMethod === 'binance' && (
                                        <div className="flex space-x-2 mt-2 ml-1">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setPaymentCurrency('USDT'); }}
                                                className={`px-3 py-1 text-xs font-bold rounded-full border transition-all ${paymentCurrency === 'USDT' ? 'text-[#fcd436] border-[#fcd436]' : 'text-gray-500 border-gray-700 hover:border-gray-500'}`}
                                            >
                                                USDT
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setPaymentCurrency('BNB'); }}
                                                className={`px-3 py-1 text-xs font-bold rounded-full border transition-all ${paymentCurrency === 'BNB' ? 'text-[#fcd436] border-[#fcd436]' : 'text-gray-500 border-gray-700 hover:border-gray-500'}`}
                                            >
                                                BNB Native
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )} */}
                        </div>


                        {/* Action Button */}
                        <button
                            onClick={handleAction}
                            disabled={orderLoading || !tokenAmount || parseFloat(tokenAmount) <= 0 || (mode === 'sell' && !isTreasurySolvent)}
                            className="w-full bg-gradient-to-r from-[#fcd436] via-[#f0b90b] to-[#f08c0b] text-black font-extrabold py-4 rounded-2xl mt-8 shadow-[0_10px_30px_-5px_rgba(252,213,53,0.4)] hover:shadow-[0_15px_35px_-5px_rgba(252,213,53,0.5)] hover:-translate-y-1 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-xl uppercase tracking-wider"
                        >
                            {orderLoading ? (
                                <span className="flex items-center justify-center space-x-2">
                                    <MdRefresh className="animate-spin" />
                                    <span>Processing...</span>
                                </span>
                            ) : (
                                `${mode === 'buy' ? 'Buy' : 'Sell'} ${tokenAmount} ${selectedToken.symbol}`
                            )}
                        </button>

                        {mode === 'sell' && !isTreasurySolvent && (
                            <div className="mt-3 bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-bold p-3 rounded-xl text-center">
                                Insufficient Treasury Liquidity on {paymentNetworkId === '137' ? 'Polygon' : paymentNetworkId === '56' ? 'BSC' : 'Ethereum'}.
                            </div>
                        )}
                    </div>
                </div>

            </main >



            {/* Login Modal */}
            {
                showModal && (
                    <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4">
                        <div className="bg-[#1E2329] rounded-[32px] shadow-2xl w-full max-w-[420px] p-8 space-y-4 relative border border-gray-800">
                            <button
                                className="absolute top-4 right-4 text-gray-400 hover:text-white text-3xl transition-colors"
                                onClick={() => { setShowModal(false); setShowLoginForm(false); }}
                            >
                                <MdClose />
                            </button>

                            {!showLoginForm ? (
                                <>
                                    <div className="text-center mb-6">
                                        <h2 className="text-2xl font-bold text-white mb-2">Connect VetaWallet</h2>
                                        <p className="text-gray-400 text-sm">Choose your preferred connection method</p>
                                    </div>

                                    <div className="space-y-3">
                                        <button className="w-full bg-[#0B0E11] border border-gray-700 py-3 rounded-xl font-semibold hover:border-gray-600 transition-all flex items-center justify-center space-x-2">
                                            <span className="text-red-500 font-bold">G</span>
                                            <span>Continue with Google</span>
                                        </button>

                                        <button
                                            className="w-full bg-[#fcd436] text-black py-3 rounded-xl font-bold hover:bg-opacity-90 transition-all"
                                            onClick={() => setShowLoginForm(true)}
                                        >
                                            Continue with VetaWallet
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="text-center mb-6">
                                        <h2 className="text-2xl font-bold text-white mb-2">Log In</h2>
                                        <p className="text-gray-400 text-sm">Welcome back to VetaWallet</p>
                                    </div>

                                    <form onSubmit={handleSubmit(submitHandler)} className="space-y-4">
                                        <div>
                                            <input
                                                type="email"
                                                placeholder="Email"
                                                className="w-full bg-[#0B0E11] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-[#fcd436] outline-none transition-all"
                                                {...register("email", {
                                                    required: "Required",
                                                    pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i, message: "Invalid email" },
                                                })}
                                            />
                                            {errors.email && <span className="text-red-500 text-xs mt-1">{errors.email.message as string}</span>}
                                        </div>

                                        <div className="relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Password"
                                                className="w-full bg-[#0B0E11] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-[#fcd436] outline-none transition-all pr-12"
                                                {...register("password", { required: "Required" })}
                                            />
                                            <button
                                                type="button"
                                                onClick={togglePasswordVisibility}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                            >
                                                {showPassword ? <FaRegEyeSlash size={20} /> : <FaRegEye size={20} />}
                                            </button>
                                        </div>

                                        <button
                                            type="submit"
                                            className="w-full bg-[#fcd436] text-black font-bold py-3 rounded-xl hover:bg-opacity-90 transition-all"
                                        >
                                            Login
                                        </button>
                                    </form>

                                    <div className="text-sm text-gray-400 mt-4 text-center">
                                        New to VetaWallet?{' '}
                                        <a href="https://www.vetawallet.com/register" className="text-[#fcd436] hover:underline font-semibold" target="_blank" rel="noopener noreferrer">
                                            Register
                                        </a>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )
            }

            {/* Binance Pay Modal (DISABLED) */}
            {/* {
                showPaymentModal && currentOrder && (
                    <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4">
                        <div className="bg-[#1E2329] rounded-[32px] w-full max-w-md p-8 border border-gray-800 relative">
                            <button
                                onClick={() => { setShowPaymentModal(false); setOrderPolling(false); }}
                                className="absolute top-4 right-4 text-gray-400 hover:text-white"
                            >
                                <MdClose size={24} />
                            </button>

                            <div className="text-center space-y-6">
                                <div className="bg-[#fcd436]/20 p-4 rounded-full w-fit mx-auto">
                                    <MdPayments className="text-[#fcd436] text-4xl" />
                                </div>

                                <div>
                                    <h3 className="text-2xl font-bold text-white mb-2">Complete Your Payment</h3>
                                    <p className="text-gray-400 text-sm">Pay {currentOrder.paymentAmount} {currentOrder.paymentCurrency} to receive {currentOrder.tokenAmount} {currentOrder.tokenSymbol}</p>
                                </div>

                                <div className="bg-[#0B0E11] rounded-xl p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-gray-400 text-sm">Status</span>
                                        <span className={`font-bold ${getStatusColor(currentOrder.status)}`}>
                                            {currentOrder.status === 'PENDING' && <span className="flex items-center space-x-1"><MdRefresh className="animate-spin" /><span>Waiting for payment</span></span>}
                                            {currentOrder.status === 'PAID' && <span className="flex items-center space-x-1"><MdRefresh className="animate-spin" /><span>Processing tokens</span></span>}
                                            {currentOrder.status === 'TOKENS_SENT' && <span className="flex items-center space-x-1"><MdCheckCircle /><span>Complete!</span></span>}
                                            {currentOrder.status === 'FAILED' && <span className="flex items-center space-x-1"><MdError /><span>Failed</span></span>}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-400">Order ID: {currentOrder.orderId}</div>
                                </div>

                                {currentOrder.qrContent && currentOrder.status === 'PENDING' && (
                                    <div className="bg-white p-6 rounded-2xl w-fit mx-auto">
                                        <img
                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(currentOrder.qrContent)}`}
                                            alt="Binance Pay QR"
                                            className="w-48 h-48"
                                        />
                                    </div>
                                )}

                                {currentOrder.paymentUrl && currentOrder.status === 'PENDING' && (
                                    <>
                                        <div className="bg-[#0B0E11] rounded-xl p-4 flex items-center justify-between">
                                            <span className="text-xs text-gray-400 font-mono truncate max-w-[200px]">
                                                {currentOrder.paymentUrl.substring(0, 40)}...
                                            </span>
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(currentOrder.paymentUrl);
                                                    Swal.fire({
                                                        toast: true,
                                                        position: 'top',
                                                        icon: 'success',
                                                        title: 'Copied!',
                                                        showConfirmButton: false,
                                                        timer: 1500,
                                                        background: '#1E2329',
                                                        color: '#ffffff'
                                                    });
                                                }}
                                                className="text-[#fcd436] hover:text-white transition-colors"
                                            >
                                                <MdContentCopy />
                                            </button>
                                        </div>

                                        <a
                                            href={currentOrder.paymentUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block w-full bg-[#fcd436] text-black font-bold py-4 rounded-2xl hover:bg-opacity-90 transition-all text-center"
                                        >
                                            Open in Binance Pay
                                        </a>
                                    </>
                                )}

                                {currentOrder.txHash && (
                                    <a
                                        href={`https://polygonscan.com/tx/${currentOrder.txHash}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-[#fcd436] hover:underline"
                                    >
                                        View Transaction on Explorer →
                                    </a>
                                )}

                                {currentOrder.status === 'PENDING' && (
                                    <button
                                        onClick={async () => {
                                            const result = await Swal.fire({
                                                title: 'Cancel Payment?',
                                                text: "Are you sure you want to cancel this order?",
                                                icon: 'warning',
                                                showCancelButton: true,
                                                confirmButtonColor: '#fcd436',
                                                cancelButtonColor: '#1E2329',
                                                confirmButtonText: 'Yes, cancel it',
                                                cancelButtonText: 'No, keep waiting',
                                                background: '#1E2329',
                                                color: '#ffffff'
                                            });

                                            if (result.isConfirmed) {
                                                clearOrderPersistence();
                                            }
                                        }}
                                        className="block w-full mt-4 text-gray-500 hover:text-red-500 text-sm font-medium transition-colors"
                                    >
                                        Cancel Payment
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )
            } */}

        </div >
    );
};

export default Home;