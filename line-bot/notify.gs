function checkAndNotify() {
  const now = new Date();
  const totalMin = now.getHours() * 60 + now.getMinutes();
  if (totalMin < 8 * 60 + 30 || totalMin > 17 * 60 + 30) return;

  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_DATA);
  if (!sheet) return;

  const data = sheet.getDataRange().getValues();
  const waitingRows = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][7] === '待機') {
      waitingRows.push({
        rowIndex: i + 1,
        userId: data[i][0],
        number: String(data[i][1]).trim(),
        site: data[i][2]
      });
    }
  }

  if (waitingRows.length === 0) return;

  const needsSite1 = waitingRows.some(r => r.site === 'SITE1');
  const needsSite2 = waitingRows.some(r => r.site === 'SITE2');

  const site1 = needsSite1 ? scrapeSite1Numbers() : {fubi: [], kanryo: []};
  const site2 = needsSite2 ? scrapeSite2Numbers() : {yobidashi: []};

  waitingRows.forEach(function(row) {
    let found = false;
    let category = '';

    if (row.site === 'SITE1') {
      if (site1.fubi.includes(row.number))        { found = true; category = '審査不備'; }
      else if (site1.kanryo.includes(row.number)) { found = true; category = '交付準備完了'; }
    } else if (row.site === 'SITE2') {
      if (site2.yobidashi.includes(row.number))   { found = true; category = '呼出中'; }
    }

    if (found) {
      pushNotify(row.userId, row.number, category);
      sheet.getRange(row.rowIndex, 8).setValue('通知済み');
    }
  });
}

function scrapeSite1Numbers() {
  const result = {fubi: [], kanryo: []};
  try {
    const url = CONFIG.urls.main.site1;
    const html = UrlFetchApp.fetch(url, {
      method: 'get',
      headers: {'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'}
    }).getContentText('UTF-8');

    const match = html.match(/bkn_cd=003189[\s\S]*?<div class="comment">([\s\S]*?)<\/div>/);
    if (match && match[1]) {
      const text = match[1];
      const fubiStart = text.indexOf('【審査不備番号】');
      const kanryoStart = text.indexOf('【交付準備完了番号】');
      if (fubiStart !== -1) {
        result.fubi = parseStrongNumbers(text.substring(fubiStart, kanryoStart !== -1 ? kanryoStart : text.length));
      }
      if (kanryoStart !== -1) {
        result.kanryo = parseStrongNumbers(text.substring(kanryoStart));
      }
    }
  } catch(e) {
    Logger.log('Site1 scrape error: ' + e);
  }
  return result;
}

function scrapeSite2Numbers() {
  const result = {yobidashi: []};
  try {
    const url = CONFIG.urls.main.site2;
    const html = UrlFetchApp.fetch(url).getContentText('Shift_JIS');
    const regex = /<b>\s*(\d+)\s*<\/b>/gi;
    let match;
    while ((match = regex.exec(html)) !== null) {
      result.yobidashi.push(match[1].trim());
    }
  } catch(e) {
    Logger.log('Site2 scrape error: ' + e);
  }
  return result;
}

function pushNotify(userId, number, category) {
  const messages = {
    '審査不備':    { title: '審査不備のお知らせ',    text: '受付番号 ' + number + ' の書類に不備があります。\n窓口へお越しください。' },
    '交付準備完了': { title: '交付準備完了のお知らせ', text: '受付番号 ' + number + ' の準備ができました。\n窓口へお越しください。' },
    '呼出中':      { title: '呼出中のお知らせ',       text: '受付番号 ' + number + ' が呼ばれています。\n窓口へお越しください。' }
  };
  const msg = messages[category] || {title: 'お知らせ', text: '番号 ' + number + ' が表示されました。'};

  UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', {
    method: 'post',
    contentType: 'application/json',
    headers: {Authorization: 'Bearer ' + CHANNEL_ACCESS_TOKEN},
    payload: JSON.stringify({
      to: userId,
      messages: [{
        type: 'flex',
        altText: msg.title,
        contents: {
          type: 'bubble',
          body: {
            type: 'box',
            layout: 'vertical',
            spacing: 'md',
            contents: [
              {type: 'text', text: msg.title, weight: 'bold', size: 'lg', wrap: true},
              {type: 'separator', margin: 'md'},
              {type: 'text', text: msg.text, size: 'md', wrap: true, margin: 'md'}
            ]
          }
        }
      }]
    }),
    muteHttpExceptions: true
  });
}

function setupNotifyTrigger() {
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'checkAndNotify') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('checkAndNotify').timeBased().everyMinutes(5).create();
  Logger.log('トリガー設定完了（5分おき・8:30〜17:30のみ動作）');
}
