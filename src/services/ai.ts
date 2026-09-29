import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AiResponse } from '../types';
import { generateSmartLocalReport } from './localTemplate';

// Re-export agar konsumen lain bisa import dari satu tempat (ai.ts)
export { generateSmartLocalReport } from './localTemplate';

// ---------------------------------------------------------------------------
// API Key helpers
// ---------------------------------------------------------------------------

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

export const OPENROUTER_API_KEY_STORAGE = '@monev_openrouter_api_key';

/**
 * Get stored or environment OpenRouter API Key
 */
export const getOpenRouterApiKey = async (): Promise<string> => {
  try {
    const storedKey = await AsyncStorage.getItem(OPENROUTER_API_KEY_STORAGE);
    return storedKey || process.env.EXPO_PUBLIC_OPENROUTER_API_KEY || '';
  } catch (error) {
    console.error('Failed to get OpenRouter API key:', error);
    return process.env.EXPO_PUBLIC_OPENROUTER_API_KEY || '';
  }
};

/**
 * Save OpenRouter API Key to AsyncStorage
 */
export const saveOpenRouterApiKey = async (apiKey: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(OPENROUTER_API_KEY_STORAGE, apiKey);
  } catch (error) {
    console.error('Failed to save OpenRouter API key:', error);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Konfigurasi umum
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `Ubah catatan mentah menjadi laporan magang JSON yg sangat komprehensif, mendalam, dan terperinci dengan kunci: "activity", "learning", "obstacle". Bahasa Indonesia formal, profesional, dan ekspresif. Perluas uraian aktivitas dan pembelajaran agar lebih panjang, bernilai, dan sangat detail. Jangan bertele-tele namun buat isinya kaya dan mendalam. Jika tanpa kendala, isi "obstacle": "Tidak terdapat kendala berarti selama pelaksanaan kegiatan, seluruh proses berjalan lancar dan sesuai target." Wajib murni JSON tanpa markdown/backticks.`;

const DEFAULT_OBSTACLE = 'Tidak terdapat kendala berarti selama pelaksanaan kegiatan, seluruh proses berjalan lancar dan sesuai target.';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

/**
 * Model Gemini statis (cadangan bila daftar dinamis gagal diambil).
 * Nama model Gemini sering berganti — cek daftar terbaru di:
 * https://ai.google.dev/gemini-api/docs/models
 */
const CANDIDATE_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
];

/**
 * Model OpenRouter statis (cadangan bila daftar dinamis gagal diambil).
 * Cek daftar terbaru di: https://openrouter.ai/models (filter "free")
 */
const OPENROUTER_CANDIDATE_MODELS = [
  'meta-llama/llama-3.3-70b-instruct:free',
  'google/gemma-3-27b-it:free',
];

const MODELS_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 jam
const GEMINI_MODELS_CACHE_KEY = '@monev_gemini_models_cache';
const OPENROUTER_MODELS_CACHE_KEY = '@monev_openrouter_models_cache';
const MAX_DYNAMIC_MODELS = 3;

// ---------------------------------------------------------------------------
// Helper error & parsing
// ---------------------------------------------------------------------------

const isRateLimitError = (error: any): boolean => {
  const status = error?.status || error?.response?.status;
  const msg: string = error?.message || '';
  return (
    status === 429 ||
    msg.includes('429') ||
    msg.includes('Too Many Requests') ||
    msg.includes('quota')
  );
};

const isModelGoneError = (error: any): boolean => {
  const status = error?.status || error?.response?.status;
  const msg: string = error?.message || '';
  return (
    status === 404 ||
    msg.includes('404') ||
    msg.includes('no longer available') ||
    msg.includes('is not found')
  );
};

/**
 * Bersihkan pembungkus markdown lalu parse JSON menjadi AiResponse.
 */
const parseAiJson = (rawText: string): AiResponse => {
  const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
  const parsed: Partial<AiResponse> = JSON.parse(cleaned);

  return {
    activity: parsed.activity || 'Data aktivitas tidak ditemukan.',
    learning: parsed.learning || 'Data pembelajaran tidak ditemukan.',
    obstacle: parsed.obstacle || DEFAULT_OBSTACLE,
  };
};

// ---------------------------------------------------------------------------
// Cache daftar model
// ---------------------------------------------------------------------------

const readModelsCache = async (key: string): Promise<string[] | null> => {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const { ts, models } = JSON.parse(raw);
    if (Array.isArray(models) && models.length && Date.now() - ts < MODELS_CACHE_TTL_MS) {
      return models;
    }
  } catch {
    // abaikan, anggap cache tidak ada
  }
  return null;
};

const writeModelsCache = async (key: string, models: string[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify({ ts: Date.now(), models }));
  } catch {
    // abaikan kegagalan cache
  }
};

// ---------------------------------------------------------------------------
// Daftar model dinamis
// ---------------------------------------------------------------------------

/**
 * Ambil daftar model Gemini "flash" yang benar-benar tersedia untuk API key ini.
 * Urutan: versi terbaru dulu. Mengembalikan [] jika gagal.
 */
