// @/playground/composable/useCompression.ts

/**
 * Encode a string to a base64url-encoded compressed format.
 */
export async function encodeSnippet(content: string): Promise<string> {
  if (!content) return '';
  try {
    const stream = new window.Blob([content])
      .stream()
      .pipeThrough(new window.CompressionStream('deflate-raw'));
    const response = new window.Response(stream);
    const buffer = await response.arrayBuffer();

    return new window.Uint8Array(buffer).toBase64({
      alphabet: 'base64url',
      omitPadding: true,
    });
  } catch (error) {
    console.error('Failed to compress snippet:', error);
    return '';
  }
}

/**
 * Decode a base64url-encoded compressed format back to a string.
 */
export async function decodeSnippet(snippet: string): Promise<string> {
  if (!snippet) return '';
  try {
    const byte = window.Uint8Array.fromBase64(snippet, {
      alphabet: 'base64url',
    });
    const stream = new window.Blob([byte])
      .stream()
      .pipeThrough(new window.DecompressionStream('deflate-raw'));
    const response = new window.Response(stream);

    return await response.text();
  } catch (error) {
    console.error('Failed to decompress snippet:', error);
    return '';
  }
}
