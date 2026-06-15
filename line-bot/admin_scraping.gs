const CONFIG = {
  MODE: 'main',
  urls: {
    main: {
      site1: 'https://www.neconome.com/S0K01.html?bkn_cd=003180&tab=2',
      site2: 'https://mlit3.ncall.info/g01/niigata01/index.cgi?k=0'
    },
    archive: {
      site1: 'https://web.archive.org/web/20250711025603/https://www.neconome.com/S0K01.html?bkn_cd=003180&tab=2',
      site2: 'https://web.archive.org/web/20250711064352/https://mlit3.ncall.info/g01/niigata01/index.cgi?k=0'
    },
    test: {
      site1: 'https://script.google.com/macros/s/AKfycbyghKP_m2gpGcgoqlB8ycMec_iLErbqJ8NtvmlfXQzSeCjTw3DsUkcbmcRkXW28BcJ7/exec?type=raw',
      site2: 'https://script.google.com/macros/s/AKfycbyghKP_m2gpGcgoqlB8ycMec_iLErbqJ8NtvmlfXQzSeCjTw3DsUkcbmcRkXW28BcJ7/exec?type=raw2'
    }
  }
};

function runWebScraping() {
  const currentMode = CONFIG.MODE;
  const site1Url = CONFIG.urls[currentMode].site1;
  const site2Url = CONFIG.urls[currentMode].site2;

  if (!site1Url || !site2Url) return '⚠️ エラー: TESTモードのURLが空欄です。';

  const timestamp = new Date();
  let fubiNumbers = [];
  let kanryoNumbers = [];
  let yobidashiNumbers = [];
  let resultStatus = '成功';

  try {
    const options1 = {
      method: 'get',
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
      }
    };

    const response1 = UrlFetchApp.fetch(site1Url, options1);
    const htmlSite1 = response1.getContentText('UTF-8');

    const blockRegex = /bkn_cd=003189[\s\S]*?<div class="comment">([\s\S]*?)<\/div>/;
    const matchBlock = htmlSite1.match(blockRegex);

    if (matchBlock && matchBlock[1]) {
      const targetAreaText = matchBlock[1];
      const fubiStart = targetAreaText.indexOf('【審査不備番号】');
      const kanryoStart = targetAreaText.indexOf('【交付準備完了番号】');

      if (fubiStart !== -1) {
        const fubiEnd = (kanryoStart !== -1) ? kanryoStart : targetAreaText.length;
        fubiNumbers = parseStrongNumbers(targetAreaText.substring(fubiStart, fubiEnd));
      }
      if (kanryoStart !== -1) {
        kanryoNumbers = parseStrongNumbers(targetAreaText.substring(kanryoStart));
      }
    } else {
      Logger.log('ネコの目.comのコメントブロック（divクラス）がHTMLから抽出できませんでした。');
    }

    const response2 = UrlFetchApp.fetch(site2Url);
    const htmlSite2 = response2.getContentText('Shift_JIS');
    const regexSite2 = /<b>\s*(\d+)\s*<\/b>/gi;
    let match2;
    while ((match2 = regexSite2.exec(htmlSite2)) !== null) {
      yobidashiNumbers.push(match2[1]);
    }

  } catch (e) {
    resultStatus = 'エラー: ' + e.toString();
  }

  const totalCounts = fubiNumbers.length + kanryoNumbers.length + yobidashiNumbers.length;
  const fubiString = fubiNumbers.join(',');
  const kanryoString = kanryoNumbers.join(',');
  const yobidashiString = yobidashiNumbers.join(',');

  try {
    saveToStatusSheet(timestamp, site1Url, site2Url, fubiString, kanryoString, yobidashiString, totalCounts, resultStatus, 'admin_scraping.gs');
  } catch (e) {
    return '❌ シートへの保存に失敗しました。\n' + e.toString();
  }

  if (resultStatus === '成功') {
    return 'モード　　　：' + currentMode.toUpperCase() + '\n\n' +
           '審査不備　　：' + (fubiString || 'なし') + '\n' +
           '交付準備完了：' + (kanryoString || 'なし') + '\n' +
           '呼出中　　　：' + (yobidashiString || 'なし') + '\n\n' +
           '確認総数　　：' + totalCounts + '件';
  } else {
    return '⚠️ エラー発生: ' + resultStatus;
  }
}

function parseStrongNumbers(areaText) {
  const regex = /<span class=(?:"strong"|strong)>(\d+)<\/span>/g;
  let match;
  const numbers = [];
  while ((match = regex.exec(areaText)) !== null) {
    numbers.push(match[1]);
  }
  return numbers;
}


function saveToStatusSheet(timestamp, url1, url2, fubi, kanryo, yobidashi, counts, result, trigger) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('status');

  if (!sheet) {
    sheet = ss.insertSheet('status');
    sheet.appendRow(['timestamp', 'SITE1_url', 'SITE2_url', '審査不備', '交付準備完了', '呼出中', 'counts', 'result', 'trigger']);
  }

  sheet.appendRow([timestamp, url1, url2, `'${fubi}`, `'${kanryo}`, `'${yobidashi}`, counts, result, trigger]);
}
