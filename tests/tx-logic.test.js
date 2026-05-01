import { describe, test, expect } from 'vitest';
import { calculateWeiUSDTValue } from '../utils/math-pure';

describe('Transaction Logic (Frontend)', () => {
  
  describe('calculateWeiUSDTValue', () => {
    test('should calculate 6 decimals correctly (Polygon/ETH)', () => {
      const amount = '0.03';
      const decimals = 6;
      const result = calculateWeiUSDTValue(amount, decimals);
      expect(result).toBe('30000');
    });

    test('should calculate 18 decimals correctly (BSC)', () => {
      const amount = '0.03';
      const decimals = 18;
      const result = calculateWeiUSDTValue(amount, decimals);
      // 0.03 * 10^18 = 3 * 10^16 = 30000000000000000
      expect(result).toBe('30000000000000000');
    });

    test('should handle integers correctly', () => {
      const amount = '1';
      const decimals = 6;
      const result = calculateWeiUSDTValue(amount, decimals);
      expect(result).toBe('1000000');
    });

    test('should handle many decimal places without precision loss', () => {
      const amount = '0.123456';
      const decimals = 6;
      const result = calculateWeiUSDTValue(amount, decimals);
      expect(result).toBe('123456');
    });
  });

});
