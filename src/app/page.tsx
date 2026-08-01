import SuperFinanceHub from './SuperFinanceHub';
import { fetchAssetClassCounts, fetchTickerTapeAssets } from './actions';

export default async function Page() {
  const initialAssetClassCounts = await fetchAssetClassCounts();
  const initialTickerTapeAssets = await fetchTickerTapeAssets();

  return (
    <SuperFinanceHub
      initialAssetClassCounts={initialAssetClassCounts}
      initialTickerTapeAssets={initialTickerTapeAssets}
    />
  );
}
