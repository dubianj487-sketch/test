// ─── LINE API 呼び出し ───────────────────────────────────────────

function callLine(endpoint, payload) {
  UrlFetchApp.fetch('https://api.line.me/v2/bot/' + endpoint, {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + CHANNEL_ACCESS_TOKEN },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
}

function replyFlex(replyToken, altText, bubble, quickReplyItems) {
  const msg = { type: 'flex', altText: altText, contents: bubble };
  if (quickReplyItems && quickReplyItems.length) msg.quickReply = { items: quickReplyItems };
  callLine('message/reply', { replyToken: replyToken, messages: [msg] });
}

function pushFlex(userId, altText, bubble) {
  callLine('message/push', {
    to: userId,
    messages: [{ type: 'flex', altText: altText, contents: bubble }]
  });
}

// 管理者用（テキストベースで十分）
function replyText(replyToken, title, body) {
  callLine('message/reply', {
    replyToken: replyToken,
    messages: [{ type: 'text', text: '【' + title + '】\n' + body }]
  });
}

function pushText(userId, title, body) {
  callLine('message/push', {
    to: userId,
    messages: [{ type: 'text', text: '【' + title + '】\n' + body }]
  });
}

// 管理者ステータス表示（Flex）
function pushStatusFlex(userId, altText, contents) {
  callLine('message/push', {
    to: userId,
    messages: [{
      type: 'flex', altText: altText,
      contents: { type: 'bubble', body: { type: 'box', layout: 'vertical', spacing: 'md', contents: contents } }
    }]
  });
}

// メッセージシートから取得（下位互換）
function getMessage(key) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_MESSAGE);
  if (!sheet) return null;
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === key) return { title: String(data[i][1] || ''), body: String(data[i][2] || '') };
  }
  return null;
}

// ─── Flex ビルダー ───────────────────────────────────────────────

const SITE_CONFIG = {
  SITE1: { label: '中古新規・名義変更', color: '#1C3D6E', light: '#EBF2FF' },
  SITE2: { label: '一般継続',           color: '#0A5C36', light: '#EDFAF3' }
};

function _header(text, color) {
  return {
    type: 'box', layout: 'vertical', paddingAll: '16px',
    backgroundColor: color,
    contents: [{ type: 'text', text: text, color: '#FFFFFF', weight: 'bold', size: 'sm' }]
  };
}

function flexRegisterStart(siteType) {
  const s = SITE_CONFIG[siteType];
  return {
    type: 'bubble',
    header: _header(s.label, s.color),
    body: {
      type: 'box', layout: 'vertical', spacing: 'sm', paddingAll: '20px',
      contents: [
        { type: 'text', text: '受付番号を入力してください', weight: 'bold', size: 'md' },
        { type: 'text', text: '半角数字で入力してください', color: '#888888', size: 'sm', margin: 'sm' }
      ]
    }
  };
}

function flexRegisterDone(number, siteType) {
  const s = SITE_CONFIG[siteType];
  return {
    type: 'bubble',
    header: _header('✅  登録完了', s.color),
    body: {
      type: 'box', layout: 'vertical', alignItems: 'center', paddingAll: '24px', spacing: 'sm',
      contents: [
        { type: 'text', text: s.label, color: '#888888', size: 'xs' },
        {
          type: 'box', layout: 'baseline', margin: 'md',
          contents: [
            { type: 'text', text: number, weight: 'bold', size: '5xl', color: s.color, flex: 0 },
            { type: 'text', text: '番', weight: 'bold', size: 'xl', color: s.color, flex: 0, margin: 'sm' }
          ]
        }
      ]
    },
    footer: {
      type: 'box', layout: 'vertical', backgroundColor: s.light, paddingAll: '14px',
      contents: [{ type: 'text', text: '🔔  順番が来たらお知らせします', color: s.color, size: 'sm', align: 'center' }]
    }
  };
}

