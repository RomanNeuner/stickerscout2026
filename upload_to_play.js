const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const PACKAGE_NAME = 'at.ncn.stickerscout2026';
const AAB_PATH = path.join(__dirname, 'dist', 'stickerscout-v1.0.6.aab');
const KEY_FILE = path.join(__dirname, 'google-service-account.json');

// Track progression: internal → alpha → beta → production
const TRACK = process.argv[2] || 'internal';
const VALID_TRACKS = ['internal', 'alpha', 'beta', 'production'];

if (!VALID_TRACKS.includes(TRACK)) {
  console.error(`Ungültiger Track: ${TRACK}. Gültig: ${VALID_TRACKS.join(', ')}`);
  process.exit(1);
}

async function upload() {
  console.log(`\n📦 StickerScout 2026 — Upload zu Track: ${TRACK.toUpperCase()}`);
  console.log(`   AAB: ${path.basename(AAB_PATH)}`);

  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE,
    scopes: ['https://www.googleapis.com/auth/androidpublisher'],
  });

  const androidpublisher = google.androidpublisher({ version: 'v3', auth });

  // 1. Edit öffnen
  console.log('\n1/4 Edit öffnen...');
  const editRes = await androidpublisher.edits.insert({ packageName: PACKAGE_NAME });
  const editId = editRes.data.id;
  console.log(`    Edit ID: ${editId}`);

  try {
    // 2. AAB hochladen
    console.log('2/4 AAB hochladen... (kann 1-2 Min dauern)');
    const aabRes = await androidpublisher.edits.bundles.upload({
      packageName: PACKAGE_NAME,
      editId,
      media: {
        mimeType: 'application/octet-stream',
        body: fs.createReadStream(AAB_PATH),
      },
    });
    const versionCode = aabRes.data.versionCode;
    console.log(`    ✅ Upload OK — versionCode: ${versionCode}`);

    // 3. Track zuweisen
    console.log(`3/4 Track "${TRACK}" zuweisen...`);
    await androidpublisher.edits.tracks.update({
      packageName: PACKAGE_NAME,
      editId,
      track: TRACK,
      requestBody: {
        track: TRACK,
        releases: [{
          versionCodes: [String(versionCode)],
          status: 'completed',
        }],
      },
    });
    console.log(`    ✅ Track gesetzt`);

    // 4. Commit
    console.log('4/4 Commit...');
    await androidpublisher.edits.commit({ packageName: PACKAGE_NAME, editId });
    console.log(`    ✅ Commit OK\n`);

    console.log(`🚀 stickerscout-v1.0.5.aab erfolgreich in "${TRACK}" veröffentlicht!`);
    if (TRACK !== 'production') {
      const next = VALID_TRACKS[VALID_TRACKS.indexOf(TRACK) + 1];
      console.log(`   Nächster Schritt: node upload_to_play.js ${next}\n`);
    }

  } catch (err) {
    // Edit bei Fehler löschen
    await androidpublisher.edits.delete({ packageName: PACKAGE_NAME, editId }).catch(() => {});
    throw err;
  }
}

upload().catch(err => {
  console.error('\n❌ Fehler:', err.message || err);
  if (err.errors) err.errors.forEach(e => console.error('  -', e.message));
  process.exit(1);
});
