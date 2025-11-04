import { promisify } from "node:util";
import path from "node:path";
import fs from "node:fs";

/**
 * Load widget script on the server side (runs once during build)
 */
export async function loadWidgetScript(): Promise<string> {
  if(process.env.NODE_ENV === 'development') {

    const response = await fetch('http://localhost:3000/donation-widget.js');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch widget script: ${response.status}`);
    }
    
    const script = await response.text();
    console.log(`✓ Widget script loaded (${(script.length / 1024).toFixed(0)} KB)`);
    
    return script;

  }

  return promisify(fs.readFile)(path.join(process.cwd(), '..', 'dist', 'donation-widget.js'), 'utf8');
  
}

