import fs from 'fs';

const html = fs.readFileSync('share_page_headers.html', 'utf-8');

// Gemini shares have JS arrays containing the conversation.
// Let's search for "ds:1" or "ds:2" or look for all script tags containing the conversation text.
// Let's extract any substantial JSON array or list of strings.
// Let's grab all text between double quotes that contains spaces and matches typical conversational words.
const matches = html.match(/"[^"]{40,2000}"/g) || [];
console.log(`Found ${matches.length} strings of substantial length.`);

// Let's filter strings that look like they have English words or URLs
const interesting = matches.map(s => s.replace(/\\"/g, '"').replace(/\\n/g, '\n'))
  .filter(s => {
    return (s.includes('https://') || s.includes('http://') || s.toLowerCase().includes('vanguard') || s.toLowerCase().includes('video') || s.toLowerCase().includes('scroll') || s.toLowerCase().includes('canvas'));
  });

console.log(`Interesting strings (${interesting.length}):`);
interesting.slice(0, 150).forEach((s, idx) => {
  console.log(`--- STRING ${idx} ---`);
  console.log(s.substring(0, 800));
});
