// ============================================================
// Google Apps Script: SpySERP → Google Sheets Auto Sync (SELECTED DOMAINS)
// ============================================================
// Update CONFIG below with your SpySERP credentials and domains
// ============================================================

// ===== CẤU HÌNH =====
const CONFIG = {
  API_TOKEN: '<YOUR_SPYSERP_TOKEN>',
  PROJECT_ID: 000000,
  DOMAIN_ID: 000000000,
  SE_ID: 13038,               // Google US (change if needed)
  SHEET_NAME: 'SpySERP Data',
  ALLOWED_DOMAINS: [
    'yourdomain.com',
    'competitor1.com',
    'competitor2.com',
  ],
};

// ===== HÀM CHÍNH =====
function syncSpySERP() {
  Logger.log('Starting SpySERP sync (selected domains)...');

  const fileId = requestExport();
  if (!fileId) return;
  Logger.log('Export requested, fileId: ' + fileId);

  if (!waitForExport(fileId)) return;
  Logger.log('Export file ready');

  const csvContent = downloadExport(fileId);
  if (!csvContent) return;
  Logger.log('Downloaded CSV, length: ' + csvContent.length);

  writeToSheet(csvContent);
  Logger.log('Sync completed!');
}

// ===== STEP 1: Request Export =====
function requestExport() {
  const payload = {
    token: CONFIG.API_TOKEN,
    method: 'statisticExport',
    project_id: CONFIG.PROJECT_ID,
    domain: CONFIG.DOMAIN_ID,
    se: [CONFIG.SE_ID],
    exportParams: {
      fileType: '2',
      exportType: 'all',
      separateDomains: false,
      includeCategory: true,
      includeUrl: true,
      includeReportSetting: true,
      includeSnippet: false,
      splitKeywords: false,
      keywordsPerSheet: 10000,
    },
  };

  const result = apiPost(payload);
  if (result && result.success && result.fileId) {
    return result.fileId;
  }
  Logger.log('ERROR: Export failed - ' + JSON.stringify(result));
  return null;
}

// ===== STEP 2: Wait for Export =====
function waitForExport(fileId) {
  for (let i = 0; i < 30; i++) {
    Utilities.sleep(3000);

    const result = apiPost({
      token: CONFIG.API_TOKEN,
      method: 'statisticExportItem',
      project_id: CONFIG.PROJECT_ID,
      item_id: fileId,
    });

    if (result && result.progress === 100 && result.status === 2 && result.fileExists) {
      return true;
    }
    Logger.log('Waiting... ' + (result ? result.progress : '?') + '%');
  }

  Logger.log('ERROR: Export timed out');
  return false;
}

// ===== STEP 3: Download Export =====
function downloadExport(fileId) {
  const url = 'https://spyserp.com/panel/api/statisticExportDownload?token=' + CONFIG.API_TOKEN;
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({
      token: CONFIG.API_TOKEN,
      method: 'statisticExportDownload',
      project_id: CONFIG.PROJECT_ID,
      item_id: fileId,
    }),
    muteHttpExceptions: true,
  };

  const response = UrlFetchApp.fetch(url, options);
  const content = response.getContentText();

  if (!content || content.length < 100) {
    Logger.log('ERROR: Download failed - ' + content);
    return null;
  }
  return content;
}

// ===== STEP 4: Parse & Write (SELECTED DOMAINS) =====
function writeToSheet(csvContent) {
  const lines = csvContent.split('\n');

  // Tìm dòng header
  let headerIndex = -1;
  for (let i = 0; i < Math.min(lines.length, 20); i++) {
    if (lines[i].startsWith('Keywords;')) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) {
    Logger.log('ERROR: Cannot find header row');
    return;
  }

  // Parse header
  const headers = parseSemicolonCsv(lines[headerIndex]);
  const domainsCol = headers.indexOf('Domains');

  // Parse data rows — chỉ lấy domains trong danh sách
  const allowed = CONFIG.ALLOWED_DOMAINS.map(d => d.toLowerCase());
  const allRows = [];
  const domainCounts = {};

  for (let i = headerIndex + 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;

    const row = parseSemicolonCsv(lines[i]);
    if (row.length < 5) continue;

    const domain = (domainsCol >= 0 ? row[domainsCol] : '').toLowerCase();
    if (allowed.includes(domain)) {
      allRows.push(row);
      domainCounts[domain] = (domainCounts[domain] || 0) + 1;
    }
  }

  if (allRows.length === 0) {
    Logger.log('ERROR: No rows found for selected domains');
    return;
  }

  // Log domain counts
  Object.entries(domainCounts).forEach(([d, c]) => {
    Logger.log('  ' + d + ': ' + c + ' rows');
  });

  // Ghi vào sheet
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME);
  }

  sheet.clear();

  const numCols = headers.length;
  const paddedRows = allRows.map(row => {
    while (row.length < numCols) row.push('');
    return row.slice(0, numCols);
  });

  sheet.getRange(1, 1, 1, numCols).setValues([headers]);
  if (paddedRows.length > 0) {
    sheet.getRange(2, 1, paddedRows.length, numCols).setValues(paddedRows);
  }

  // Format header
  const headerRange = sheet.getRange(1, 1, 1, numCols);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#1e3a5f');
  headerRange.setFontColor('#ffffff');
  sheet.setFrozenRows(1);

  Logger.log('Written ' + allRows.length + ' rows for ' + Object.keys(domainCounts).length + ' domains');
}

// ===== HELPERS =====

function parseSemicolonCsv(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ';' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function apiPost(payload) {
  const url = 'https://spyserp.com/panel/api/' + payload.method + '?token=' + CONFIG.API_TOKEN;
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  };

  const response = UrlFetchApp.fetch(url, options);
  try {
    return JSON.parse(response.getContentText());
  } catch (e) {
    return null;
  }
}

// ===== SETUP TRIGGER =====
function setupWeeklyTrigger() {
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'syncSpySERP') {
      ScriptApp.deleteTrigger(t);
    }
  });

  ScriptApp.newTrigger('syncSpySERP')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(9)
    .create();

  Logger.log('Weekly trigger created: every Monday at 9 AM (Sheet timezone: GMT+7)');
}

// ===== MENU =====
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('SpySERP Sync')
    .addItem('Sync Now', 'syncSpySERP')
    .addItem('Setup Weekly Trigger', 'setupWeeklyTrigger')
    .addToUi();
}
