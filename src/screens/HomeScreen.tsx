import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
  AccessibilityInfo,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import {
  Copy,
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertCircle,
  ExternalLink,
} from 'lucide-react-native';

import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { generateReportAi } from '../services/ai';
import { saveReportLocal } from '../services/storage';
import { backupToGoogleSheets } from '../services/sheets';
import { confirmAttendanceToday } from '../services/alarm';
import { openMonev } from '../config/links';
import { Report } from '../types';
import MonevLinkBar from '../components/MonevLinkBar';

/**
 * Syarat minimum karakter per bagian laporan harian — PRD §B, §7.3.
 * Berdasarkan informasi Kemnaker via MagangHub. Verifikasi ke portal sebelum rilis.
 */
const MIN_SECTION_CHARS = 100;

type BackupStatus = 'idle' | 'saving' | 'success' | 'error';

/**
 * HomeScreen — Layar utama "Hari Ini"
 * Sesuai design.md §9.1–9.3, §7, §8
 */
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [rawInput, setRawInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState('Menyusun laporan…');
  const [result, setResult] = useState<Report | null>(null);
  const [backupStatus, setBackupStatus] = useState<BackupStatus>('idle');
  const [copiedSection, setCopiedSection] = useState<'U' | 'P' | 'K' | 'all' | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [monevError, setMonevError] = useState<string | null>(null);

  // Animasi "stempel" — design.md §8
  const animU = useRef(new Animated.Value(0)).current;
  const animP = useRef(new Animated.Value(0)).current;
  const animK = useRef(new Animated.Value(0)).current;

  const todayStr = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setPrefersReducedMotion);
  }, []);

  useEffect(() => {
    if (!result) return;

    animU.setValue(0);
    animP.setValue(0);
    animK.setValue(0);

    if (prefersReducedMotion) {
      // prefers-reduced-motion: fade polos 100ms tanpa scale (design.md §8)
      Animated.sequence([
        Animated.timing(animU, { toValue: 1, duration: 100, useNativeDriver: true }),
        Animated.delay(0),
        Animated.timing(animP, { toValue: 1, duration: 100, useNativeDriver: true }),
        Animated.delay(0),
        Animated.timing(animK, { toValue: 1, duration: 100, useNativeDriver: true }),
      ]).start();
    } else {
      // Stempel: scale 97%→100% + fade 150ms, jeda 80ms antar-entri (design.md §8)
      Animated.sequence([
        Animated.timing(animU, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.delay(80),
        Animated.timing(animP, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.delay(80),
        Animated.timing(animK, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [result, prefersReducedMotion, animU, animP, animK]);

  const handleGenerate = async () => {
    if (!rawInput.trim() || isLoading) return;

    setIsLoading(true);
    setLoadingLabel('Menyusun laporan…');
    setResult(null);
    setBackupStatus('idle');

    try {
      const aiResult = await generateReportAi(rawInput);

      const newReport: Report = {
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        rawInput,
        activity: aiResult.activity,
        learning: aiResult.learning,
        obstacle: aiResult.obstacle,
        createdAt: new Date().toISOString(),
      };

      setResult(newReport);
      await saveReportLocal(newReport);
      // Konfirmasi otomatis absensi hari ini & matikan sisa alarm pengingat
      confirmAttendanceToday('logbook_submit').catch(() => {});

      setLoadingLabel('Menyimpan ke Sheets…');
      setBackupStatus('saving');
      const backupSuccess = await backupToGoogleSheets(newReport);
      setBackupStatus(backupSuccess ? 'success' : 'error');
    } catch {
      Alert.alert(
        'Laporan belum bisa dibuat',
        'Koneksi ke Gemini gagal merespons. Catatanmu masih tersimpan — coba lagi.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const retryBackup = async () => {
    if (!result) return;
    setBackupStatus('saving');
    const ok = await backupToGoogleSheets(result);
    setBackupStatus(ok ? 'success' : 'error');
  };

  /** Salin teks ke clipboard dan tampilkan umpan balik inline sesaat */
  const copySection = (text: string, section: 'U' | 'P' | 'K' | 'all') => {
    Clipboard.setStringAsync(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 1500);
  };

  const copyAll = () => {
    if (!result) return;
    const text =
      `Uraian Aktivitas:\n${result.activity}\n\n` +
      `Pembelajaran yang Diperoleh:\n${result.learning}\n\n` +
      `Kendala yang Dialami:\n${result.obstacle}`;
    copySection(text, 'all');
  };

  const handleOpenMonev = async () => {
    setMonevError(null);
    const errMsg = await openMonev();
    if (errMsg) setMonevError(errMsg);
  };

  const getStampStyle = (anim: Animated.Value) =>
    prefersReducedMotion
      ? { opacity: anim }
      : {
          opacity: anim,
          transform: [
            {
              scale: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.97, 1],
              }),
            },
          ],
        };

  const isGenerating = isLoading || backupStatus === 'saving';
  const canGenerate = rawInput.trim().length > 0 && !isGenerating;

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
    >
      {/* ── Header Layar — design.md §9.1 ── */}
      <View style={styles.screenHeader}>
        <View>
          <Text style={typography.display}>Hari Ini</Text>
          {/* Tanggal: font mono sesuai §4 "Data & meta" */}
          <Text style={[typography.meta, styles.dateText]}>{todayStr}</Text>
        </View>
      </View>

      {/* ── Input Catatan — design.md §7.3 ── */}
      <View
        style={[
          styles.inputContainer,
          rawInput.length > 0 && styles.inputContainerFocused,
        ]}
      >
        <TextInput
          style={styles.input}
          multiline
          placeholder="Ketik catatan kegiatan hari ini..."
          placeholderTextColor={colors.inkSoft}
          value={rawInput}
          onChangeText={setRawInput}
          maxLength={500}
          accessible
          accessibilityLabel="Catatan kegiatan hari ini"
        />
        {/* Penghitung karakter: font mono (design.md §7.3) */}
        <Text
          style={[
            typography.meta,
            styles.counter,
            rawInput.length > 450 && { color: colors.warn },
          ]}
        >
          {rawInput.length} / 500
        </Text>
      </View>

      {/* Hint validasi kosong — design.md §10 */}
      {rawInput.trim().length === 0 && (
        <Text style={[typography.bodySmall, styles.hint]}>
          Ketik minimal beberapa kata dulu.
        </Text>
      )}

      {/* ── Bar Portal Monev — design.md §7.5b, PRD §E.3 #2 ── */}
      {!result && (
        <View style={styles.monevBarWrapper}>
          <MonevLinkBar onPress={handleOpenMonev} />
        </View>
      )}

      {/* Toast error Monev — design.md §7.7, PRD §E.4 */}
      {monevError && (
        <View style={styles.errorToast}>
          <AlertCircle color={colors.error} size={16} strokeWidth={1.75} style={{ marginRight: 8 }} />
          <Text style={[typography.bodySmall, { color: colors.error, flex: 1 }]}>
            {monevError}
          </Text>
        </View>
      )}

      {/* ── Tombol Utama / Bar Progres — design.md §7.1, §9.2 ── */}
      {isGenerating ? (
        // Bar progres flat selama generate/simpan — design.md §9.2 (bukan spinner)
        <View style={styles.progressBar}>
          <Text style={[typography.label, { color: colors.onAction }]}>
            {loadingLabel}
          </Text>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.btnPrimary, !canGenerate && styles.btnDisabled]}
          onPress={handleGenerate}
          disabled={!canGenerate}
          activeOpacity={0.98}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Buat laporan dari catatan"
          accessibilityState={{ disabled: !canGenerate }}
        >
          <Text style={styles.btnPrimaryText}>Buat laporan</Text>
        </TouchableOpacity>
      )}

      {/* ── Empty state — design.md §9.1 ── */}
      {!result && !isGenerating && (
        <View style={styles.emptyState}>
          <Text style={typography.bodySmall}>
            Riwayat 6 hari terakhir tersimpan di Google Sheets kamu →
          </Text>
        </View>
      )}

      {/* ── Hasil Laporan — design.md §9.3, §7.3 ── */}
      {result && (
        <View style={styles.resultSection}>
          {/* Header hasil: judul + chip status backup */}
          <View style={styles.resultHeader}>
            <Text style={typography.title}>Hasil Laporan</Text>
            {backupStatus !== 'idle' && (
              <BackupChip status={backupStatus} onRetry={retryBackup} />
            )}
          </View>

          <View style={styles.rule} />

          {/* Bar sticky "Salin semua" — design.md §7.3 */}
          <TouchableOpacity
            style={styles.copyAllBar}
            onPress={copyAll}
            activeOpacity={0.7}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Salin semua bagian laporan"
          >
            <Copy color={colors.action} size={16} strokeWidth={1.75} />
            <Text style={[typography.label, { color: colors.action, marginLeft: 6 }]}>
              {copiedSection === 'all' ? 'Tersalin' : 'Salin semua'}
            </Text>
          </TouchableOpacity>

          {/* Tabel logbook: U/P/K entries — design.md §7.3 */}
          <View style={styles.reportList}>
            <ReportEntry
              tabLetter="U"
              sectionLabel="Uraian Aktivitas"
              text={result.activity}
              isCopied={copiedSection === 'U'}
              onCopy={() => copySection(result.activity, 'U')}
              animStyle={getStampStyle(animU)}
            />
            <View style={styles.rule} />
            <ReportEntry
              tabLetter="P"
              sectionLabel="Pembelajaran"
              text={result.learning}
              isCopied={copiedSection === 'P'}
              onCopy={() => copySection(result.learning, 'P')}
              animStyle={getStampStyle(animP)}
            />
            <View style={styles.rule} />
            <ReportEntry
              tabLetter="K"
              sectionLabel="Kendala"
              text={result.obstacle}
              isCopied={copiedSection === 'K'}
              onCopy={() => copySection(result.obstacle, 'K')}
              animStyle={getStampStyle(animK)}
            />
          </View>

          {/* Tombol primer "Buka Monev" — design.md §7.5, §9.3, PRD §E.3 #3 */}
          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={handleOpenMonev}
            activeOpacity={0.98}
            accessible
            accessibilityRole="link"
            accessibilityLabel="Buka portal Monev"
            accessibilityHint="Membuka situs Monev di browser"
          >
            <ExternalLink
              color={colors.onAction}
              size={16}
              strokeWidth={1.75}
              style={{ marginRight: 8 }}
            />
            <Text style={styles.btnPrimaryText}>Buka Monev</Text>
          </TouchableOpacity>

          {/* Tombol Secondary "Buat laporan baru" — design.md §7.1, §9.3 */}
          <TouchableOpacity
            style={styles.btnSecondary}
            onPress={() => {
              setResult(null);
              setRawInput('');
              setBackupStatus('idle');
              setMonevError(null);
            }}
            activeOpacity={0.98}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Buat laporan baru"
          >
            <Text style={[typography.label, { color: colors.ink }]}>
              Buat laporan baru
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

/* ── Sub-komponen ──────────────────────────────────────────────── */

/**
 * ReportEntry — satu baris entri logbook (U/P/K) — design.md §7.3
 * Menampilkan penghitung karakter terhadap MIN_SECTION_CHARS.
 */
function ReportEntry({
  tabLetter,
  sectionLabel,
  text,
  isCopied,
  onCopy,
  animStyle,
}: {
  tabLetter: string;
  sectionLabel: string;
  text: string;
  isCopied: boolean;
  onCopy: () => void;
  animStyle: object;
}) {
  const charCount = text.length;
  const meetsMin = charCount >= MIN_SECTION_CHARS;
  const shortage = MIN_SECTION_CHARS - charCount;

  return (
    <Animated.View style={[styles.reportItem, animStyle]}>
      {/* Tab huruf berlatar action solid, teks onAction, lebar tetap 28px — §7.3 */}
      <View style={styles.tabCol}>
        <Text style={styles.tabLetter}>{tabLetter}</Text>
      </View>

      <View style={styles.reportContent}>
        <View style={styles.reportContentHeader}>
          <Text style={typography.label}>{sectionLabel}</Text>
          {/* Ghost button salin — design.md §7.1, §7.3 */}
          <TouchableOpacity
            onPress={onCopy}
            style={styles.copyIconBtn}
            accessible
            accessibilityRole="button"
            accessibilityLabel={`Salin ${sectionLabel}`}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {isCopied ? (
              <Text style={[typography.meta, { color: colors.success }]}>Tersalin</Text>
            ) : (
              <Copy color={colors.inkSoft} size={18} strokeWidth={1.75} />
            )}
          </TouchableOpacity>
        </View>

        <Text style={typography.body}>{text}</Text>

        {/* Penghitung syarat minimum — design.md §7.3, PRD §B */}
        <View style={styles.charCountRow}>
          {meetsMin ? (
            <>
              <CheckCircle2
                color={colors.success}
                size={12}
                strokeWidth={2}
                style={{ marginRight: 4 }}
              />
              <Text style={[typography.meta, { color: colors.success }]}>
                {charCount} karakter, syarat terpenuhi
              </Text>
            </>
          ) : (
            <>
              <AlertTriangle
                color={colors.warn}
                size={12}
                strokeWidth={2}
                style={{ marginRight: 4 }}
              />
              <Text style={[typography.meta, { color: colors.warn }]}>
                {charCount} karakter, kurang {shortage}. Tambahkan detail sebelum disalin.
              </Text>
            </>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

/**
 * BackupChip — status chip backup — design.md §7.6
 * Memakai token tint solid (bukan rgba) sesuai design.md §2.
 */
function BackupChip({
  status,
  onRetry,
}: {
  status: BackupStatus;
  onRetry: () => void;
}) {
  const chipColor =
    status === 'success' ? colors.success :
    status === 'error' ? colors.error : colors.warn;

  // Tint solid — design.md §3 (bukan rgba/opacity berlapis)
  const chipBg =
    status === 'success' ? colors.successTint :
    status === 'error' ? colors.errorTint : colors.warnTint;

  const label =
    status === 'success' ? 'Tersimpan' :
    status === 'error' ? 'Gagal disimpan' : 'Menyimpan…';

  return (
    <View style={[styles.statusChip, { backgroundColor: chipBg }]}>
      {/* Ikon + teks + warna = 3 penanda aksesibilitas (design.md §7.6, §11) */}
      {status === 'success' && (
        <CheckCircle2 color={chipColor} size={13} strokeWidth={2} style={styles.chipIcon} />
      )}
      {status === 'saving' && (
        <Clock color={chipColor} size={13} strokeWidth={2} style={styles.chipIcon} />
      )}
      {status === 'error' && (
        <AlertCircle color={chipColor} size={13} strokeWidth={2} style={styles.chipIcon} />
      )}
      <Text style={[typography.meta, { color: chipColor }]}>{label}</Text>

      {/* Tombol "Coba lagi" menyatu di kanan chip saat error — design.md §7.6 */}
      {status === 'error' && (
        <>
          <View style={styles.chipDivider} />
          <TouchableOpacity
            onPress={onRetry}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Coba simpan lagi"
          >
            <Text style={[typography.meta, { color: colors.error }]}>Coba lagi</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

/* ── Styles ──────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  contentContainer: {
    paddingHorizontal: 20,  // margin layar 20px — design.md §5
    paddingBottom: 40,
  },

  // Header layar
  screenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 20,
    marginBottom: 24,
  },
  dateText: {
    marginTop: 4,
    color: colors.inkSoft,
  },

  // Input catatan — design.md §7.3
  inputContainer: {
    backgroundColor: colors.paperRaised,
    borderRadius: 8,       // elemen interaktif: 8px — design.md §5
    borderWidth: 1,
    borderColor: colors.rule,
    marginBottom: 8,
  },
  inputContainerFocused: {
    borderColor: colors.action,
    borderWidth: 2,        // border fokus 2px — design.md §7.3
  },
  input: {
    minHeight: 140,
    padding: 16,
    textAlignVertical: 'top',
    fontSize: 16,
    lineHeight: 25,
    color: colors.ink,
  },
  counter: {
    textAlign: 'right',
    padding: 12,
    paddingTop: 0,
    color: colors.inkSoft,
  },
  hint: {
    marginBottom: 16,
    paddingHorizontal: 4,
    color: colors.inkSoft,
  },

  // Bar Portal Monev — design.md §7.5b
  monevBarWrapper: {
    marginBottom: 16,
  },

  // Toast error — design.md §7.7
  errorToast: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.errorTint,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
    borderRadius: 4,
    padding: 12,
    marginBottom: 12,
  },

  // Tombol primary — design.md §7.1
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.action,
    height: 44,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 12,
  },
  btnPrimaryText: {
    color: colors.onAction,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 17,
  },
  btnDisabled: {
    opacity: 0.5,
  },

  // Bar progres flat — design.md §9.2 (bukan spinner/shimmer)
  progressBar: {
    backgroundColor: colors.action,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },

  // Tombol secondary — design.md §7.1
  btnSecondary: {
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.rule,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: 'transparent',
  },

  // Empty state
  emptyState: {
    borderTopWidth: 1,
    borderTopColor: colors.rule,
    paddingTop: 16,
  },

  // Section hasil
  resultSection: {
    marginTop: 8,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  // Garis pemisah rule 1px — design.md §5 (bukan shadow)
  rule: {
    height: 1,
    backgroundColor: colors.rule,
  },

  // Bar sticky "Salin semua" — design.md §7.3
  copyAllBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderBottomWidth: 1,
    borderBottomColor: colors.rule,
    backgroundColor: colors.paperRaised,
  },

  // Tabel logbook — design.md §7.3
  reportList: {
    backgroundColor: colors.paperRaised,
    borderWidth: 1,
    borderColor: colors.rule,
    borderRadius: 4,       // permukaan statis: 4px — design.md §5
    overflow: 'hidden',
    marginBottom: 8,
  },
  reportItem: {
    flexDirection: 'row',
  },

  // Kolom tab huruf U/P/K — design.md §7.3: "Tab berlatar action solid, huruf onAction"
  tabCol: {
    width: 28,
    borderRightWidth: 1,
    borderRightColor: colors.rule,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 12,
    backgroundColor: colors.action,  // solid action — design.md §7.3
  },
  tabLetter: {
    color: colors.onAction,           // putih di atas action
    fontWeight: '600',
    fontSize: 13,
    lineHeight: 17,
  },

  // Isi konten entri
  reportContent: {
    flex: 1,
    padding: 12,
  },
  reportContentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },

  // Ghost button ikon salin — tap target ≥44×44 terpenuhi via hitSlop
  copyIconBtn: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },

  // Baris penghitung karakter minimum — design.md §7.3, PRD §B
  charCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },

  // Status chip backup — design.md §7.6 (tint solid, pill)
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 16,      // pill — design.md §5
  },
  chipIcon: {
    marginRight: 4,
  },
  chipDivider: {
    width: 1,
    height: 12,
    backgroundColor: colors.rule,
    marginHorizontal: 6,
  },
});
