import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { spacing, fontSize, radius, shadow } from '../theme';

export default function AddTaskModal({ visible, onAdd, onClose }) {
  const { colors } = useTheme();
  const [title, setTitle] = useState('');

  const handleAdd = () => {
    if (!title.trim()) return;
    onAdd({ title: title.trim() });
    setTitle('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <TouchableOpacity activeOpacity={1}>
            <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
              <View style={[styles.handle, { backgroundColor: colors.border }]} />
              <Text style={[styles.heading, { color: colors.text }]}>New Task</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="What do you want to focus on?"
                placeholderTextColor={colors.textMuted}
                value={title}
                onChangeText={setTitle}
                autoFocus
                multiline
                maxLength={120}
              />
              <View style={styles.row}>
                <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: colors.background, borderColor: colors.border }]} onPress={onClose}>
                  <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.addBtn, { backgroundColor: colors.primary }, !title.trim() && styles.addBtnDisabled]}
                  onPress={handleAdd}
                  disabled={!title.trim()}
                >
                  <Text style={styles.addText}>Add Task</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.lg, paddingBottom: spacing.xl },
  handle: { width: 40, height: 4, borderRadius: radius.full, alignSelf: 'center', marginBottom: spacing.lg },
  heading: { fontSize: fontSize.xl, fontWeight: '700', marginBottom: spacing.md },
  input: { borderRadius: radius.md, padding: spacing.md, fontSize: fontSize.md, minHeight: 80, textAlignVertical: 'top', marginBottom: spacing.md, borderWidth: 1 },
  row: { flexDirection: 'row', gap: spacing.sm },
  cancelBtn: { flex: 1, padding: spacing.md, borderRadius: radius.md, alignItems: 'center', borderWidth: 1 },
  cancelText: { fontSize: fontSize.md, fontWeight: '500' },
  addBtn: { flex: 2, padding: spacing.md, borderRadius: radius.md, alignItems: 'center' },
  addBtnDisabled: { opacity: 0.4 },
  addText: { fontSize: fontSize.md, color: '#FFFFFF', fontWeight: '600' },
});