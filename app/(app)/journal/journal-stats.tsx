import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "@clerk/clerk-expo";
import { AppHeader } from "../../../components/AppHeader";
import CurvedBackground from "../../../components/CurvedBackground";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useTheme } from "../../../contexts/ThemeContext";
import StatusModal from "../../../components/StatusModal";

const { width } = Dimensions.get("window");

interface JournalStats {
  totalJournals: number;
  totalWords: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  skippedCount: number;
  positiveCountThisMonth: number;
  negativeCountThisMonth: number;
  neutralCountThisMonth: number;
  skippedCountThisMonth: number;
  journalsThisMonth: number;
  mostFrequentEmotion: string;
  averageWordsPerEntry: number;
}

interface TrendAnalysis {
  trend: string;
  emotionalPattern: string;
  writingFrequency: string;
  recommendation: string;
  flaggedConcerns: string[];
}

export default function JournalStatsScreen() {
  const { theme, scaledFontSize } = useTheme();
  const { user } = useUser();
  const [stats, setStats] = useState<JournalStats | null>(null);
  const [trendAnalysis, setTrendAnalysis] = useState<TrendAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzingTrends, setAnalyzingTrends] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    type: 'info' as 'success' | 'error' | 'info',
    title: '',
    message: '',
  });

  // Fetch all journal entries
  const journalEntries = useQuery(api.journal.listRecent, {
    clerkUserId: user?.id,
    limit: 500, // Get all entries for stats
  });

  const styles = useMemo(() => createStyles(scaledFontSize), [scaledFontSize]);

  const showModal = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    setModalConfig({ type, title, message });
    setModalVisible(true);
  };

  // Calculate statistics from journal entries
  useEffect(() => {
    if (!journalEntries) return;

    try {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      let totalWords = 0;
      let positiveCount = 0;
      let negativeCount = 0;
      let neutralCount = 0;
      let skippedCount = 0;
      let positiveCountThisMonth = 0;
      let negativeCountThisMonth = 0;
      let neutralCountThisMonth = 0;
      let skippedCountThisMonth = 0;
      let journalsThisMonth = 0;
      const emotionCounts: { [key: string]: number } = {};

      journalEntries.forEach((entry: any) => {
        // Count words
        const wordCount = entry.content.trim().split(/\s+/).length;
        totalWords += wordCount;

        // Count emotions
        const emotion = entry.emotion_type || 'neutral';
        emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;

        // Categorize sentiment
        const positiveEmotions = ['happy', 'ecstatic', 'content', 'grateful', 'excited', 'joyful'];
        const negativeEmotions = ['sad', 'angry', 'frustrated', 'anxious', 'overwhelmed', 'stressed', 'depressed'];
        const skippedEmotions = ['skipped'];

        // Check if entry is from this month
        const entryDate = new Date(entry.created_at);
        const isThisMonth = entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;

        if (positiveEmotions.includes(emotion.toLowerCase())) {
          positiveCount++;
          if (isThisMonth) positiveCountThisMonth++;
        } else if (negativeEmotions.includes(emotion.toLowerCase())) {
          negativeCount++;
          if (isThisMonth) negativeCountThisMonth++;
        } else if (skippedEmotions.includes(emotion.toLowerCase())) {
          skippedCount++;
          if (isThisMonth) skippedCountThisMonth++;
        } else {
          neutralCount++;
          if (isThisMonth) neutralCountThisMonth++;
        }

        // Count this month's entries
        if (isThisMonth) {
          journalsThisMonth++;
        }
      });

      // Calculate skipped days for this month
      // Days passed in current month (e.g., Nov 14 = 14 days)
      const daysPassed = now.getDate();
      // Skipped = days that passed - actual journal entries this month
      const calculatedSkippedThisMonth = Math.max(0, daysPassed - journalsThisMonth);
      skippedCountThisMonth = calculatedSkippedThisMonth;

      // Find most frequent emotion
      const mostFrequentEmotion = Object.entries(emotionCounts).reduce(
        (max, [emotion, count]) => (count > max.count ? { emotion, count } : max),
        { emotion: 'neutral', count: 0 }
      ).emotion;

      const calculatedStats: JournalStats = {
        totalJournals: journalEntries.length,
        totalWords,
        positiveCount,
        negativeCount,
        neutralCount,
        skippedCount,
        positiveCountThisMonth,
        negativeCountThisMonth,
        neutralCountThisMonth,
        skippedCountThisMonth,
        journalsThisMonth,
        mostFrequentEmotion,
        averageWordsPerEntry: journalEntries.length > 0 ? Math.round(totalWords / journalEntries.length) : 0,
      };

      setStats(calculatedStats);
      setLoading(false);
    } catch (error) {
      console.error("Error calculating stats:", error);
      showModal('error', 'Error', 'Failed to calculate journal statistics');
      setLoading(false);
    }
  }, [journalEntries]);

  // Analyze trends with Gemini AI
  const analyzeTrendsWithAI = async () => {
    if (!journalEntries || journalEntries.length === 0) {
      showModal('info', 'No Data', 'You need at least one journal entry to analyze trends.');
      return;
    }

    setAnalyzingTrends(true);

    try {
      const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

      if (!apiKey) {
        console.error("Gemini API key not found");
        showModal('error', 'Configuration Error', 'AI service is not configured');
        setAnalyzingTrends(false);
        return;
      }

      // Prepare recent entries for analysis (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentEntries = journalEntries
        .filter((entry: any) => new Date(entry.created_at) >= thirtyDaysAgo)
        .slice(0, 20) // Limit to most recent 20 entries
        .map((entry: any) => ({
          date: new Date(entry.created_at).toLocaleDateString(),
          emotion: entry.emotion_type || 'neutral',
          title: entry.title,
          contentPreview: entry.content.substring(0, 200), // First 200 chars
          wordCount: entry.content.trim().split(/\s+/).length,
        }));

      // Check for flagged words
      const flaggedWords = ['suicide', 'kill', 'die', 'death', 'hurt myself', 'end it all', 'no point', 'hopeless', 'worthless'];
      const allContent = journalEntries.map((e: any) => e.content.toLowerCase()).join(' ');
      const foundFlags = flaggedWords.filter(word => allContent.includes(word));

      const prompt = `You are a compassionate mental health assistant analyzing journal entries. Provide a thoughtful analysis.

Recent Journal Data (last 30 days):
${JSON.stringify(recentEntries, null, 2)}

Total Statistics:
- Total Journals: ${stats?.totalJournals}
- Total Words: ${stats?.totalWords}
- Positive Entries: ${stats?.positiveCount}
- Negative Entries: ${stats?.negativeCount}
- Neutral Entries: ${stats?.neutralCount}
- This Month: ${stats?.journalsThisMonth}
- Most Frequent Emotion: ${stats?.mostFrequentEmotion}

${foundFlags.length > 0 ? `IMPORTANT: The following concerning words were detected: ${foundFlags.join(', ')}` : ''}

Please respond with ONLY a JSON object in this exact format:
{
  "trend": "brief overall emotional trend description (2-3 sentences)",
  "emotionalPattern": "description of emotional patterns observed (2-3 sentences)",
  "writingFrequency": "analysis of writing frequency and consistency (1-2 sentences)",
  "recommendation": "supportive, actionable recommendations (2-3 sentences)",
  "flaggedConcerns": ["list of any serious mental health concerns detected"]
}

Keep the tone supportive, professional, and encouraging. If concerning patterns are detected, recommend professional support.`;

      const modelName = "gemini-2.5-flash-lite";
      const url = `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${apiKey}`;
      const response = await fetch(
        url,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        }
      );

      if (!response.ok) {
        console.error('[AI Analysis] API Error:', response.status, response.statusText);
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

      // Extract JSON from response
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysis: TrendAnalysis = JSON.parse(jsonMatch[0]);
        
        // Add flagged words if found
        if (foundFlags.length > 0 && !analysis.flaggedConcerns.includes('Crisis-related language detected')) {
          analysis.flaggedConcerns.push(`Crisis-related language detected: ${foundFlags.join(', ')}`);
        }

        setTrendAnalysis(analysis);
        
        // Show alert if serious concerns detected
        if (analysis.flaggedConcerns.length > 0) {
          showModal('error', 'Important Notice', 
            'Some concerning patterns were detected in your journals. Please consider reaching out to a mental health professional or using our Crisis Support feature.');
        }
      } else {
        throw new Error('Could not parse AI response');
      }
    } catch (error) {
      console.error("Error analyzing trends:", error);
      showModal('error', 'Analysis Failed', 'Unable to analyze trends. Please try again later.');
    } finally {
      setAnalyzingTrends(false);
    }
  };

  if (loading) {
    return (
      <CurvedBackground>
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <AppHeader title="Journal Statistics" showBack={true} />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
              Calculating statistics...
            </Text>
          </View>
        </SafeAreaView>
      </CurvedBackground>
    );
  }

  return (
    <CurvedBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <AppHeader title="Journal Statistics" showBack={true} />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Page Title */}
          <Text style={[styles.pageTitle, { color: theme.colors.text }]}>
            Your Journal Insights
          </Text>

          {/* Overall Stats */}
          <View style={[styles.section, { backgroundColor: theme.isDark ? '#1E1E1E' : '#FAFAFA' }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Overall Statistics</Text>
            
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="book" size={32} color="#4CAF50" />
                <Text style={styles.statNumber}>{stats?.totalJournals || 0}</Text>
                <Text style={styles.statLabel}>Total Journals</Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="text" size={32} color="#2196F3" />
                <Text style={styles.statNumber}>{stats?.totalWords.toLocaleString() || 0}</Text>
                <Text style={styles.statLabel}>Total Words</Text>
              </View>
            </View>

            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { backgroundColor: '#FFF3E0' }]}>
                <Ionicons name="calendar" size={32} color="#FF9800" />
                <Text style={styles.statNumber}>{stats?.journalsThisMonth || 0}</Text>
                <Text style={styles.statLabel}>This Month</Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: '#F3E5F5' }]}>
                <Ionicons name="speedometer" size={32} color="#9C27B0" />
                <Text style={styles.statNumber}>{stats?.averageWordsPerEntry || 0}</Text>
                <Text style={styles.statLabel}>Avg Words/Entry</Text>
              </View>
            </View>
          </View>

          {/* Sentiment Analysis */}
          <View style={[styles.section, { backgroundColor: theme.isDark ? '#1E1E1E' : '#FAFAFA' }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Sentiment Analysis</Text>
              <View style={styles.tooltipContainer}>
                <Ionicons name="information-circle-outline" size={20} color={theme.colors.textSecondary} />
                <Text style={[styles.tooltipText, { color: theme.colors.textSecondary }]}>
                  For {new Date().toLocaleString('default', { month: 'long' })}
                </Text>
              </View>
            </View>
            
            <View style={styles.sentimentContainer}>
              <View style={styles.barChartContainer}>
                {/* Positive Bar */}
                <View style={styles.barColumn}>
                  <View style={styles.barWrapper}>
                    <View style={[styles.barTrackVertical, { backgroundColor: theme.isDark ? '#2A2A2A' : '#E0E0E0' }]}>
                      <View 
                        style={[
                          styles.barFillVertical, 
                          { 
                            height: `${Math.round((stats?.positiveCountThisMonth || 0) / Math.max(stats?.journalsThisMonth || 1, 1) * 100)}%`,
                            backgroundColor: '#7CB342'
                          }
                        ]} 
                      />
                    </View>
                    <View style={[styles.barValueCircle, { 
                      backgroundColor: theme.isDark ? '#2A2A2A' : '#FFFFFF',
                      borderColor: theme.isDark ? '#444' : '#E0E0E0'
                    }]}>
                      <Text style={[styles.barValueText, { color: theme.colors.text }]}>{stats?.positiveCountThisMonth || 0}</Text>
                    </View>
                  </View>
                  <Text style={styles.barValueEmoji}>😊</Text>
                  <Text style={[styles.barLabel, { color: theme.colors.text }]}>Positive</Text>
                </View>

                {/* Neutral Bar */}
                <View style={styles.barColumn}>
                  <View style={styles.barWrapper}>
                    <View style={[styles.barTrackVertical, { backgroundColor: theme.isDark ? '#2A2A2A' : '#E0E0E0' }]}>
                      <View 
                        style={[
                          styles.barFillVertical, 
                          { 
                            height: `${Math.round((stats?.neutralCountThisMonth || 0) / Math.max(stats?.journalsThisMonth || 1, 1) * 100)}%`,
                            backgroundColor: '#9E9E9E'
                          }
                        ]} 
                      />
                    </View>
                    <View style={[styles.barValueCircle, { 
                      backgroundColor: theme.isDark ? '#2A2A2A' : '#FFFFFF',
                      borderColor: theme.isDark ? '#444' : '#E0E0E0'
                    }]}>
                      <Text style={[styles.barValueText, { color: theme.colors.text }]}>{stats?.neutralCountThisMonth || 0}</Text>
                    </View>
                  </View>
                  <Text style={styles.barValueEmoji}>😐</Text>
                  <Text style={[styles.barLabel, { color: theme.colors.text }]}>Neutral</Text>
                </View>

                {/* Negative Bar */}
                <View style={styles.barColumn}>
                  <View style={styles.barWrapper}>
                    <View style={[styles.barTrackVertical, { backgroundColor: theme.isDark ? '#2A2A2A' : '#E0E0E0' }]}>
                      <View 
                        style={[
                          styles.barFillVertical, 
                          { 
                            height: `${Math.round((stats?.negativeCountThisMonth || 0) / Math.max(stats?.journalsThisMonth || 1, 1) * 100)}%`,
                            backgroundColor: '#FF9800'
                          }
                        ]} 
                      />
                    </View>
                    <View style={[styles.barValueCircle, { 
                      backgroundColor: theme.isDark ? '#2A2A2A' : '#FFFFFF',
                      borderColor: theme.isDark ? '#444' : '#E0E0E0'
                    }]}>
                      <Text style={[styles.barValueText, { color: theme.colors.text }]}>{stats?.negativeCountThisMonth || 0}</Text>
                    </View>
                  </View>
                  <Text style={styles.barValueEmoji}>😔</Text>
                  <Text style={[styles.barLabel, { color: theme.colors.text }]}>Negative</Text>
                </View>

                {/* Skipped Bar */}
                <View style={styles.barColumn}>
                  <View style={styles.barWrapper}>
                    <View style={[styles.barTrackVertical, { backgroundColor: theme.isDark ? '#2A2A2A' : '#E0E0E0' }]}>
                      <View 
                        style={[
                          styles.barFillVertical, 
                          { 
                            height: `${Math.round((stats?.skippedCountThisMonth || 0) / Math.max(stats?.journalsThisMonth || 1, 1) * 100)}%`,
                            backgroundColor: '#5D4037'
                          }
                        ]} 
                      />
                    </View>
                    <View style={[styles.barValueCircle, { 
                      backgroundColor: theme.isDark ? '#2A2A2A' : '#FFFFFF',
                      borderColor: theme.isDark ? '#444' : '#E0E0E0'
                    }]}>
                      <Text style={[styles.barValueText, { color: theme.colors.text }]}>{stats?.skippedCountThisMonth || 0}</Text>
                    </View>
                  </View>
                  <Text style={styles.barValueEmoji}>⏭️</Text>
                  <Text style={[styles.barLabel, { color: theme.colors.text }]}>Skipped</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Journal Insight */}
          <View style={[styles.section, { backgroundColor: theme.isDark ? '#1E1E1E' : '#FAFAFA' }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Journal Insight</Text>
            
            <View style={[styles.insightCard, { backgroundColor: theme.isDark ? '#2A2A2A' : '#FFFFFF' }]}>
              <View style={styles.insightRow}>
                <Ionicons name="happy" size={24} color="#9C27B0" />
                <View style={styles.insightTextContainer}>
                  <Text style={[styles.insightLabel, { color: theme.colors.textSecondary }]}>Most Frequent Emotion</Text>
                  <Text style={[styles.insightValue, { color: theme.colors.text }]}>{stats?.mostFrequentEmotion || 'N/A'}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* AI Trend Analysis */}
          <View style={[styles.section, { backgroundColor: theme.isDark ? '#1E1E1E' : '#FAFAFA' }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>AI Trend Analysis</Text>
              <TouchableOpacity
                style={styles.analyzeButton}
                onPress={analyzeTrendsWithAI}
                disabled={analyzingTrends}
              >
                {analyzingTrends ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="analytics" size={18} color="#FFFFFF" />
                    <Text style={styles.analyzeButtonText}>
                      {trendAnalysis ? 'Refresh' : 'Analyze'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {trendAnalysis ? (
              <View style={styles.analysisContainer}>
                <View style={[styles.analysisCard, { backgroundColor: theme.isDark ? '#2A2A2A' : '#FFFFFF' }]}>
                  <Text style={[styles.analysisTitle, { color: theme.colors.text }]}>📈 Overall Trend</Text>
                  <Text style={[styles.analysisText, { color: theme.colors.textSecondary }]}>{trendAnalysis.trend}</Text>
                </View>

                <View style={[styles.analysisCard, { backgroundColor: theme.isDark ? '#2A2A2A' : '#FFFFFF' }]}>
                  <Text style={[styles.analysisTitle, { color: theme.colors.text }]}>💭 Emotional Pattern</Text>
                  <Text style={[styles.analysisText, { color: theme.colors.textSecondary }]}>{trendAnalysis.emotionalPattern}</Text>
                </View>

                <View style={[styles.analysisCard, { backgroundColor: theme.isDark ? '#2A2A2A' : '#FFFFFF' }]}>
                  <Text style={[styles.analysisTitle, { color: theme.colors.text }]}>✍️ Writing Frequency</Text>
                  <Text style={[styles.analysisText, { color: theme.colors.textSecondary }]}>{trendAnalysis.writingFrequency}</Text>
                </View>

                <View style={[styles.analysisCard, { backgroundColor: theme.isDark ? '#2A2A2A' : '#FFFFFF' }]}>
                  <Text style={[styles.analysisTitle, { color: theme.colors.text }]}>💡 Recommendation</Text>
                  <Text style={[styles.analysisText, { color: theme.colors.textSecondary }]}>{trendAnalysis.recommendation}</Text>
                </View>

                {trendAnalysis.flaggedConcerns.length > 0 && (
                  <View style={[styles.analysisCard, styles.concernCard]}>
                    <Text style={styles.concernTitle}>⚠️ Important Notice</Text>
                    {trendAnalysis.flaggedConcerns.map((concern, index) => (
                      <Text key={index} style={styles.concernText}>• {concern}</Text>
                    ))}
                    <TouchableOpacity
                      style={styles.crisisButton}
                      onPress={() => router.push('/crisis-support')}
                    >
                      <Ionicons name="medical" size={20} color="#FFFFFF" />
                      <Text style={styles.crisisButtonText}>Get Crisis Support</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.placeholderContainer}>
                <Ionicons name="analytics-outline" size={48} color="#BDBDBD" />
                <Text style={styles.placeholderText}>
                  Tap &ldquo;Analyze&rdquo; to get AI-powered insights about your journal trends
                </Text>
              </View>
            )}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>

        <StatusModal
          visible={modalVisible}
          type={modalConfig.type}
          title={modalConfig.title}
          message={modalConfig.message}
          onClose={() => setModalVisible(false)}
        />
      </SafeAreaView>
    </CurvedBackground>
  );
}

const createStyles = (scaledFontSize: (size: number) => number) => StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: scaledFontSize(16),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  pageTitle: {
    fontSize: scaledFontSize(24),
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 20,
  },
  section: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: scaledFontSize(18),
    fontWeight: '700',
    marginBottom: 0,
  },
  tooltipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(158, 158, 158, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tooltipText: {
    fontSize: scaledFontSize(11),
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNumber: {
    fontSize: scaledFontSize(24),
    fontWeight: '700',
    color: '#000',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: scaledFontSize(12),
    color: '#999',
    textAlign: 'center',
  },
  sentimentContainer: {
    width: '100%',
    paddingVertical: 20,
  },
  barChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 280,
    paddingHorizontal: 20,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    maxWidth: 80,
  },
  barWrapper: {
    width: '100%',
    height: 200,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  barTrackVertical: {
    width: 60,
    height: '100%',
    backgroundColor: '#E0E0E0',
    borderRadius: 30,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  barFillVertical: {
    width: '100%',
    borderRadius: 30,
    minHeight: 30,
  },
  barValueCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginTop: 8,
  },
  barValueText: {
    fontSize: scaledFontSize(16),
    fontWeight: '700',
  },
  barValueEmoji: {
    fontSize: scaledFontSize(20),
    marginTop: 4,
    marginBottom: 4,
  },
  barLabel: {
    fontSize: scaledFontSize(13),
    fontWeight: '600',
    textAlign: 'center',
  },
  sentimentBar: {
    flexDirection: 'row',
    height: 40,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
  },
  sentimentSegment: {
    height: '100%',
  },
  sentimentLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: scaledFontSize(13),
    color: '#666',
  },
  insightCard: {
    borderRadius: 12,
    padding: 16,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  insightTextContainer: {
    flex: 1,
  },
  insightLabel: {
    fontSize: scaledFontSize(13),
    marginBottom: 4,
  },
  insightValue: {
    fontSize: scaledFontSize(16),
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#9C27B0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  analyzeButtonText: {
    color: '#FFFFFF',
    fontSize: scaledFontSize(14),
    fontWeight: '600',
  },
  analysisContainer: {
    gap: 12,
  },
  analysisCard: {
    borderRadius: 12,
    padding: 16,
  },
  analysisTitle: {
    fontSize: scaledFontSize(15),
    fontWeight: '700',
    marginBottom: 8,
  },
  analysisText: {
    fontSize: scaledFontSize(14),
    lineHeight: scaledFontSize(14) * 1.5,
  },
  concernCard: {
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#F44336',
  },
  concernTitle: {
    fontSize: scaledFontSize(15),
    fontWeight: '700',
    color: '#D32F2F',
    marginBottom: 8,
  },
  concernText: {
    fontSize: scaledFontSize(14),
    color: '#C62828',
    marginBottom: 4,
    lineHeight: scaledFontSize(14) * 1.5,
  },
  crisisButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F44336',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
  },
  crisisButtonText: {
    color: '#FFFFFF',
    fontSize: scaledFontSize(14),
    fontWeight: '600',
  },
  placeholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  placeholderText: {
    fontSize: scaledFontSize(14),
    color: '#999',
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 20,
  },
});
