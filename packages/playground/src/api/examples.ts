// @/api/examples.ts
import apiClient from './index';

export async function fetchExample(locale: string): Promise<string> {
  try {
    return await apiClient.get<string>(`assets/examples/${locale}.ffm`);
  } catch (error) {
    // Fallback to English example if the requested locale is not found
    return await apiClient.get<string>('assets/examples/en.ffm');
  }
}
