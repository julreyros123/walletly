import { useGamificationStore } from '../../src/store/gamificationStore';

describe('savingsStore facade', () => {
  beforeEach(() => {
    useGamificationStore.setState({
      savingsGoals: [],
      unspentSavingsVault: 0,
      savingsRecords: [],
    });
  });

  test('savings actions delegate to unified gamification state', () => {
    useGamificationStore.getState().addSavingsGoal('Vacation', 5000, '2026-12-31', 'Travel');
    expect(useGamificationStore.getState().savingsGoals).toHaveLength(1);
    expect(useGamificationStore.getState().savingsGoals[0].name).toBe('Vacation');
  });

  test('savings actions allocate and withdraw unspent savings vault', () => {
    useGamificationStore.getState().allocateUnspentSavings(1000, 'Rollover unspent allowance');
    expect(useGamificationStore.getState().unspentSavingsVault).toBe(1000);

    const withdrawSuccess = useGamificationStore.getState().withdrawUnspentSavings(400);
    expect(withdrawSuccess).toBe(true);
    expect(useGamificationStore.getState().unspentSavingsVault).toBe(600);
  });
});
