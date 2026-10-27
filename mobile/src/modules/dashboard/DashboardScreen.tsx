import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { RootStackParamList } from '../../navigation/types';
import { Button } from '../../shared/components/Button';
import { Card } from '../../shared/components/Card';
import { ProgressBar } from '../../shared/components/ProgressBar';
import { Screen } from '../../shared/components/Screen';
import { ScoreRing } from '../../shared/components/ScoreRing';
import { colors, scoreColor, spacing } from '../../theme/theme';
import { DashboardData, loadDashboard } from './dashboardService';

export default function DashboardScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [data, setData] = useState<DashboardData | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadDashboard().then((d) => active && setData(d));
      return () => {
        active = false;
      };
    }, []),
  );

  if (!data) return <Screen scroll={false}><ActivityIndicator style={{ flex: 1 }} color={colors.primary} /></Screen>;
  const { readiness, stats, streak, recent, weakTopics } = data;

  return (
    <Screen>
      <Text style={styles.h1}>Career readiness</Text>

      <Card style={styles.hero}>
        <ScoreRing score={readiness} label="ready" />
        <View style={{ flex: 1, gap: spacing.sm }}>
          <Text style={styles.muted}>Interview performance</Text>
          <ProgressBar value={recent.length ? recent.reduce((s, r) => s + r.score, 0) / recent.length / 100 : 0} color={colors.primary} />
          <Text style={styles.muted}>Flashcard mastery</Text>
          <ProgressBar value={stats.mastery} color={colors.amber} />
        </View>
      </Card>

      <View style={styles.row}>
        <Card style={styles.stat}>
          <Text style={styles.statNum}>{streak.current}</Text>
          <Text style={styles.muted}>day streak</Text>
          <Text style={styles.tiny}>{streak.studiedToday ? 'Studied today' : streak.current > 0 ? 'Review today to keep it' : 'Start one today'}</Text>
        </Card>
        <Card style={styles.stat}>
          <Text style={[styles.statNum, stats.due > 0 && { color: colors.amber }]}>{stats.due}</Text>
          <Text style={styles.muted}>cards due</Text>
          <Text style={styles.tiny}>{stats.reviewedToday} reviewed today</Text>
        </Card>
      </View>

      <Button title={stats.due > 0 ? `Review ${stats.due} due card${stats.due === 1 ? '' : 's'}` : 'No cards due'} disabled={stats.due === 0} onPress={() => nav.navigate('FlashcardReview', {})} />
      <Button title="Start mock interview" variant="secondary" onPress={() => nav.navigate('InterviewSetup')} />

      <Card style={{ gap: spacing.sm }}>
        <Text style={styles.h2}>Weak topics</Text>
        {weakTopics.length === 0 ? (
          <Text style={styles.muted}>Complete a mock interview and your gaps will appear here, with flashcards generated for each.</Text>
        ) : (
          weakTopics.map((w) => (
            <Text key={w.topic} style={{ color: colors.ink }}>
              {w.topic}{w.count > 1 ? `  (seen in ${w.count} interviews)` : ''}
            </Text>
          ))
        )}
      </Card>

      {recent.length > 0 && (
        <Card style={{ gap: spacing.sm }}>
          <Text style={styles.h2}>Recent interviews</Text>
          {recent.map((r) => (
            <View key={r.id} style={styles.recent}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.ink, fontWeight: '600' }}>{r.roleTitle}</Text>
                <Text style={styles.tiny}>{new Date(r.sessionDate).toLocaleDateString()}</Text>
              </View>
              <Text style={{ fontWeight: '800', fontSize: 18, color: scoreColor(r.score) }}>{r.score}</Text>
            </View>
          ))}
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 28, fontWeight: '800', color: colors.ink },
  h2: { fontSize: 17, fontWeight: '800', color: colors.ink },
  hero: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  row: { flexDirection: 'row', gap: spacing.md },
  stat: { flex: 1, gap: 2 },
  statNum: { fontSize: 36, fontWeight: '800', color: colors.ink },
  muted: { color: colors.muted },
  tiny: { color: colors.muted, fontSize: 12 },
  recent: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
