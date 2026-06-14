function statusProcess(userId, event) {
  const replyToken = event.replyToken;
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('data');
  const data = sheet.getDataRange().getValues();

  const filtered = data.slice(1).filter(row =>
    row[7] === '待機' &&
    row[4] === '未通知' &&
    row[0] === userId
  );

  if (filtered.length === 0) {
    replyFlexMessage(replyToken, '交付待ち', '該当する受付番号は見つかりませんでした。');
    return;
  }

  const siteMap = {
    'SITE1': '中古新規・名義変更',
    'SITE2': '一般継続'
  };

  function getTimeAgo(timestamp) {
    if (!timestamp) return '';
    const now = new Date();
    const registeredTime = new Date(timestamp);
    const diffMs = now.getTime() - registeredTime.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffMinutes < 1) return 'たった今';
    if (diffMinutes < 60) return `${diffMinutes}分前`;
    if (diffHours < 24) return `${diffHours}時間前`;
    return `${diffDays}日前`;
  }

  const groupedData = { 'SITE1': [], 'SITE2': [] };
  filtered.forEach(row => {
    const siteId = row[2];
    if (groupedData[siteId]) groupedData[siteId].push(row);
  });

  const contents = [];
  const categoryOrder = ['SITE1', 'SITE2'];

  categoryOrder.forEach(siteId => {
    const numbersInSite = groupedData[siteId];
    if (numbersInSite.length > 0) {
      contents.push({
        type: 'text', text: siteMap[siteId] || siteId,
        weight: 'bold', size: 'md', margin: 'md', wrap: true
      });

      numbersInSite.forEach(row => {
        const number = row[1];
        const registeredAt = row[6];
        const timeAgoText = getTimeAgo(registeredAt);

        contents.push({
          type: 'box', layout: 'horizontal', margin: 'sm',
          contents: [
            {
              type: 'box', layout: 'horizontal', flex: 1,
              contents: [{
                type: 'text', size: 'md',
                contents: [
                  { type: 'span', text: `${number}`, weight: 'bold', color: '#007AFF' },
                  { type: 'span', text: '番', color: '#000000' }
                ]
              }]
            },
            {
              type: 'box', layout: 'horizontal', flex: 1, justifyContent: 'flex-end',
              contents: [{
                type: 'text', text: timeAgoText, size: 'sm', color: '#888888', gravity: 'center'
              }]
            }
          ]
        });
      });
    }
  });

  const payload = {
    replyToken: replyToken,
    messages: [{
      type: 'flex', altText: '交付待ち',
      contents: {
        type: 'bubble',
        body: {
          type: 'box', layout: 'vertical', spacing: 'md',
          contents: [
            { type: 'text', text: '交付待ち', weight: 'bold', size: 'lg', wrap: true },
            { type: 'separator', margin: 'md' },
            ...contents
          ]
        }
      }
    }]
  };

  UrlFetchApp.fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + CHANNEL_ACCESS_TOKEN
    },
    payload: JSON.stringify(payload)
  });
}
