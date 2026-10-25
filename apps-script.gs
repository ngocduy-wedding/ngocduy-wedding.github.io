/**
 * Wedding wishes + RSVP — Google Apps Script web app.
 *
 * One deployment handles both:
 *   GET  → returns approved wishes as JSON: { wishes: [{name, wish, timestamp}, ...] }
 *   POST → appends a submission row to the sheet
 *
 * ============================================================================
 * SETUP (10 min, one time)
 * ============================================================================
 * 1. Create a new Google Sheet. In the first tab (default name "Sheet1" is fine),
 *    put this header row in row 1:
 *       timestamp | name | phone | attend | wish | approved
 *    Set the `approved` column to TRUE for wishes you want to show publicly.
 *    (New submissions default to TRUE — see APPROVE_BY_DEFAULT below.)
 *
 * 2. Extensions → Apps Script. Delete the stub code, paste THIS file in, save.
 *
 * 3. Deploy → New deployment → type "Web app".
 *       Execute as:  Me
 *       Who has access:  Anyone
 *    Click Deploy, authorize, copy the Web app URL.
 *
 * 4. Paste that URL into `WISHES_ENDPOINT` in script.js.
 *
 * To moderate: open the Sheet, flip `approved` to FALSE for anything you want
 * hidden. The public page re-fetches on every load.
 * ============================================================================
 */

// If true, new submissions are visible immediately. Set to false if you want to
// manually approve each wish in the sheet before it appears on the site.
const APPROVE_BY_DEFAULT = true;

// Sheet tab name. Change if you renamed the default tab.
const SHEET_NAME = "Sheet1";

// Max wishes returned by GET. Keep modest so the page stays fast.
const MAX_WISHES = 200;

function doGet(e) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_NAME);
  const rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return jsonOut({ wishes: [] });

  const header = rows[0].map((h) => String(h).trim().toLowerCase());
  const iTs = header.indexOf("timestamp");
  const iName = header.indexOf("name");
  const iWish = header.indexOf("wish");
  const iApproved = header.indexOf("approved");

  const wishes = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const text = String(row[iWish] || "").trim();
    if (!text) continue;
    if (iApproved !== -1 && row[iApproved] === false) continue;
    const ts = row[iTs];
    wishes.push({
      name: String(row[iName] || "").trim(),
      wish: text,
      timestamp: ts instanceof Date ? ts.toISOString() : String(ts || ""),
    });
  }

  wishes.reverse(); // newest first
  return jsonOut({ wishes: wishes.slice(0, MAX_WISHES) });
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || "{}");
    const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_NAME);
    sheet.appendRow([
      new Date(),
      String(payload.name || "").slice(0, 120),
      String(payload.phone || "").slice(0, 40),
      String(payload.attend || "").slice(0, 10),
      String(payload.wish || "").slice(0, 2000),
      APPROVE_BY_DEFAULT,
    ]);
    return jsonOut({ ok: true });
  } catch (err) {
    return jsonOut({ ok: false, error: String(err) });
  }
}

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
