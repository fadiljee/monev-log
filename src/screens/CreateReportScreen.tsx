import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import {
  ArrowLeft,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  RotateCcw,
  Cloud,
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';

import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { shadows } from '../theme/shadows';
import { generateReportAi } from '../services/ai';
import { saveReportLocal } from '../services/storage';
import { backupToGoogleSheets } from '../services/sheets';
import { confirmAttendanceToday } from '../services/alarm';
import { openMonev } from '../config/links';
import { Report } from '../types';
import ReportSectionCard from '../components/ReportSectionCard';
import StatusChip from '../components/StatusChip';
import Toast from '../components/Toast';

interface CreateReportScreenProps {
  onBack: () => void;
  onReportCreated?: (report: Report) => void;
}

export default function CreateReportScreen({
  onBack,
  onReportCreated,
}: CreateReportScreenProps) {
  const insets = useSafeAreaInsets();
  const [rawInput, setRawInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState('Menyusun laporan formal...');
  const [result, setResult] = useState<Report | null>(null);
  const [allCopied, setAllCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<'success' | 'warn' | 'error'>('warn');

  // Animasi progress bar datar (Reanimated)
  const progressAnim = useSharedValue(0.15);

  useEffect(() => {
    if (isLoading) {
      progressAnim.value = withRepeat(
        withTiming(0.85, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    } else {
      progressAnim.value = 1;
    }
  }, [isLoading]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressAnim.value * 100}%`,
  }));

  const showToast = (msg: string, variant: 'success' | 'warn' | 'error' = 'warn') => {
    setToastMessage(msg);
    setToastVariant(variant);
  };

  const handleGenerate = async () => {
    if (!rawInput.trim() || isLoading) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    setIsLoading(true);
    setLoadingLabel('Menyusun laporan formal...');
    setResult(null);

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
        generatedBy: aiResult.generatedBy || 'gemini',
        syncStatus: 'pending',
      };

      await saveReportLocal(newReport);
      setResult(newReport);

      // Konfirmasi absensi otomatis saat logbook dibuat
      confirmAttendanceToday('logbook_submit').catch(() => {});

      if (onReportCreated) {
        onReportCreated(newReport);
      }

      // Sync ke Google Sheets di background
      setLoadingLabel('Menyimpan cadangan ke Google Sheets...');
      backupToGoogleSheets(newReport)
        .then((success) => {
          setResult((prev) =>
            prev ? { ...prev, syncStatus: success ? 'synced' : 'failed' } : null,
          );
        })
        .catch(() => {});
    } catch (err: any) {
      Alert.alert(
        'Gagal Menyusun Laporan',
        'Koneksi AI tidak merespons. Catatan Anda tetap tersimpan, silakan coba lagi.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyAll = async () => {
    if (!result) return;
    const text =
      `Uraian Aktivitas:\n${result.activity}\n\n` +
      `Pembelajaran:\n${result.learning}\n\n` +
      `Kendala:\n${result.obstacle}`;

    try {
      await Clipboard.setStringAsync(text);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    setAllCopied(true);
    showToast('Seluruh bagian laporan berhasil disalin!', 'success');
    setTimeout(() => setAllCopied(false), 2000);
  };

  const handleOpenMonev = async () => {
    const errorMsg = await openMonev();
    if (errorMsg) {
      showToast(errorMsg, 'error');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.root, { paddingTop: insets.top + 8 }]}
    >
      {/* Header bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Kembali"
        >
          <ArrowLeft color={colors.ink} size={22} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={[typography.title, styles.headerTitle]}>
          {result ? 'Hasil Laporan' : 'Buat Laporan'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {!result ? (
          /* FORM INPUT */
          <Animated.View entering={FadeIn.duration(300)}>
            <Text style={[typography.section, styles.sectionTitle]}>
              Catatan Kegiatan Hari Ini
            </Text>

            <View
              style={[
                styles.inputWrapper,
                isFocused && styles.inputWrapperFocused,
              ]}
            >
              <TextInput
                style={[typography.body, styles.textarea]}
                placeholder="Tulis poin-poin kegiatan magangmu hari ini...&#10;- Mengerjakan modul backend login&#10;- Diskusi dengan mentor tim"
                placeholderTextColor={colors.inkSoft}
                multiline
                numberOfLines={8}
                value={rawInput}
                onChangeText={setRawInput}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                editable={!isLoading}
                textAlignVertical="top"
                maxLength={500}
              />
              <Text style={[typography.meta, styles.charCounter]}>
                {rawInput.length} / 500
              </Text>
            </View>

            {rawInput.trim().length === 0 && (
              <Text style={[typography.bodySmall, styles.hintText]}>
                Ketik minimal beberapa poin kegiatan hari ini.
              </Text>
            )}

            {/* Loading state bar atau Tombol Buat Laporan */}
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <View style={styles.progressBarTrack}>
                  <Animated.View style={[styles.progressBarFill, progressStyle]} />
                </View>
                <View style={styles.loadingLabelRow}>
                  <Sparkles color={colors.action} size={16} />
                  <Text style={[typography.label, styles.loadingLabelText]}>
                    {loadingLabel}
                  </Text>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={[
                  styles.btnPrimary,
                  !rawInput.trim() && styles.btnDisabled,
                ]}
                onPress={handleGenerate}
                disabled={!rawInput.trim()}
                activeOpacity={0.88}
                accessible
                accessibilityRole="button"
                accessibilityLabel="Buat laporan"
              >
                <Sparkles color={colors.onAction} size={18} strokeWidth={2} />
                <Text style={styles.btnPrimaryText}>Buat Laporan</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        ) : (
          /* HASIL LAPORAN (U / P / K) */
          <Animated.View entering={FadeIn.duration(300)}>
            {/* Status Chips */}
            <View style={styles.chipsRow}>
              <StatusChip variant="success" label="Tersimpan lokal" />
              {result.syncStatus === 'synced' && (
                <StatusChip variant="success" label="Sheets tersinkron" />
              )}
              {result.generatedBy === 'local' && (
                <StatusChip variant="warn" label="Mode offline (template)" />
              )}
            </View>

            {/* Tombol Salin Semua Bagian */}
            <TouchableOpacity
              style={styles.btnSecondary}
              onPress={handleCopyAll}
              accessible
              accessibilityRole="button"
              accessibilityLabel="Salin semua bagian laporan"
              activeOpacity={0.85}
            >
              {allCopied ? (
                <Check color={colors.success} size={18} strokeWidth={2} />
              ) : (
                <Copy color={colors.action} size={18} strokeWidth={1.8} />
              )}
              <Text
                style={[
                  styles.btnSecondaryText,
                  { color: allCopied ? colors.success : colors.action },
                ]}
              >
                {allCopied ? 'Semua Tersalin' : 'Salin Semua Bagian'}
              </Text>
            </TouchableOpacity>

            {/* 3 Kartu Laporan U / P / K */}
            <ReportSectionCard
              letter="U"
              title="Uraian Aktivitas"
              content={result.activity}
              enteringDelay={0}
            />
            <ReportSectionCard
              letter="P"
              title="Pembelajaran"
              content={result.learning}
              enteringDelay={80}
            />
            <ReportSectionCard
              letter="K"
              title="Kendala"
              content={result.obstacle}
              enteringDelay={160}
            />

            {/* Aksi Utama: Buka Portal Monev */}
            <TouchableOpacity
              style={[styles.btnPrimary, { marginTop: 16 }]}
              onPress={handleOpenMonev}
              accessible
              accessibilityRole="link"
              accessibilityLabel="Buka portal Monev"
              activeOpacity={0.88}
            >
              <ExternalLink color={colors.onAction} size={18} strokeWidth={2} />
              <Text style={styles.btnPrimaryText}>Buka Portal Monev & Tempel</Text>
            </TouchableOpacity>

            {/* Tombol Buat Laporan Baru */}
            <TouchableOpacity
              style={styles.btnGhost}
              onPress={() => {
                setResult(null);
                setRawInput('');
              }}
              accessible
              accessibilityRole="button"
              accessibilityLabel="Buat laporan baru"
            >
              <RotateCcw color={colors.action} size={16} strokeWidth={1.8} />
              <Text style={styles.btnGhostText}>Buat Laporan Baru</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>

      {/* Floating Toast Notification */}
      <Toast
        visible={!!toastMessage}
        message={toastMessage || ''}
        variant={toastVariant}
        onHide={() => setToastMessage(null)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.paperRaised,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.e1,
  },
  headerTitle: {
    color: colors.ink,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  sectionTitle: {
    marginBottom: 12,
    color: colors.ink,
  },
  inputWrapper: {
    backgroundColor: colors.paperRaised,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.rule,
    padding: 16,
    minHeight: 180,
  },
  inputWrapperFocused: {
    borderColor: colors.action,
    borderWidth: 2,
  },
  textarea: {
    color: colors.ink,
    minHeight: 120,
  },
  charCounter: {
    textAlign: 'right',
    marginTop: 8,
    color: colors.inkSoft,
  },
  hintText: {
    marginTop: 8,
    color: colors.inkSoft,
    paddingHorizontal: 4,
  },
  loadingContainer: {
    marginTop: 24,
    gap: 12,
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.track,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.action,
    borderRadius: 3,
  },
  loadingLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingLabelText: {
    color: colors.action,
  },
  btnPrimary: {
    backgroundColor: colors.action,
    borderRadius: 16,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
  },
  btnPrimaryText: {
    color: colors.onAction,
    fontSize: 15,
    fontWeight: '600',
  },
  btnDisabled: {
    backgroundColor: colors.neutralFill,
    opacity: 0.7,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  btnSecondary: {
    backgroundColor: colors.paperRaised,
    borderWidth: 1,
    borderColor: colors.rule,
    borderRadius: 16,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
    ...shadows.e1,
  },
  btnSecondaryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  btnGhost: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
    paddingVertical: 10,
  },
  btnGhostText: {
    color: colors.action,
    fontWeight: '600',
    fontSize: 14,
  },
});
