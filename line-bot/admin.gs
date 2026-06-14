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
