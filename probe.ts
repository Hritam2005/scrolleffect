import { execSync } from 'child_process';

function probe() {
  try {
    console.log("=== Git Log ===");
    console.log(execSync('git log --oneline -n 10').toString());
  } catch (e: any) {
    console.log("Git log failed:", e.message);
  }

  try {
    console.log("=== Git Status ===");
    console.log(execSync('git status').toString());
  } catch (e: any) {
    console.log("Git status failed:", e.message);
  }

  try {
    console.log("=== Git Reflog or Show ===");
    console.log(execSync('git log -p -S "https://gemini.google.com/share"').toString());
  } catch (e: any) {
    console.log("Git search failed:", e.message);
  }
}

probe();
