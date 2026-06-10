import fs from 'fs';

function dumpConversations() {
  if (!fs.existsSync('temp_share.html')) {
    console.log("No file!");
    return;
  }
  const html = fs.readFileSync('temp_share.html', 'utf-8');

  // Let's locate all text strings in js arrays.
  // We can write a regular expression to match anything that looks like a quoted string.
  // Let's search specifically for things that look like a URL starting with http or https.
  const urls: string[] = [];
  const urlRegex = /https?:\/\/[^\s"',<>\\]+/g;
  const matches = html.match(urlRegex) || [];
  for (const m of matches) {
    // Unescape some sequences
    const cleaned = m.replace(/\\"/g, '').replace(/\\/g, '');
    urls.push(cleaned);
  }

  const uniqueUrls = Array.from(new Set(urls));
  console.log(`=== Total unique URLs: ${uniqueUrls.length} ===`);
  const cdnUrls = uniqueUrls.filter(u => {
    const l = u.toLowerCase();
    return l.includes('cloudfront') || l.includes('aws') || l.includes('storage') || l.includes('video') || l.includes('assets') || l.endsWith('.mp4') || l.endsWith('.m3u8') || l.includes('drive.google') || l.includes('youtube') || l.includes('photos') || l.includes('vimeo') || l.includes('github') || l.includes('raw');
  });
  console.log("Media-like or External storage/cloud/video URLs found:");
  cdnUrls.forEach(u => console.log("- " + u));

  console.log("\n=== Checking all URLs containing common file extensions or media patterns ===");
  uniqueUrls.filter(u => {
    const l = u.toLowerCase();
    return l.includes('.mp4') || l.includes('.m3u8') || l.includes('.png') || l.includes('.jpg') || l.includes('.jpeg') || l.includes('.gif') || l.includes('.mov') || l.includes('.webm') || l.includes('stream') || l.includes('playlist');
  }).forEach(u => console.log("- " + u));

  console.log("\n=== Checking for text messages inside ds: data blocks ===");
  // Let's find script tags or json arrays on ds: blocks like AF_initDataCallback
  const matchesData = html.match(/AF_initDataCallback\([^)]+\)/g) || [];
  console.log("Total initDataCallbacks:", matchesData.length);
  
  // Let's write a file with all URLs extracted to inspect
  fs.writeFileSync('extracted_urls.txt', uniqueUrls.join('\n'));
  console.log("All unique URLs saved to extracted_urls.txt");

  // Let's search for "mp4" or "m3u8" inside the raw html with casing-insensitive
  const rawIdx = html.toLowerCase().indexOf('.mp4');
  if (rawIdx !== -1) {
    console.log("Found .mp4 at index:", rawIdx);
    console.log(html.substring(rawIdx - 150, rawIdx + 150));
  }
  const m3u8Idx = html.toLowerCase().indexOf('.m3u8');
  if (m3u8Idx !== -1) {
    console.log("Found .m3u8 at index:", m3u8Idx);
    console.log(html.substring(m3u8Idx - 150, m3u8Idx + 150));
  }
}

dumpConversations();
