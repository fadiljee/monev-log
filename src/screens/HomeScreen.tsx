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
import { Copy, CheckCircle2, Clock, AlertCircle, Settings } from 'lucide-react-native';

import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { generateReportAi } from '../services/ai';
import { saveReportLocal } from '../services/storage';
import { backupToGoogleSheets } from '../services/sheets';
import { Report } from '../types';

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
    if (!rawInput.trim()) return;

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
        <TouchableOpacity
          accessible
          accessibilityLabel="Pengaturan"
          accessibilityRole="button"
          style={styles.settingsBtn}
        >
          <Settings color={colors.inkSoft} size={22} strokeWidth={1.75} />
        </TouchableOpacity>
      </View>

      {/* ── Input Catatan — design.md §7.2 ── */}
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
        {/* Penghitung karakter: font mono, stamp saat mendekati batas (design.md §7.2) */}
        <Text
          style={[
            typography.meta,
            styles.counter,
            rawInput.length > 450 && { color: colors.stamp },
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

      {/* ── Tombol Utama / Bar Progres — design.md §7.1, §9.2 ── */}
      {isGenerating ? (
        // Bar progres flat selama generate/simpan — design.md §9.2
        <View style={styles.progressBar}>
          <Text style={[typography.label, { color: colors.paperRaised }]}>
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
          <Text style={styles.btnPrimaryText}>Buat Laporan</Text>
        </TouchableOpacity>
      )}

      {/* ── Empty state link Riwayat — design.md §9.1 ── */}
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

          {/* Tombol Secondary "Buat laporan baru" — design.md §7.1, §9.3 */}
          <TouchableOpacity
            style={styles.btnSecondary}
            onPress={() => {
              setResult(null);
              setRawInput('');
              setBackupStatus('idle');
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
  return (
    <Animated.View style={[styles.reportItem, animStyle]}>
      {/* Tab huruf berlatar paper-raised, teks action, lebar tetap 28px — §7.3 */}
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
              <Text style={[typography.meta, { color: colors.action }]}>Tersalin</Text>
            ) : (
              <Copy color={colors.inkSoft} size={18} strokeWidth={1.75} />
            )}
          </TouchableOpacity>
        </View>
        <Text style={typography.body}>{text}</Text>
      </View>
    </Animated.View>
  );
}

/**
 * BackupChip — status chip backup — design.md §7.4
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

  const chipBg =
    status === 'success' ? 'rgba(44,107,79,0.10)' :
    status === 'error' ? 'rgba(156,59,50,0.10)' : 'rgba(148,107,29,0.10)';

  const label =
    status === 'success' ? 'Tersimpan' :
    status === 'error' ? 'Gagal disimpan' : 'Menyimpan…';

  return (
    <View style={[styles.statusChip, { backgroundColor: chipBg }]}>
      {/* Ikon + teks + warna = 3 penanda aksesibilitas (design.md §7.4, §11) */}
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

      {/* Tombol "Coba lagi" menyatu di kanan chip saat error — design.md §7.4 */}
      {status === 'error' && (
        <>
          <View style={styles.chipDivider} />
          <TouchableOpacity
            onPress={onRetry}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Coba simpan lagi"
          >
            <Text style={[typography.meta, { color: colors.stamp }]}>Coba lagi</Text>
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
  settingsBtn: {
    // tap target ≥44×44 — design.md §11
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },

  // Input catatan — design.md §7.2
  inputContainer: {
    backgroundColor: colors.paperRaised,
    borderRadius: 8,       // elemen interaktif: 8px — design.md §5
    borderWidth: 1,
    borderColor: colors.rule,
    marginBottom: 8,
  },
  inputContainerFocused: {
    borderColor: colors.action,
    borderWidth: 1.5,
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
  },
  hint: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },

  // Tombol primary — design.md §7.1
  btnPrimary: {
    backgroundColor: colors.action,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  btnDisabled: {
    opacity: 0.5,
  },

  // Bar progres flat — design.md §9.2 (bukan spinner)
  progressBar: {
    backgroundColor: colors.action,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },

  // Tombol secondary — design.md §7.1
  btnSecondary: {
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.rule,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
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
  },
  reportItem: {
    flexDirection: 'row',
  },

  // Kolom tab huruf U/P/K — design.md §7.3
  tabCol: {
    width: 28,
    borderRightWidth: 1,
    borderRightColor: colors.rule,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 12,
    backgroundColor: colors.paperRaised,
  },
  tabLetter: {
    color: colors.action,
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

  // Status chip backup — design.md §7.4
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 16,      // pill — pengecualian yang disengaja (design.md §5)
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
