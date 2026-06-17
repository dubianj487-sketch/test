function backupProcess(userId, replyToken, adminProcRowIndex) {
  const sheet = SpreadsheetApp
    .openById(SPREADSHEET_ID)
    .getSheetByName(SHEET_DATA);

  try {
    const startTime = new Date();

    sheet.getRange(adminProcRowIndex, 8).setValue('バックアップ処理');
    SpreadsheetApp.flush();

    const now = new Date();
    const timestamp = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyyMMdd-HHmmss');

    const rootFolder = DriveApp.getRootFolder();
    let parentFolder;
    const folderIterator = rootFolder.getFoldersByName('backup');
    if (folderIterator.hasNext()) {
      parentFolder = folderIterator.next();
    } else {
      parentFolder = rootFolder.createFolder('backup');
    }

    const backupFolder = parentFolder.createFolder(`backup_${timestamp}`);
    backupFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    const scriptsFolder = backupFolder.createFolder('scripts');
    const spreadsheetFolder = backupFolder.createFolder('spreadsheet');

    const projectId = ScriptApp.getScriptId();
    const url = `https://script.googleapis.com/v1/projects/${projectId}/content`;
    const token = ScriptApp.getOAuthToken();

    const response = UrlFetchApp.fetch(url, {
      method: 'get',
      headers: { Authorization: 'Bearer ' + token }
    });

    const json = JSON.parse(response.getContentText());
    const files = json.files;

    let allScriptsContent = '';
    let totalSize = 0;

    files.forEach(file => {
      let fileName = '';
      let headerName = '';
      let content = file.source;

      if (file.type === 'SERVER_JS') {
        fileName = `${file.name}.txt`;
        headerName = `${file.name}.gs`;
      } else if (file.type === 'HTML') {
        fileName = `${file.name}.txt`;
        headerName = `${file.name}.html`;
      } else if (file.type === 'JSON' && file.name === 'appsscript') {
        fileName = 'appsscript.json.txt';
        headerName = 'appsscript.json';
        content = JSON.stringify(JSON.parse(file.source), null, 2);
      }

      if (fileName) {
        const createdFile = scriptsFolder.createFile(fileName, content);
        totalSize += createdFile.getSize();
        allScriptsContent += `=== ${headerName} ===\n`;
        allScriptsContent += content + '\n\n';
      }
    });

    const allSheets = SpreadsheetApp.openById(SPREADSHEET_ID).getSheets();
    let allCsvContent = '';

    allSheets.forEach(currentSheet => {
      const sheetName = currentSheet.getName();
      const sheetValues = currentSheet.getDataRange().getValues();
      if (sheetValues.length === 0 || (sheetValues.length === 1 && sheetValues[0][0] === '')) return;

      allCsvContent += `=== SHEET: ${sheetName} ===\n`;
      const csvContent = sheetValues.map(row =>
        row.map(cell => {
          let cellStr = String(cell);
          if (cellStr.includes(',') || cellStr.includes('\n') || cellStr.includes('"')) {
            cellStr = '"' + cellStr.replace(/"/g, '""') + '"';
          }
          return cellStr;
        }).join(',')
      ).join('\n');
      allCsvContent += csvContent + '\n\n';
    });

    if (allCsvContent) {
      const csvFile = scriptsFolder.createFile('spreadsheet_backup.txt', allCsvContent);
      totalSize += csvFile.getSize();
      allScriptsContent += `\n\n=== SPREADSHEET DATA ===\n\n` + allCsvContent;
    }

    const allFile = scriptsFolder.createFile('all.txt', allScriptsContent);
    totalSize += allFile.getSize();

    const exportUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=xlsx`;
    const exportResponse = UrlFetchApp.fetch(exportUrl, {
      headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() }
    });
    const spreadsheetFile = spreadsheetFolder.createFile(
      exportResponse.getBlob().setName('spreadsheet_backup.xlsx')
    );
    totalSize += spreadsheetFile.getSize();

    manageBackupFolders(parentFolder);

    const endTime = new Date();
    const seconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

    const flexMessage = {
      type: 'flex',
      altText: 'バックアップ完了',
      contents: {
        type: 'bubble',
        header: {
          type: 'box', layout: 'vertical',
          contents: [{ type: 'text', text: '管理者メニュー', weight: 'bold', size: 'md', color: '#1DB446' }]
        },
        hero: {
          type: 'box', layout: 'vertical',
          contents: [{
            type: 'image',
            url: 'https://drive.google.com/uc?export=download&id=1j0FHZ0XRzsfLCAdL7HLW7kcpOj-n_54c',
            size: 'xl', aspectRatio: '4:3', aspectMode: 'cover'
          }]
        },
        body: {
          type: 'box', layout: 'vertical',
          contents: [
            { type: 'text', text: 'バックアップ完了', weight: 'bold', size: 'xl', align: 'center' },
            { type: 'text', text: `保存完了 (${seconds}秒)`, size: 'sm', margin: 'md', wrap: true },
            { type: 'text', text: `サイズ: ${formatBytes(totalSize)}`, size: 'sm', wrap: true, margin: 'sm' },
            {
              type: 'text',
              text: `backup/\n└ backup_${timestamp}/\n    └ scripts/\n    └ spreadsheet/`,
              size: 'sm', color: '#888888', margin: 'md', wrap: true
            }
          ]
        },
        footer: {
          type: 'box', layout: 'vertical', spacing: 'sm',
          contents: [{
            type: 'button', style: 'primary',
            action: { type: 'uri', label: 'フォルダを開く', uri: backupFolder.getUrl() }
          }]
        }
      }
    };

    sheet.deleteRow(adminProcRowIndex);
    replyMessage(replyToken, flexMessage);

  } catch (e) {
    Logger.log(e);
    replyMessage(replyToken, { type: 'text', text: `エラーが発生しました: ${e.toString()}` });
    try { sheet.deleteRow(adminProcRowIndex); } catch (_) {}
  }
}

function manageBackupFolders(parentFolder) {
  const MAX_FOLDERS = 5;
  let existingBackupFolders = [];

  const allFolders = parentFolder.getFolders();
  while (allFolders.hasNext()) {
    const folder = allFolders.next();
    const folderName = folder.getName();
    const match = folderName.match(/^backup_(\d{8}-\d{6})$/);
    if (match) {
      try {
        const datePart = match[1];
        const creationTime = new Date(
          parseInt(datePart.substring(0, 4), 10),
          parseInt(datePart.substring(4, 6), 10) - 1,
          parseInt(datePart.substring(6, 8), 10),
          parseInt(datePart.substring(9, 11), 10),
          parseInt(datePart.substring(11, 13), 10),
          parseInt(datePart.substring(13, 15), 10)
        ).getTime();
        existingBackupFolders.push({ name: folderName, id: folder.getId(), creationTime });
      } catch (e) {
        Logger.log(`パースエラー: ${folderName} - ${e}`);
      }
    }
  }

  existingBackupFolders.sort((a, b) => a.creationTime - b.creationTime);

  while (existingBackupFolders.length > MAX_FOLDERS) {
    const oldestFolder = existingBackupFolders.shift();
    if (oldestFolder) {
      try {
        DriveApp.getFolderById(oldestFolder.id).setTrashed(true);
        Logger.log(`古いバックアップフォルダを自動削除しました: '${oldestFolder.name}'`);
      } catch (e) {
        Logger.log(`フォルダ削除エラー '${oldestFolder.name}': ${e.toString()}`);
      }
    }
  }
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function replyMessage(replyToken, messageObject) {
  const url = 'https://api.line.me/v2/bot/message/reply';
  const payload = { replyToken: replyToken, messages: [messageObject] };

  UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + CHANNEL_ACCESS_TOKEN },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
}
