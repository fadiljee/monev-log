import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ExternalLink, Moon, Database, ChevronRight, Info, Check, X } from 'lucide-react-native';

import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { getSheetsWebhookUrl, saveSheetsWebhookUrl } from '../services/sheets';

/**
 * SettingsScreen — Pengaturan
 * Sesuai design.md §9.5
 */
export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [webhookUrl, setWebhookUrl] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [inputUrl, setInputUrl] = useState('');

  useEffect(() => {
    loadUrl();
  }, []);

  const loadUrl = async () => {
    const url = await getSheetsWebhookUrl();
    setWebhookUrl(url);
    setInputUrl(url);
  };

  const handleSaveUrl = async () => {
    try {
      await saveSheetsWebhookUrl(inputUrl.trim());
      setWebhookUrl(inputUrl.trim());
      setModalVisible(false);
      Alert.alert('Berhasil', 'URL Google Apps Script Webhook berhasil disimpan.');
    } catch (error) {
      Alert.alert('Gagal', 'Tidak dapat menyimpan Webhook URL.');
    }
  };

  const isConnected = Boolean(webhookUrl.trim());

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Judul layar — display typography, dikelola layar sendiri (headerShown: false) */}
      <Text style={[typography.display, styles.screenTitle]}>Pengaturan</Text>

      {/* ── Seksi Penyimpanan ── */}
      <Text style={styles.sectionLabel}>PENYIMPANAN</Text>
      <View style={styles.section}>
        {/* Status koneksi Google Sheets */}
        <View style={styles.item}>
          <View style={styles.itemLeft}>
            <Database color={colors.inkSoft} size={18} strokeWidth={1.75} style={styles.itemIcon} />
            <Text style={typography.body}>Koneksi Google Sheets</Text>
          </View>
          {/* Status chip — design.md §7.4: ikon + teks + warna */}
          <View style={[styles.statusChip, isConnected ? styles.chipSuccess : styles.chipWarn]}>
            <Text style={[typography.meta, { color: isConnected ? colors.success : colors.warn }]}>
              {isConnected ? 'Terhubung' : 'Belum terhubung'}
            </Text>
          </View>
        </View>

        <View style={styles.rule} />

        {/* Hubungkan / Pengaturan Webhook */}
        <TouchableOpacity
          style={styles.itemTouchable}
          onPress={() => setModalVisible(true)}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Konfigurasi URL Google Sheets Apps Script"
        >
          <View style={styles.itemLeft}>
            <ExternalLink color={colors.inkSoft} size={18} strokeWidth={1.75} style={styles.itemIcon} />
            <Text style={typography.body}>
              {isConnected ? 'Ubah URL Webhook' : 'Hubungkan Webhook'}
            </Text>
          </View>
          <ChevronRight color={colors.inkSoft} size={18} strokeWidth={1.75} />
        </TouchableOpacity>
      </View>

      {/* ── Seksi Aplikasi ── */}
      <Text style={styles.sectionLabel}>APLIKASI</Text>
      <View style={styles.section}>
        {/* Mode gelap */}
        <TouchableOpacity
          style={styles.itemTouchable}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Atur mode gelap"
        >
          <View style={styles.itemLeft}>
            <Moon color={colors.inkSoft} size={18} strokeWidth={1.75} style={styles.itemIcon} />
            <Text style={typography.body}>Mode gelap</Text>
          </View>
          {/* Nilai saat ini — font mono sesuai §4 */}
          <Text style={[typography.meta, { marginRight: 4 }]}>Ikuti sistem</Text>
        </TouchableOpacity>

        <View style={styles.rule} />

        {/* Tentang aplikasi */}
        <TouchableOpacity
          style={styles.itemTouchable}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Tentang aplikasi"
        >
          <View style={styles.itemLeft}>
            <Info color={colors.inkSoft} size={18} strokeWidth={1.75} style={styles.itemIcon} />
            <Text style={typography.body}>Tentang aplikasi</Text>
          </View>
          <ChevronRight color={colors.inkSoft} size={18} strokeWidth={1.75} />
        </TouchableOpacity>

        <View style={styles.rule} />

        {/* Versi — nilai pakai font mono (design.md §4 "Meta") */}
        <View style={[styles.item, styles.itemLast]}>
          <View style={styles.itemLeft}>
            <Text style={typography.body}>Versi</Text>
          </View>
          <Text style={typography.meta}>1.0.0</Text>
        </View>
      </View>

      {/* Modal Input Webhook URL */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={modalStyles.overlay}>
          <View style={modalStyles.content}>
            <Text style={[typography.title, { marginBottom: 12 }]}>Google Sheets Webhook URL</Text>
            <Text style={[typography.body, { color: colors.inkSoft, marginBottom: 16 }]}>
              Masukkan URL Web App dari Google Apps Script yang sudah dideploy.
            </Text>
            <TextInput
              style={modalStyles.input}
              placeholder="https://script.google.com/macros/s/.../exec"
              placeholderTextColor={colors.inkSoft}
              value={inputUrl}
              onChangeText={setInputUrl}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={modalStyles.buttonRow}>
              <TouchableOpacity
                style={[modalStyles.btn, modalStyles.btnCancel]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={typography.label}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[modalStyles.btn, modalStyles.btnSave]}
                onPress={handleSaveUrl}
              >
                <Text style={[typography.label, { color: '#FFFFFF' }]}>Simpan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: colors.paper,
    borderRadius: 8,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.rule,
  },
  input: {
    backgroundColor: colors.paperRaised,
    borderWidth: 1,
    borderColor: colors.rule,
    borderRadius: 4,
    padding: 12,
    fontSize: 14,
    color: colors.ink,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  btn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 4,
  },
  btnCancel: {
    backgroundColor: colors.rule,
  },
  btnSave: {
    backgroundColor: colors.action,
  },
});


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
  screenTitle: {
    marginTop: 20,
    marginBottom: 24,
  },

  // Label seksi — ALL-CAPS hanya untuk label grup navigasi (bukan body text)
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.inkSoft,
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingLeft: 2,
  },

  // Blok seksi — permukaan statis radius 4px (design.md §5)
  section: {
    backgroundColor: colors.paperRaised,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.rule,
    marginBottom: 24,
    overflow: 'hidden',
  },

  // Item non-touchable
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  itemLast: {
    // tidak ada borderBottom di item terakhir
  },

  // Item touchable — tap target ≥44px (design.md §11)
  itemTouchable: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    minHeight: 44,
    paddingVertical: 12,
  },

  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemIcon: {
    marginRight: 12,
  },

  // Garis pemisah 1px — design.md §5 (bukan shadow)
  rule: {
    height: 1,
    backgroundColor: colors.rule,
    marginHorizontal: 0,
  },

  // Status chip — design.md §7.4
  // Pill shape (radius penuh) = pengecualian yang disengaja sebagai "penanda status"
  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  chipWarn: {
    backgroundColor: 'rgba(148, 107, 29, 0.10)',
  },
  chipSuccess: {
    backgroundColor: 'rgba(44, 107, 79, 0.10)',
  },
});
