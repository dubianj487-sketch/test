function getMessage(key) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_MESSAGE);
  if (!sheet) return null;
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === key) return { title: String(data[i][1] || ''), body: String(data[i][2] || '') };
  }
  return null;
}

function replyText(replyToken, title, body) {
  callLine('https://api.line.me/v2/bot/message/reply', { replyToken, messages: [makeFlex(title, body)] });
}

function pushText(userId, title, body) {
  callLine('https://api.line.me/v2/bot/message/push', { to: userId, messages: [makeFlex(title, body)] });
}

function replyFormattedText(replyToken, title, template, number) {
  const parts = template.split('{number}');
  const spans = [];
  if (parts[0]) spans.push({ type: 'span', text: parts[0] });
  spans.push({ type: 'span', text: String(number), weight: 'bold', color: '#007AFF' });
  if (parts[1]) spans.push({ type: 'span', text: parts[1] });

  callLine('https://api.line.me/v2/bot/message/reply', {
    replyToken,
    messages: [{
      type: 'flex', altText: title,
      contents: {
        type: 'bubble',
        body: {
          type: 'box', layout: 'vertical', spacing: 'md',
          contents: [
            { type: 'text', text: title, weight: 'bold', size: 'lg', wrap: true },
            { type: 'separator', margin: 'md' },
            { type: 'text', contents: spans, wrap: true, margin: 'md' }
          ]
        }
      }
    }]
  });
}

function replyWithQuickReply(replyToken, title, body, items) {
  const msg = makeFlex(title, body);
  msg.quickReply = { items };
  callLine('https://api.line.me/v2/bot/message/reply', { replyToken, messages: [msg] });
}

function pushStatusFlex(userId, title, contents) {
  callLine('https://api.line.me/v2/bot/message/push', {
    to: userId,
    messages: [{
      type: 'flex', altText: title,
      contents: {
        type: 'bubble',
        body: { type: 'box', layout: 'vertical', spacing: 'md', contents }
      }
    }]
  });
}

function makeFlex(title, body) {
  return {
    type: 'flex', altText: title,
    contents: {
      type: 'bubble',
      body: {
        type: 'box', layout: 'vertical', spacing: 'md',
        contents: [
          { type: 'text', text: title, weight: 'bold', size: 'lg', wrap: true },
          { type: 'separator', margin: 'md' },
          { type: 'text', text: body, size: 'md', wrap: true, margin: 'md' }
        ]
      }
    }
  };
}

function callLine(url, payload) {
  UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + CHANNEL_ACCESS_TOKEN },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
}
