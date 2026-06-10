import fs from 'fs';

async function testFetch() {
  try {
    const res = await fetch('https://gemini.google.com/share/45c54fd26627', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    });
    console.log("Response status:", res.status);
    const text = await res.text();
    console.log("HTML length:", text.length);
    fs.writeFileSync('temp_share.html', text);
    console.log("Wrote temp_share.html successfully.");
  } catch (e: any) {
    console.error("Error fetching:", e.message);
  }
}

testFetch();
