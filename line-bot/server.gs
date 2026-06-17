function doGet(e) {
  var type = (e && e.parameter && e.parameter.type) ? e.parameter.type : '';

  if (type === 'json') {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName('server');
    var result = {fubi: [], kanryo: [], yobidashi: []};
    if (sheet) {
      var lastRow = sheet.getLastRow();
      if (lastRow >= 2) {
        var data = sheet.getRange(2, 1, lastRow - 1, 3).getValues();
        for (var i = 0; i < data.length; i++) {
          var f = data[i][0] ? String(data[i][0]).trim() : '';
          var k = data[i][1] ? String(data[i][1]).trim() : '';
          var y = data[i][2] ? String(data[i][2]).trim() : '';
          if (f && f !== 'undefined') result.fubi.push(f);
          if (k && k !== 'undefined') result.kanryo.push(k);
          if (y && y !== 'undefined') result.yobidashi.push(y);
        }
      }
    }
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (type === '') {
    return HtmlService.createHtmlOutputFromFile('menu')
                      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
  }

  var webAppUrl = '#';
  try { webAppUrl = ScriptApp.getService().getUrl(); } catch(err) {}

  if (type === 'site2' || type === 'raw2') {
    var template2 = HtmlService.createTemplateFromFile('test2');
    template2.WEB_APP_URL = webAppUrl;

    var sheet2 = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('server');
    var lastRow2 = sheet2.getLastRow();
    var callingRowsHtml = '';

    if (lastRow2 >= 2) {
      var dataRange2 = sheet2.getRange(2, 1, lastRow2 - 1, 3).getValues();
      for (var i = 0; i < dataRange2.length; i++) {
        var callingValue = dataRange2[i][2] ? String(dataRange2[i][2]).trim() : '';
        if (callingValue !== '' && callingValue !== 'undefined') {
          callingRowsHtml += '    <tr>\n' +
                             '      <td><h3><font color="#cc0000">【呼出中】</font></h3></td>\n' +
                             '      <td><h2><b>' + callingValue + ' </b></h2></td>\n' +
                             '      <td></td>\n' +
                             '    </tr>\n\n';
        }
      }
    }
    template2.CALLING_ROWS = callingRowsHtml;
    var output2 = template2.evaluate().addMetaTag('viewport', 'width=device-width, initial-scale=1.0');

    if (type === 'raw2') {
      return ContentService.createTextOutput(output2.getContent())
                           .setMimeType(ContentService.MimeType.HTML);
    }
    return output2;
  }

  if (type === 'site' || type === 'raw') {
    var template = HtmlService.createTemplateFromFile('test');
    var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('server');
    var lastRow = sheet.getLastRow();

    var invalidArray = [];
    var completeArray = [];

    if (lastRow >= 2) {
      var dataRange = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
      for (var i = 0; i < dataRange.length; i++) {
        var invalidValue = dataRange[i][0] ? String(dataRange[i][0]).trim() : '';
        var completeValue = dataRange[i][1] ? String(dataRange[i][1]).trim() : '';
        if (invalidValue !== '') invalidArray.push('<span class="strong">' + invalidValue + '</span>番');
        if (completeValue !== '') completeArray.push('<span class="strong">' + completeValue + '</span>番');
      }
    }

    var invalidBlock = invalidArray.length > 0 ? '【審査不備番号】<br>' + invalidArray.join(',') + '<br><br>' : '';
    var completeBlock = completeArray.length > 0 ? '【交付準備完了番号】<br>' + completeArray.join(',') : '';

    var finalMessage = (invalidArray.length === 0 && completeArray.length === 0)
      ? 'ただいま受付時間外です。'
      : '以下の番号の方は窓口までお越しください。<br>' + invalidBlock + completeBlock;

    template.STATUS_MESSAGE = finalMessage;
    var output = template.evaluate().addMetaTag('viewport', 'width=device-width, initial-scale=1.0');

    if (type === 'raw') {
      return ContentService.createTextOutput(output.getContent())
                           .setMimeType(ContentService.MimeType.HTML);
    }
    return output;
  }
}
