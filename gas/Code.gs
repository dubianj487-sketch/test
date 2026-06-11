// スプレッドシートのIDをここに入れてください
const SPREADSHEET_ID = '15wgBIMQNXmvPi52LeaSfGFk4lPfe0edpa0GzVt_TFS8';

function doGet(e) {
  try {
    const action = (e.parameter && e.parameter.action) || 'all';
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    if (action === 'battery') {
      return makeResponse({ok: true, data: {battery: readBattery()}});
    }

    if (action === 'location') {
      return makeResponse({ok: true, data: readLocation(ss)});
    }

    if (action === 'geocode') {
      const addr = (e.parameter.addr || '').trim();
      if (!addr) return makeResponse({ok: false, error: 'no addr'});
      try {
        const result = Maps.newGeocoder().setLanguage('ja').geocode(addr);
        if (result.status === 'OK' && result.results.length > 0) {
          const loc = result.results[0].geometry.location;
          return makeResponse({ok: true, data: {lat: loc.lat, lng: loc.lng}});
        }
        return makeResponse({ok: false, error: 'not found'});
      } catch(err) {
        return makeResponse({ok: false, error: err.message});
      }
    }

    if (action === 'all') {
      return makeResponse({ok: true, data: {
        girls:       readRows(ss, 'girls',       ['id','name','nick','addr']),
        places:      readRows(ss, 'places',      ['id','name','addr']),
        depLocs:     readRows(ss, 'depLocs',     ['id','name','addr']),
        schedHistory: readScheduleHistory(ss),
        counters:    readCounters(ss),
        memo:        readMemo(ss),
        battery:     readBattery(),
        location:    readLocation(ss),
        secret:      readSecret(ss)
      }});
    }

    const body = JSON.parse(e.parameter.data || '{}');
    switch(action) {
      case 'saveGirls':    writeRows(ss, 'girls', ['id','name','nick','addr'], body.payload); break;
      case 'savePlaces':   writeRows(ss, 'places', ['id','name','addr'], body.payload); break;
      case 'saveSecret':   writeSecret(ss, body.payload); break;
      case 'saveDepLocs':  writeRows(ss, 'depLocs', ['id','name','addr'], body.payload); break;
      case 'saveSchedule':
      case 'updateSchedule': saveScheduleEntry(ss, body.payload); break;
      case 'deleteSchedule': deleteScheduleEntry(ss, body.id); break;
      case 'saveCounters': writeCounters(ss, body.payload); break;
      case 'saveMemo':     writeMemo(ss, body.memo); break;
      case 'saveSecret':   writeSecret(ss, body.payload); break;
      case 'saveSubscription': savePushSubscription(body.subscription); return makeResponse({ok:true});
      case 'notifyAll': {
        var props_ = PropertiesService.getScriptProperties();
        var subs_ = JSON.parse(props_.getProperty('pushSubscriptions') || '[]');
        var cfUrl_ = props_.getProperty('CF_PUSH_URL');
        notifyAllSubscribers(body.title, body.body);
        return makeResponse({ok:true, notified:subs_.length, hasCfUrl:!!cfUrl_});
      }
      case 'getSubInfo': {
        var p_ = PropertiesService.getScriptProperties();
        var s_ = JSON.parse(p_.getProperty('pushSubscriptions') || '[]');
        return makeResponse({ok:true, count:s_.length, hasCfUrl:!!p_.getProperty('CF_PUSH_URL')});
      }
      case 'updateBattery':
        writeBattery({
          user:     e.parameter.user,
          level:    e.parameter.level,
          charging: e.parameter.charging
        });
        break;
      case 'saveLocation':
        writeLocation(ss, {
          user: e.parameter.user,
          lat:  e.parameter.lat,
          lng:  e.parameter.lng
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

    // OwnTracks HTTP format: {"_type":"location","lat":...,"lon":...}
    if (body._type === 'location' && body.lat && body.lon) {
      const user = (e.parameter && e.parameter.user) || '';
      if (user) writeLocation(ss, {user: user, lat: body.lat, lng: body.lon});
      return ContentService.createTextOutput('[]').setMimeType(ContentService.MimeType.JSON);
    }

    // Overland format (legacy)
    if (body.locations && Array.isArray(body.locations) && body.locations.length > 0) {
      const user = (e.parameter && e.parameter.user) || '';
      if (user) {
        const latest = body.locations[body.locations.length - 1];
        const coords = latest.geometry.coordinates;
        writeLocation(ss, {user: user, lat: coords[1], lng: coords[0]});
      }
      return makeResponse({result: 'ok'});
    }

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
  const sheet = getOrCreateSheet(SpreadsheetApp.openById(SPREADSHEET_ID), 'battery');
  try { return JSON.parse(sheet.getRange(1, 1).getValue() || '{}'); } catch(e) { return {}; }
}

function writeBattery(data) {
  const sheet = getOrCreateSheet(SpreadsheetApp.openById(SPREADSHEET_ID), 'battery');
  const bat = JSON.parse(sheet.getRange(1, 1).getValue() || '{}');
  let lv = parseFloat(String(data.level || '0').replace(/[^\d.]/g, '')) || 0;
  if (lv > 0 && lv <= 1) lv = Math.round(lv * 100);
  else lv = Math.round(lv);
  bat[data.user] = {
    level: lv,
    charging: ['true','1','yes','はい'].includes(String(data.charging||'').replace(/[\[\]]/g,'').trim().toLowerCase()) || data.charging === true,
    at: new Date().toISOString()
  };
  sheet.getRange(1, 1).setValue(JSON.stringify(bat));
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

function readLocation(ss) {
  const sheet = getOrCreateSheet(ss, 'location');
  try { return JSON.parse(sheet.getRange(1, 1).getValue() || '{}'); } catch(e) { return {}; }
}

function writeLocation(ss, data) {
  const sheet = getOrCreateSheet(ss, 'location');
  const loc = JSON.parse(sheet.getRange(1, 1).getValue() || '{}');
  loc[data.user] = {
    lat: parseFloat(data.lat),
    lng: parseFloat(data.lng),
    at: new Date().toISOString()
  };
  sheet.getRange(1, 1).setValue(JSON.stringify(loc));
}

function readSecret(ss) {
  const sheet = getOrCreateSheet(ss, 'secret');
  const val = sheet.getRange(1, 1).getValue();
  try { return JSON.parse(val || '{}'); } catch(e) { return {}; }
}

function writeSecret(ss, data) {
  const sheet = getOrCreateSheet(ss, 'secret');
  sheet.getRange(1, 1).setValue(JSON.stringify({url: data.url||'', text: data.text||''}));
}

function savePushSubscription(sub) {
  const props = PropertiesService.getScriptProperties();
  const list = JSON.parse(props.getProperty('pushSubscriptions') || '[]');
  const idx = list.findIndex(function(s) { return s.endpoint === sub.endpoint; });
  if (idx >= 0) list[idx] = sub; else list.push(sub);
  props.setProperty('pushSubscriptions', JSON.stringify(list));
}

function notifyAllSubscribers(title, body) {
  const props = PropertiesService.getScriptProperties();
  const list = JSON.parse(props.getProperty('pushSubscriptions') || '[]');
  const cfUrl = props.getProperty('CF_PUSH_URL');
  if (!cfUrl || list.length === 0) return;
  list.forEach(function(sub) {
    try {
      UrlFetchApp.fetch(cfUrl, {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify({subscription: sub, title: title, body: body}),
        muteHttpExceptions: true
      });
    } catch(e) { Logger.log('Push error: ' + e); }
  });
}

