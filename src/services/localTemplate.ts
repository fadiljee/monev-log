/**
 * Smart Local Template Engine — PRD refactor.md
 *
 * Alur:
 * 1. Baca `reportTemplates.json` (Separation of Concerns: data ≠ logika).
 * 2. Cocokkan kata kunci (keyword matching) dari catatan mentah ke kategori.
 * 3. Pilih kalimat secara acak dari masing-masing array template.
 * 4. Sisipkan catatan mentah ke placeholder `{note}`.
 * 5. Kembalikan AiResponse dengan format identik output AI.
 *
 * Kriteria keberhasilan (refactor.md §4):
 * - Modular: JSON terpisah, tidak ada hard-coded string di sini.
 * - Peka konteks: keyword matching case-insensitive.
 * - Variasi tinggi: pemilihan acak dari tiap array.
 * - Kecepatan: < 10ms (sync, no network, no async overhead).
 * - Bahasa formal sesuai format Monev Kemnaker.
 */

import templates from '../data/reportTemplates.json';
import { AiResponse } from '../types';

interface TemplateCategory {
  id: string;
  label: string;
  keywords: string[];
  uraianTemplates: string[];
  pembelajaranTemplates: string[];
  kendalaTemplates: string[];
}

interface KendalaOption {
  id: string;
  label: string;
  text: string;
}

interface TemplateData {
  categories: TemplateCategory[];
  kendalaOptions: KendalaOption[];
}

const data = templates as TemplateData;

/** Pilih satu item secara acak dari array */
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

/**
 * Deteksi kategori berdasarkan keyword matching case-insensitive.
 * Mengembalikan kategori pertama yang memiliki keyword cocok.
 * Jika tidak ada yang cocok, kembalikan kategori terakhir (umum/default).
 */
const detectCategory = (rawInput: string): TemplateCategory => {
  const lower = rawInput.toLowerCase();

  for (const category of data.categories) {
    for (const keyword of category.keywords) {
      if (lower.includes(keyword.toLowerCase())) {
        return category;
      }
    }
  }

  // Fallback ke kategori terakhir (default/umum)
  return data.categories[data.categories.length - 1];
};

/**
 * Smart Local Template Engine — entry point utama.
 * Sinkron, tidak ada I/O, target eksekusi < 10ms.
 */
export const generateSmartLocalReport = (rawInput: string): AiResponse => {
  const category = detectCategory(rawInput);

  // Pilih kalimat uraian, sisipkan rawInput via placeholder {note}
  const uraianTemplate = pick(category.uraianTemplates);
  const activity = uraianTemplate.replace('{note}', rawInput.trim());

  // Pilih kalimat pembelajaran acak
  const learning = pick(category.pembelajaranTemplates);

  // Pilih kalimat kendala acak dari kendalaOptions (pool global fleksibel)
  // — bukan dari kategori agar variasi kendala tidak terikat domain teknis
  const obstacle = pick(data.kendalaOptions).text;

  return { activity, learning, obstacle };
};
