import { describe, it, expect } from 'vitest';
import { dexRouter } from '../src/services/router';

describe('DEX Router', () => {
  it('should find the best route', async () => {
    const bestRoute = await dexRouter.findBestRoute('SOL', 'USDC', 1);
    expect(bestRoute).toBeDefined();
    expect(bestRoute.dex).toBeDefined();
    expect(bestRoute.quote).toBeDefined();
  });
});
