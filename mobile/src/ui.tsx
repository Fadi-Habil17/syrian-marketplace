import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { useSession } from './state/session';
export const colors = {
  ink: '#192f2a',
  green: '#10554c',
  cream: '#faf6ed',
  muted: '#486158',
  line: '#d8dfd4',
  gold: '#e8b665',
};
export function Page({ title, children }: { title: string; children: ReactNode }) {
  const { locale } = useSession();
  return (
    <SafeAreaView style={s.screen}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[s.page, { direction: locale === 'ar' ? 'rtl' : 'ltr' }]}
      >
        <Button
          title={locale === 'ar' ? 'رجوع' : 'Back'}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        />
        <Text accessibilityRole="header" style={s.title}>
          {title}
        </Text>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
export function Copy({ children }: { children: ReactNode }) {
  const { locale } = useSession();
  return (
    <Text
      style={[
        s.text,
        {
          textAlign: locale === 'ar' ? 'right' : 'left',
          writingDirection: locale === 'ar' ? 'rtl' : 'ltr',
        },
      ]}
    >
      {children}
    </Text>
  );
}
export function Card({ children }: { children: ReactNode }) {
  return <View style={s.card}>{children}</View>;
}
export function Button({
  title,
  onPress,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[s.button, disabled && { opacity: 0.5 }]}
    >
      <Text style={s.buttonText}>{title}</Text>
    </Pressable>
  );
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  const { locale } = useSession();
  return (
    <View style={{ gap: 6 }}>
      <Copy>{label}</Copy>
      <TextInput
        {...props}
        accessibilityLabel={label}
        style={[s.input, { textAlign: locale === 'ar' ? 'right' : 'left' }]}
        placeholderTextColor={colors.muted}
      />
    </View>
  );
}
export function Busy() {
  return <ActivityIndicator accessibilityLabel="Loading / جار التحميل" color={colors.green} />;
}
export function Failure({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <Card>
      <Text accessibilityRole="alert" style={{ color: '#9b3429' }}>
        {message}
      </Text>
      {retry && <Button title="إعادة المحاولة / Retry" onPress={retry} />}
    </Card>
  );
}
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  page: { padding: 22, gap: 16, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '700', color: colors.ink, textAlign: 'auto' },
  text: {
    color: colors.ink,
    fontFamily: 'NotoSansArabic_400Regular',
    fontSize: 14,
    lineHeight: 25,
  },
  card: {
    padding: 18,
    gap: 12,
    backgroundColor: 'white',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
  },
  button: {
    minHeight: 48,
    padding: 13,
    backgroundColor: colors.green,
    borderRadius: 12,
    justifyContent: 'center',
  },
  buttonText: { color: 'white', textAlign: 'center', fontSize: 16, fontWeight: '600' },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: 12,
    backgroundColor: 'white',
    color: colors.ink,
    fontSize: 16,
  },
});
