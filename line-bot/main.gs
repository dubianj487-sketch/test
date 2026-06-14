const CHANNEL_ACCESS_TOKEN = PropertiesService.getScriptProperties().getProperty('CHANNEL_ACCESS_TOKEN');
const SPREADSHEET_ID = '15wgBIMQNXmvPi52LeaSfGFk4lPfe0edpa0GzVt_TFS8';
const SHEET_DATA = 'data';
const SHEET_MESSAGE = 'message';

function doPost(e) {
  try {
    const json = JSON.parse(e.postData.contents);
    if (!json.events || json.events.length === 0) return;

    const event = json.events[0];
    if (event.type !== 'message' || !event.message || event.message.type !== 'text') return;

    const userId = event.source.userId;
    const userText = event.message.text.trim();
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_DATA);
    const data = sheet.getDataRange().getValues();

    let regProcRowIndex = -1;
    let adminProcRowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === userId) {
        if (data[i][7] === '登録処理') {
          regProcRowIndex = i + 1;
        } else if (data[i][7] === '管理') {
          adminProcRowIndex = i + 1;
        }
      }
    }

    if (adminProcRowIndex !== -1) {
      if (typeof adminProcess === 'function') adminProcess(userId, event);
      return ContentService.createTextOutput('');
    }

    const isNumberOnly = /^[0-9]+$/.test(userText);
    switch (userText) {
      case 'キャンセル':
        if (regProcRowIndex !== -1) {
          sheet.getRange(regProcRowIndex, 8).setValue('キャンセル処理');
        }
        if (typeof cancelProcess === 'function') cancelProcess(userId, event);
        return ContentService.createTextOutput('');

      case '中古新規・名義変更':
      case '一般継続':
        if (regProcRowIndex !== -1) sheet.deleteRow(regProcRowIndex);
        const siteId = userText === '中古新規・名義変更' ? 'SITE1' : 'SITE2';
        const msg = getFlexMessageContent(`register_start_${siteId}`);
        if (msg) replyFlexMessage(event.replyToken, msg.title, msg.text);
        sheet.appendRow([userId, '', siteId, '', '未通知', '', new Date(), '登録処理']);
        return ContentService.createTextOutput('');

      case '交付待ち':
        if (regProcRowIndex !== -1) sheet.deleteRow(regProcRowIndex);
        if (typeof statusProcess === 'function') statusProcess(userId, event);
        return ContentService.createTextOutput('');

      case 'admin':
        if (regProcRowIndex !== -1) sheet.deleteRow(regProcRowIndex);
        if (typeof adminProcess === 'function') adminProcess(userId, event);
        return ContentService.createTextOutput('');
    }

    if (isNumberOnly) {
      if (regProcRowIndex !== -1) {
        const siteId = sheet.getRange(regProcRowIndex, 3).getValue();
        if (!isValidNumber(userText)) {
          const errorKey = `error_number_${siteId}`;
          const msg = getFlexMessageContent(errorKey);
          if (msg) replyFlexMessage(event.replyToken, msg.title, msg.text);
          return ContentService.createTextOutput('');
        }
        processRegisterNumber(userId, userText, regProcRowIndex, event);
      } else {
        processCancelNumber(userId, userText, event);
      }
      return ContentService.createTextOutput('');
    } else {
      if (regProcRowIndex !== -1) {
        const siteId = sheet.getRange(regProcRowIndex, 3).getValue();
        const errorKey = `error_number_${siteId}`;
        const msg = getFlexMessageContent(errorKey);
        if (msg) replyFlexMessage(event.replyToken, msg.title, msg.text);
        return ContentService.createTextOutput('');
      }
    }

    const msg = getFlexMessageContent('error_selection');
    if (msg) replyFlexMessage(event.replyToken, msg.title, msg.text);
    return ContentService.createTextOutput('');

  } catch (err) {
    Logger.log('Error in doPost: ' + err);
    return ContentService.createTextOutput('');
  }
}

function getFlexMessageContent(key) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_MESSAGE);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === key) {
      return {
        title: data[i][1] || '',
        text: data[i][2] || ''
      };
    }
  }
  return null;
}

function replyFlexMessage(replyToken, title, text) {
  const url = 'https://api.line.me/v2/bot/message/reply';
  const payload = {
    replyToken: replyToken,
    messages: [
      {
        type: 'flex',
        altText: title,
        contents: {
          type: 'bubble',
          body: {
            type: 'box',
            layout: 'vertical',
            spacing: 'md',
            contents: [
              { type: 'text', text: title, weight: 'bold', size: 'lg', wrap: true },
              { type: 'separator', margin: 'md' },
              { type: 'text', text: text, size: 'md', wrap: true, margin: 'md' }
            ]
          }
        }
      }
    ]
  };

  UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + CHANNEL_ACCESS_TOKEN },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
}

function replyFormattedFlexMessage(replyToken, title, textTemplate, number) {
  const parts = textTemplate.split('{number}');
  const beforeText = parts[0] || '';
  const afterText = parts[1] || '';

  const spans = [];
  if (beforeText) spans.push({ type: 'span', text: beforeText, size: 'md' });
  spans.push({ type: 'span', text: String(number), weight: 'bold', color: '#007AFF', size: 'md' });
  if (afterText) spans.push({ type: 'span', text: afterText, size: 'md' });

  const url = 'https://api.line.me/v2/bot/message/reply';
  const payload = {
    replyToken: replyToken,
    messages: [
      {
        type: 'flex',
        altText: title,
        contents: {
          type: 'bubble',
          body: {
            type: 'box',
            layout: 'vertical',
            spacing: 'md',
            contents: [
              { type: 'text', text: title, weight: 'bold', size: 'lg', wrap: true },
              { type: 'separator', margin: 'md' },
              { type: 'text', contents: spans, wrap: true, margin: 'md' }
            ]
          }
        }
      }
    ]
  };

  UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + CHANNEL_ACCESS_TOKEN },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
}

function processRegisterNumber(userId, inputNumber, rowIndex, event) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_DATA);
  sheet.getRange(rowIndex, 2).setValue(inputNumber);
  sheet.getRange(rowIndex, 8).setValue('待機');

  const siteId = sheet.getRange(rowIndex, 3).getValue();
  const key = `register_done_${siteId}`;
  const msg = getFlexMessageContent(key);
  if (msg) {
    replyFormattedFlexMessage(event.replyToken, msg.title, msg.text, inputNumber);
  }
}

function isValidNumber(numStr) {
  return /^[0-9]{1,10}$/.test(numStr);
}
