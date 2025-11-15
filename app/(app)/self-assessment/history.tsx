import { useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { useUser } from '@clerk/clerk-expo';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import CurvedBackground from '../../../components/CurvedBackground';
import { AppHeader } from '../../../components/AppHeader';
import { Ionicons } from '@expo/vector-icons';

export default function AssessmentHistoryScreen() {
  const { theme, scaledFontSize } = useTheme();
  const { user } = useUser();
  const history = useQuery(user?.id ? api.assessments.getAssessmentHistory : (undefined as any), user?.id ? { userId: user.id, limit: 50 } : 'skip') as any[] | undefined;
  const stats = useQuery(user?.id ? api.assessments.getAssessmentStats : (undefined as any), user?.id ? { userId: user.id } : 'skip') as any | undefined;

  const styles = useMemo(() => createStyles(scaledFontSize), [scaledFontSize]);

  return (
    <CurvedBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}> 
        <AppHeader title="Assessment History" showBack={true} />
        <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 60 }}>
          <View style={styles.content}> 
            {stats && (
              <View style={[styles.statsCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}> 
                <Text style={[styles.statsTitle, { color: theme.colors.text }]}>Overview</Text>
                <View style={styles.statsRow}> 
                  <Stat icon="swap-vertical" label="Total" value={stats.totalAssessments} />
                  <Stat icon="speedometer" label="Average" value={stats.averageScore ?? '--'} />
                  <Stat icon={stats.trend === 'improving' ? 'trending-up' : stats.trend === 'declining' ? 'trending-down' : 'remove'} label="Trend" value={stats.trend ? capitalize(stats.trend) : 'N/A'} />
                </View>
              </View>
            )}

            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Past Assessments</Text>
            {!history || history.length === 0 ? (
              <View style={styles.empty}> 
                <Ionicons name="document-text" size={42} color={theme.colors.iconDisabled} />
                <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No assessments yet</Text>
              </View>
            ) : (
              history.map((h) => (
                <View key={h.id} style={[styles.assessmentRow, { backgroundColor: theme.colors.surface, borderColor: theme.colors.borderLight }]}> 
                  <View style={styles.rowLeft}> 
                    <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} style={{ marginRight: 10 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.rowScore, { color: theme.colors.text }]}>Score: {h.totalScore}/35</Text>
                      <Text style={[styles.rowDate, { color: theme.colors.textSecondary }]}>{h.completedAt}</Text>
                    </View>
                  </View>
                  <View style={styles.rowRight}> 
                    <Ionicons name="time" size={16} color={theme.colors.textSecondary} style={{ marginRight: 4 }} />
                    <Text style={[styles.rowMeta, { color: theme.colors.textSecondary }]}>Next: {h.nextDueDate || '—'}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </CurvedBackground>
  );
}

function Stat({ icon, label, value }: { icon: any; label: string; value: any }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Ionicons name={icon} size={20} color="#4CAF50" style={{ marginBottom: 4 }} />
      <Text style={{ fontSize: 12, fontWeight: '600', color: '#555' }}>{label}</Text>
      <Text style={{ fontSize: 14, fontWeight: '700' }}>{String(value)}</Text>
    </View>
  );
}

function capitalize(str: string) { return str.charAt(0).toUpperCase() + str.slice(1); }

const createStyles = (scaledFontSize: (n: number) => number) => StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 20 },
  statsCard: { borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 20 },
  statsTitle: { fontSize: scaledFontSize(16), fontWeight: '600', marginBottom: 12 },
  statsRow: { flexDirection: 'row', gap: 12 },
  sectionTitle: { fontSize: scaledFontSize(18), fontWeight: '600', marginBottom: 12 },
  empty: { alignItems: 'center', padding: 40 },
  emptyText: { marginTop: 8, fontSize: scaledFontSize(14) },
  assessmentRow: { flexDirection: 'row', justifyContent: 'space-between', borderWidth: 1, padding: 14, borderRadius: 12, marginBottom: 12 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  rowRight: { flexDirection: 'row', alignItems: 'center' },
  rowScore: { fontSize: scaledFontSize(15), fontWeight: '600' },
  rowDate: { fontSize: scaledFontSize(12) },
  rowMeta: { fontSize: scaledFontSize(12) },
});
