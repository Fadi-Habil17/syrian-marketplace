import { useState } from 'react';
import { Keyboard, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAppearance, themedStyles, type AppearancePreference } from './appearance';
import { readingStyle } from './theme';
const choices = [
  ['light', 'فاتح', 'Light', '☼'],
  ['dark', 'داكن', 'Dark', '☾'],
  ['system', 'حسب الجهاز', 'System', '◐'],
] as const;
export function AppearancePicker({ locale }: { locale: 'ar' | 'en' }) {
  const { preference, setPreference, persistenceError } = useAppearance(),
    s = useStyles();
  const [open, setOpen] = useState(false),
    [draft, setDraft] = useState<AppearancePreference>(preference);
  const ar = locale === 'ar',
    current = choices.find((c) => c[0] === preference)!;
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={(ar ? 'المظهر: ' : 'Appearance: ') + current[ar ? 1 : 2]}
        onPress={() => {
          Keyboard.dismiss();
          setDraft(preference);
          setOpen(true);
        }}
        style={s.trigger}
      >
        <Text style={s.icon}>{current[3]}</Text>
      </Pressable>
      <Modal visible={open} transparent animationType="none" onRequestClose={() => setOpen(false)}>
        <View style={s.overlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setOpen(false)}
            accessibilityRole="button"
            accessibilityLabel={ar ? 'إغلاق المظهر' : 'Close appearance'}
          />
          <View style={s.panel} accessibilityViewIsModal>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text accessibilityRole="header" style={[s.heading, readingStyle(locale, true)]}>
                {ar ? 'على ذوقك' : 'Make yourself comfortable'}
              </Text>
              <Text style={[s.copy, readingStyle(locale)]}>
                {ar
                  ? 'نفس روح الحارة، بالضو اللي بناسبك.'
                  : 'The same neighbourhood spirit, in your kind of light.'}
              </Text>
              <View accessibilityRole="radiogroup">
                {choices.map(([value, a, en, icon]) => (
                  <Pressable
                    key={value}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: draft === value }}
                    style={[s.option, draft === value && s.selected]}
                    onPress={() => setDraft(value)}
                  >
                    <Text style={s.icon}>{icon}</Text>
                    <Text style={[s.label, readingStyle(locale, true)]}>{ar ? a : en}</Text>
                    <Text style={s.check}>{draft === value ? '✓' : ''}</Text>
                  </Pressable>
                ))}
              </View>
              {persistenceError && (
                <Text accessibilityRole="alert" style={[s.copy, readingStyle(locale)]}>
                  {ar
                    ? 'تعذّر حفظ المظهر. التغيير متاح لهذه الجلسة.'
                    : 'Preference could not be saved. Your change applies for this visit.'}
                </Text>
              )}
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setOpen(false);
                  requestAnimationFrame(() => {
                    void setPreference(draft);
                  });
                }}
                style={s.done}
              >
                <Text style={[s.doneText, readingStyle(locale, true)]}>{ar ? 'تمام' : 'Done'}</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}
const useStyles = themedStyles((colors) =>
  StyleSheet.create({
    trigger: {
      minHeight: 44,
      minWidth: 44,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 10,
    },
    icon: { fontSize: 22, color: colors.green },
    overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', padding: 24 },
    panel: {
      backgroundColor: colors.paper,
      borderRadius: 22,
      padding: 24,
      maxHeight: '85%',
      width: '100%',
      maxWidth: 460,
      alignSelf: 'center',
    },
    heading: { fontSize: 22, lineHeight: 34, color: colors.ink, marginBottom: 8 },
    copy: { fontSize: 14, lineHeight: 24, color: colors.muted, marginBottom: 20 },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 12,
      marginBottom: 10,
      minHeight: 60,
    },
    selected: { backgroundColor: colors.mint, borderColor: colors.green },
    label: { fontSize: 16, color: colors.ink, flex: 1 },
    check: { color: colors.green, fontSize: 20 },
    done: { backgroundColor: colors.green, borderRadius: 12, padding: 14, marginTop: 12 },
    doneText: { color: colors.onAction, textAlign: 'center', fontSize: 16 },
  }),
);
