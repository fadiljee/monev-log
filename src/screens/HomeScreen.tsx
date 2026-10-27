import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  Sun,
  Moon,
  Bell,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Calendar,
} from 'lucide-react-native';

import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { shadows } from '../theme/shadows';
import { openMonev } from '../config/links';
import { getReportsLocal } from '../services/storage';
import {
  getAttendanceStatusToday,
  confirmAttendanceToday,
  cancelAttendanceToday,
} from '../services/alarm';
import { Report } from '../types';

import TaskCard from '../components/TaskCard';
import MonevLinkCard from '../components/MonevLinkCard';
import SectionHeader from '../components/SectionHeader';
import StatusChip from '../components/StatusChip';
import Fab from '../components/Fab';
import Toast from '../components/Toast';

interface HomeScreenProps {
  onOpenCreateReport: () => void;
  onOpenHistory: () => void;
  onOpenNotifications?: () => void;
}

export default function HomeScreen({
  onOpenCreateReport,
  onOpenHistory,
  onOpenNotifications,
}: HomeScreenProps) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'today' | 'week'>('today');
  const [isAttendanceDone, setIsAttendanceDone] = useState(false);
  const [isReportDone, setIsReportDone] = useState(false);
  const [lastReport, setLastReport] = useState<Report | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [reports, setReports] = useState<Report[]>([]);

  // Sapaan berdasarkan jam lokal
  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 11
      ? 'Selamat pagi'
      : currentHour < 15
      ? 'Selamat siang'
      : currentHour < 18
      ? 'Selamat sore'
      : 'Selamat malam';

  const isNight = currentHour >= 18 || currentHour < 5;
  const isAfterWork = currentHour >= 16;
  const showAlarmWarning = isAfterWork && !isAttendanceDone;

  const todayDateStr = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  const loadData = async () => {
    try {
      const allReports = await getReportsLocal();
      setReports(allReports);

      const todayIso = new Date().toISOString().split('T')[0];
      const hasTodayReport = allReports.some((r) => r.date === todayIso);
      setIsReportDone(hasTodayReport);

      if (allReports.length > 0) {
        setLastReport(allReports[0]);
      } else {
        setLastReport(null);
      }

      const attendance = await getAttendanceStatusToday();
      setIsAttendanceDone(attendance?.isConfirmed ?? false);
    } catch {}
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, []),
  );

  const handleToggleAttendance = async () => {
    if (isAttendanceDone) {
      await cancelAttendanceToday();
      setIsAttendanceDone(false);
      setToastMessage('Penanda absen dibatalkan.');
    } else {
      await confirmAttendanceToday('manual_button');
      setIsAttendanceDone(true);
      setToastMessage('Kehadiran tercatat! Alarm hari ini dinonaktifkan.');
    }
  };

  const handleToggleReport = () => {
    setIsReportDone((prev) => !prev);
  };

  const handleOpenMonev = async () => {
    const errorMsg = await openMonev();
    if (errorMsg) {
      setToastMessage(errorMsg);
    }
  };

  // 5 hari kerja minggu berjalan untuk tab "Minggu Ini"
  const getWeekDays = () => {
    const now = new Date();
    const currentDay = now.getDay();
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);

    const days = [];
    const dayNames = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
    for (let i = 0; i < 5; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      const hasReport = reports.some((r) => r.date === iso);
      const isPast = d < new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const isToday = iso === now.toISOString().split('T')[0];
      days.push({
        name: dayNames[i],
        date: d.getDate(),
        iso,
        hasReport,
        isPast,
        isToday,
      });
    }
    return days;
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 12 }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header: Sapaan + Tanggal + Bell Indicator */}
        <Animated.View entering={FadeInDown.duration(350)} style={styles.topHeader}>
          <View style={styles.greetingGroup}>
            <View style={styles.greetingTitleRow}>
              {isNight ? (
                <Moon color={colors.action} size={18} strokeWidth={2} />
              ) : (
                <Sun color={colors.action} size={18} strokeWidth={2} />
              )}
              <Text style={[typography.bodySmall, styles.greetingText]}>
                {greeting}
              </Text>
            </View>
            <Text style={[typography.title, styles.dateText]}>{todayDateStr}</Text>
          </View>

          <TouchableOpacity
            style={styles.bellBtn}
            onPress={onOpenNotifications}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Notifikasi"
          >
            <Bell color={colors.ink} size={20} strokeWidth={1.75} />
            {showAlarmWarning && <View style={styles.bellAlertDot} />}
          </TouchableOpacity>
        </Animated.View>

        {/* Tab Segmen: Hari Ini vs Minggu Ini */}
        <View style={styles.segmentBar}>
          <TouchableOpacity
            style={[styles.segmentTab, activeTab === 'today' && styles.segmentTabActive]}
            onPress={() => setActiveTab('today')}
          >
            <Text
              style={[
                typography.section,
                styles.segmentText,
                activeTab === 'today' && styles.segmentTextActive,
              ]}
            >
              Hari Ini
            </Text>
            {activeTab === 'today' && <View style={styles.activeTabLine} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentTab, activeTab === 'week' && styles.segmentTabActive]}
            onPress={() => setActiveTab('week')}
          >
            <Text
              style={[
                typography.section,
                styles.segmentText,
                activeTab === 'week' && styles.segmentTextActive,
              ]}
            >
              Minggu Ini
            </Text>
            {activeTab === 'week' && <View style={styles.activeTabLine} />}
          </TouchableOpacity>
        </View>

        {activeTab === 'today' ? (
          /* TAB HARI INI */
          <Animated.View entering={FadeInDown.duration(250)}>
            {/* Seksi Tugas Hari Ini */}
            <SectionHeader
              icon={<FileText color={colors.action} size={18} strokeWidth={2} />}
              title="Tugas Hari Ini"
              rightElement={
                <StatusChip variant="warn" label="Batas 23.59 WIB" />
              }
            />

            {/* Checklist Absen Sore */}
            <TaskCard
              title="Absen Sore"
              subtitle="Alarm 16:00 – 24:00 WIB"
              done={isAttendanceDone}
              onToggle={handleToggleAttendance}
              isWarning={showAlarmWarning}
            />

            {/* Checklist Laporan Harian */}
            <TaskCard
              title="Laporan Harian (Monev)"
              subtitle={isReportDone ? 'Laporan sudah tersimpan' : 'Belum dibuat hari ini'}
              done={isReportDone}
              onToggle={handleToggleReport}
              isWarning={!isReportDone && isAfterWork}
            />

            <Text style={[typography.bodySmall, styles.disclaimerText]}>
              Penanda ini hanya di aplikasi, bukan status resmi portal.
            </Text>

            {/* Kartu Portal Monev */}
            <View style={{ marginTop: 18, marginBottom: 20 }}>
              <MonevLinkCard onPress={handleOpenMonev} />
            </View>

            {/* Laporan Terakhir */}
            <SectionHeader
              icon={<Calendar color={colors.action} size={18} strokeWidth={2} />}
              title="Laporan Terakhir"
              actionLabel="Lihat semua"
              onActionPress={onOpenHistory}
            />

            {lastReport ? (
              <TouchableOpacity
                style={[styles.lastReportCard, shadows.e1]}
                onPress={onOpenHistory}
                activeOpacity={0.85}
              >
                <View style={styles.lastReportHeader}>
                  <Text style={[typography.meta, { color: colors.ink }]}>
                    {lastReport.date}
                  </Text>
                  <StatusChip
                    variant={lastReport.syncStatus === 'synced' ? 'success' : 'neutral'}
                    label={
                      lastReport.syncStatus === 'synced'
                        ? 'Tersinkron'
                        : 'Tersimpan lokal'
                    }
                  />
                </View>
                <Text
                  style={[typography.body, styles.lastReportText]}
                  numberOfLines={2}
                >
                  {lastReport.activity}
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.emptyReportBox}>
                <Text style={[typography.bodySmall, { color: colors.inkSoft }]}>
                  Belum ada laporan tersimpan. Tekan tombol pena di bawah untuk mulai.
                </Text>
              </View>
            )}
          </Animated.View>
        ) : (
          /* TAB MINGGU INI */
          <Animated.View entering={FadeInDown.duration(250)} style={styles.weekContainer}>
            <Text style={[typography.section, { marginBottom: 12, color: colors.ink }]}>
              Pelacak Hari Kerja Minggu Ini
            </Text>
            {getWeekDays().map((d) => (
              <View key={d.iso} style={[styles.weekDayCard, shadows.e1]}>
                <View style={styles.weekDayLeft}>
                  <Text style={[typography.title, { fontSize: 16, color: colors.ink }]}>
                    {d.name}
                  </Text>
                  <Text style={[typography.meta, { color: colors.inkSoft }]}>
                    Tanggal {d.date}
                  </Text>
                </View>
                <View style={styles.weekDayRight}>
                  {d.hasReport ? (
                    <StatusChip variant="success" label="Laporan Ada" />
                  ) : d.isPast ? (
                    <StatusChip variant="warn" label="Terlewat" />
                  ) : d.isToday ? (
                    <StatusChip variant="neutral" label="Hari Ini" />
                  ) : (
                    <Text style={[typography.bodySmall, { color: colors.inkSoft }]}>
                      Mendatang
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </Animated.View>
        )}
      </ScrollView>

      {/* Floating Action Button "Buat Laporan" */}
      <Fab onPress={onOpenCreateReport} />

      {/* Toast Alert */}
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  greetingGroup: {
    gap: 4,
  },
  greetingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  greetingText: {
    color: colors.inkSoft,
  },
  dateText: {
    color: colors.ink,
  },
  bellBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.paperRaised,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.e1,
  },
  bellAlertDot: {
    position: 'absolute',
    top: 10,
    right: 11,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
  },
  segmentBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.rule,
    marginBottom: 20,
  },
  segmentTab: {
    paddingVertical: 10,
    marginRight: 24,
    position: 'relative',
  },
  segmentTabActive: {},
  segmentText: {
    fontSize: 16,
    color: colors.inkSoft,
  },
  segmentTextActive: {
    color: colors.action,
  },
  activeTabLine: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: colors.action,
    borderRadius: 2,
  },
  disclaimerText: {
    fontSize: 12,
    color: colors.inkSoft,
    paddingHorizontal: 4,
    marginTop: 2,
  },
  lastReportCard: {
    backgroundColor: colors.paperRaised,
    borderRadius: 20,
    padding: 16,
    gap: 8,
  },
  lastReportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastReportText: {
    lineHeight: 22,
    color: colors.ink,
  },
  emptyReportBox: {
    backgroundColor: colors.paperRaised,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.rule,
    alignItems: 'center',
  },
  weekContainer: {
    gap: 8,
  },
  weekDayCard: {
    backgroundColor: colors.paperRaised,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  weekDayLeft: {
    gap: 2,
  },
  weekDayRight: {},
});
