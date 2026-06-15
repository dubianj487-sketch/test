function startRegistration(userId, event, sheet, siteType, existingRowIndex) {
  if (existingRowIndex !== -1) sheet.deleteRow(existingRowIndex);

  const msg = getMessage('register_start_' + siteType);
  if (msg) replyText(event.replyToken, msg.title, msg.body);

  sheet.appendRow([userId, '', siteType, '', '未通知', '', new Date(), '登録処理']);
}

function completeRegistration(userId, number, rowIndex, event, sheet) {
  if (!/^[0-9]{1,10}$/.test(number)) {
    const siteType = sheet.getRange(rowIndex, 3).getValue();
    const msg = getMessage('error_number_' + siteType);
    if (msg) replyText(event.replyToken, msg.title, msg.body);
    return;
  }

  const siteType = sheet.getRange(rowIndex, 3).getValue();
  sheet.getRange(rowIndex, 2).setValue(number);
  sheet.getRange(rowIndex, 8).setValue('待機');

  const msg = getMessage('register_done_' + siteType);
  if (msg) replyFormattedText(event.replyToken, msg.title, msg.body, number);
}
