import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AiResponse } from '../types';

export const GEMINI_API_KEY_STORAGE = '@monev_gemini_api_key';

/**
 * Get stored or environment Gemini API Key
 */
export const getGeminiApiKey = async (): Promise<string> => {
  try {
    const storedKey = await AsyncStorage.getItem(GEMINI_API_KEY_STORAGE);
    return storedKey || process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
  } catch (error) {
    console.error('Failed to get Gemini API key:', error);
    return process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
  }
};

/**
 * Save Gemini API Key to AsyncStorage
 */
export const saveGeminiApiKey = async (apiKey: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(GEMINI_API_KEY_STORAGE, apiKey);
  } catch (error) {
    console.error('Failed to save Gemini API key:', error);
    throw error;
  }
};


const SYSTEM_PROMPT = `
Kamu adalah asisten profesional yang membantu peserta magang menyusun laporan harian untuk portal Monev Kemnaker.
Tugasmu adalah mengubah catatan kegiatan mentah dari pengguna menjadi laporan terstruktur dalam format JSON dengan tiga kunci wajib: "activity", "learning", dan "obstacle".

Aturan:
1. Gunakan Bahasa Indonesia formal, profesional, jelas, ringkas, dan mudah dipahami.
2. Tidak boleh mengarang aktivitas atau menambahkan informasi yang tidak terdapat dalam input.
3. Pertahankan konteks asli pengguna. Ubah poin-poin singkat menjadi paragraf yang natural.
4. "activity": Berisi uraian kegiatan apa yang dilakukan.
5. "learning": Berisi pengetahuan, keterampilan, atau pengalaman yang diperoleh dari kegiatan tersebut.
6. "obstacle": Berisi kendala yang dialami. Jika tidak disebutkan kendala, tuliskan "Tidak terdapat kendala berarti selama pelaksanaan kegiatan."
7. Jangan gunakan kalimat atau bahasa yang berlebihan.
8. Output HARUS murni JSON tanpa markdown atau backticks (\`\`\`).
`;

const CANDIDATE_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.5-flash',
  'gemini-3.0-flash',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
];

export const generateReportAi = async (rawInput: string): Promise<AiResponse> => {
  const apiKey = await getGeminiApiKey();
  if (!apiKey) {
    throw new Error('API Key Gemini belum diatur. Silakan atur EXPO_PUBLIC_GEMINI_API_KEY di file .env atau atur melalui Pengaturan.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  let lastError: unknown = null;

  for (const modelName of CANDIDATE_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: SYSTEM_PROMPT,
      });

      const prompt = `Ubah catatan kegiatan ini menjadi laporan JSON:\n\n${rawInput}`;

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
        },
      });

      const responseText = result.response.text();
      const parsedData: AiResponse = JSON.parse(responseText);

      return {
        activity: parsedData.activity || 'Data aktivitas tidak ditemukan.',
        learning: parsedData.learning || 'Data pembelajaran tidak ditemukan.',
        obstacle: parsedData.obstacle || 'Tidak terdapat kendala berarti selama pelaksanaan kegiatan.',
      };
    } catch (error) {
      lastError = error;
      console.warn(`Model ${modelName} failed, trying next candidate...`, error);
    }
  }

  console.error('All Gemini API models failed:', lastError);
  throw new Error('Gagal menghasilkan laporan dari AI. Pastikan API Key Gemini (AIzaSy...) valid.');
};


