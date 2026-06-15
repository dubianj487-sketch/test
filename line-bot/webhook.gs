function doPost(e) {
  try {
    const json = JSON.parse(e.postData.contents);
    if (!json.events || !json.events.length) return ok();
    const event = json.events[0];
    if (event.type !== 'message' || event.message.type !== 'text') return ok();
    routeMessage(event);
  } catch(err) {
    Logger.log('doPost error: ' + err);
  }
  return ok();
}

function doGet(e) {
  const type = (e && e.parameter && e.parameter.type) || '';
  if (type === 'json') return serveJson();
  return ContentService.createTextOutput('LINE Bot is running.');
}

function ok() {
  return ContentService.createTextOutput('');
}

function serveJson() {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_SERVER);
    const result = { fubi: [], kanryo: [], yobidashi: [], updatedAt: '' };

    if (sheet && sheet.getLastRow() > 1) {
      const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 4).getValues();
      data.forEach(function(row) {
        const f = String(row[0] || '').trim();
        const k = String(row[1] || '').trim();
        const y = String(row[2] || '').trim();
        if (f) result.fubi.push(f);
        if (k) result.kanryo.push(k);
        if (y) result.yobidashi.push(y);
        if (!result.updatedAt && row[3]) result.updatedAt = new Date(row[3]).toISOString();
      });
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(e) {
    return ContentService.createTextOutput(JSON.stringify({ fubi: [], kanryo: [], yobidashi: [], updatedAt: '' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function routeMessage(event) {
  const userId   = event.source.userId;
  const userText = event.message.text.trim();
  const sheet    = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_DATA);
  const data     = sheet.getDataRange().getValues();

  let regRowIndex  = -1;
  let adminRowIndex = -1;
  const waitingRows = [];

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] !== userId) continue;
    const mode = data[i][7];
    if (mode === '登録処理') regRowIndex  = i + 1;
    if (mode === '管理')     adminRowIndex = i + 1;
    if (mode === '待機') waitingRows.push({ rowIndex: i + 1, number: String(data[i][1]).trim(), site: data[i][2], timestamp: data[i][6] });
  }

  if (adminRowIndex !== -1) {
    handleAdmin(userId, event, sheet, adminRowIndex);
    return;
  }

  switch (userText) {
    case 'admin':
      if (regRowIndex !== -1) sheet.deleteRow(regRowIndex);
      sheet.appendRow([userId, '', '', '', '', '', new Date(), '管理']);
      replyText(event.replyToken, '管理者モード', '管理者モードを開始しました。\nコマンド：チェック / ステータス / 終了');
      return;

    case '中古新規・名義変更':
      startRegistration(userId, event, sheet, 'SITE1', regRowIndex);
      return;

    case '一般継続':
      startRegistration(userId, event, sheet, 'SITE2', regRowIndex);
      return;

    case 'キャンセル':
      handleCancel(userId, event, sheet, waitingRows);
      return;

    case '交付待ち':
      showMyWaiting(userId, event.replyToken, waitingRows);
      return;
  }

  if (/^[0-9]+$/.test(userText)) {
    if (regRowIndex !== -1) {
      completeRegistration(userId, userText, regRowIndex, event, sheet);
    } else if (waitingRows.length > 0) {
      processCancelByNumber(userId, userText, event, sheet, waitingRows);
    } else {
      replyText(event.replyToken, 'エラー', 'メニューから操作を選択してください。');
    }
    return;
  }

  replyText(event.replyToken, 'エラー', 'メニューから操作を選択してください。');
}
