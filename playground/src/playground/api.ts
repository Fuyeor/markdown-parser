// @/playground/api.ts
import apiClient from '@app/http';

export async function get(locale: string): Promise<string> {
  try {
    return await apiClient.get<string>(`static/example/${locale}.ffm`);
  } catch {
    // Fallback to English example if the requested locale is not found
    return await apiClient.get<string>('static/example/en.ffm');
  }
}
