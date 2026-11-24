import { Switch, StyleSheet, Text, View } from 'react-native';
import { useAppearance, themedStyles } from './appearance';
import { readingStyle } from './theme';
import { Icon } from './icons';
export function AppearancePicker({ locale }: { locale: 'ar' | 'en' }) {
  const { mode, colors, setPreference, persistenceError } = useAppearance(),
    s = useStyles();
  const ar = locale === 'ar';
  return (
    <View style={s.container}>
      <View style={[s.row, { flexDirection: ar ? 'row-reverse' : 'row' }]}>
        <Icon name={mode === 'dark' ? 'moon' : 'sun'} color={colors.green} />
        <Text style={[s.label, readingStyle(locale, true)]}>
          {ar ? 'الوضع الداكن' : 'Dark mode'}
        </Text>
        <Switch
          accessibilityLabel={ar ? 'الوضع الداكن' : 'Dark mode'}
          value={mode === 'dark'}
          onValueChange={(dark) => void setPreference(dark ? 'dark' : 'light')}
          trackColor={{ false: colors.line, true: colors.green }}
          thumbColor={mode === 'dark' ? colors.onAction : colors.paper}
        />
      </View>
      {persistenceError && (
        <Text accessibilityRole="alert" style={[s.notice, readingStyle(locale)]}>
          {ar
            ? 'تغيّر المظهر لهذه الزيارة؛ تعذّر حفظ التفضيل.'
            : 'Appearance changed for this visit; preference could not be saved.'}
        </Text>
      )}
    </View>
  );
}
const useStyles = themedStyles((c) =>
  StyleSheet.create({
    container: { gap: 8 },
    row: {
      alignItems: 'center',
      gap: 12,
      minHeight: 52,
      borderTopWidth: 1,
      borderColor: c.line,
      paddingTop: 12,
    },
    label: { flex: 1, fontSize: 14, lineHeight: 24, color: c.ink },
    notice: { color: c.muted, fontSize: 12, lineHeight: 20 },
  }),
);
