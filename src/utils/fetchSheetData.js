import Papa from 'papaparse';

const SHEET_CSV_URL =
  'https://docs.google.com/spreadsheets/d/<YOUR_SHEET_ID>/gviz/tq?tqx=out:csv&gid=<YOUR_GID>';

export async function fetchSheetData() {
  const res = await fetch(SHEET_CSV_URL);
  const text = await res.text();

  const { data } = Papa.parse(text, { header: true, skipEmptyLines: true });

  const headers = Object.keys(data[0] || {});
  const dateColumns = headers.filter(
    (h) => /^\d{2}\.\d{2}\.\d{4}/.test(h)
  );

  // Sort dates chronologically (oldest first)
  dateColumns.sort((a, b) => {
    const [dA, mA, yA] = a.split(' ')[0].split('.');
    const [dB, mB, yB] = b.split(' ')[0].split('.');
    return new Date(`${yA}-${mA}-${dA}`) - new Date(`${yB}-${mB}-${dB}`);
  });

  const keywords = data.map((row) => {
    const rankings = dateColumns.map((col) => {
      const val = row[col];
      if (!val || val === 'NA' || val === '') return null;
      if (val.includes('>100')) return 101;
      return parseInt(val, 10);
    });

    // Compute best position from rankings
    const validRanks = rankings.filter((r) => r !== null);
    const bestPosition = validRanks.length > 0 ? Math.min(...validRanks) : null;

    return {
      keyword: row['Keywords'] || '',
      category: row['Category'] || '',
      domain: row['Domains'] || '',
      serpUrl: row['SERP Url'] || '',
      bestPosition,
      volume: parseInt(row['Volume'], 10) || 0,
      rankings,
      latest: rankings[rankings.length - 1],
      previous: rankings[rankings.length - 2],
    };
  }).filter((k) => k.keyword);

  const dates = dateColumns.map((col) => {
    const [d, m, y] = col.split(' ')[0].split('.');
    return `${d}/${m}`;
  });

  return { keywords, dates, dateColumns };
}
