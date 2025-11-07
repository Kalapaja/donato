/**
 * Integrity Calculation Utility
 * 
 * This module provides functionality to calculate SHA-384 hashes for files
 * and format them as Subresource Integrity (SRI) hash strings.
 * 
 * SRI is a security feature that enables browsers to verify that files they
 * fetch are delivered without unexpected manipulation.
 * 
 * @see https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity
 * @see https://www.w3.org/TR/SRI/
 */

/**
 * Calculates the SHA-384 hash of a file and returns it in SRI format.
 * 
 * The SRI format is: "sha384-{base64-encoded-hash}"
 * 
 * Example output: "sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxy9rx7HNQlGYl1kPzQho1wx4JwY8wC"
 * 
 * @param filePath - Absolute or relative path to the file
 * @returns Promise resolving to SRI-formatted hash string
 * @throws Error if file cannot be read or hash calculation fails
 * 
 * @example
 * ```typescript
 * const integrity = await calculateSHA384("./dist/donation-widget.js");
 * console.log(integrity); // sha384-...
 * ```
 */
export async function calculateSHA384(filePath: string): Promise<string> {
  try {
    // Read file content as bytes
    const fileData = await Deno.readFile(filePath);
    
    // Calculate SHA-384 hash using Web Crypto API
    const hashBuffer = await crypto.subtle.digest("SHA-384", fileData);
    
    // Convert hash to base64 string
    const hashBase64 = btoa(
      String.fromCharCode(...new Uint8Array(hashBuffer))
    );
    
    // Format as SRI string
    return `sha384-${hashBase64}`;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      throw new Error(`File not found: ${filePath}`);
    }
    if (error instanceof Deno.errors.PermissionDenied) {
      throw new Error(`Permission denied reading file: ${filePath}`);
    }
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to calculate integrity for ${filePath}: ${message}`);
  }
}

/**
 * Calculates the SHA-384 hash from a buffer or string.
 * 
 * This is useful when you already have the content in memory
 * and don't need to read from a file.
 * 
 * @param content - File content as Uint8Array or string
 * @returns Promise resolving to SRI-formatted hash string
 * 
 * @example
 * ```typescript
 * const content = new TextEncoder().encode("console.log('Hello');");
 * const integrity = await calculateSHA384FromBuffer(content);
 * ```
 */
export async function calculateSHA384FromBuffer(
  content: Uint8Array | string
): Promise<string> {
  // Convert string to Uint8Array if needed
  const data: Uint8Array = typeof content === "string" 
    ? new TextEncoder().encode(content)
    : content;
  
  // Calculate SHA-384 hash
  const hashBuffer = await crypto.subtle.digest("SHA-384", data as BufferSource);
  
  // Convert to base64 and format as SRI string
  const hashBase64 = btoa(
    String.fromCharCode(...new Uint8Array(hashBuffer))
  );
  
  return `sha384-${hashBase64}`;
}

/**
 * Verifies if a given integrity hash matches the file content.
 * 
 * @param filePath - Path to the file to verify
 * @param expectedIntegrity - Expected SRI hash string (e.g., "sha384-...")
 * @returns Promise resolving to true if hashes match, false otherwise
 * 
 * @example
 * ```typescript
 * const isValid = await verifyIntegrity(
 *   "./dist/widget.js",
 *   "sha384-abc123..."
 * );
 * ```
 */
export async function verifyIntegrity(
  filePath: string,
  expectedIntegrity: string
): Promise<boolean> {
  try {
    const actualIntegrity = await calculateSHA384(filePath);
    return actualIntegrity === expectedIntegrity;
  } catch {
    return false;
  }
}

/**
 * Calculates integrity hashes for multiple files in parallel.
 * 
 * @param filePaths - Array of file paths
 * @returns Promise resolving to Map of file paths to their SRI hashes
 * 
 * @example
 * ```typescript
 * const hashes = await calculateMultipleIntegrity([
 *   "./dist/widget.js",
 *   "./dist/widget.css"
 * ]);
 * console.log(hashes.get("./dist/widget.js"));
 * ```
 */
export async function calculateMultipleIntegrity(
  filePaths: string[]
): Promise<Map<string, string>> {
  const results = await Promise.all(
    filePaths.map(async (path) => {
      try {
        const integrity = await calculateSHA384(path);
        return [path, integrity] as [string, string];
      } catch (error) {
        console.error(`Failed to calculate integrity for ${path}:`, error);
        return [path, ""] as [string, string];
      }
    })
  );
  
  return new Map(results.filter(([_, hash]) => hash !== ""));
}

// CLI support - run this script directly to calculate integrity for a file
if (import.meta.main) {
  const args = Deno.args;
  
  if (args.length === 0) {
    console.error("Usage: deno run --allow-read scripts/calculate-integrity.ts <file-path>");
    console.error("\nExample:");
    console.error("  deno run --allow-read scripts/calculate-integrity.ts ./dist/donation-widget.js");
    Deno.exit(1);
  }
  
  const filePath = args[0];
  
  try {
    const integrity = await calculateSHA384(filePath);
    console.log(`File: ${filePath}`);
    console.log(`Integrity: ${integrity}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${message}`);
    Deno.exit(1);
  }
}

