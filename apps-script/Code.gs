/**
 * DRE Homes — Portals Feedback Survey → Google Sheets
 *
 * Setup (once):
 * 1. Create a Google Sheet. Extensions > Apps Script. Replace Code.gs with this file and save.
 * 2. Set the shared secret (same value as SURVEY_SHARED_SECRET on Vercel), either:
 *      - replace PASTE_SECRET_HERE below, or
 *      - Project Settings (gear) > Script Properties > add SHARED_SECRET (takes precedence).
 * 3. Deploy > New deployment > Select type: Web app
 *      Execute as: Me    Who has access: Anyone
 *    Authorise, then copy the Web app URL (ends with /exec) into GOOGLE_SCRIPT_URL on Vercel.
 *
 * Each submission is written twice:
 *  - one row on the "All Responses" tab (a formatted table of everyone), and
 *  - one column on a tab named after the respondent (questions down the side, one column per submission).
 * After editing this script, use Deploy > Manage deployments > Edit > Version: New version.
 */
var SHEET_NAME = "All Responses";
var SHARED_SECRET = "PASTE_SECRET_HERE";

var HEADER_BG = "#ab9889";
var HEADER_FG = "#ffffff";
var LABEL_BG = "#f1ebe4";
var BAND_BG = "#faf8f5";
var BORDER = "#d9c39a";

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var secret = PropertiesService.getScriptProperties().getProperty("SHARED_SECRET") || SHARED_SECRET;
    if (!secret || secret === "PASTE_SECRET_HERE" || body.secret !== secret) return json_({ ok: false, error: "unauthorised" });
    if (!Array.isArray(body.headers) || !Array.isArray(body.values)) return json_({ ok: false, error: "bad payload" });

    var lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var now = new Date();
      var id = String(body.id || "");
      var values = body.values.map(clean_);
      appendSummaryRow_(ss, body.headers, [now, id].concat(values));
      appendPersonColumn_(ss, String(body.name || values[0] || "Unknown"), body.headers.slice(2), values, now, id);
    } finally {
      lock.releaseLock();
    }
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function doGet() {
  return json_({ ok: true, service: "DRE Portals Feedback Survey" });
}

function appendSummaryRow_(ss, headers, row) {
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME, 0);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    styleHeader_(sheet.getRange(1, 1, 1, headers.length));
    sheet.setFrozenRows(1);
    sheet.setFrozenColumns(3);
    sheet.setColumnWidths(1, 3, 150);
    if (headers.length > 3) sheet.setColumnWidths(4, headers.length - 3, 240);
    sheet.setRowHeight(1, 48);
  }
  var r = sheet.getLastRow() + 1;
  var range = sheet.getRange(r, 1, 1, row.length);
  sheet.getRange(r, 2, 1, row.length - 1).setNumberFormat("@");
  range.setValues([row]);
  styleBody_(range, r % 2 === 0);
  sheet.getRange(r, 1).setNumberFormat("dd mmm yyyy, hh:mm");
  sheet.getRange(r, 3).setFontWeight("bold");
}

function appendPersonColumn_(ss, name, labels, values, now, id) {
  var tabName = tabName_(name);
  var sheet = findSheet_(ss, tabName);
  var rows = labels.length + 1;
  if (!sheet) {
    sheet = ss.insertSheet(tabName);
    var labelCells = [["Question"]].concat(labels.map(function (l) { return [l]; }));
    sheet.getRange(1, 1, rows, 1).setValues(labelCells);
    styleHeader_(sheet.getRange(1, 1));
    sheet.getRange(2, 1, rows - 1, 1)
      .setBackground(LABEL_BG).setFontWeight("bold").setWrap(true).setVerticalAlignment("top")
      .setBorder(true, true, true, true, true, true, BORDER, SpreadsheetApp.BorderStyle.SOLID);
    sheet.setColumnWidth(1, 300);
    sheet.setFrozenColumns(1);
    sheet.setFrozenRows(1);
    sheet.setRowHeight(1, 48);
  }
  var c = sheet.getLastColumn() + 1;
  var stamp = Utilities.formatDate(now, ss.getSpreadsheetTimeZone(), "dd MMM yyyy, HH:mm") + "  ·  " + id;
  sheet.getRange(1, c).setValue(stamp);
  styleHeader_(sheet.getRange(1, c));
  sheet.getRange(2, c, rows - 1, 1).setNumberFormat("@").setValues(values.map(function (v) { return [v]; }));
  styleBody_(sheet.getRange(2, c, rows - 1, 1), false);
  sheet.setColumnWidth(c, 340);
}

function styleHeader_(range) {
  range.setBackground(HEADER_BG).setFontColor(HEADER_FG).setFontWeight("bold").setWrap(true)
    .setVerticalAlignment("middle")
    .setBorder(true, true, true, true, true, true, BORDER, SpreadsheetApp.BorderStyle.SOLID);
}

function styleBody_(range, banded) {
  range.setBackground(banded ? BAND_BG : "#ffffff").setWrap(true).setVerticalAlignment("top")
    .setBorder(true, true, true, true, true, true, BORDER, SpreadsheetApp.BorderStyle.SOLID);
}

// Sheet tab names can't contain : \ / ? * [ ] and are limited to 100 characters.
function tabName_(name) {
  var clean = String(name).replace(/[:\\\/?*\[\]]/g, " ").replace(/^'+|'+$/g, "").replace(/\s+/g, " ").trim().slice(0, 90);
  if (!clean) clean = "Unknown";
  if (clean.toLowerCase() === SHEET_NAME.toLowerCase()) clean += " (person)";
  return clean;
}

function findSheet_(ss, tabName) {
  var target = tabName.toLowerCase();
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    if (sheets[i].getName().toLowerCase() === target) return sheets[i];
  }
  return null;
}

// Prevent spreadsheet formula injection from free-text answers.
function clean_(value) {
  var s = String(value == null ? "" : value);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
