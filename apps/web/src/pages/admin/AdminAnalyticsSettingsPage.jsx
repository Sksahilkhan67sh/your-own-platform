import { useState, useEffect } from 'react';
import { CHART_TYPE_VALUES } from '@your-own/shared';
import { Input } from '../../components/ui/Input.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { Toggle } from '../../components/ui/Toggle.jsx';
import { fetchAdminAnalyticsSettings, updateAdminAnalyticsSettings } from '../../lib/analyticsApi.js';

// [showKey, manualKey, label, description]
const TOGGLE_ROWS = [
  ['showMonthlySales', 'manualMonthlySales', 'Sold Last Month'],
  ['showYearlySales', 'manualYearlySales', 'Sold Last Year'],
  ['showLifetimeSales', 'manualLifetimeSales', 'Lifetime Sales'],
  ['showAveragePrice', 'manualAveragePrice', 'Average Price'],
  ['showHighestPrice', 'manualHighestPrice', 'Highest Price'],
  ['showLowestPrice', 'manualLowestPrice', 'Lowest Price'],
  ['showGrowth', 'manualGrowth', 'Price Growth'],
  ['showNearbySales', 'manualNearbySales', 'Nearby Sold'],
  ['showDemand', 'manualDemand', 'Demand Score'],
  ['showInvestmentScore', 'manualInvestmentScore', 'Investment Score'],
  ['showSoldVsActiveRatio', null, 'Sold vs Active Ratio'],
  ['showActiveListings', null, 'Active Listings'],
];

const CHART_LABELS = {
  monthly: 'Monthly Chart',
  yearly: 'Yearly Chart',
  pie: 'Pie Chart',
  bar: 'Bar Chart',
  area: 'Area Chart',
};

