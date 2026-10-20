import SuperFinanceHub from './SuperFinanceHub';
import { fetchAssetClassCounts, fetchTickerTapeAssets, fetchAssetsPaginated } from './actions';
import { DEFAULT_ASSET_CLASS_COUNTS } from '@/lib/constants';

export default async function Page() {
  // Fetch all initial data in parallel so the SSR HTML already has content
  // instead of showing "0 assets" + "Loading Market Data…" spinner.
  const [initialAssetClassCounts, initialTickerTapeAssets, initialPageData] = await Promise.all([
    fetchAssetClassCounts().catch(() => DEFAULT_ASSET_CLASS_COUNTS),
    fetchTickerTapeAssets().catch(() => []),
    fetchAssetsPaginated({
      limit: 40,
      offset: 0,
      searchQuery: '',
      activeClass: 'All',
      activeSector: 'All Sectors',
      sortBy: 'Market Cap',
    }).catch(() => ({ assets: [], totalCount: 0 })),
  ]);

  return (
    <SuperFinanceHub
      initialAssetClassCounts={initialAssetClassCounts || DEFAULT_ASSET_CLASS_COUNTS}
      initialTickerTapeAssets={initialTickerTapeAssets}
      initialAssets={initialPageData.assets}
      initialTotalCount={initialPageData.totalCount || initialAssetClassCounts['All'] || 150000}
    />
  );
}
