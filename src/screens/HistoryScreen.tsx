import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { Trash2, Copy } from 'lucide-react-native';

import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { getReportsLocal, deleteReportLocal } from '../services/storage';
import { Report } from '../types';

/**
 * HistoryScreen — Riwayat laporan
 * Sesuai design.md §9.4, §7.4
 */
export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const [reports, setReports] = useState<Report[]>([]);

  const loadReports = async () => {
    const data = await getReportsLocal();
    setReports(data);
  };

  useFocusEffect(
    useCallback(() => {
      loadReports();
    }, []),
  );

  const handleDelete = (id: string) => {
    Alert.alert('Hapus Laporan', 'Hapus riwayat ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          await deleteReportLocal(id);
          loadReports();
        },
      },
    ]);
  };

  const copyAll = (report: Report) => {
    const text =
      `Uraian Aktivitas:\n${report.activity}\n\n` +
      `Pembelajaran yang Diperoleh:\n${report.learning}\n\n` +
      `Kendala yang Dialami:\n${report.obstacle}`;
    Clipboard.setStringAsync(text);
    Alert.alert('Tersalin', 'Seluruh bagian laporan telah disalin.');
  };

  /**
   * Format tanggal dalam format mono — design.md §9.4
   * Contoh: "27 Sep 2026"
   */
  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(dateStr));
  };

  const renderItem = ({ item }: { item: Report }) => (
    <View style={styles.card}>
      {/* Header kartu: tanggal mono + tombol hapus */}
      <View style={styles.cardHeader}>
        {/* Tanggal: font mono sesuai §9.4, §4 */}
        <Text style={[typography.meta, { color: colors.ink }]}>
          {formatDate(item.date)}
        </Text>
        <TouchableOpacity
          onPress={() => handleDelete(item.id)}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Hapus laporan ini"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.deleteBtn}
        >
          <Trash2 color={colors.inkSoft} size={18} strokeWidth={1.75} />
        </TouchableOpacity>
      </View>

      {/* Preview satu baris terpotong — design.md §9.4 */}
      <Text style={styles.previewText} numberOfLines={1}>
        {item.activity}
      </Text>

      {/* Garis pemisah sebelum aksi */}
      <View style={styles.rule} />

      {/* Ghost button "Salin semua" — design.md §7.1 */}
      <TouchableOpacity
        style={styles.copyBtn}
        onPress={() => copyAll(item)}
        accessible
        accessibilityRole="button"
        accessibilityLabel="Salin semua bagian laporan"
      >
        <Copy color={colors.action} size={16} strokeWidth={1.75} style={{ marginRight: 6 }} />
        <Text style={[typography.label, { color: colors.action }]}>Salin semua</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Judul layar — display typography, dikelola layar sendiri (headerShown: false) */}
      <View style={styles.screenHeader}>
        <Text style={typography.display}>Riwayat</Text>
      </View>

      {reports.length === 0 ? (
        // Empty state — design.md §10
        <View style={styles.emptyContainer}>
          <Text style={[typography.title, styles.emptyTitle]}>Belum ada laporan</Text>
          <Text style={[typography.bodySmall, styles.emptySubtitle]}>
            Laporan yang kamu buat akan muncul di sini.
          </Text>
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

/* ── Styles ──────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
    paddingHorizontal: 20,  // margin layar 20px — design.md §5
  },
  screenHeader: {
    marginTop: 20,
    marginBottom: 8,
  },
  listContent: {
    paddingTop: 16,
    paddingBottom: 40,
  },

  // Kartu riwayat — permukaan statis: radius 4px (design.md §5)
  card: {
    backgroundColor: colors.paperRaised,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.rule,
    marginBottom: 16,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  deleteBtn: {
    // tap target ≥44×44 dipenuhi via hitSlop (design.md §11)
    padding: 4,
  },

  // Preview teks — design.md §9.4
  previewText: {
    ...typography.body,
    color: colors.inkSoft,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },

  // Garis pemisah 1px — design.md §5 (bukan shadow)
  rule: {
    height: 1,
    backgroundColor: colors.rule,
  },

  // Ghost button salin — design.md §7.1 "Aksi ringan di dalam kartu"
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,              // tap target minimum 44px — design.md §11
    backgroundColor: 'transparent',
  },

  // Empty state — design.md §10
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
  },
  emptyTitle: {
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
