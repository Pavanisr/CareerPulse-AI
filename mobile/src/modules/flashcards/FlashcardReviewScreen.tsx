import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { RootStackParamList } from '../../navigation/types';
import { Button } from '../../shared/components/Button';
import { ProgressBar } from '../../shared/components/ProgressBar';
import { Screen } from '../../shared/components/Screen';
import { colors, radius, spacing } from '../../theme/theme';
import { Card, getDueCards, reviewCard } from './repository';
import { formatInterval, previewIntervals, Rating } from './sm2';

type Props = NativeStackScreenProps<RootStackParamList, 'FlashcardReview'>;

const RATINGS: { rating: Rating; label: string; color: string }[] = [
  { rating: 'again', label: 'Again', color: colors.danger },
  { rating: 'hard', label: 'Hard', color: colors.amber },
  { rating: 'good', label: 'Good', color: colors.primary },
  { rating: 'easy', label: 'Easy', color: colors.good },
];

export default function FlashcardReviewScreen({ route, navigation }: Props) {
  const deckId = route.params?.deckId;
  const [queue, setQueue] = useState<Card[]>([]);
  const [index, setIndex] = useState(0);
  const [initialCount, setInitialCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const flip = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    navigation.setOptions({ title: route.params?.title ?? 'Review' });
    getDueCards({ deckId, limit: 50 }).then((cards) => {
      setQueue(cards);
      setInitialCount(cards.length);
      setLoading(false);
    });
  }, [deckId, navigation, route.params?.title]);

  const card = queue[index];

  const toggle = useCallback(() => {
    Animated.spring(flip, { toValue: flipped ? 0 : 1, friction: 8, tension: 12, useNativeDriver: true }).start();
    setFlipped((f) => !f);
  }, [flip, flipped]);

  const rate = async (rating: Rating) => {
    if (!card || saving) return;
    setSaving(true);
    try {
      await reviewCard(card.id, rating);
      // A failed card comes back at the end of this session; the SM-2 schedule still moves it to tomorrow.
      if (rating === 'again') setQueue((q) => [...q, card]);
      flip.setValue(0);
      setFlipped(false);
      setIndex((i) => i + 1);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Screen scroll={false}><ActivityIndicator style={{ flex: 1 }} color={colors.primary} /></Screen>;

  if (!card) {
    return (
      <Screen>
        <View style={styles.done}>
          <Text style={styles.doneTitle}>{initialCount === 0 ? 'Nothing due right now' : 'Session complete'}</Text>
          <Text style={styles.muted}>
            {initialCount === 0 ? 'Every card is scheduled for a later day. Try a mock interview to find new gaps.' : `You reviewed ${initialCount} card${initialCount === 1 ? '' : 's'}. Your streak is updated.`}
          </Text>
          <Button title="Back to dashboard" onPress={() => navigation.popToTop()} />
        </View>
      </Screen>
    );
  }

  const preview = previewIntervals(card);
  const frontRot = flip.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backRot = flip.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });

  return (
    <Screen scroll={false}>
      <View style={{ padding: spacing.md, gap: spacing.sm }}>
        <Text style={styles.muted}>{card.deckTitle} · {Math.min(index + 1, queue.length)} of {queue.length}</Text>
        <ProgressBar value={index / queue.length} />
      </View>

      <Pressable style={styles.stage} onPress={toggle} accessibilityRole="button" accessibilityLabel={flipped ? 'Show question' : 'Show answer'}>
        <Animated.View style={[styles.face, { transform: [{ perspective: 1000 }, { rotateY: frontRot }] }]}>
          <Text style={styles.tag}>Question</Text>
          <Text style={styles.qText}>{card.question}</Text>
          <Text style={styles.tapHint}>Tap to reveal the answer</Text>
        </Animated.View>
        <Animated.View style={[styles.face, styles.back, { transform: [{ perspective: 1000 }, { rotateY: backRot }] }]}>
          <Text style={[styles.tag, { color: colors.primary }]}>Answer</Text>
          <Text style={styles.aText}>{card.answer}</Text>
          {card.topic ? <Text style={styles.tapHint}>Weak topic: {card.topic}</Text> : null}
        </Animated.View>
      </Pressable>

      <View style={styles.ratings}>
        {flipped ? (
          RATINGS.map(({ rating, label, color }) => (
            <Pressable key={rating} disabled={saving} onPress={() => rate(rating)} style={[styles.rateBtn, { backgroundColor: color, opacity: saving ? 0.6 : 1 }]} accessibilityRole="button">
              <Text style={styles.rateLabel}>{label}</Text>
              <Text style={styles.rateSub}>{rating === 'again' ? 'Today' : formatInterval(preview[rating])}</Text>
            </Pressable>
          ))
        ) : (
          <Button title="Show answer" onPress={toggle} style={{ flex: 1 }} />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  muted: { color: colors.muted },
  stage: { flex: 1, marginHorizontal: spacing.md },
  face: {
    ...StyleSheet.absoluteFillObject,
    backfaceVisibility: 'hidden',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.lg,
    justifyContent: 'center',
    gap: spacing.md,
  },
  back: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  tag: { color: colors.muted, fontWeight: '700' },
  qText: { fontSize: 24, lineHeight: 32, fontWeight: '800', color: colors.ink },
  aText: { fontSize: 20, lineHeight: 29, color: colors.ink },
  tapHint: { color: colors.muted, fontSize: 13 },
  ratings: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md },
  rateBtn: { flex: 1, minHeight: 60, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  rateLabel: { color: '#fff', fontWeight: '800', fontSize: 16 },
  rateSub: { color: '#fff', opacity: 0.9, fontSize: 12 },
  done: { padding: spacing.lg, gap: spacing.md, marginTop: spacing.xl },
  doneTitle: { fontSize: 26, fontWeight: '800', color: colors.ink },
});
