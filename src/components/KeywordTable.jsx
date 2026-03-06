import { useState, useMemo } from 'react';

export default function KeywordTable({ keywords }) {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [sortKey, setSortKey] = useState('latest');
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(0);
  const perPage = 20;

  const categories = useMemo(() => {
    return [...new Set(keywords.map((k) => k.category))].filter(Boolean).sort();
  }, [keywords]);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(0);
  };

  const filtered = useMemo(() => {
    let items = keywords;
    if (catFilter !== 'all') {
      items = items.filter((k) => k.category === catFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter((k) => k.keyword.toLowerCase().includes(q));
    }

    items = [...items].sort((a, b) => {
      let aVal = a[sortKey];
      let bVal = b[sortKey];
      if (aVal === null) aVal = 999;
      if (bVal === null) bVal = 999;
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return items;
  }, [keywords, search, catFilter, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paged = filtered.slice(page * perPage, (page + 1) * perPage);

  const SortHeader = ({ label, field }) => (
    <th
      className="px-3 py-2 text-left text-xs font-medium text-slate-400 uppercase cursor-pointer hover:text-white select-none"
      onClick={() => handleSort(field)}
    >
      {label} {sortKey === field ? (sortDir === 'asc' ? '▲' : '▼') : ''}
    </th>
  );

  const getChange = (k) => {
    if (k.latest === null || k.previous === null) return null;
    return k.previous - k.latest;
  };

  return (
    <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Keyword Rankings</h2>
          <input
            type="text"
            placeholder="Filter keywords..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="bg-slate-700 text-white rounded-lg px-3 py-2 text-sm w-full sm:w-72 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {categories.length > 1 && (
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => { setCatFilter('all'); setPage(0); }}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                catFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => { setCatFilter(cat); setPage(0); }}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                  catFilter === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-400 uppercase">Keyword</th>
              <SortHeader label="Volume" field="volume" />
              <SortHeader label="Latest" field="latest" />
              <SortHeader label="Best" field="bestPosition" />
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-400 uppercase">Change</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-400 uppercase">Domain</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-400 uppercase">Category</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((k) => {
              const change = getChange(k);
              return (
                <tr key={k.keyword} className="border-b border-slate-700/40 hover:bg-slate-700/30">
                  <td className="px-3 py-2 text-slate-300 max-w-xs truncate" title={k.keyword}>
                    {k.keyword}
                  </td>
                  <td className="px-3 py-2 text-slate-400">{k.volume.toLocaleString()}</td>
                  <td className="px-3 py-2">
                    <span className={
                      k.latest === null ? 'text-slate-600' :
                      k.latest <= 3 ? 'text-emerald-400 font-bold' :
                      k.latest <= 10 ? 'text-blue-400 font-semibold' :
                      k.latest <= 30 ? 'text-amber-400' :
                      'text-slate-400'
                    }>
                      {k.latest === null ? '-' : k.latest === 101 ? '>100' : k.latest}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate-400">
                    {k.bestPosition || '-'}
                  </td>
                  <td className="px-3 py-2">
                    {change === null ? (
                      <span className="text-slate-600">-</span>
                    ) : change > 0 ? (
                      <span className="text-emerald-400">+{change}</span>
                    ) : change < 0 ? (
                      <span className="text-red-400">{change}</span>
                    ) : (
                      <span className="text-slate-500">0</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-500 max-w-[120px] truncate" title={k.domain}>
                    {k.domain}
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-500 max-w-[120px] truncate" title={k.category}>
                    {k.category}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4 text-sm text-slate-400">
        <span>{filtered.length} keywords</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1 bg-slate-700 rounded disabled:opacity-40 hover:bg-slate-600"
          >
            Prev
          </button>
          <span>{page + 1} / {totalPages || 1}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-3 py-1 bg-slate-700 rounded disabled:opacity-40 hover:bg-slate-600"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
