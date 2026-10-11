/**
 * IgnizAI website — forms → Google Sheet
 *
 *   Contact page / enquiry pop-ups  →  tab "IgnizAI_Leads"
 *   Home-page Digital Growth Quiz   →  tab "Quiz_Leads"   (requests with source=growth_quiz)
 *
 * Both tabs are created automatically, with a header row, the first time they're used.
 *
 * Update (keeps the same web-app URL, so the website needs no change):
 *   1. Open your Google Sheet → Extensions → Apps Script.
 *   2. Replace all the code there with this whole file, click Save.
 *   3. Deploy → Manage deployments → select the existing Web app → ✏️ Edit
 *        Version: New version → Deploy.
 *      (First-time setup instead: Deploy → New deployment → Web app,
 *       Execute as: Me, Who has access: Anyone → copy the /exec URL into the site.)
 */

const SHEET_NAME = 'IgnizAI_Leads';
const QUIZ_SHEET_NAME = 'Quiz_Leads';

// [column header, form field name]
const COLUMNS = [
  ['Submitted at',    'submitted_at'],
  ['First name',      'first_name'],
  ['Last name',       'last_name'],
  ['Email',           'email_id'],
  ['Country code',    'country_code'],
  ['Contact number',  'contact'],
  ['Country',         'country'],
  ['City',            'city'],
  ['Organisation',    'organization_name'],
  ['Services',        'service_names'],
  ['Project details', 'remark'],
  ['Page',            'page'],
];

const QUIZ_COLUMNS = [
  ['Submitted at',            'submitted_at'],
  ['Name',                    'name'],
  ['Country code',            'country_code'],
  ['Mobile number',           'contact'],
  ['Recommended services',    'recommended'],
  ['Business type',           'q_industry'],
  ['Website today',           'q_website'],
  ['How customers find them', 'q_discovery'],
  ['Biggest challenge',       'q_challenge'],
  ['Website maintenance',     'q_maintenance'],
  ['After-hours enquiries',   'q_afterhours'],
  ['Goal (3–6 months)',       'q_goal'],
  ['Digital setup',           'q_setup'],
  ['Page',                    'page'],
];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const data = readData_(e);
    const isQuiz = data.source === 'growth_quiz';
    const cols = isQuiz ? QUIZ_COLUMNS : COLUMNS;
    const sheet = getSheet_(isQuiz ? QUIZ_SHEET_NAME : SHEET_NAME, cols);
    const row = cols.map(function (c) {
      if (c[1] === 'submitted_at') {
        const d = data.submitted_at ? new Date(data.submitted_at) : new Date();
        return isNaN(d) ? new Date() : d;
      }
      return safe_(data[c[1]]);
    });
    sheet.appendRow(row);
    return json_({ result: 'success', sheet: sheet.getName() });
  } catch (err) {
    return json_({ result: 'error', error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// Visiting the URL in a browser just confirms the script is live.
function doGet() {
  return json_({ status: 'ok', message: 'IgnizAI form endpoint is running.' });
}

function readData_(e) {
  if (e && e.postData && e.postData.type === 'application/json') {
    return JSON.parse(e.postData.contents || '{}');
  }
  return (e && e.parameter) || {};
}

function getSheet_(name, cols) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(cols.map(function (c) { return c[0]; }));
    sheet.getRange(1, 1, 1, cols.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// Stop text that starts with = + - @ being treated as a spreadsheet formula.
function safe_(v) {
  if (v === undefined || v === null) return '';
  v = String(v).slice(0, 5000);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
