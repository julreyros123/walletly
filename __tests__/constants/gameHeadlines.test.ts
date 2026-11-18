import { GAME_HEADLINES_POOL } from '../../src/constants/gameHeadlines';

describe('gameHeadlines constants', () => {
  test('GAME_HEADLINES_POOL has valid headlines with required fields', () => {
    expect(GAME_HEADLINES_POOL.length).toBeGreaterThan(0);

    GAME_HEADLINES_POOL.forEach((item) => {
      expect(typeof item.id).toBe('string');
      expect(typeof item.ticker).toBe('string');
      expect(typeof item.companyName).toBe('string');
      expect(typeof item.headline).toBe('string');
      expect(typeof item.actualImpact).toBe('number');
      expect(['BUY', 'SELL']).toContain(item.correctAction);
      expect(item.virtualBaseBet).toBeGreaterThan(0);

      // Verify business logic: positive impact corresponds to BUY, negative to SELL
      if (item.actualImpact > 0) {
        expect(item.correctAction).toBe('BUY');
      } else if (item.actualImpact < 0) {
        expect(item.correctAction).toBe('SELL');
      }
    });
  });
});
