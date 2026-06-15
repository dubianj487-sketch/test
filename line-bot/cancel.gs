function handleCancel(userId, event, sheet, waitingRows) {
  if (waitingRows.length === 0) {
    const msg = getMessage('cancel_no_number');
    replyText(event.replyToken, msg ? msg.title : 'キャンセル', msg ? msg.body : '通知を取り消せる受付番号がありません。');
    return;
  }

  const quickItems = waitingRows.map(function(row) {
    const label = (row.site === 'SITE1' ? '新規' : '継続') + ' ' + row.number + '番';
    return {
      type: 'action',
      action: { type: 'message', label: label.substring(0, 20), text: row.number }
    };
  });

  const msg = getMessage('cancel_instruction');
  replyWithQuickReply(
    event.replyToken,
    msg ? msg.title : 'キャンセル',
    msg ? msg.body : '取り消す番号を選択してください。',
    quickItems
  );
}

function processCancelByNumber(userId, number, event, sheet, waitingRows) {
  const target = waitingRows.find(function(r) { return r.number === number; });
  if (!target) {
    const msg = getMessage('cancel_not_found');
    replyText(event.replyToken, msg ? msg.title : 'エラー', msg ? msg.body : '入力された番号は見つかりませんでした。');
    return;
  }

  sheet.deleteRow(target.rowIndex);

  const msg = getMessage('cancel_success');
  if (msg) {
    replyFormattedText(event.replyToken, msg.title, msg.body, number);
  } else {
    replyText(event.replyToken, 'キャンセル', number + '番の通知を取り消しました。');
  }
}
