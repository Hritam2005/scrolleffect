import fs from 'fs';

function findTextSegments() {
  if (!fs.existsSync('temp_share.html')) {
    console.log("No file!");
    return;
  }
  const html = fs.readFileSync('temp_share.html', 'utf-8');

  // Conversation strings in Gemini share pages are typically nested inside JSON-like script blocks or arrays.
  // Let's look for script blocks that contain WIDGET_DATA or user data.
  // We can write all chunks of quoted text of substantial size (longer than 50 chars) that are not HTML markup.
  const regex = /"([^"\\]*(?:\\.[^"\\]*)*)"/g;
  let match;
  const list: string[] = [];
  while ((match = regex.exec(html)) !== null) {
    const s = match[1];
    if (s.length > 50 && !s.includes('<style') && !s.includes('function(') && !s.includes('.css')) {
      const decoded = s.replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\u([0-9a-fA-F]{4})/g, (match, grp) => {
        return String.fromCharCode(parseInt(grp, 16));
      });
      list.push(decoded);
    }
  }

  console.log(`Found ${list.length} candidate text blocks.`);
  
  // Let's search inside candidate blocks for terms of interest
  const filters = ["embed", "youtube", "drive", "video", "theme", "color", "glass", "liquid", "mp4", "m3u8"];
  const matches = list.filter(s => {
    return filters.some(f => s.toLowerCase().includes(f));
  });

  console.log(`\n=== Found ${matches.length} matching text blocks: ===`);
  matches.forEach((s, i) => {
    console.log(`\n--- Match ${i} ---`);
    console.log(s.substring(0, 1000));
  });
}

findTextSegments();
