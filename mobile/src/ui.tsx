import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { useSession } from './state/session';
import { MobileShell } from './shell';
import { colors, design, readingStyle } from './theme';

export { colors } from './theme';

export function Page({
  title,
  backLabel,
  children,
}: {
  title?: string;
  backLabel?: string;
  children: ReactNode;
}) {
  const { locale } = useSession();
  const ar = locale === 'ar';
  const label = backLabel ?? (ar ? 'رجوع' : 'Back');
  return (
    <MobileShell>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={label}
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        style={s.back}
      >
        <Image source={design.arrow} style={[s.arrow, ar && { transform: [{ scaleX: -1 }] }]} />
        <Text style={[s.backLabel, readingStyle(locale, true)]}>{label}</Text>
      </Pressable>
      {title && <Heading>{title}</Heading>}
      {children}
    </MobileShell>
  );
}

export function Heading({ children, small = false }: { children: ReactNode; small?: boolean }) {
  const { locale } = useSession();
  const androidArabic = Platform.OS === 'android' && locale === 'ar';
  return (
    <Text
      accessibilityRole="header"
      style={[
        s.title,
        small && s.section,
        androidArabic && (small ? s.arabicSection : s.arabicTitle),
        readingStyle(locale, true),
      ]}
    >
      {children}
    </Text>
  );
}

export function Copy({
  children,
  variant = 'body',
  style,
}: {
  children: ReactNode;
  variant?: 'body' | 'muted' | 'label' | 'price';
  style?: StyleProp<TextStyle>;
}) {
  const { locale } = useSession();
  return (
    <Text
      style={[
        s.text,
        variant !== 'body' && s[variant],
        readingStyle(locale, variant === 'label' || variant === 'price'),
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function Button({
  title,
  onPress,
  disabled = false,
  variant = 'primary',
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'outline' | 'link';
}) {
  const { locale } = useSession();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        variant === 'outline' && s.outline,
        variant === 'link' && s.link,
        (pressed || disabled) && s.dimmed,
      ]}
    >
      <Text
        style={[readingStyle(locale, true), s.buttonText, variant !== 'primary' && s.greenText]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

export function Field({ label, style, multiline, ...props }: TextInputProps & { label: string }) {
  const { locale } = useSession();
  return (
    <View style={s.field}>
      <Copy variant="label">{label}</Copy>
      <TextInput
        {...props}
        multiline={multiline}
        accessibilityLabel={label}
        style={[s.input, readingStyle(locale), multiline && s.multiline, style]}
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
      <Text accessibilityRole="alert" style={s.error}>
        {message}
      </Text>
      {retry && <Button title="إعادة المحاولة / Retry" onPress={retry} />}
    </Card>
  );
}

const s = StyleSheet.create({
  back: {
    minHeight: 36,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  arrow: { width: 16, height: 16 },
  backLabel: { fontSize: 13, lineHeight: 20, color: colors.green },
  title: { fontSize: 28, lineHeight: 38, color: colors.ink },
  section: { fontSize: 20, lineHeight: 28 },
  arabicTitle: { lineHeight: 42 },
  arabicSection: { lineHeight: 30 },
  text: { color: colors.ink, fontSize: 14, lineHeight: 22 },
  muted: { color: colors.muted, fontSize: 13, lineHeight: 21 },
  label: { fontSize: 13, lineHeight: 20 },
  price: { color: colors.green, fontSize: 16, lineHeight: 24 },
  card: {
    padding: 14,
    gap: 12,
    backgroundColor: colors.paper,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
  },
  button: {
    minHeight: 46,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: colors.green,
    borderRadius: 11,
    justifyContent: 'center',
  },
  outline: { backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line },
  link: { backgroundColor: 'transparent', paddingHorizontal: 4 },
  dimmed: { opacity: 0.55 },
  buttonText: { color: colors.paper, textAlign: 'center', fontSize: 14, lineHeight: 22 },
  greenText: { color: colors.green },
  field: { gap: 4 },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 11,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.paper,
    color: colors.ink,
    fontSize: 15,
  },
  multiline: { minHeight: 76, textAlignVertical: 'top' },
  error: { color: '#9b3429' },
});
