import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, SafeAreaView, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTheme } from '../src/context/ThemeContext';
import { Spacing, FontSize, Radius } from '../src/constants/theme';
import { getAllCategories, insertCategory, updateCategory, deleteCategory, type Category } from '../src/db/database';

const PRESET_COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A29BFE', '#55EFC4', '#FDCB6E', '#74B9FF', '#E17055'];
const COMMON_EMOJIS = ['🍔', '🚗', '🛍️', '🎭', '💊', '🛒', '🏠', '📚', '✈️', '📱', '💅', '📦', '🎮', '☕', '🎵', '💼', '🐶', '🎁', '⚽', '🔧'];

export default function ManageCategoriesScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('📦');
  const [colorHex, setColorHex] = useState(PRESET_COLORS[0]);

  const loadData = useCallback(() => { setCategories(getAllCategories()); }, []);
  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const openAdd = () => { setEditingCategory(null); setName(''); setEmoji('📦'); setColorHex(PRESET_COLORS[0]); setShowModal(true); };
  const openEdit = (cat: Category) => { setEditingCategory(cat); setName(cat.name); setEmoji(cat.emoji); setColorHex(cat.colorHex); setShowModal(true); };

  const handleSave = () => {
    if (!name.trim()) return;
    if (editingCategory) { updateCategory({ ...editingCategory, name: name.trim(), emoji, colorHex }); }
    else { insertCategory({ name: name.trim(), emoji, isDefault: 0, colorHex }); }
    setShowModal(false); loadData();
  };

  const handleDelete = (cat: Category) => {
    if (cat.isDefault) { Alert.alert('Cannot Delete', 'Default categories cannot be deleted.'); return; }
    Alert.alert('Delete Category', `Delete "${cat.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { deleteCategory(cat.id); loadData(); } },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} testID="manage-categories-screen">
      <View style={styles.header}>
        <TouchableOpacity testID="back-btn" onPress={() => router.back()} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color={colors.text} /></TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Manage Categories</Text>
        <TouchableOpacity testID="add-category-btn" onPress={openAdd} style={[styles.addBtn, { backgroundColor: colors.primary }]}><Ionicons name="add" size={22} color="#FFF" /></TouchableOpacity>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {categories.map(cat => (
          <View key={cat.id} style={[styles.catRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.catIcon, { backgroundColor: cat.colorHex + '20' }]}><Text style={styles.catEmoji}>{cat.emoji}</Text></View>
            <View style={styles.catInfo}>
              <Text style={[styles.catName, { color: colors.text }]}>{cat.name}</Text>
              {cat.isDefault ? <Text style={[styles.catBadge, { color: colors.textSecondary }]}>Default</Text> : null}
            </View>
            <TouchableOpacity testID={`edit-cat-${cat.id}`} onPress={() => openEdit(cat)} style={styles.actionBtn}><Ionicons name="pencil" size={18} color={colors.primary} /></TouchableOpacity>
            {!cat.isDefault && (<TouchableOpacity testID={`delete-cat-${cat.id}`} onPress={() => handleDelete(cat)} style={styles.actionBtn}><Ionicons name="trash-outline" size={18} color={colors.danger} /></TouchableOpacity>)}
          </View>
        ))}
      </ScrollView>

      <Modal visible={showModal} transparent animationType="fade" testID="category-modal">
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{editingCategory ? 'Edit Category' : 'Add Category'}</Text>
            <TextInput testID="category-name-input" value={name} onChangeText={setName} placeholder="Category name" placeholderTextColor={colors.textSecondary} style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]} />
            <Text style={[styles.label, { color: colors.textSecondary }]}>Emoji</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.emojiRow}>
              {COMMON_EMOJIS.map(e => (<TouchableOpacity key={e} onPress={() => setEmoji(e)} style={[styles.emojiBtn, emoji === e && { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}><Text style={styles.emojiText}>{e}</Text></TouchableOpacity>))}
            </ScrollView>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Color</Text>
            <View style={styles.colorRow}>
              {PRESET_COLORS.map(c => (<TouchableOpacity key={c} onPress={() => setColorHex(c)} style={[styles.colorBtn, { backgroundColor: c }, colorHex === c && styles.colorBtnSelected]} />))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity testID="cancel-category-btn" onPress={() => setShowModal(false)} style={[styles.modalBtn, { backgroundColor: colors.surface }]}><Text style={[styles.modalBtnText, { color: colors.text }]}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity testID="save-category-btn" onPress={handleSave} disabled={!name.trim()} style={[styles.modalBtn, { backgroundColor: name.trim() ? colors.primary : colors.border }]}><Text style={[styles.modalBtnText, { color: '#FFF' }]}>Save</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontSize: FontSize.xl, fontWeight: '800', marginLeft: Spacing.sm },
  addBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingBottom: 40 },
  catRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderRadius: Radius.md, marginBottom: Spacing.sm, borderWidth: 0.5 },
  catIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  catEmoji: { fontSize: 20 },
  catInfo: { flex: 1, marginLeft: Spacing.md },
  catName: { fontSize: FontSize.base, fontWeight: '600' },
  catBadge: { fontSize: FontSize.xs, marginTop: 2 },
  actionBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  modal: { width: '100%', borderRadius: Radius.lg, padding: Spacing.xl },
  modalTitle: { fontSize: FontSize.xl, fontWeight: '800', marginBottom: Spacing.lg },
  input: { height: 48, borderRadius: Radius.md, borderWidth: 1, paddingHorizontal: Spacing.lg, fontSize: FontSize.base },
  label: { fontSize: FontSize.sm, fontWeight: '600', marginTop: Spacing.md, marginBottom: Spacing.sm },
  emojiRow: { maxHeight: 48 },
  emojiBtn: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.sm, borderWidth: 1.5, borderColor: 'transparent' },
  emojiText: { fontSize: 20 },
  colorRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  colorBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: 'transparent' },
  colorBtnSelected: { borderColor: '#000', borderWidth: 3 },
  modalActions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.xl },
  modalBtn: { flex: 1, height: 48, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  modalBtnText: { fontSize: FontSize.base, fontWeight: '700' },
});
