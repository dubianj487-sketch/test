function setupMessageSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_MESSAGE);
  if (!sheet) sheet = ss.insertSheet(SHEET_MESSAGE);

  sheet.clearContents();
  const rows = [
    ['key', 'title', 'text'],
    ['register_start_SITE1', '中古新規・名義変更', '受付番号を半角数字で入力してください'],
    ['register_start_SITE2', '一般継続', '受付番号を半角数字で入力してください'],
    ['error_number_SITE1', '中古新規・名義変更', '受付番号は半角数字で入力してください'],
    ['error_number_SITE2', '一般継続', '受付番号は半角数字で入力してください'],
    ['register_done_SITE1', '中古新規・名義変更', '{number}番を登録しました。順番が来たらお知らせいたします'],
    ['register_done_SITE2', '一般継続', '{number}番を登録しました。順番が来たらお知らせいたします'],
    ['error_selection', 'Oops!(>_<)', 'リッチメニューから操作を選択してください'],
    ['cancel_no_number', 'キャンセル', '通知を取り消せる受付番号がありません'],
    ['cancel_instruction', 'キャンセル', '通知を取り消す受付番号を選択するか、番号を入力してください'],
    ['cancel_input_hint', '', '一部の番号はクイックリプライに表示されません。番号を入力すると取り消せます。'],
    ['error_cancel_invalid_format', 'Oops!(>_<)', '受付番号は半角数字で入力してください'],
    ['cancel_success', 'キャンセル', '{number}番の通知を取り消しました'],
    ['cancel_not_found', 'Oops!(>_<)', '入力された受付番号は見つかりませんでした']
  ];
  sheet.getRange(1, 1, rows.length, 3).setValues(rows);
  Logger.log('messageシートを設定しました');
}

function setupSheets() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  const sheets = {
    'server': ['審査不備', '交付準備完了', '呼出中'],
    'data':    ['userId', 'step', 'number', 'name', 'kana', 'phone', 'timestamp', 'mode'],
    'message': ['timestamp', 'userId', 'message'],
    'status':  ['timestamp', 'SITE1_url', 'SITE2_url', '審査不備', '交付準備完了', '呼出中', 'counts', 'result', 'trigger']
  };

  Object.entries(sheets).forEach(function([name, headers]) {
    var sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      sheet.appendRow(headers);
      Logger.log(name + ' シートを作成しました');
    } else {
      Logger.log(name + ' シートはすでに存在します');
    }
  });

  Logger.log('セットアップ完了');
}

function adminProcess(userId, event) {
  const userText = event.message.text.trim();
  const replyToken = event.replyToken;

  const sheet = SpreadsheetApp
    .openById(SPREADSHEET_ID)
    .getSheetByName(SHEET_DATA);

  const adminProcRowIndex = getAdminRowIndex(sheet, userId);

  switch (userText) {

    case 'admin':
      if (adminProcRowIndex !== -1) {
        sheet.deleteRow(adminProcRowIndex);
        replyFlexMessage(replyToken, '管理者メニュー', '管理者モードを終了しました。');
      } else {
        sheet.appendRow([userId, '', '', '', '', '', new Date(), '管理']);
        SpreadsheetApp.flush();
        const adminMenuMessage = createAdminMenuMessage();
        replyMessage(replyToken, adminMenuMessage);
      }
      break;

    case 'チェック':
      if (adminProcRowIndex !== -1) {
        if (typeof runWebScraping === 'function') {
          const scrapingResult = runWebScraping();
          replyFlexMessage(replyToken, 'スクレイピング結果', scrapingResult);
        } else {
          replyFlexMessage(replyToken, 'エラー', 'スクレイピング関数が見つかりません。');
        }
      } else {
        replyFlexMessage(replyToken, 'エラー', 'admin を実行してください。');
      }
      break;

    case 'backup':
      if (adminProcRowIndex !== -1) {
        backupProcess(userId, replyToken, adminProcRowIndex);
      } else {
        replyFlexMessage(replyToken, 'エラー', 'admin を実行してください。');
      }
      break;

    case 'card':
      if (adminProcRowIndex !== -1) {
        const message = createCarouselMessage();
        replyMessage(replyToken, message);
      } else {
        replyFlexMessage(replyToken, 'エラー', 'admin を実行してください。');
      }
      break;

    default:
      if (adminProcRowIndex !== -1) {
        replyFlexMessage(replyToken, 'エラー', '無効なコマンドです。');
      }
      break;
  }
}

function getAdminRowIndex(sheet, userId) {
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === userId && data[i][7] === '管理') {
      return i + 1;
    }
  }
  return -1;
}