function Section({ title, description, children }) {
  return (
    <section className="rounded-card border border-border bg-surface p-6 shadow-card">
      <h2 className="font-display text-lg text-ink">{title}</h2>
      {description && <p className="mt-1 text-sm text-ink-soft">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function AdminAnalyticsSettingsPage() {
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [serverError, setServerError] = useState(null);

  useEffect(() => {
    fetchAdminAnalyticsSettings()
      .then(setSettings)
      .catch(() => setServerError('Could not load analytics settings. Try refreshing the page.'))
      .finally(() => setIsLoading(false));
  }, []);

  const setField = (field, value) => setSettings((prev) => ({ ...prev, [field]: value }));
  const setChart = (type, value) =>
    setSettings((prev) => ({ ...prev, chartTypes: { ...prev.chartTypes, [type]: value } }));

  const setTier = (index, patch) =>
    setSettings((prev) => {
      const tiers = [...prev.demandFormula];
      tiers[index] = { ...tiers[index], ...patch };
      return { ...prev, demandFormula: tiers };
    });

  const addTier = () =>
    setSettings((prev) => ({
      ...prev,
      demandFormula: [...prev.demandFormula, { max: 1000, label: 'New tier' }],
    }));

  const removeTier = (index) =>
    setSettings((prev) => ({ ...prev, demandFormula: prev.demandFormula.filter((_, i) => i !== index) }));

  const handleSave = async () => {
    setServerError(null);
    setIsSaving(true);
    try {
      const saved = await updateAdminAnalyticsSettings(toPayload(settings));
      setSettings(saved);
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 3000);
    } catch (err) {
      setServerError(err?.response?.data?.error?.message || 'Could not save analytics settings.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!settings) {
    return <p className="text-danger">{serverError}</p>;
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-display-md text-ink">Analytics Management</h1>
          <p className="mt-2 text-ink-soft">
            Choose which market-insight panels viewers see, and whether their numbers come from live data or values
            you set manually.
          </p>
        </div>
        <Button type="button" variant="primary" onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Save changes'}
        </Button>
      </div>

      {serverError && (
        <p role="alert" className="mt-4 text-sm text-danger">
          {serverError}
        </p>
      )}
      {savedNotice && (
        <p role="status" className="mt-4 rounded bg-accent-soft px-4 py-2.5 text-sm text-accent-hover">
          Analytics settings saved.
        </p>
      )}

      <div className="mt-6 space-y-6">
        <Section title="Data source" description="Live values are recalculated from the database. Manual values are fixed until you change them here.">
          <Toggle
            label="Use manual values"
            description="When off, everything below uses live database values."
            checked={settings.manualMode}
            onChange={(v) => setField('manualMode', v)}
          />
        </Section>

        <Section title="Visible analytics" description="Hidden panels are not rendered for viewers at all.">
          <div className="divide-y divide-border">
            {TOGGLE_ROWS.map(([showKey, manualKey, label]) => (
              <div key={showKey}>
                <Toggle label={label} checked={settings[showKey]} onChange={(v) => setField(showKey, v)} />
                {settings.manualMode && manualKey && settings[showKey] && (
                  <div className="pb-3 pl-1">
                    <Input
                      label={`Manual ${label.toLowerCase()}`}
                      type={manualKey === 'manualDemand' ? 'text' : 'number'}
                      value={settings[manualKey] ?? ''}
                      onChange={(e) =>
                        setField(
                          manualKey,
                          manualKey === 'manualDemand'
                            ? e.target.value
                            : e.target.value === ''
                              ? null
                              : Number(e.target.value)
                        )
                      }
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>

        <Section title="Demand formula" description="Classifies a computed demand score into a label. Tiers are matched in ascending order; the last tier (no max) catches everything above it.">
          <div className="space-y-3">
            {settings.demandFormula.map((tier, index) => (
              <div key={index} className="flex items-center gap-3">
                <span className="text-sm text-ink-soft">Score up to</span>
                <input
                  type="number"
                  value={tier.max ?? ''}
                  placeholder="and above"
                  onChange={(e) => setTier(index, { max: e.target.value === '' ? null : Number(e.target.value) })}
                  className="w-28 rounded border border-border bg-surface px-3 py-2 text-sm text-ink"
                />
                <span className="text-sm text-ink-soft">→</span>
                <input
                  type="text"
                  value={tier.label}
                  onChange={(e) => setTier(index, { label: e.target.value })}
                  className="flex-1 rounded border border-border bg-surface px-3 py-2 text-sm text-ink"
                />
                <button
                  type="button"
                  onClick={() => removeTier(index)}
                  className="text-sm text-danger hover:underline"
                  aria-label={`Remove tier ${index + 1}`}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <Button type="button" variant="outline" size="sm" className="mt-3" onClick={addTier}>
            Add tier
          </Button>
        </Section>

        <Section title="Price growth">
          <Toggle
            label="Use manual growth %"
            description="When off, growth is recalculated from recent vs prior sale windows."
            checked={settings.growthUseManual}
            onChange={(v) => setField('growthUseManual', v)}
          />
          {settings.growthUseManual && (
            <div className="mt-3">
              <Input
                label="Manual growth %"
                type="number"
                value={settings.manualGrowth ?? ''}
                onChange={(e) => setField('manualGrowth', e.target.value === '' ? null : Number(e.target.value))}
              />
            </div>
          )}
        </Section>

        <Section title="Charts" description="Turn the whole charts panel on/off, and choose which chart types render within it.">
          <Toggle label="Show charts" checked={settings.showCharts} onChange={(v) => setField('showCharts', v)} />
          <Toggle label="Show heatmap" checked={settings.showHeatmap} onChange={(v) => setField('showHeatmap', v)} />
          {settings.showCharts && (
            <div className="mt-3 grid grid-cols-2 gap-x-6 sm:grid-cols-3">
              {CHART_TYPE_VALUES.map((type) => (
                <Toggle
                  key={type}
                  label={CHART_LABELS[type]}
                  checked={settings.chartTypes?.[type] ?? true}
                  onChange={(v) => setChart(type, v)}
                />
              ))}
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}

function toPayload(settings) {
  const payload = { ...settings };
  delete payload._id;
  delete payload.id;
  delete payload.createdAt;
  delete payload.updatedAt;
  delete payload.__v;
  return payload;
}
