import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  Search,
  Plus,
  ChevronRight,
  FileText,
  CheckCircle2,
  Trash2,
  ArrowLeft,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { shadows } from '../theme/shadows';
import { getReportsLocal, deleteReportLocal } from '../services/storage';
import { Report } from '../types';
import ProgressRing from '../components/ProgressRing';
import HistoryDetailScreen from './HistoryDetailScreen';

interface HistoryScreenProps {
  onBack?: () => void;
  onOpenCreateReport?: () => void;
}

interface MonthlyGroup {
  monthKey: string; // "Oktober 2026"
  reports: Report[];
  completionPercentage: number;
}

export default function HistoryScreen({
  onBack,
  onOpenCreateReport,
}: HistoryScreenProps) {
  const insets = useSafeAreaInsets();
  const [reports, setReports] = useState<Report[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const loadReports = async () => {
    try {
      const all = await getReportsLocal();
      setReports(all);
    } catch {}
  };

  useFocusEffect(
    useCallback(() => {
      loadReports();
    }, []),
  );

  // Filter reports
  const filtered = reports.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.activity?.toLowerCase().includes(q) ||
      r.learning?.toLowerCase().includes(q) ||
      r.obstacle?.toLowerCase().includes(q) ||
      r.date?.includes(q)
    );
  });

  // Kelompokkan per bulan
  const groupedMonths: MonthlyGroup[] = [];
  const monthMap = new Map<string, Report[]>();

  filtered.forEach((r) => {
    const d = new Date(r.date);
    const monthKey = new Intl.DateTimeFormat('id-ID', {
      month: 'long',
      year: 'numeric',
    }).format(d);

    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, []);
    }
    monthMap.get(monthKey)!.push(r);
  });

  monthMap.forEach((repList, monthKey) => {
    // Anggap 22 hari kerja rata-rata per bulan
    const pct = Math.min(1, repList.length / 22);
    groupedMonths.push({
      monthKey,
      reports: repList,
      completionPercentage: pct,
    });
  });

  const handleDelete = (id: string) => {
    Alert.alert('Hapus Laporan', 'Hapus laporan tanggal ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            await deleteReportLocal(id);
            loadReports();
          } catch {}
        },
      },
    ]);
  };

  // Jika sedang melihat detail laporan
  if (selectedReport) {
    return (
      <HistoryDetailScreen
        report={selectedReport}
        onBack={() => {
          setSelectedReport(null);
          loadReports();
        }}
        onDeleted={() => {
          setSelectedReport(null);
          loadReports();
        }}
      />
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      {/* Header bar */}
      <View style={styles.headerBar}>
        {onBack ? (
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
        ) : (
          <View style={{ width: 40 }} />
        )}
        <Text style={[typography.title, styles.headerTitle]}>
          Riwayat Laporan
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Tombol Buat Laporan Hari Ini */}
        {onOpenCreateReport && (
          <TouchableOpacity
            style={[styles.btnNewReport, shadows.e1]}
            onPress={onOpenCreateReport}
            activeOpacity={0.85}
          >
            <Plus color={colors.action} size={18} strokeWidth={2} />
            <Text style={styles.btnNewReportText}>Buat Laporan Hari Ini</Text>
          </TouchableOpacity>
        )}

        {/* Search Bar Pill */}
        <View style={styles.searchBar}>
          <Search color={colors.inkSoft} size={18} strokeWidth={2} />
          <TextInput
            style={[typography.body, styles.searchInput]}
            placeholder="Cari aktivitas atau kendala..."
            placeholderTextColor={colors.inkSoft}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Daftar Grup Per Bulan */}
        {groupedMonths.map((group, gIdx) => (
          <Animated.View
            key={group.monthKey}
            entering={FadeInDown.delay(gIdx * 60).duration(300)}
            style={[styles.monthCard, shadows.e1]}
          >
            {/* Header Bulan + Cincin Kelengkapan */}
            <View style={styles.monthHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={[typography.section, styles.monthTitle]}>
                  {group.monthKey}
                </Text>
                <Text style={[typography.meta, { color: colors.inkSoft }]}>
                  {group.reports.length} laporan tercatat
                </Text>
              </View>

              <ProgressRing
                size={54}
                progress={group.completionPercentage}
                label={`${Math.round(group.completionPercentage * 100)}%`}
                strokeWidth={5}
              />
            </View>

            <View style={styles.divider} />

            {/* List item laporan */}
            {group.reports.map((item, idx) => (
              <TouchableOpacity
                key={item.id}
                style={styles.itemRow}
                onPress={() => setSelectedReport(item)}
                activeOpacity={0.7}
              >
                <View style={styles.checkIcon}>
                  <CheckCircle2 color={colors.action} size={18} strokeWidth={2} />
                </View>
                <View style={styles.itemContent}>
                  <Text style={[typography.meta, styles.itemDate]}>
                    {new Intl.DateTimeFormat('id-ID', {
                      day: 'numeric',
                      month: 'short',
                    }).format(new Date(item.date))}
                  </Text>
                  <Text style={[typography.body, styles.itemActivity]} numberOfLines={1}>
                    {item.activity}
                  </Text>
                </View>
                <ChevronRight color={colors.inkSoft} size={16} strokeWidth={2} />
              </TouchableOpacity>
            ))}
          </Animated.View>
        ))}

        {reports.length === 0 && (
          <View style={styles.emptyWrap}>
            <FileText color={colors.actionSoft} size={48} strokeWidth={1.5} />
            <Text style={[typography.title, styles.emptyTitle]}>
              Belum Ada Laporan
            </Text>
            <Text style={[typography.bodySmall, styles.emptyDesc]}>
              Catatan yang kamu susun akan tersimpan rapi di sini dan siap dicadangkan.
            </Text>
            {onOpenCreateReport && (
              <TouchableOpacity
                style={styles.btnStartNow}
                onPress={onOpenCreateReport}
              >
                <Text style={styles.btnStartNowText}>Mulai Sekarang</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  btnNewReport: {
    backgroundColor: colors.paperRaised,
    borderRadius: 16,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.rule,
  },
  btnNewReportText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.action,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.paperRaised,
    borderRadius: 9999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    marginBottom: 16,
    ...shadows.e1,
  },
  searchInput: {
    flex: 1,
    padding: 0,
    color: colors.ink,
  },
  monthCard: {
    backgroundColor: colors.paperRaised,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
  },
  monthHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthTitle: {
    color: colors.ink,
    fontSize: 16,
  },
  divider: {
    height: 1,
    backgroundColor: colors.rule,
    marginVertical: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  checkIcon: {
    width: 28,
    alignItems: 'center',
  },
  itemContent: {
    flex: 1,
  },
  itemDate: {
    color: colors.inkSoft,
    fontSize: 11,
  },
  itemActivity: {
    color: colors.ink,
    fontSize: 14,
    marginTop: 2,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    paddingHorizontal: 20,
    gap: 10,
  },
  emptyTitle: {
    color: colors.ink,
    marginTop: 8,
  },
  emptyDesc: {
    color: colors.inkSoft,
    textAlign: 'center',
    lineHeight: 20,
  },
  btnStartNow: {
    backgroundColor: colors.action,
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 12,
  },
  btnStartNowText: {
    color: colors.onAction,
    fontWeight: '600',
    fontSize: 14,
  },
});