function flexNotify(number, category) {
  const cfg = {
    '審査不備':    { color: '#B91C1C', light: '#FEF2F2', icon: '⚠️', sub: '書類に不備があります\n窓口へお越しください' },
    '交付準備完了': { color: '#166534', light: '#F0FDF4', icon: '✅', sub: '準備が整いました\n窓口へお越しください' },
    '呼出中':      { color: '#B91C1C', light: '#FEF2F2', icon: '🔔', sub: '呼ばれています\n窓口へお越しください' }
  };
  const c = cfg[category] || { color: '#333333', light: '#F5F5F5', icon: '📢', sub: '窓口へお越しください' };

  return {
    type: 'bubble',
    header: _header(c.icon + '  ' + category + 'のお知らせ', c.color),
    body: {
      type: 'box', layout: 'vertical', alignItems: 'center',
      paddingAll: '28px', backgroundColor: c.light, spacing: 'sm',
      contents: [
        { type: 'text', text: '受付番号', color: '#888888', size: 'xs' },
        {
          type: 'box', layout: 'baseline', margin: 'sm',
          contents: [
            { type: 'text', text: number, weight: 'bold', size: '5xl', color: c.color, flex: 0 },
            { type: 'text', text: '番', weight: 'bold', size: 'xl',  color: c.color, flex: 0, margin: 'sm' }
          ]
        },
        { type: 'separator', margin: 'lg' },
        { type: 'text', text: c.sub, color: '#444444', size: 'sm', align: 'center', wrap: true, margin: 'lg' }
      ]
    }
  };
}

function flexMyWaiting(waitingRows) {
  const contents = [
    { type: 'text', text: '📋  交付待ち一覧', weight: 'bold', size: 'lg' },
    { type: 'separator', margin: 'md' }
  ];

  if (waitingRows.length === 0) {
    contents.push({ type: 'text', text: '現在待機中の番号はありません', color: '#888888', size: 'sm', align: 'center', margin: 'xl' });
  } else {
    ['SITE1', 'SITE2'].forEach(function(site) {
      const rows = waitingRows.filter(function(r) { return r.site === site; });
      if (!rows.length) return;
      const s = SITE_CONFIG[site];
      contents.push({ type: 'text', text: s.label, size: 'xs', color: s.color, weight: 'bold', margin: 'lg' });
      rows.forEach(function(r) {
        contents.push({
          type: 'box', layout: 'baseline', margin: 'sm',
          contents: [
            { type: 'text', text: r.number, weight: 'bold', size: 'xxl', color: s.color, flex: 0 },
            { type: 'text', text: '番', size: 'sm', color: '#888888', flex: 0, margin: 'sm' }
          ]
        });
      });
    });
  }

  return { type: 'bubble', body: { type: 'box', layout: 'vertical', spacing: 'sm', paddingAll: '20px', contents: contents } };
}

function flexCancelSelect(waitingRows) {
  return {
    type: 'bubble',
    header: _header('キャンセル', '#2D2D2D'),
    body: {
      type: 'box', layout: 'vertical', paddingAll: '20px', spacing: 'sm',
      contents: [
        { type: 'text', text: '取り消す番号を選択するか\n直接番号を入力してください', size: 'sm', color: '#444444', wrap: true }
      ]
    }
  };
}

function flexCancelSuccess(number) {
  return {
    type: 'bubble',
    header: _header('キャンセル完了', '#2D2D2D'),
    body: {
      type: 'box', layout: 'vertical', alignItems: 'center', paddingAll: '24px', spacing: 'sm',
      contents: [
        {
          type: 'box', layout: 'baseline',
          contents: [
            { type: 'text', text: number, weight: 'bold', size: '4xl', color: '#2D2D2D', flex: 0 },
            { type: 'text', text: '番', size: 'lg', color: '#2D2D2D', flex: 0, margin: 'sm' }
          ]
        },
        { type: 'text', text: '通知の取り消しが完了しました', color: '#888888', size: 'sm', margin: 'sm' }
      ]
    }
  };
}

function flexError(message) {
  return {
    type: 'bubble',
    body: {
      type: 'box', layout: 'vertical', paddingAll: '20px',
      contents: [{ type: 'text', text: '⚠️  ' + message, color: '#B91C1C', size: 'sm', wrap: true }]
    }
  };
}

function flexCancelNoNumber() {
  return {
    type: 'bubble',
    body: {
      type: 'box', layout: 'vertical', alignItems: 'center', paddingAll: '24px',
      contents: [
        { type: 'text', text: 'キャンセル', weight: 'bold', size: 'md' },
        { type: 'separator', margin: 'md' },
        { type: 'text', text: '取り消せる受付番号がありません', color: '#888888', size: 'sm', align: 'center', margin: 'lg' }
      ]
    }
  };
}
