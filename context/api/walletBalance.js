// pages/api/walletBalance.js
import { getWalletBalance } from '../utils/getWalletsBalance';

export default async function handler(req, res) {
  try {
    const balance = await getWalletBalance();
    res.status(200).json({ balance });
  } catch (error) {
    res.status(500).json({ error: 'Error getting wallet balance' });
  }
}
