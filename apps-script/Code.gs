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
 * Every submission is appended as one row on the "Responses" tab (created automatically).
 * After editing this script, use Deploy > Manage deployments > Edit > Version: New version.
 */
var SHEET_NAME = "Responses";
var SHARED_SECRET = "PASTE_SECRET_HERE";

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
      var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(body.headers);
        sheet.getRange(1, 1, 1, body.headers.length).setFontWeight("bold").setBackground("#f1ebe4");
        sheet.setFrozenRows(1);
      }
      var row = [new Date(), String(body.id || "")].concat(body.values.map(clean_));
      sheet.appendRow(row);
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

// Prevent spreadsheet formula injection from free-text answers.
function clean_(value) {
  var s = String(value == null ? "" : value);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
