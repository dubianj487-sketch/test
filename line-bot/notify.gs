function checkAndNotify() {
  const now = new Date();
  const totalMin = now.getHours() * 60 + now.getMinutes();
  if (totalMin < BUSINESS_START_MIN || totalMin > BUSINESS_END_MIN) return;

  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_DATA);
  if (!sheet) return;

  const data = sheet.getDataRange().getValues();
  const waitingRows = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][7] === '待機') {
      waitingRows.push({ rowIndex: i + 1, userId: data[i][0], number: String(data[i][1]).trim(), site: data[i][2] });
    }
  }

  if (waitingRows.length === 0) return;

  const needsSite1 = waitingRows.some(function(r) { return r.site === 'SITE1'; });
  const needsSite2 = waitingRows.some(function(r) { return r.site === 'SITE2'; });

  const site1 = needsSite1 ? scrapeSite1() : { fubi: [], kanryo: [] };
  const site2 = needsSite2 ? scrapeSite2() : { yobidashi: [] };

  if (needsSite1 || needsSite2) {
    updateServerSheet(site1, site2);
  }

  waitingRows.forEach(function(row) {
    let category = '';

    if (row.site === 'SITE1') {
      if (site1.fubi.includes(row.number))        category = '審査不備';
      else if (site1.kanryo.includes(row.number)) category = '交付準備完了';
    } else if (row.site === 'SITE2') {
      if (site2.yobidashi.includes(row.number))   category = '呼出中';
    }

    if (!category) return;

    pushFlex(row.userId, category + 'のお知らせ：' + row.number + '番', flexNotify(row.number, category));
    sheet.getRange(row.rowIndex, 8).setValue('通知済み');
  });
}

function setupNotifyTrigger() {
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'checkAndNotify') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('checkAndNotify').timeBased().everyMinutes(1).create();
  Logger.log('トリガー設定完了（1分おき）');
}
