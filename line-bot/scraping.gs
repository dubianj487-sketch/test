function scrapeSite1() {
  const result = { fubi: [], kanryo: [] };
  try {
    const html = UrlFetchApp.fetch(SITE1_URL, {
      method: 'get',
      headers: { 'User-Agent': SITE1_UA }
    }).getContentText('UTF-8');

    const match = html.match(/bkn_cd=003189[\s\S]*?<div class="comment">([\s\S]*?)<\/div>/);
    if (match && match[1]) {
      const text = match[1];
      const fubiIdx   = text.indexOf('【審査不備番号】');
      const kanryoIdx = text.indexOf('【交付準備完了番号】');
      if (fubiIdx !== -1)   result.fubi   = parseStrongNumbers(text.substring(fubiIdx, kanryoIdx !== -1 ? kanryoIdx : undefined));
      if (kanryoIdx !== -1) result.kanryo = parseStrongNumbers(text.substring(kanryoIdx));
    }
  } catch(e) {
    Logger.log('scrapeSite1 error: ' + e);
  }
  return result;
}

function scrapeSite2() {
  const result = { yobidashi: [] };
  try {
    const html = UrlFetchApp.fetch(SITE2_URL).getContentText('Shift_JIS');
    const regex = /<b>\s*(\d+)\s*<\/b>/gi;
    let m;
    while ((m = regex.exec(html)) !== null) result.yobidashi.push(m[1].trim());
  } catch(e) {
    Logger.log('scrapeSite2 error: ' + e);
  }
  return result;
}

function parseStrongNumbers(text) {
  const regex = /<span class=(?:"strong"|strong)>(\d+)<\/span>/g;
  const numbers = [];
  let m;
  while ((m = regex.exec(text)) !== null) numbers.push(m[1]);
  return numbers;
}

function updateServerSheet(site1, site2) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_SERVER);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_SERVER);
    sheet.appendRow(['審査不備', '交付準備完了', '呼出中', '更新日時']);
  }
  if (sheet.getLastRow() > 1) sheet.deleteRows(2, sheet.getLastRow() - 1);

  const len = Math.max(site1.fubi.length, site1.kanryo.length, site2.yobidashi.length, 1);
  const now = new Date();
  const rows = [];
  for (let i = 0; i < len; i++) {
    rows.push([site1.fubi[i] || '', site1.kanryo[i] || '', site2.yobidashi[i] || '', i === 0 ? now : '']);
  }
  sheet.getRange(2, 1, rows.length, 4).setValues(rows);
}

function saveStatusLog(site1, site2, resultStatus, trigger) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_STATUS);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_STATUS);
    sheet.appendRow(['timestamp', 'SITE1_url', 'SITE2_url', '審査不備', '交付準備完了', '呼出中', 'counts', 'result', 'trigger']);
  }
  const counts = site1.fubi.length + site1.kanryo.length + site2.yobidashi.length;
  sheet.appendRow([new Date(), SITE1_URL, SITE2_URL, site1.fubi.join(','), site1.kanryo.join(','), site2.yobidashi.join(','), counts, resultStatus, trigger]);
}
