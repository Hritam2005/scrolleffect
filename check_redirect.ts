async function checkRedirect() {
  try {
    const res = await fetch('https://gemini.google.com/share/45c54fd26627', {
      redirect: 'manual',
    });
    console.log("Status:", res.status);
    console.log("Headers:");
    res.headers.forEach((val, key) => {
      console.log(`  ${key}: ${val}`);
    });
    const text = await res.text();
    console.log("Body length:", text.length);
    console.log("Body preview:", text.substring(0, 1000));
  } catch (e: any) {
    console.error("Error:", e.message);
  }
}

checkRedirect();
