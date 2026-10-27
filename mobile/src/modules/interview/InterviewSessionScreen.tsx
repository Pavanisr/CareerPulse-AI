import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Speech from 'expo-speech';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { INTERVIEW_QUESTION_COUNT } from '../../config';
import { RootStackParamList } from '../../navigation/types';
import { Button } from '../../shared/components/Button';
import { Card } from '../../shared/components/Card';
import { ProgressBar } from '../../shared/components/ProgressBar';
import { ScoreRing } from '../../shared/components/ScoreRing';
import { colors, radius, scoreColor, spacing } from '../../theme/theme';
import { startInterview, submitAnswer, summarizeInterview } from './api';
import { CompletedTurn, InterviewQuestion, InterviewSummary, TurnEvaluation } from './types';
import { syncInterviewResult } from './weaknessSync';

type Props = NativeStackScreenProps<RootStackParamList, 'InterviewSession'>;
const TOTAL = INTERVIEW_QUESTION_COUNT;

export default function InterviewSessionScreen({ route, navigation }: Props) {
  const { roleTitle, jobDescription } = route.params;

  const [question, setQuestion] = useState<InterviewQuestion | null>(null);
  const [number, setNumber] = useState(1);
  const [answer, setAnswer] = useState('');
  const [turns, setTurns] = useState<CompletedTurn[]>([]);
  const [busy, setBusy] = useState(true);
  const [busyLabel, setBusyLabel] = useState('Preparing your interviewer…');
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ evaluation: TurnEvaluation; next: InterviewQuestion | null } | null>(null);
  const [result, setResult] = useState<{ summary: InterviewSummary; newCards: number } | null>(null);
  const [readAloud, setReadAloud] = useState(true);
  const scrollRef = useRef<ScrollView>(null);
  const retryKind = useRef<'start' | 'send' | 'finish'>('start');

  const speak = useCallback(
    (text: string) => {
      Speech.stop();
      if (readAloud) Speech.speak(text, { language: 'en-US', rate: 0.95 });
    },
    [readAloud],
  );

  /* ---- start ---- */
  const begin = useCallback(async () => {
    retryKind.current = 'start';
    setBusy(true);
    setError(null);
    try {
      const { question: q } = await startInterview({ roleTitle, jobDescription, totalQuestions: TOTAL });
      setQuestion(q);
      speak(q.text);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleTitle, jobDescription]);

  useEffect(() => {
    begin();
    return () => {
      Speech.stop();
    };
  }, [begin]);

  /* ---- submit an answer ---- */
  const send = async () => {
    if (!question || !answer.trim()) return;
    retryKind.current = 'send';
    Speech.stop();
    setBusy(true);
    setBusyLabel('Scoring your answer…');
    setError(null);
    try {
      const res = await submitAnswer({
        roleTitle,
        jobDescription,
        question,
        answer: answer.trim(),
        questionNumber: number,
        totalQuestions: TOTAL,
        history: turns.map((t) => ({ question: t.question.text, answer: t.answer })),
      });
      setTurns((t) => [...t, { question, answer: answer.trim(), evaluation: res.evaluation }]);
      setFeedback({ evaluation: res.evaluation, next: res.nextQuestion });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  /* ---- finish: summary -> SQLite -> flashcard sync ---- */
  const finish = useCallback(
    async (all: CompletedTurn[]) => {
      retryKind.current = 'finish';
      setBusy(true);
      setBusyLabel('Building your study plan…');
      setError(null);
      try {
        const summary = await summarizeInterview({ roleTitle, jobDescription, turns: all });
        const { newCards } = await syncInterviewResult(roleTitle, summary);
        setResult({ summary, newCards });
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setBusy(false);
      }
    },
    [roleTitle, jobDescription],
  );

  const continueAfterFeedback = () => {
    if (!feedback) return;
    const next = feedback.next;
    setFeedback(null);
    setAnswer('');
    if (next) {
      setQuestion(next);
      setNumber((n) => n + 1);
      speak(next.text);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    } else {
      finish(turns);
    }
  };

  const retry = () => (retryKind.current === 'start' ? begin() : retryKind.current === 'send' ? send() : finish(turns));

  /* ---- render ---- */
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.role} numberOfLines={1}>{roleTitle}</Text>
            <Text style={styles.count}>Question {Math.min(number, TOTAL)} of {TOTAL}</Text>
          </View>
          <Text style={styles.count}>Read aloud</Text>
          <Switch value={readAloud} onValueChange={(v) => { setReadAloud(v); if (!v) Speech.stop(); }} trackColor={{ true: colors.primary }} />
        </View>
        <View style={{ paddingHorizontal: spacing.md }}>
          <ProgressBar value={turns.length / TOTAL} />
        </View>

        <ScrollView ref={scrollRef} contentContainerStyle={{ padding: spacing.md, gap: spacing.md }} keyboardShouldPersistTaps="handled">
          {question && (
            <Card style={{ gap: spacing.sm }}>
              <Text style={styles.type}>{question.type === 'behavioral' ? 'Behavioral question' : 'Technical question'}</Text>
              <Text style={styles.question}>{question.text}</Text>
              <Pressable onPress={() => speak(question.text)} accessibilityRole="button">
                <Text style={styles.link}>Replay question</Text>
              </Pressable>
              {question.type === 'behavioral' && <Text style={styles.hint}>Tip: use Situation, Task, Action, Result and quantify the result.</Text>}
            </Card>
          )}
          {error && (
            <Card style={{ backgroundColor: colors.dangerSoft, gap: spacing.sm }}>
              <Text style={{ color: colors.danger, fontWeight: '600' }}>{error}</Text>
              <Button title="Try again" variant="danger" onPress={retry} />
            </Card>
          )}
          {busy && (
            <View style={styles.busy}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.count}>{busyLabel}</Text>
            </View>
          )}
        </ScrollView>

        {question && !result && (
          <View style={styles.composer}>
            <TextInput
              style={styles.input}
              value={answer}
              onChangeText={setAnswer}
              placeholder="Type your answer (tip: use your keyboard's microphone to dictate)"
              placeholderTextColor={colors.muted}
              multiline
              maxLength={4000}
              editable={!busy}
            />
            <Button title="Submit answer" onPress={send} disabled={!answer.trim() || busy} />
          </View>
        )}
      </KeyboardAvoidingView>

      {/* ---------- instant feedback modal ---------- */}
      <Modal visible={!!feedback} animationType="slide" onRequestClose={() => {}}>
        <SafeAreaView style={styles.safe}>
          {feedback && (
            <>
              <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}>
                <View style={{ alignItems: 'center' }}>
                  <ScoreRing score={feedback.evaluation.score} label="out of 100" />
                </View>
                <Card style={{ gap: spacing.md }}>
                  <Dimension label="Technical accuracy" score={feedback.evaluation.technicalAccuracy.score} comment={feedback.evaluation.technicalAccuracy.comment} />
                  <Dimension label="Clarity" score={feedback.evaluation.clarity.score} comment={feedback.evaluation.clarity.comment} />
                  {feedback.evaluation.starUsage.applicable && (
                    <Dimension label="STAR method" score={feedback.evaluation.starUsage.score} comment={feedback.evaluation.starUsage.comment} />
                  )}
                </Card>
                <ListBlock title="What worked" items={feedback.evaluation.strengths} />
                <ListBlock title="Improve next time" items={feedback.evaluation.improvements} />
                {feedback.evaluation.missingSkills.length > 0 && (
                  <Card style={{ gap: spacing.sm }}>
                    <Text style={styles.blockTitle}>Skills you missed</Text>
                    <View style={styles.chips}>
                      {feedback.evaluation.missingSkills.map((s) => (
                        <View key={s} style={styles.skillChip}><Text style={{ color: colors.ink, fontWeight: '600' }}>{s}</Text></View>
                      ))}
                    </View>
                  </Card>
                )}
                {!!feedback.evaluation.idealAnswerHint && (
                  <Card style={{ gap: 6 }}>
                    <Text style={styles.blockTitle}>A stronger answer would include</Text>
                    <Text style={styles.body}>{feedback.evaluation.idealAnswerHint}</Text>
                  </Card>
                )}
              </ScrollView>
              <View style={styles.composer}>
                <Button title={feedback.next ? 'Next question' : 'Finish and see my study plan'} onPress={continueAfterFeedback} />
              </View>
            </>
          )}
        </SafeAreaView>
      </Modal>

      {/* ---------- final result modal ---------- */}
      <Modal visible={!!result} animationType="slide" onRequestClose={() => {}}>
        <SafeAreaView style={styles.safe}>
          {result && (
            <>
              <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}>
                <View style={{ alignItems: 'center' }}>
                  <ScoreRing score={result.summary.overallScore} label="interview score" />
                </View>
                <Text style={styles.body}>{result.summary.summaryText}</Text>
                <Card style={{ gap: spacing.sm }}>
                  <Text style={styles.blockTitle}>Weak spots</Text>
                  {result.summary.keyWeaknesses.map((w) => (
                    <View key={w.topic}>
                      <Text style={{ fontWeight: '700', color: colors.ink }}>{w.topic}</Text>
                      <Text style={styles.body}>{w.detail}</Text>
                    </View>
                  ))}
                </Card>
                <Card style={{ gap: spacing.sm }}>
                  <Text style={styles.blockTitle}>Study plan</Text>
                  {result.summary.studyRecommendations.map((r) => (
                    <View key={r.title}>
                      <Text style={{ fontWeight: '700', color: colors.ink }}>{r.title}</Text>
                      <Text style={styles.body}>{r.action}</Text>
                    </View>
                  ))}
                </Card>
                <Card style={{ backgroundColor: colors.primarySoft }}>
                  <Text style={{ color: colors.ink, fontWeight: '700' }}>
                    {result.newCards > 0
                      ? `${result.newCards} new flashcards were added to "Interview Gaps: ${roleTitle}". They are in your review queue today.`
                      : 'Your Interview Gaps deck already covers these topics.'}
                  </Text>
                </Card>
              </ScrollView>
              <View style={[styles.composer, { gap: spacing.sm }]}>
                <Button title="Review the new flashcards" onPress={() => navigation.replace('FlashcardReview', {})} />
                <Button title="Back to dashboard" variant="ghost" onPress={() => navigation.popToTop()} />
              </View>
            </>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function Dimension({ label, score, comment }: { label: string; score: number; comment: string }) {
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={styles.blockTitle}>{label}</Text>
        <Text style={{ fontWeight: '800', color: scoreColor(score) }}>{score}</Text>
      </View>
      <ProgressBar value={score / 100} color={scoreColor(score)} />
      <Text style={styles.body}>{comment}</Text>
    </View>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <Card style={{ gap: 6 }}>
      <Text style={styles.blockTitle}>{title}</Text>
      {items.map((i, idx) => (
        <Text key={idx} style={styles.body}>{`\u2022  ${i}`}</Text>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md },
  role: { fontSize: 18, fontWeight: '800', color: colors.ink },
  count: { color: colors.muted, fontSize: 13 },
  type: { color: colors.primary, fontWeight: '700' },
  question: { fontSize: 20, lineHeight: 28, fontWeight: '700', color: colors.ink },
  link: { color: colors.primary, fontWeight: '700' },
  hint: { color: colors.muted, fontSize: 13 },
  busy: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, justifyContent: 'center', padding: spacing.md },
  composer: { padding: spacing.md, gap: spacing.sm, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.surface },
  input: { minHeight: 90, maxHeight: 180, borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, padding: 12, fontSize: 16, color: colors.ink, backgroundColor: colors.bg },
  blockTitle: { fontWeight: '800', color: colors.ink, fontSize: 15 },
  body: { color: colors.ink, lineHeight: 21 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  skillChip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, backgroundColor: colors.amberSoft },
});
