import React from 'react';
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, radius } from '../../theme/theme';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
interface Props {
  title: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

const bg: Record<Variant, string> = { primary: colors.primary, secondary: colors.primarySoft, danger: colors.danger, ghost: 'transparent' };
const fg: Record<Variant, string> = { primary: '#fff', secondary: colors.primary, danger: '#fff', ghost: colors.muted };

export function Button({ title, onPress, variant = 'primary', loading, disabled, style }: Props) {
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [styles.base, { backgroundColor: bg[variant], opacity: inactive ? 0.5 : pressed ? 0.85 : 1 }, style]}
    >
      {loading ? <ActivityIndicator color={fg[variant]} /> : <Text style={[styles.text, { color: fg[variant] }]}>{title}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { minHeight: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  text: { fontSize: 16, fontWeight: '700' },
});
