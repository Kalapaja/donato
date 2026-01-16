import { promisify } from "node:util";
import path from "node:path";
import fs from "node:fs";

const DEV_SCRIPT_URL = "http://localhost:3000/donation-widget.js";
const readFile = promisify(fs.readFile);

/**
 * Load widget script on the server side (runs once during build)
 */
export async function loadWidgetScript(): Promise<string> {
  if (process.env.NODE_ENV === "development") {
    const response = await fetch(DEV_SCRIPT_URL);

    if (!response.ok) {
      throw new Error(`Failed to fetch widget script: ${response.status}`);
    }

    const script = await response.text();
    console.log(`Widget script loaded (${(script.length / 1024).toFixed(0)} KB)`);

    return script;
  }

  const distPath = path.join(process.cwd(), "..", "dist", "donation-widget.js");
  return readFile(distPath, "utf8");
}
