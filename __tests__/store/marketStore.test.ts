import { useMarketStore } from '../../src/store/marketStore';
import * as finnhubApi from '../../src/services/finnhubApi';
import { storage } from '../../src/utils/storage';
import { ASSET_DATA } from '../../src/constants/assets';

describe('marketStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useMarketStore.setState({
      assets: { ...ASSET_DATA },
      assetsList: Object.values(ASSET_DATA),
      isLive: false,
      isSyncing: false,
      lastSyncTimestamp: 0,
      tickDirections: {},
    });
  });

  describe('driftTick', () => {
    test('driftTick executes micro-tick and assigns tick directions to tickers', () => {
      useMarketStore.getState().driftTick();

      const state = useMarketStore.getState();
      expect(state.assetsList.length).toBeGreaterThan(0);
      expect(Object.keys(state.tickDirections).length).toBeGreaterThan(0);

      // Verify each price is at least 1 (boundary protection)
      state.assetsList.forEach((asset) => {
        expect(asset.price).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('startLiveDrift', () => {
    test('startLiveDrift sets up interval on first listener and cleans up on unmount', () => {
      jest.useFakeTimers();

      const unsubscribe1 = useMarketStore.getState().startLiveDrift();
      const unsubscribe2 = useMarketStore.getState().startLiveDrift();

      // Fast-forward interval
      jest.advanceTimersByTime(5000);

      unsubscribe1();
      unsubscribe2();

      jest.useRealTimers();
    });
  });

  describe('refreshAnchor', () => {
    test('refreshAnchor without Finnhub API key sets isLive false and isSyncing false', async () => {
      jest.spyOn(finnhubApi, 'getFinnhubApiKey').mockReturnValue(null);

      await useMarketStore.getState().refreshAnchor(true);
      expect(useMarketStore.getState().isLive).toBe(false);
      expect(useMarketStore.getState().isSyncing).toBe(false);
    });

    test('refreshAnchor with valid quotes updates asset prices and saves to storage', async () => {
      jest.spyOn(finnhubApi, 'getFinnhubApiKey').mockReturnValue('valid_key');
      const setItemSpy = jest.spyOn(storage, 'setItem');

      const mockQuotes = {
        NOVA: { c: 200, d: 5, dp: 2.5, h: 205, l: 195, o: 196, pc: 195 },
      };
      jest.spyOn(finnhubApi, 'fetchAllAssetQuotes').mockResolvedValue(mockQuotes);

      await useMarketStore.getState().refreshAnchor(true);

      const state = useMarketStore.getState();
      expect(state.isLive).toBe(true);
      expect(state.isSyncing).toBe(false);
      expect(setItemSpy).toHaveBeenCalledWith('walletly_market_store_v1', expect.any(String));
    });
  });

  describe('initMarket', () => {
    test('initMarket loads cached state from storage', async () => {
      const cached = {
        assets: {
          NOVA: {
            ...ASSET_DATA.NOVA,
            price: 180,
          },
        },
        lastSyncTimestamp: Date.now() - 1000,
      };
      jest.spyOn(storage, 'getItem').mockResolvedValueOnce(JSON.stringify(cached));
      jest.spyOn(finnhubApi, 'getFinnhubApiKey').mockReturnValue(null);

      await useMarketStore.getState().initMarket();
      expect(useMarketStore.getState().assets.NOVA.price).toBe(180);
    });
  });
});
