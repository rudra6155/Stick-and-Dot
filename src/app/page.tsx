import SuperFinanceHub from './SuperFinanceHub';
import { fetchAssetClassCounts, fetchTickerTapeAssets } from './actions';

export default async function Page() {
  const initialAssetClassCounts = await fetchAssetClassCounts().catch(() => ({}));
  const initialTickerTapeAssets = await fetchTickerTapeAssets().catch(() => []);

  return (
    <SuperFinanceHub
      initialAssetClassCounts={initialAssetClassCounts}
      initialTickerTapeAssets={initialTickerTapeAssets}
    />
  );
}
