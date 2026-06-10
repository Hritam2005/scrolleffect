import fs from 'fs';

function parseDs() {
  if (!fs.existsSync('temp_share.html')) {
    console.log("No file!");
    return;
  }
  const html = fs.readFileSync('temp_share.html', 'utf-8');

  // Let's find script blocks containing "AF_initDataCallback"
  const regex = /AF_initDataCallback\(\{[\s\S]*?\}\);/gi;
  let match;
  let count = 0;
  while ((match = regex.exec(html)) !== null) {
    count++;
    const content = match[0];
    console.log(`\n=== AF_initDataCallback ${count} (length ${content.length}) ===`);
    // Print first 500 characters
    console.log(content.substring(0, 800));
    // Let's search inside this callback for anything that has "cloudfront" or "video" or "youtube" or "drive"
    if (content.toLowerCase().includes('cloudfront') || content.toLowerCase().includes('youtube') || content.toLowerCase().includes('drive.google') || content.toLowerCase().includes('.mp4') || content.toLowerCase().includes('.m3u8')) {
      console.log("--> This callback contains media URLs!");
      // Let's scan for URLs inside this content
      const urlRegex = /https?:\/\/[^\s"',<\\]+/g;
      const foundUrls = content.match(urlRegex) || [];
      console.log("Found URLs in this block:", Array.from(new Set(foundUrls)));
    }
  }

  // Also we can look for "jsdata" or "WIDGET_DATA"
  const jsdataRegex = /window\['WIDGET_DATA'\]\s*=([\s\S]*?);/gi;
  while ((match = jsdataRegex.exec(html)) !== null) {
    console.log("\n=== window['WIDGET_DATA'] found! ===");
    console.log(match[1].substring(0, 1000));
  }

  const dataRegex = /data:\s*(\[[\s\S]*?\])\s*,\s*sideChannel/gi;
  while ((match = dataRegex.exec(html)) !== null) {
    console.log("\n=== data: [...] found! ===");
    console.log(match[1].substring(0, 1000));
  }
}

parseDs();
