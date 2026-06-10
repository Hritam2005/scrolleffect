import fs from 'fs';

function inspect() {
  if (!fs.existsSync('temp_share.html')) {
    console.log("No file!");
    return;
  }
  const html = fs.readFileSync('temp_share.html', 'utf-8');
  console.log("File length:", html.length);

  // Find all <script> tag contents
  const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  let count = 0;
  while ((match = scriptRegex.exec(html)) !== null) {
    const content = match[1];
    count++;
    if (content.includes('45c54fd26627') || content.includes('ds:') || content.includes('WIDGET_DATA') || content.includes('initData')) {
      console.log(`\nScript ${count} (length ${content.length}) contains interesting keywords:`);
      console.log(content.substring(0, 1000));
    }
  }
  
  // Search for the specific share ID "45c54fd26627" anywhere in the body
  console.log("\n=== References to share ID ===");
  let index = 0;
  while ((index = html.indexOf('45c54fd26627', index)) !== -1) {
    console.log(`Found "45c54fd26627" at index ${index}:`);
    console.log(html.substring(Math.max(0, index - 200), Math.min(html.length, index + 200)));
    index += '45c54fd26627'.length;
  }
}

inspect();
