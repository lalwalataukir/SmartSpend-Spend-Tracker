import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Alert, TextInput, Modal, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { Spacing, FontSize, Radius } from '../../src/constants/theme';
import { PAYMENT_METHODS } from '../../src/constants/categories';
import { deleteAllData, getAllTransactions, getAllCategories } from '../../src/db/database';
import { formatDateForCSV, formatTimeForCSV } from '../../src/utils/format';

export default function SettingsScreen() {
  const { colors, themeMode, setThemeMode, defaultPaymentMethod, setDefaultPaymentMethod } = useTheme();
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const themeModes = [
    { key: 'system' as const, label: 'System', icon: 'phone-portrait-outline' as const },
    { key: 'light' as const, label: 'Light', icon: 'sunny-outline' as const },
    { key: 'dark' as const, label: 'Dark', icon: 'moon-outline' as const },
  ];

  const handleExportCSV = async () => {
    try {
      const transactions = getAllTransactions();
      const categories = getAllCategories();
      const catMap = new Map(categories.map(c => [c.id, c.name]));
      let csv = 'Date,Time,Amount,Category,Note,Payment Method,Recurring\n';
      for (const tx of transactions) {
        const catName = catMap.get(tx.categoryId) || 'Unknown';
        csv += `${formatDateForCSV(tx.date)},${formatTimeForCSV(tx.date)},${tx.amount},${catName},"${(tx.note || '').replace(/"/g, '""')}",${tx.paymentMethod},${tx.isRecurring ? 'Yes' : 'No'}\n`;
      }
      await Share.share({ message: csv, title: `SpendSmart_Export_${new Date().toISOString().slice(0, 7)}.csv` });
    } catch (error) { Alert.alert('Export Error', 'Failed to export data.'); }
  };

  const handleDeleteAll = async () => {
    if (deleteConfirmText === 'DELETE') {
      await deleteAllData();
      setShowDeleteModal(false);
      setDeleteConfirmText('');
      Alert.alert('Done', 'All data has been deleted.');
    }
  };

  const SettingsItem = ({ icon, label, onPress, rightContent, destructive }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress?: () => void; rightContent?: React.ReactNode; destructive?: boolean }) => (
    <TouchableOpacity testID={`settings-${label.toLowerCase().replace(/\s/g, '-')}`} onPress={onPress} style={[styles.settingsItem, { borderBottomColor: colors.border }]} activeOpacity={onPress ? 0.6 : 1}>
      <View style={[styles.settingsIconBg, { backgroundColor: destructive ? colors.danger + '15' : colors.primary + '10' }]}>
        <Ionicons name={icon} size={20} color={destructive ? colors.danger : colors.primary} />
      </View>
      <Text style={[styles.settingsLabel, { color: destructive ? colors.danger : colors.text }]}>{label}</Text>
      <View style={styles.settingsRight}>{rightContent || <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />}</View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} testID="settings-screen">
      <View style={styles.header}><Text style={[styles.title, { color: colors.text }]}>Settings</Text></View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>GENERAL</Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardLabel, { color: colors.text }]}>App Theme</Text>
          <View style={styles.themeRow}>
            {themeModes.map(t => (
              <TouchableOpacity key={t.key} testID={`theme-${t.key}`} onPress={() => setThemeMode(t.key)} style={[styles.themeChip, { borderColor: themeMode === t.key ? colors.primary : colors.border }, themeMode === t.key && { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name={t.icon} size={18} color={themeMode === t.key ? colors.primary : colors.textSecondary} />
                <Text style={[styles.themeText, { color: themeMode === t.key ? colors.primary : colors.text }]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.cardLabel, { color: colors.text, marginTop: Spacing.lg }]}>Default Payment Method</Text>
          <View style={styles.themeRow}>
            {PAYMENT_METHODS.map(method => (
              <TouchableOpacity key={method} testID={`default-payment-${method}`} onPress={() => setDefaultPaymentMethod(method)} style={[styles.themeChip, { borderColor: defaultPaymentMethod === method ? colors.primary : colors.border }, defaultPaymentMethod === method && { backgroundColor: colors.primary }]}>
                <Text style={[styles.themeText, { color: defaultPaymentMethod === method ? '#FFF' : colors.text, fontWeight: defaultPaymentMethod === method ? '700' : '400' }]}>{method}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>CATEGORIES & BUDGETS</Text>
        <View style={[styles.settingsGroup, { backgroundColor: colors.surface }]}>
          <SettingsItem icon="grid-outline" label="Manage Categories" onPress={() => router.push('/manage-categories')} />
          <SettingsItem icon="wallet-outline" label="Manage Budgets" onPress={() => router.push('/manage-budgets')} />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>DATA</Text>
        <View style={[styles.settingsGroup, { backgroundColor: colors.surface }]}>
          <SettingsItem icon="download-outline" label="Export as CSV" onPress={handleExportCSV} />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ABOUT</Text>
        <View style={[styles.settingsGroup, { backgroundColor: colors.surface }]}>
          <SettingsItem icon="information-circle-outline" label="App Version" rightContent={<Text style={[styles.versionText, { color: colors.textSecondary }]}>1.0.0</Text>} />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.danger }]}>DANGER ZONE</Text>
        <View style={[styles.settingsGroup, { backgroundColor: colors.surface }]}>
          <SettingsItem icon="trash-outline" label="Delete All Data" destructive onPress={() => setShowDeleteModal(true)} />
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={showDeleteModal} transparent animationType="fade" testID="delete-modal">
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: colors.background }]}>
            <Ionicons name="warning" size={40} color={colors.danger} />
            <Text style={[styles.modalTitle, { color: colors.text }]}>Delete All Data?</Text>
            <Text style={[styles.modalDesc, { color: colors.textSecondary }]}>This action cannot be undone. All transactions, budgets, and custom categories will be permanently deleted.</Text>
            <Text style={[styles.modalDesc, { color: colors.text, fontWeight: '600' }]}>Type DELETE to confirm:</Text>
            <TextInput testID="delete-confirm-input" value={deleteConfirmText} onChangeText={setDeleteConfirmText} placeholder="Type DELETE" placeholderTextColor={colors.textSecondary} style={[styles.modalInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]} autoCapitalize="characters" />
            <View style={styles.modalActions}>
              <TouchableOpacity testID="cancel-delete-btn" onPress={() => { setShowDeleteModal(false); setDeleteConfirmText(''); }} style={[styles.modalBtn, { backgroundColor: colors.surface }]}><Text style={[styles.modalBtnText, { color: colors.text }]}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity testID="confirm-delete-btn" onPress={handleDeleteAll} disabled={deleteConfirmText !== 'DELETE'} style={[styles.modalBtn, { backgroundColor: deleteConfirmText === 'DELETE' ? colors.danger : colors.border }]}><Text style={[styles.modalBtnText, { color: '#FFF' }]}>Delete</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.sm },
  title: { fontSize: FontSize.xxl, fontWeight: '800' },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingBottom: 100 },
  sectionTitle: { fontSize: FontSize.xs, fontWeight: '700', letterSpacing: 1, marginTop: Spacing.xl, marginBottom: Spacing.sm, paddingHorizontal: Spacing.xs },
  card: { borderRadius: Radius.lg, padding: Spacing.lg },
  cardLabel: { fontSize: FontSize.base, fontWeight: '600', marginBottom: Spacing.sm },
  themeRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  themeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.full, borderWidth: 1.5 },
  themeText: { fontSize: FontSize.sm },
  settingsGroup: { borderRadius: Radius.lg, overflow: 'hidden' },
  settingsItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg, borderBottomWidth: 0.5 },
  settingsIconBg: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  settingsLabel: { flex: 1, marginLeft: Spacing.md, fontSize: FontSize.base, fontWeight: '500' },
  settingsRight: { marginLeft: Spacing.sm },
  versionText: { fontSize: FontSize.sm },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  modal: { width: '100%', borderRadius: Radius.lg, padding: Spacing.xl, alignItems: 'center' },
  modalTitle: { fontSize: FontSize.xl, fontWeight: '800', marginTop: Spacing.md },
  modalDesc: { fontSize: FontSize.sm, textAlign: 'center', marginTop: Spacing.sm, lineHeight: 20 },
  modalInput: { width: '100%', height: 48, borderRadius: Radius.md, borderWidth: 1, paddingHorizontal: Spacing.lg, fontSize: FontSize.base, marginTop: Spacing.md, textAlign: 'center' },
  modalActions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg, width: '100%' },
  modalBtn: { flex: 1, height: 48, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  modalBtnText: { fontSize: FontSize.base, fontWeight: '700' },
});
