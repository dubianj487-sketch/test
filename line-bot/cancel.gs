function handleCancel(userId, event, sheet, waitingRows) {
  if (waitingRows.length === 0) {
    replyFlex(event.replyToken, '取り消せる番号がありません', flexCancelNoNumber());
    return;
  }

  const quickItems = waitingRows.map(function(row) {
    const label = (row.site === 'SITE1' ? '新規' : '継続') + ' ' + row.number + '番';
    return {
      type: 'action',
      action: { type: 'message', label: label.substring(0, 20), text: row.number }
    };
  });

  replyFlex(event.replyToken, '取り消す番号を選択してください', flexCancelSelect(waitingRows), quickItems);
}

function processCancelByNumber(userId, number, event, sheet, waitingRows) {
  const target = waitingRows.find(function(r) { return r.number === number; });
  if (!target) {
    replyFlex(event.replyToken, 'キャンセルエラー', flexError('入力された受付番号は見つかりませんでした。'));
    return;
  }

  sheet.deleteRow(target.rowIndex);
  replyFlex(event.replyToken, number + '番をキャンセルしました', flexCancelSuccess(number));
}
