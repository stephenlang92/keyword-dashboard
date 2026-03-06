import { useState, useEffect, useMemo } from 'react';
import { fetchSheetData } from './utils/fetchSheetData';
import KPICards from './components/KPICards';
import RankingChart from './components/RankingChart';
import DistributionChart from './components/DistributionChart';
import BiggestMovers from './components/BiggestMovers';
import VolumeScatter from './components/VolumeScatter';
import KeywordTable from './components/KeywordTable';

function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDomain, setSelectedDomain] = useState('joy.so');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchSheetData()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const domains = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.keywords.map((k) => k.domain))].filter(Boolean).sort();
  }, [data]);

  const domainFiltered = useMemo(() => {
    if (!data) return [];
    return data.keywords.filter((k) => k.domain === selectedDomain);
  }, [data, selectedDomain]);

  const categories = useMemo(() => {
    return [...new Set(domainFiltered.map((k) => k.category))].filter(Boolean).sort();
  }, [domainFiltered]);

  const filtered = useMemo(() => {
    if (selectedCategory === 'all') return domainFiltered;
    return domainFiltered.filter((k) => k.category === selectedCategory);
  }, [domainFiltered, selectedCategory]);

  const handleRefresh = () => {
    setLoading(true);
    setError(null);
    fetchSheetData()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <div className="text-slate-400">Loading data from Google Sheets...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-red-400">
          <div className="text-xl mb-2">Failed to load data</div>
          <div className="text-sm mb-4">{error}</div>
          <button onClick={handleRefresh} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-[1400px] mx-auto">
      {/* Sticky Header + Filters */}
      <div className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 px-4 sm:px-6 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <h1 className="text-xl font-bold text-white">Keyword Dashboard</h1>
            <p className="text-xs text-slate-400">
              Tracking {domainFiltered.length} keywords across {data.dates.length} checkpoints &middot; {selectedDomain}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {domains.length > 1 && (
              <select
                value={selectedDomain}
                onChange={(e) => { setSelectedDomain(e.target.value); setSelectedCategory('all'); }}
                className="bg-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {domains.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            )}
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 text-sm"
            >
              Refresh Data
            </button>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
            }`}
          >
            All ({domainFiltered.length})
          </button>
          {categories.map((cat) => {
            const count = domainFiltered.filter((k) => k.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Dashboard sections */}
      <div className="flex flex-col gap-6 p-4 sm:p-6">
        <KPICards keywords={filtered} />

        <RankingChart keywords={filtered} dates={data.dates} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DistributionChart keywords={filtered} />
          <VolumeScatter keywords={filtered} />
        </div>

        <BiggestMovers keywords={filtered} />

        <KeywordTable keywords={filtered} />
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-slate-600 mt-2 pb-4">
        Data source: Google Sheets (live) &middot; Last refresh: {new Date().toLocaleString()}
      </div>
    </div>
  );
}

export default App;
