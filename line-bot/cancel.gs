function cancelProcess(userId, event) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('data');
  const data = sheet.getDataRange().getValues();
  const replyToken = event.replyToken;

  const deleteRows = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === userId && data[i][7] === 'キャンセル処理') {
      deleteRows.push(i + 1);
    }
  }
  if (deleteRows.length > 0) {
    for (let i = deleteRows.length - 1; i >= 0; i--) {
      sheet.deleteRow(deleteRows[i]);
    }
  }

  const candidates = [];
  for (let i = 1; i < data.length; i++) {
    const [rowUserId, number, siteId, , status, , , inputStatus] = data[i];
    if (rowUserId === userId && status === '未通知' && inputStatus === '待機') {
      candidates.push({ number: String(number), siteId });
    }
  }

  if (candidates.length === 0) {
    const msg = getFlexMessageContent('cancel_no_number');
    if (msg) replyFlexMessage(replyToken, msg.title, msg.text);
    return;
  }

  const siteMap = {
    'SITE1': '中古新規・名義変更',
    'SITE2': '一般継続'
  };

  const quickReplyItems = candidates.slice(0, 13).map(({ number, siteId }) => {
    const labelPrefix = siteMap[siteId] || '不明';
    return {
      type: 'action',
      action: { type: 'message', label: `${labelPrefix} ${number}番`, text: `${number}` }
    };
  });

  const instructionMsg = getFlexMessageContent('cancel_instruction');
  const inputHintMsg = getFlexMessageContent('cancel_input_hint');

  if (!instructionMsg) {
    Logger.log('Error: cancel_instruction message not found in spreadsheet.');
    return;
  }

  const bodyContents = [
    { type: 'text', text: instructionMsg.title, weight: 'bold', size: 'lg', wrap: true },
    { type: 'separator', margin: 'md' },
    { type: 'text', text: instructionMsg.text, size: 'md', wrap: true, margin: 'md' }
  ];

  const order = ['SITE1', 'SITE2'];
  const grouped = { 'SITE1': [], 'SITE2': [] };
  for (const { number, siteId } of candidates) {
    if (grouped[siteId]) grouped[siteId].push(number);
  }

  for (const siteId of order) {
    const numbers = grouped[siteId];
    if (numbers.length > 0) {
      bodyContents.push({
        type: 'text', text: siteMap[siteId] || siteId,
        size: 'md', weight: 'bold', margin: 'md', wrap: true
      });

      const spans = [];
      numbers.forEach((num, index) => {
        spans.push({ type: 'span', weight: 'bold', text: num, color: '#007AFF' });
        spans.push({ type: 'span', text: '番', color: '#000000' });
        if (index !== numbers.length - 1) {
          spans.push({ type: 'span', text: ', ', color: '#000000' });
        }
      });

      bodyContents.push({
        type: 'text', contents: spans, size: 'md', wrap: true, margin: 'md'
      });
    }
  }

  if (candidates.length > 13 && inputHintMsg) {
    bodyContents.push({
      type: 'text', text: inputHintMsg.text,
      size: 'sm', color: '#888888', wrap: true, margin: 'md'
    });
  }

  const flexMessage = {
    type: 'flex',
    altText: instructionMsg.title,
    contents: {
      type: 'bubble',
      body: { type: 'box', layout: 'vertical', spacing: 'md', contents: bodyContents }
    }
  };

  if (quickReplyItems.length > 0) {
    flexMessage.quickReply = { items: quickReplyItems };
  }

  replyMessage(replyToken, flexMessage);
}

function processCancelNumber(userId, inputNumber, event) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('data');
  const data = sheet.getDataRange().getValues();
  const replyToken = event.replyToken;

  const errorMsg = getFlexMessageContent('error_cancel_invalid_format');
  if (!errorMsg) {
    Logger.log('Error: error_cancel_invalid_format message not found in spreadsheet.');
    return;
  }

  if (!/^\d+$/.test(inputNumber)) {
    replyFlexMessage(replyToken, errorMsg.title, errorMsg.text);
    return;
  }

  let updated = false;
  for (let i = 1; i < data.length; i++) {
    if (
      data[i][0] === userId &&
      String(data[i][1]) === inputNumber &&
      data[i][4] === '未通知' &&
      data[i][7] === '待機'
    ) {
      sheet.getRange(i + 1, 5).setValue('キャンセル');
      sheet.getRange(i + 1, 6).setValue(new Date());
      updated = true;
      break;
    }
  }

  if (updated) {
    const responseMsg = getFlexMessageContent('cancel_success');
    if (responseMsg) {
      replyFormattedFlexMessage(replyToken, responseMsg.title, responseMsg.text, inputNumber);
    } else {
      Logger.log('Error: "cancel_success" message not found in spreadsheet.');
    }
  } else {
    const responseMsg = getFlexMessageContent('cancel_not_found');
    if (responseMsg) {
      replyFlexMessage(replyToken, responseMsg.title, responseMsg.text);
    } else {
      Logger.log('Error: "cancel_not_found" message not found in spreadsheet.');
    }
  }
}
