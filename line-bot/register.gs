function startRegistration(userId, event, sheet, siteType, existingRowIndex) {
  if (existingRowIndex !== -1) sheet.deleteRow(existingRowIndex);
  sheet.appendRow([userId, '', siteType, '', '未通知', '', new Date(), '登録処理']);
  replyFlex(event.replyToken, '受付番号を入力してください', flexRegisterStart(siteType));
}

function completeRegistration(userId, number, rowIndex, event, sheet) {
  if (!/^[0-9]{1,10}$/.test(number)) {
    replyFlex(event.replyToken, '入力エラー', flexError('受付番号は半角数字で入力してください。'));
    return;
  }

  const siteType = sheet.getRange(rowIndex, 3).getValue();
  sheet.getRange(rowIndex, 2).setValue(number);
  sheet.getRange(rowIndex, 8).setValue('待機');

  replyFlex(event.replyToken, number + '番を登録しました', flexRegisterDone(number, siteType));
}

function showMyWaiting(userId, replyToken, waitingRows) {
  const altText = waitingRows.length === 0
    ? '待機中の番号はありません'
    : '交付待ち一覧：' + waitingRows.map(function(r) { return r.number + '番'; }).join('、');
  replyFlex(replyToken, altText, flexMyWaiting(waitingRows));
}
