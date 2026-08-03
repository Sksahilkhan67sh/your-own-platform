import { useLandAnalytics } from '../../hooks/useLandAnalytics.js';
import { MarketInsightsCard, MarketInsightsSkeleton, MarketInsightsEmpty } from './MarketInsightsCard.jsx';
import {
  MonthlySalesChart,
  PriceTrendChart,
  PriceAppreciationChart,
  SoldVsActivePieChart,
} from './MarketInsightsCharts.jsx';
import { NearbySoldList } from './NearbySoldList.jsx';
import { ErrorState } from '../ui/EmptyAndErrorStates.jsx';

function ChartPanel({ title, children }) {
  return (
    <div className="rounded-card border border-border bg-surface p-5 shadow-card">
      <h3 className="font-display text-base text-ink">{title}</h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}

export function MarketInsightsSection({ landId }) {
  const { data, isLoading, isError, error, refetch } = useLandAnalytics(landId);

  if (isLoading) return <MarketInsightsSkeleton />;
  if (isError) return <ErrorState message={error} onRetry={refetch} />;
  if (!data) return null;

  const hasAnyMarketData = data.lifetimeSold > 0 || data.activeListings > 0;

  return (
    <div className="space-y-6">
      <MarketInsightsCard data={data} />

      {!hasAnyMarketData ? (
        <MarketInsightsEmpty />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <ChartPanel title="Monthly Sales">
              <MonthlySalesChart nearbySoldProperties={data.nearbySoldProperties} />
            </ChartPanel>
            <ChartPanel title="Price Trend">
              <PriceTrendChart nearbySoldProperties={data.nearbySoldProperties} />
            </ChartPanel>
            <ChartPanel title="Price Appreciation">
              <PriceAppreciationChart priceTrend={data.priceTrend} priceGrowth={data.priceGrowth} />
            </ChartPanel>
            <ChartPanel title="Sold vs Active">
              <SoldVsActivePieChart sold1Year={data.sold1Year} activeListings={data.activeListings} />
            </ChartPanel>
          </div>

          <div className="rounded-card border border-border bg-surface p-5 shadow-card">
            <h3 className="font-display text-base text-ink">Nearby Sold Properties</h3>
            <div className="mt-3">
              <NearbySoldList properties={data.nearbySoldProperties} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
