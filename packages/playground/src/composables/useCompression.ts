// @/composables/useCompression.ts

/**
 * Encode a string to a base64-encoded compressed format using the CompressionStream API.
 */
export async function encodeSnippet(content: string): Promise<string> {
  if (!content) return '';
  try {
    const stream = new Blob([content])
      .stream()
      .pipeThrough(new CompressionStream('deflate-raw'));
    const response = new Response(stream);
    const blob = await response.blob();
    const buffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Convert to base64url format
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]!);
    }
    return btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  } catch (error) {
    console.error('Failed to compress snippet:', error);
    return '';
  }
}

/**
 * Decode a base64-encoded compressed format back to a string using the DecompressionStream API.
 */
export async function decodeSnippet(snippet: string): Promise<string> {
  if (!snippet) return '';
  try {
    // Convert base64url back to base64
    let base64 = snippet.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }

    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const stream = new Blob([bytes])
      .stream()
      .pipeThrough(new DecompressionStream('deflate-raw'));
    const response = new Response(stream);
    return await response.text();
  } catch (error) {
    console.error('Failed to decompress snippet:', error);
    return '';
  }
}
