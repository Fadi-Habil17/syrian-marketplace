import { useState } from 'react';
import { Keyboard, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { themedStyles, useAppearance } from './appearance';
import { useSession } from './state/session';
import { readingStyle } from './theme';
import { Icon } from './icons';

export function Select({
  label,
  value,
  options,
  onChange,
  placeholder,
  disabled = false,
  loading = false,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const { locale } = useSession(),
    { colors, reduceMotion } = useAppearance(),
    s = useStyles();
  const ar = locale === 'ar';
  const selected = options.find((option) => option.value === value);
  return (
    <View style={s.field}>
      <Text style={[s.label, readingStyle(locale, true)]}>{label}</Text>
      <Pressable
        accessibilityRole="combobox"
        accessibilityLabel={label}
        accessibilityValue={{ text: selected?.label ?? placeholder ?? '' }}
        accessibilityState={{ expanded: open, disabled: disabled || loading }}
        disabled={disabled || loading}
        onPress={() => {
          Keyboard.dismiss();
          setOpen(true);
        }}
        style={({ pressed }) => [
          s.trigger,
          { flexDirection: ar ? 'row-reverse' : 'row' },
          (disabled || loading) && s.disabled,
          pressed && s.active,
        ]}
      >
        <Text
          numberOfLines={2}
          style={[s.value, readingStyle(locale), !selected && { color: colors.muted }]}
        >
          {loading
            ? ar
              ? 'جارٍ التحميل…'
              : 'Loading…'
            : (selected?.label ?? placeholder ?? (ar ? 'اختر…' : 'Choose…'))}
        </Text>
        <Icon name="chevron" color={colors.green} />
      </Pressable>
      <Modal
        visible={open}
        transparent
        animationType={reduceMotion ? 'none' : 'fade'}
        onRequestClose={() => setOpen(false)}
      >
        <View style={s.overlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            accessibilityRole="button"
            accessibilityLabel={ar ? 'إغلاق الخيارات' : 'Close options'}
            onPress={() => setOpen(false)}
          />
          <SafeAreaView style={s.panel} edges={['bottom']} accessibilityViewIsModal>
            <View style={[s.heading, { flexDirection: ar ? 'row-reverse' : 'row' }]}>
              <Text accessibilityRole="header" style={[s.title, readingStyle(locale, true)]}>
                {label}
              </Text>
              <Pressable
                style={s.close}
                accessibilityRole="button"
                accessibilityLabel={ar ? 'إغلاق' : 'Close'}
                onPress={() => setOpen(false)}
              >
                <Icon name="close" color={colors.ink} />
              </Pressable>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.options}>
              {options.map((option) => (
                <Pressable
                  key={option.value}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: option.value === value }}
                  onPress={() => {
                    setOpen(false);
                    onChange(option.value);
                  }}
                  style={({ pressed }) => [
                    s.option,
                    { flexDirection: ar ? 'row-reverse' : 'row' },
                    (option.value === value || pressed) && s.active,
                  ]}
                >
                  <Text style={[s.value, readingStyle(locale, option.value === value)]}>
                    {option.label}
                  </Text>
                  {option.value === value && <Icon name="check" color={colors.green} />}
                </Pressable>
              ))}
              {!options.length && (
                <Text style={[s.label, readingStyle(locale)]}>
                  {ar ? 'لا توجد خيارات متاحة' : 'No options available'}
                </Text>
              )}
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}
const useStyles = themedStyles((c) =>
  StyleSheet.create({
    field: { gap: 7, direction: 'ltr' },
    label: { color: c.ink, fontSize: 13, lineHeight: 22 },
    trigger: {
      minHeight: 50,
      borderWidth: 1,
      borderColor: c.control,
      borderRadius: 14,
      backgroundColor: c.paper,
      paddingHorizontal: 15,
      paddingVertical: 12,
      alignItems: 'center',
      gap: 12,
    },
    value: { flex: 1, color: c.ink, fontSize: 14, lineHeight: 23 },
    disabled: { opacity: 0.5 },
    active: { backgroundColor: c.mint, borderColor: c.green },
    overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: c.overlay },
    panel: {
      backgroundColor: c.paper,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: '75%',
      maxWidth: 600,
      width: '100%',
      alignSelf: 'center',
    },
    heading: {
      padding: 18,
      borderBottomWidth: 1,
      borderColor: c.line,
      alignItems: 'center',
      gap: 12,
    },
    title: { flex: 1, color: c.ink, fontSize: 18, lineHeight: 30 },
    close: {
      padding: 10,
      minHeight: 44,
      minWidth: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    options: { padding: 12, gap: 5, paddingBottom: 20 },
    option: { minHeight: 50, padding: 13, borderRadius: 12, alignItems: 'center', gap: 12 },
  }),
);
