import fs from 'fs';

function findVideo() {
  if (!fs.existsSync('temp_share.html')) {
    console.log("temp_share.html does not exist!");
    return;
  }
  const html = fs.readFileSync('temp_share.html', 'utf-8');
  console.log("Analyzing temp_share.html, length:", html.length);

  // Look for any video extensions or dynamic patterns
  const extensions = ['mp4', 'm3u8', 'webm', 'mov', 'ogg', 'avi', 'mkv', 'manifest', 'video', 'stream', 'cloudfront', 'amazonaws'];
  const urls: string[] = [];

  // Match URLs
  const urlRegex = /https?:\/\/[^\s"',<>\\#\^`\{\}]+/g;
  const allUrls = html.match(urlRegex) || [];
  console.log("Total raw URLs found:", allUrls.length);

  for (const url of allUrls) {
    const lower = url.toLowerCase();
    if (extensions.some(ext => lower.includes(ext))) {
      urls.push(url);
    }
  }

  const uniqueUrls = Array.from(new Set(urls));
  console.log(`Found ${uniqueUrls.length} unique video/media-like URLs:`);
  uniqueUrls.forEach(u => console.log("- ", u));

  console.log("\n=== Checking for text clues ===");
  // Let's also look for text content that might be inside conversation bubbles
  const substrings = ["video", "theme", "amber", "sunset", "liquid", "glass", "background", "link", "mp4", "m3u8", "liquid glass"];
  substrings.forEach(sub => {
    const idx = html.toLowerCase().indexOf(sub);
    if (idx !== -1) {
      console.log(`Found mention of "${sub}" at index ${idx}:`);
      console.log(html.substring(Math.max(0, idx - 50), Math.min(html.length, idx + 150)).replace(/\s+/g, ' '));
    }
  });
}

findVideo();