const getAvailableGeminiModels = async (apiKey: string): Promise<string[]> => {
  const cached = await readModelsCache(GEMINI_MODELS_CACHE_KEY);
  if (cached) return cached;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}&pageSize=200`
    );
    if (!res.ok) return [];

    const json = await res.json();
    const models: string[] = (json.models || [])
      .filter(
        (m: any) =>
          m.supportedGenerationMethods?.includes('generateContent') &&
          /flash/i.test(m.name) &&
          !/image|live|audio|tts|embedding|robotics|omni|native/i.test(m.name)
      )
      .map((m: any) => String(m.name).replace('models/', ''))
      .sort()
      .reverse()
      .slice(0, MAX_DYNAMIC_MODELS);

    if (models.length) await writeModelsCache(GEMINI_MODELS_CACHE_KEY, models);
    return models;
  } catch (error) {
    console.warn('Gagal mengambil daftar model Gemini:', error);
    return [];
  }
};

/**
 * Ambil daftar model gratis di OpenRouter. Mengembalikan [] jika gagal.
 */
const getAvailableOpenRouterModels = async (): Promise<string[]> => {
  const cached = await readModelsCache(OPENROUTER_MODELS_CACHE_KEY);
  if (cached) return cached;

  try {
    const res = await fetch('https://openrouter.ai/api/v1/models');
    if (!res.ok) return [];

    const json = await res.json();
    const models: string[] = (json.data || [])
      .filter(
        (m: any) =>
          typeof m.id === 'string' &&
          m.id.endsWith(':free') &&
          Number(m.pricing?.prompt) === 0 &&
          Number(m.pricing?.completion) === 0 &&
          // hanya model teks/instruct biasa, hindari varian khusus
          !/vision|image|audio|embed/i.test(m.id)
      )
      .map((m: any) => m.id as string)
      .slice(0, MAX_DYNAMIC_MODELS);

    if (models.length) await writeModelsCache(OPENROUTER_MODELS_CACHE_KEY, models);
    return models;
  } catch (error) {
    console.warn('Gagal mengambil daftar model OpenRouter:', error);
    return [];
  }
};

// ---------------------------------------------------------------------------
// OpenRouter
// ---------------------------------------------------------------------------

const generateReportOpenRouter = async (rawInput: string, apiKey: string): Promise<AiResponse> => {
  let lastError: any = null;

  const dynamicModels = await getAvailableOpenRouterModels();
  const modelsToTry = dynamicModels.length ? dynamicModels : OPENROUTER_CANDIDATE_MODELS;

  for (const modelName of modelsToTry) {
    let retries = 0;
    const maxRetries = 1;
    let waitTime = 2000;

    while (retries <= maxRetries) {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: modelName,
            temperature: 0.7,
            max_tokens: 4096,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: rawInput },
            ],
          }),
        });

        if (!response.ok) {
          if (response.status === 429) throw new Error('429 Rate Limit');
          if (response.status === 404) throw new Error('404 Model not found');
          throw new Error(`OpenRouter Error: ${response.status}`);
        }

        const data = await response.json();
        const responseText: string = data.choices?.[0]?.message?.content || '';
        return parseAiJson(responseText);
      } catch (error: any) {
        lastError = error;

        if (isModelGoneError(error)) {
          console.warn(`OpenRouter model ${modelName} tidak tersedia, lanjut ke kandidat berikutnya.`);
          break;
        }

        if (isRateLimitError(error)) {
          if (retries === maxRetries) break; // Pindah ke model berikutnya
          console.warn(`OpenRouter model ${modelName} rate limited, retrying...`);
          await delay(waitTime);
          waitTime *= 2;
          retries++;
        } else {
          console.warn(`OpenRouter model ${modelName} failed, trying next candidate...`, error);
          break; // Pindah ke model berikutnya
        }
      }
    }
  }

  throw lastError || new Error('All OpenRouter models failed.');
};

// ---------------------------------------------------------------------------
// Gemini
// ---------------------------------------------------------------------------

const generateReportGemini = async (rawInput: string, apiKey: string): Promise<AiResponse> => {
  let lastError: any = null;
  const genAI = new GoogleGenerativeAI(apiKey);

  const dynamicModels = await getAvailableGeminiModels(apiKey);
  const modelsToTry = dynamicModels.length ? dynamicModels : CANDIDATE_MODELS;

  for (const modelName of modelsToTry) {
    let retries = 0;
    const maxRetries = 2; // 0, 1, 2 (Total 3 tries)
    let waitTime = 2000;

    while (retries <= maxRetries) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: SYSTEM_PROMPT,
        });

        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: rawInput }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.7,
            maxOutputTokens: 8192,
          },
        });

        return parseAiJson(result.response.text());
      } catch (error: any) {
        lastError = error;

        // Model sudah dimatikan / tidak ditemukan -> langsung ke kandidat berikutnya
        if (isModelGoneError(error)) {
          console.warn(`Model ${modelName} sudah tidak tersedia, lanjut ke kandidat berikutnya.`);
          // Buang cache agar daftar model diambil ulang pada request berikutnya
          await AsyncStorage.removeItem(GEMINI_MODELS_CACHE_KEY).catch(() => {});
          break;
        }

        if (isRateLimitError(error)) {
          if (retries === maxRetries) {
            break; // Pindah ke model berikutnya alih-alih melempar error agar bisa fallback
          }
          console.warn(`Model ${modelName} rate limited, retrying in ${waitTime}ms...`);
          await delay(waitTime);
          waitTime *= 2;
          retries++;
        } else {
          console.warn(`Model ${modelName} failed with non-rate-limit error, trying next candidate...`, error);
          break; // Pindah ke model berikutnya
        }
      }
    }
  }

  throw lastError || new Error('All Gemini models failed.');
};

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export const generateReportAi = async (rawInput: string): Promise<AiResponse> => {
  const geminiKey = await getGeminiApiKey();

  if (!geminiKey) {
    throw new Error(
      'API Key Gemini belum diatur. Silakan atur EXPO_PUBLIC_GEMINI_API_KEY di file .env atau melalui halaman Pengaturan.'
    );
  }

  return generateReportGemini(rawInput, geminiKey);
};