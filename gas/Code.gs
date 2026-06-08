// スプレッドシートのIDをここに入れてください
const SPREADSHEET_ID = '15wgBIMQNXmvPi52LeaSfGFk4lPfe0edpa0GzVt_TFS8';

function doGet(e) {
  try {
    const action = (e.parameter && e.parameter.action) || 'all';
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    if (action === 'battery') {
      return makeResponse({ok: true, data: {battery: readBattery()}});
    }

    if (action === 'all') {
      return makeResponse({ok: true, data: {
        girls:       readRows(ss, 'girls',       ['id','name','nick','addr']),
        places:      readRows(ss, 'places',      ['id','name','addr']),
        depLocs:     readRows(ss, 'depLocs',     ['id','name','addr']),
        schedHistory: readScheduleHistory(ss),
        counters:    readCounters(ss),
        memo:        readMemo(ss),
        battery:     readBattery()
      }});
    }

    const body = JSON.parse(e.parameter.data || '{}');
    switch(action) {
      case 'saveGirls':    writeRows(ss, 'girls', ['id','name','nick','addr'], body.payload); break;
      case 'savePlaces':   writeRows(ss, 'places', ['id','name','addr'], body.payload); break;
      case 'saveDepLocs':  writeRows(ss, 'depLocs', ['id','name','addr'], body.payload); break;
      case 'saveSchedule':
      case 'updateSchedule': saveScheduleEntry(ss, body.payload); break;
      case 'deleteSchedule': deleteScheduleEntry(ss, body.id); break;
      case 'saveCounters': writeCounters(ss, body.payload); break;
      case 'saveMemo':     writeMemo(ss, body.memo); break;
      case 'updateBattery':
        writeBattery({
          user:     e.parameter.user,
          level:    e.parameter.level,
          charging: e.parameter.charging
        });
        break;
    }
    return makeResponse({ok: true});
  } catch(err) {
    return makeResponse({ok: false, error: err.message});
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    switch(body.action) {
      case 'saveGirls':
        writeRows(ss, 'girls', ['id','name','nick','addr'], body.payload);
        break;
      case 'savePlaces':
        writeRows(ss, 'places', ['id','name','addr'], body.payload);
        break;
      case 'saveDepLocs':
        writeRows(ss, 'depLocs', ['id','name','addr'], body.payload);
        break;
      case 'saveSchedule':
      case 'updateSchedule':
        saveScheduleEntry(ss, body.payload);
        break;
      case 'deleteSchedule':
        deleteScheduleEntry(ss, body.id);
        break;
      case 'saveCounters':
        writeCounters(ss, body.payload);
        break;
    }
    return makeResponse({ok: true});
  } catch(err) {
    return makeResponse({ok: false, error: err.message});
  }
}

function makeResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateSheet(ss, name) {
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

function readRows(ss, sheetName, keys) {
  const sheet = getOrCreateSheet(ss, sheetName);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  const values = sheet.getRange(2, 1, lastRow - 1, keys.length).getValues();
  return values
    .filter(function(row) { return row[0] !== ''; })
    .map(function(row) {
      const obj = {};
      keys.forEach(function(k, i) { obj[k] = row[i]; });
      if (obj.id !== undefined) obj.id = Number(obj.id);
      return obj;
    });
}

function writeRows(ss, sheetName, keys, rows) {
  const sheet = getOrCreateSheet(ss, sheetName);
  sheet.clearContents();
  sheet.getRange(1, 1, 1, keys.length).setValues([keys]);
  if (!rows || rows.length === 0) return;
  const values = rows.map(function(row) {
    return keys.map(function(k) { return row[k] !== undefined ? row[k] : ''; });
  });
  sheet.getRange(2, 1, values.length, keys.length).setValues(values);
}

function readScheduleHistory(ss) {
  const sheet = getOrCreateSheet(ss, 'schedHistory');
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  const values = sheet.getRange(2, 1, lastRow - 1, 7).getValues();
  return values
    .filter(function(row) { return row[0] !== ''; })
    .map(function(row) {
      return {
        id:        Number(row[0]),
        dateVal:   row[1] instanceof Date ? Utilities.formatDate(row[1], Session.getScriptTimeZone(), 'yyyy-MM-dd') : String(row[1]).replace(/\//g,'-').slice(0,10),
        dateLabel: String(row[2]),
        runs:      JSON.parse(row[3] || '[]'),
        shunTxt:   String(row[4]),
        boyTxt:    String(row[5]),
        savedAt:   String(row[6])
      };
    })
    .sort(function(a, b) { return b.dateVal.localeCompare(a.dateVal); });
}

function saveScheduleEntry(ss, entry) {
  const sheet = getOrCreateSheet(ss, 'schedHistory');
  const keys = ['id','dateVal','dateLabel','runsJSON','shunTxt','boyTxt','savedAt'];
  const lastRow = sheet.getLastRow();

  if (lastRow < 1) {
    sheet.getRange(1, 1, 1, keys.length).setValues([keys]);
  }

  let targetRow = -1;
  if (lastRow >= 2) {
    const dateVals = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
    for (let i = 0; i < dateVals.length; i++) {
      if (String(dateVals[i][0]) === String(entry.dateVal)) {
        targetRow = i + 2;
        break;
      }
    }
  }

  const row = [
    entry.id,
    entry.dateVal,
    entry.dateLabel,
    JSON.stringify(entry.runs),
    entry.shunTxt,
    entry.boyTxt,
    entry.savedAt || new Date().toISOString()
  ];

  if (targetRow > 0) {
    sheet.getRange(targetRow, 1, 1, keys.length).setValues([row]);
  } else {
    const nextRow = Math.max(sheet.getLastRow() + 1, 2);
    sheet.getRange(nextRow, 1, 1, keys.length).setValues([row]);
  }
}

function deleteScheduleEntry(ss, id) {
  const sheet = getOrCreateSheet(ss, 'schedHistory');
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;
  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (let i = ids.length - 1; i >= 0; i--) {
    if (Number(ids[i][0]) === Number(id)) {
      sheet.deleteRow(i + 2);
      break;
    }
  }
}

function readCounters(ss) {
  const sheet = getOrCreateSheet(ss, 'counters');
  const lastRow = sheet.getLastRow();
  const defaults = {dCnt: 20, gCnt: 20, pCnt: 20, histCnt: 0};
  if (lastRow < 2) return defaults;
  const values = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
  values.forEach(function(row) {
    if (row[0]) defaults[String(row[0])] = Number(row[1]);
  });
  return defaults;
}

function readMemo(ss) {
  const sheet = getOrCreateSheet(ss, 'memo');
  const lastRow = sheet.getLastRow();
  if (lastRow < 1) return '';
  return String(sheet.getRange(1, 1).getValue());
}

function writeMemo(ss, text) {
  const sheet = getOrCreateSheet(ss, 'memo');
  sheet.getRange(1, 1).setValue(text || '');
}

function readBattery() {
  const props = PropertiesService.getScriptProperties();
  return JSON.parse(props.getProperty('battery') || '{}');
}

function writeBattery(data) {
  const props = PropertiesService.getScriptProperties();
  const bat = JSON.parse(props.getProperty('battery') || '{}');
  let lv = parseFloat(String(data.level || '0').replace(/[^\d.]/g, '')) || 0;
  if (lv > 0 && lv <= 1) lv = Math.round(lv * 100); // 0.28 → 28
  else lv = Math.round(lv);                           // 28% or 28 → 28
  bat[data.user] = {
    level: lv,
    charging: ['true','1','yes','はい'].includes(String(data.charging||'').toLowerCase()) || data.charging === true,
    at: new Date().toISOString()
  };
  props.setProperty('battery', JSON.stringify(bat));
}

function writeCounters(ss, counters) {
  const sheet = getOrCreateSheet(ss, 'counters');
  sheet.clearContents();
  sheet.getRange(1, 1, 1, 2).setValues([['key', 'value']]);
  const rows = Object.keys(counters).map(function(k) { return [k, counters[k]]; });
  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, 2).setValues(rows);
  }
}
