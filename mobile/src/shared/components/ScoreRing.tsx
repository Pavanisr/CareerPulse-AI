import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, scoreColor } from '../../theme/theme';

/** Dependency-free score badge: a thick ring with the number inside. */
export function ScoreRing({ score, size = 140, label }: { score: number; size?: number; label?: string }) {
  const c = scoreColor(score);
  return (
    <View style={[styles.ring, { width: size, height: size, borderRadius: size / 2, borderColor: c }]}>
      <Text style={[styles.num, { fontSize: size * 0.34, color: colors.ink }]}>{Math.round(score)}</Text>
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}
const styles = StyleSheet.create({
  ring: { borderWidth: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  num: { fontWeight: '800' },
  label: { color: colors.muted, fontSize: 12, marginTop: -2 },
});
