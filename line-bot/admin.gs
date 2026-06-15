function handleAdmin(userId, event, sheet, adminRowIndex) {
  const replyToken = event.replyToken;
  const userText   = event.message.text.trim();

  switch (userText) {

    case '終了':
      sheet.deleteRow(adminRowIndex);
      replyText(replyToken, '管理者モード', '管理者モードを終了しました。');
      break;

    case 'チェック':
      try {
        const site1 = scrapeSite1();
        const site2 = scrapeSite2();
        updateServerSheet(site1, site2);
        saveStatusLog(site1, site2, '成功', 'admin');
        const result =
          'モード：MAIN\n\n' +
          '審査不備　　：' + (site1.fubi.join(',')       || 'なし') + '\n' +
          '交付準備完了：' + (site1.kanryo.join(',')     || 'なし') + '\n' +
          '呼出中　　　：' + (site2.yobidashi.join(',')  || 'なし') + '\n\n' +
          '確認総数　　：' + (site1.fubi.length + site1.kanryo.length + site2.yobidashi.length) + '件';
        replyText(replyToken, 'スクレイピング結果', result);
      } catch(e) {
        replyText(replyToken, 'エラー', 'スクレイピング中にエラーが発生しました。\n' + e.toString());
      }
      break;

    case 'ステータス':
      showWaitingStatus(userId, replyToken, sheet);
      break;

    case 'admin':
      replyText(replyToken, '管理者モード', 'すでに管理者モードです。\nコマンド：チェック / ステータス / 終了');
      break;

    default:
      replyText(replyToken, '管理者メニュー', 'コマンド：チェック / ステータス / 終了');
      break;
  }
}

function showWaitingStatus(userId, replyToken, sheet) {
  const data = sheet.getDataRange().getValues();
  const waiting = [];

  for (let i = 1; i < data.length; i++) {
    if (data[i][7] === '待機') {
      waiting.push({ number: String(data[i][1]).trim(), site: data[i][2], timestamp: data[i][6] });
    }
  }

  if (waiting.length === 0) {
    replyText(replyToken, '待機状況', '現在待機中の番号はありません。');
    return;
  }

  function timeAgo(ts) {
    if (!ts) return '';
    const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
    if (diff < 1)  return 'たった今';
    if (diff < 60) return diff + '分前';
    return Math.floor(diff / 60) + '時間前';
  }

  const siteLabel = { SITE1: '中古新規・名義変更', SITE2: '一般継続' };
  const contents = [
    { type: 'text', text: '待機状況', weight: 'bold', size: 'lg' },
    { type: 'separator', margin: 'md' }
  ];

  ['SITE1', 'SITE2'].forEach(function(site) {
    const rows = waiting.filter(function(r) { return r.site === site; });
    if (!rows.length) return;
    contents.push({ type: 'text', text: siteLabel[site], weight: 'bold', size: 'sm', margin: 'md', color: '#555555' });
    rows.forEach(function(r) {
      contents.push({
        type: 'box', layout: 'horizontal', margin: 'sm',
        contents: [
          { type: 'text', contents: [{ type: 'span', text: r.number, weight: 'bold', color: '#007AFF' }, { type: 'span', text: '番' }], flex: 1 },
          { type: 'text', text: timeAgo(r.timestamp), size: 'sm', color: '#888888', align: 'end', flex: 1 }
        ]
      });
    });
  });

  pushStatusFlex(userId, '待機状況', contents);
  replyText(replyToken, '待機状況', '一覧を送信しました。');
}
