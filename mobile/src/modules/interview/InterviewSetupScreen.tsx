import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ROLE_PRESETS } from '../../config';
import { RootStackParamList } from '../../navigation/types';
import { Button } from '../../shared/components/Button';
import { Card } from '../../shared/components/Card';
import { Screen } from '../../shared/components/Screen';
import { colors, radius, spacing } from '../../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'InterviewSetup'>;

export default function InterviewSetupScreen({ navigation }: Props) {
  const [role, setRole] = useState('');
  const [jd, setJd] = useState('');
  const canStart = role.trim().length >= 2;

  return (
    <Screen>
      <Text style={styles.h1}>Which role are you interviewing for?</Text>
      <View style={styles.chips}>
        {ROLE_PRESETS.map((r) => (
          <Pressable key={r} onPress={() => setRole(r)} style={[styles.chip, role === r && styles.chipOn]}>
            <Text style={[styles.chipText, role === r && { color: '#fff' }]}>{r}</Text>
          </Pressable>
        ))}
      </View>
      <Card style={{ gap: spacing.sm }}>
        <Text style={styles.label}>Job title</Text>
        <TextInput style={styles.input} value={role} onChangeText={setRole} placeholder="e.g. Senior Backend Engineer" placeholderTextColor={colors.muted} maxLength={120} />
        <Text style={styles.label}>Job description (optional)</Text>
        <TextInput
          style={[styles.input, { height: 160, textAlignVertical: 'top' }]}
          value={jd}
          onChangeText={setJd}
          multiline
          maxLength={6000}
          placeholder="Paste the posting so questions match the real requirements."
          placeholderTextColor={colors.muted}
        />
      </Card>
      <Button title="Start 5-question interview" disabled={!canStart} onPress={() => navigation.replace('InterviewSession', { roleTitle: role.trim(), jobDescription: jd.trim() || undefined })} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 24, fontWeight: '800', color: colors.ink },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.ink, fontWeight: '600' },
  label: { fontWeight: '700', color: colors.ink },
  input: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, padding: 12, fontSize: 16, color: colors.ink, backgroundColor: colors.bg },
});
