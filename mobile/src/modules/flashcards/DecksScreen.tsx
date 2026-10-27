import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { RootStackParamList } from '../../navigation/types';
import { Card } from '../../shared/components/Card';
import { Screen } from '../../shared/components/Screen';
import { colors, spacing } from '../../theme/theme';
import { DeckSummary, getDecks } from './repository';

export default function DecksScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [decks, setDecks] = useState<DeckSummary[]>([]);

  useFocusEffect(
    useCallback(() => {
      getDecks().then(setDecks);
    }, []),
  );

  return (
    <Screen>
      <Text style={styles.h1}>Decks</Text>
      {decks.map((d) => (
        <Pressable key={d.id} onPress={() => nav.navigate('FlashcardReview', { deckId: d.id, title: d.title })} accessibilityRole="button">
          <Card style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{d.title}</Text>
              <Text style={styles.muted}>{d.source === 'interview' ? 'From your mock interviews' : d.category} · {d.total} cards</Text>
            </View>
            <View style={[styles.badge, d.due === 0 && { backgroundColor: colors.line }]}>
              <Text style={[styles.badgeText, d.due === 0 && { color: colors.muted }]}>{d.due === 0 ? 'Done' : `${d.due} due`}</Text>
            </View>
          </Card>
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 28, fontWeight: '800', color: colors.ink },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  title: { fontWeight: '800', color: colors.ink, fontSize: 16 },
  muted: { color: colors.muted, marginTop: 2 },
  badge: { backgroundColor: colors.amberSoft, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999 },
  badgeText: { color: colors.ink, fontWeight: '700' },
});
