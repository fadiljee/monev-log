import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import {
  ArrowLeft,
  ExternalLink,
  Copy,
  Check,
  Trash2,
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';

import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { shadows } from '../theme/shadows';
import { openMonev } from '../config/links';
import { deleteReportLocal } from '../services/storage';
import { Report } from '../types';
import ReportSectionCard from '../components/ReportSectionCard';
import StatusChip from '../components/StatusChip';
import Toast from '../components/Toast';

interface HistoryDetailScreenProps {
  report: Report;
  onBack: () => void;
  onDeleted?: () => void;
}

export default function HistoryDetailScreen({
  report,
  onBack,
  onDeleted,
}: HistoryDetailScreenProps) {
  const insets = useSafeAreaInsets();
  const [allCopied, setAllCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const formattedDate = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(report.date));

  const handleCopyAll = async () => {
    const text =
      `Uraian Aktivitas:\n${report.activity}\n\n` +
      `Pembelajaran:\n${report.learning}\n\n` +
      `Kendala:\n${report.obstacle}`;

    try {
      await Clipboard.setStringAsync(text);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    setAllCopied(true);
    setToastMessage('Seluruh bagian laporan telah disalin!');
    setTimeout(() => setAllCopied(false), 2000);
  };

  const handleOpenMonev = async () => {
    const errorMsg = await openMonev();
    if (errorMsg) {
      setToastMessage(errorMsg);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Hapus Laporan',
      'Apakah Anda yakin ingin menghapus laporan tanggal ini dari penyimpanan lokal?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              await deleteReportLocal(report.id);
              if (onDeleted) onDeleted();
              onBack();
            } catch {}
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      {/* Header Bar */}
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
        <Text style={[typography.title, styles.headerTitle]} numberOfLines={1}>
          Detail Laporan
        </Text>
        <TouchableOpacity
          onPress={handleDelete}
          style={styles.deleteBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Hapus laporan ini"
        >
          <Trash2 color={colors.error} size={20} strokeWidth={1.8} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeIn.duration(300)}>
          {/* Tanggal & Chips Status */}
          <Text style={[typography.title, styles.dateHeading]}>
            {formattedDate}
          </Text>

          <View style={styles.chipsRow}>
            <StatusChip variant="success" label="Tersimpan lokal" />
            {report.syncStatus === 'synced' && (
              <StatusChip variant="success" label="Sheets tersinkron" />
            )}
            {report.generatedBy === 'local' && (
              <StatusChip variant="warn" label="Template lokal" />
            )}
          </View>

          {/* Tombol Salin Semua */}
          <TouchableOpacity
            style={styles.btnSecondary}
            onPress={handleCopyAll}
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

          {/* Tiga Kartu U / P / K */}
          <ReportSectionCard
            letter="U"
            title="Uraian Aktivitas"
            content={report.activity}
            enteringDelay={0}
          />
          <ReportSectionCard
            letter="P"
            title="Pembelajaran"
            content={report.learning}
            enteringDelay={60}
          />
          <ReportSectionCard
            letter="K"
            title="Kendala"
            content={report.obstacle}
            enteringDelay={120}
          />

          {/* Tombol Buka Monev */}
          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={handleOpenMonev}
            activeOpacity={0.88}
          >
            <ExternalLink color={colors.onAction} size={18} strokeWidth={2} />
            <Text style={styles.btnPrimaryText}>Buka Portal Monev & Tempel</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {/* Floating Toast */}
      <Toast
        visible={!!toastMessage}
        message={toastMessage || ''}
        variant="success"
        onHide={() => setToastMessage(null)}
      />
    </View>
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
  deleteBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.paperRaised,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.e1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  dateHeading: {
    marginBottom: 8,
    color: colors.ink,
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
  btnPrimary: {
    backgroundColor: colors.action,
    borderRadius: 16,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  btnPrimaryText: {
    color: colors.onAction,
    fontSize: 15,
    fontWeight: '600',
  },
});
