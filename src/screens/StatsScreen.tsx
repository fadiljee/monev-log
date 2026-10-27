import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Flame, FileText, Calendar, BarChart2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { shadows } from '../theme/shadows';
import { getReportsLocal } from '../services/storage';
import { calculateStats, StatsData } from '../services/stats';
import { Report } from '../types';
import ProgressRing from '../components/ProgressRing';

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState<StatsData>({
    totalReports: 0,
    thisMonthCount: 0,
    completionRate: 0,
    streakDays: 0,
    averageChars: 0,
    mostActiveDay: 'Senin',
  });

  const loadStats = async () => {
    try {
      const reports = await getReportsLocal();
      const calculated = calculateStats(reports);
      setStats(calculated);
    } catch {}
  };

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, []),
  );

  const METRICS = [
    {
      Icon: Flame,
      label: 'Streak',
      value: `${stats.streakDays} hari`,
      iconColor: '#E06B22',
    },
    {
      Icon: FileText,
      label: 'Rata-rata',
      value: `${stats.averageChars} char`,
      iconColor: colors.action,
    },
    {
      Icon: Calendar,
      label: 'Hari Top',
      value: stats.mostActiveDay,
      iconColor: colors.actionSoft,
    },
  ];

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { paddingTop: insets.top + 16, paddingBottom: 110 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[typography.title, styles.screenTitle]}>
        Statistik Magang
      </Text>

      {/* Kartu Utama: Donat Bulan Ini */}
      <Animated.View entering={FadeInDown.duration(400)} style={[styles.card, shadows.e1]}>
        <Text style={[typography.section, styles.cardTitle]}>
          Laporan Bulan Ini
        </Text>
        <View style={styles.donatRow}>
          <ProgressRing
            size={140}
            progress={stats.completionRate}
            label={`${stats.thisMonthCount}`}
            sublabel="laporan"
            strokeWidth={12}
          />
          <View style={styles.legendList}>
            {[
              {
                label: 'Total dibuat',
                val: `${stats.totalReports} lap`,
                color: colors.action,
              },
              {
                label: 'Bulan ini',
                val: `${stats.thisMonthCount} lap`,
                color: colors.actionSoft,
              },
              {
                label: 'Kelengkapan',
                val: `${Math.round(stats.completionRate * 100)}%`,
                color: colors.success,
              },
            ].map((item) => (
              <View key={item.label} style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                <Text style={[typography.bodySmall, { color: colors.ink }]}>
                  {item.label}
                </Text>
                <Text style={[typography.label, styles.legendVal]}>
                  {item.val}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </Animated.View>

      {/* 3 Metric Cards */}
      <Animated.View
        entering={FadeInDown.delay(120).duration(400)}
        style={styles.metricRow}
      >
        {METRICS.map(({ Icon, label, value, iconColor }) => (
          <View key={label} style={[styles.metricCard, shadows.e1]}>
            <View style={[styles.metricIconWrap, { backgroundColor: colors.actionTint }]}>
              <Icon color={iconColor} size={20} strokeWidth={2} />
            </View>
            <Text style={[typography.meta, { color: colors.inkSoft }]}>{label}</Text>
            <Text style={[typography.section, styles.metricVal]}>{value}</Text>
          </View>
        ))}
      </Animated.View>

      {/* Kelengkapan & Motivasi */}
      <Animated.View
        entering={FadeInDown.delay(220).duration(400)}
        style={[styles.card, shadows.e1]}
      >
        <View style={styles.cardHeaderRow}>
          <BarChart2 color={colors.action} size={18} strokeWidth={2} />
          <Text style={[typography.section, { color: colors.ink }]}>
            Target Laporan Kerja
          </Text>
        </View>
        <Text style={[typography.body, { color: colors.ink, marginTop: 8 }]}>
          Tingkat pengisian laporanmu saat ini mencapai{' '}
          <Text style={{ fontWeight: '700', color: colors.action }}>
            {Math.round(stats.completionRate * 100)}%
          </Text>{' '}
          dari hari kerja efektif bulan ini.
        </Text>
        <View style={styles.trackBarContainer}>
          <View
            style={[
              styles.trackBarFill,
              { width: `${Math.round(stats.completionRate * 100)}%` },
            ]}
          />
        </View>
      </Animated.View>

      {stats.totalReports === 0 && (
        <Animated.Text
          entering={FadeInDown.delay(300)}
          style={[typography.body, styles.emptyText]}
        >
          Statistik visual akan otomatis terisi setelah Anda membuat laporan pertama.
        </Animated.Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    backgroundColor: colors.paper,
    flexGrow: 1,
  },
  screenTitle: {
    marginBottom: 20,
    color: colors.ink,
  },
  card: {
    backgroundColor: colors.paperRaised,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: {
    marginBottom: 16,
    color: colors.ink,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  donatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  legendList: {
    flex: 1,
    gap: 12,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendVal: {
    marginLeft: 'auto',
    color: colors.ink,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.paperRaised,
    borderRadius: 18,
    padding: 14,
    gap: 6,
    alignItems: 'center',
  },
  metricIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricVal: {
    fontSize: 15,
    color: colors.ink,
    textAlign: 'center',
  },
  trackBarContainer: {
    height: 8,
    backgroundColor: colors.track,
    borderRadius: 4,
    marginTop: 14,
    overflow: 'hidden',
  },
  trackBarFill: {
    height: '100%',
    backgroundColor: colors.action,
    borderRadius: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.inkSoft,
    marginTop: 24,
    paddingHorizontal: 16,
  },
});
