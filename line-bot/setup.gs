function setupAll() {
  setupSheets();
  setupMessageSheet();
  Logger.log('全セットアップ完了。次に setupNotifyTrigger を実行してください。');
}

function setupSheets() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const defs = {
    [SHEET_DATA]:    ['userId', 'number', 'site', 'name', 'status', 'phone', 'timestamp', 'mode'],
    [SHEET_MESSAGE]: ['key', 'title', 'body'],
    [SHEET_SERVER]:  ['審査不備', '交付準備完了', '呼出中', '更新日時'],
    [SHEET_STATUS]:  ['timestamp', 'SITE1_url', 'SITE2_url', '審査不備', '交付準備完了', '呼出中', 'counts', 'result', 'trigger']
  };
  Object.entries(defs).forEach(function([name, headers]) {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      sheet.appendRow(headers);
      Logger.log(name + ' を作成しました');
    } else {
      Logger.log(name + ' はすでに存在します');
    }
  });
}

function setupMessageSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_MESSAGE);
  if (!sheet) sheet = ss.insertSheet(SHEET_MESSAGE);
  sheet.clearContents();
  sheet.getRange(1, 1, 1, 3).setValues([['key', 'title', 'body']]);
  const rows = [
    ['register_start_SITE1', '中古新規・名義変更', '受付番号を半角数字で入力してください'],
    ['register_start_SITE2', '一般継続',           '受付番号を半角数字で入力してください'],
    ['error_number_SITE1',   '中古新規・名義変更', '受付番号は半角数字で入力してください'],
    ['error_number_SITE2',   '一般継続',           '受付番号は半角数字で入力してください'],
    ['register_done_SITE1',  '中古新規・名義変更', '{number}番を登録しました。順番が来たらお知らせいたします'],
    ['register_done_SITE2',  '一般継続',           '{number}番を登録しました。順番が来たらお知らせいたします'],
    ['error_selection',      'Oops!(>_<)',          'リッチメニューから操作を選択してください'],
    ['cancel_no_number',     'キャンセル',          '通知を取り消せる受付番号がありません'],
    ['cancel_instruction',   'キャンセル',          '通知を取り消す受付番号を選択するか、番号を直接入力してください'],
    ['cancel_success',       'キャンセル',          '{number}番の通知を取り消しました'],
    ['cancel_not_found',     'Oops!(>_<)',          '入力された受付番号は見つかりませんでした']
  ];
  sheet.getRange(2, 1, rows.length, 3).setValues(rows);
  Logger.log('messageシートを設定しました');
}

function setupNotifyTrigger() {
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'checkAndNotify') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('checkAndNotify').timeBased().everyMinutes(1).create();
  Logger.log('通知トリガーを設定しました（1分おき）');
}

function setupRichMenu() {
  const richMenu = {
    size: { width: 2500, height: 843 },
    selected: true,
    name: '新潟運輸支局',
    chatBarText: 'メニューを開く',
    areas: [
      {
        bounds: { x: 0, y: 0, width: 833, height: 843 },
        action: { type: 'message', label: '中古新規・名義変更', text: '中古新規・名義変更' }
      },
      {
        bounds: { x: 833, y: 0, width: 834, height: 843 },
        action: { type: 'message', label: '一般継続', text: '一般継続' }
      },
      {
        bounds: { x: 1667, y: 0, width: 833, height: 843 },
        action: { type: 'message', label: 'キャンセル', text: 'キャンセル' }
      }
    ]
  };

  const res = UrlFetchApp.fetch('https://api.line.me/v2/bot/richmenu', {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + CHANNEL_ACCESS_TOKEN },
    payload: JSON.stringify(richMenu),
    muteHttpExceptions: true
  });

  const result = JSON.parse(res.getContentText());
  Logger.log('richMenuId: ' + result.richMenuId);
  Logger.log('次のステップ: LINE Developersコンソールでこのメニューに画像をアップロードし、デフォルトに設定してください');
  Logger.log('richMenuId: ' + result.richMenuId);
  return result.richMenuId;
}
