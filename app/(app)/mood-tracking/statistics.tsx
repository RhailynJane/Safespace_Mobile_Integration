/**
 * LLM Prompt: Add concise comments to this React Native component. 
 * Reference: chat.deepseek.com
 */
import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Modal,
  Pressable,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing } from "../../../constants/theme";
import BottomNavigation from "../../../components/BottomNavigation";
import { AppHeader } from "../../../components/AppHeader";
import CurvedBackground from "../../../components/CurvedBackground";
import { useTheme } from "../../../contexts/ThemeContext";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@clerk/clerk-expo";
import { useBottomNavTabs } from "../../../utils/hooks/useBottomNavTabs";

const { width } = Dimensions.get("window");

type TimeFilter = "Day" | "Week" | "Month" | "Year";

interface FreudScore {
  positive: number;
  negative: number;
  overall: number;
  trend: "improving" | "stable" | "declining";
}

interface PredictionDay {
  day: string;
  emoji: string;
  mood: string;
  confidence: number;
}

interface RiskAnalysis {
  level: "low" | "moderate" | "high" | "critical";
  score: number;
  summary: string;
  recommendations: string[];
  concerningPatterns: string[];
}

const StatisticsScreen: React.FC = () => {
  const { theme, scaledFontSize } = useTheme();
  const { userId } = useAuth();
  const [activeTab, setActiveTab] = useState("home");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("Month");
  const [loadingPredictions, setLoadingPredictions] = useState(false);
  const [predictions, setPredictions] = useState<PredictionDay[]>([]);
  const [loadingRiskAnalysis, setLoadingRiskAnalysis] = useState(false);
  const [riskAnalysis, setRiskAnalysis] = useState<RiskAnalysis | null>(null);
  const [showFreudTooltip, setShowFreudTooltip] = useState(false);

  // Calculate days based on time filter
  const getDaysFromFilter = (filter: TimeFilter): number => {
    switch (filter) {
      case "Day": return 1;    // last 1 day
      case "Week": return 7;   // last 7 days
      case "Month": return 30; // last 30 days
      case "Year": return 365; // last 365 days
      default: return 30;
    }
  };

  // Fetch mood data for statistics
  const moodChartData = useQuery(api.moods.getMoodChartData, {
    userId: userId || "",
    days: getDaysFromFilter(timeFilter),
  });

  // Navigation tabs
  const tabs = useBottomNavTabs();

  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "home") {
      router.replace("/(app)/(tabs)/home");
    } else {
      router.push(`/(app)/(tabs)/${tabId}`);
    }
  };

  // Calculate Freud Score based on mood history
  const calculateFreudScore = useCallback((): FreudScore => {
    if (!moodChartData?.chartData) {
      return { positive: 0, negative: 0, overall: 0, trend: "stable" };
    }

    const moodsWithScores = moodChartData.chartData.filter(d => d.hasMood && d.averageScore);
    if (moodsWithScores.length === 0) {
      return { positive: 0, negative: 0, overall: 0, trend: "stable" };
    }

    // Calculate positive/negative percentages
    const positiveCount = moodsWithScores.filter(d => (d.averageScore || 0) >= 3.5).length;
    const negativeCount = moodsWithScores.filter(d => (d.averageScore || 0) < 2.5).length;
    
    const positive = Math.round((positiveCount / moodsWithScores.length) * 100);
    const negative = Math.round((negativeCount / moodsWithScores.length) * 100);
    const overall = Math.round(
      moodsWithScores.reduce((sum, d) => sum + (d.averageScore || 0), 0) / moodsWithScores.length * 20
    );

    // Determine trend (compare first half vs second half)
    const halfPoint = Math.floor(moodsWithScores.length / 2);
    const firstHalfAvg = moodsWithScores.slice(0, halfPoint).reduce((sum, d) => sum + (d.averageScore || 0), 0) / halfPoint;
    const secondHalfAvg = moodsWithScores.slice(halfPoint).reduce((sum, d) => sum + (d.averageScore || 0), 0) / (moodsWithScores.length - halfPoint);
    
    let trend: "improving" | "stable" | "declining" = "stable";
    if (secondHalfAvg > firstHalfAvg + 0.3) trend = "improving";
    else if (secondHalfAvg < firstHalfAvg - 0.3) trend = "declining";

    console.log('[Freud Score] Calculation:', {
      totalMoods: moodsWithScores.length,
      positive,
      negative,
      overall,
      trend
    });

    return { positive, negative, overall, trend };
  }, [moodChartData]);

  const freudScore = useMemo(() => calculateFreudScore(), [calculateFreudScore]);

  // Distribution stats for clarity
  const distributionStats = useMemo(() => {
    if (!moodChartData?.chartData) return { total: 0, logged: 0, skipped: 0 };
    const total = moodChartData.chartData.length;
    const logged = moodChartData.chartData.filter(
      (d: any) => d.hasMood && d.averageScore !== undefined && d.averageScore !== null
    ).length;
    const skipped = Math.max(0, total - logged);
    return { total, logged, skipped };
  }, [moodChartData]);

  // Exact date range label derived from data (ISO YYYY-MM-DD strings)
  const dateRangeLabel = useMemo(() => {
    try {
      const dates: string[] = moodChartData?.chartData
        ?.map((d: any) => d?.date)
        .filter(Boolean) || [];
      if (dates.length === 0) return "";

      let min = dates[0] as string;
      let max = dates[0] as string;
      for (const iso of dates) {
        if (iso < min) min = iso;
        if (iso > max) max = iso;
      }

      const monthShort = [
        "Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"
      ];
      const fmt = (iso: string, withYear: boolean) => {
        const parts = iso.split("-");
        const y = parseInt(parts[0] || "0", 10);
        const m = parseInt(parts[1] || "1", 10);
        const d = parseInt(parts[2] || "1", 10);
        const base = `${monthShort[(m || 1) - 1]} ${d}`;
        return withYear ? `${base}, ${y}` : base;
      };

      const startYear = (min.split("-")[0] || "");
      const endYear = (max.split("-")[0] || "");
      const includeStartYear = startYear !== endYear; // include year on start if spans years
      // Always include year on end for clarity
      return `${fmt(min, includeStartYear)} → ${fmt(max, true)}`;
    } catch {
      return "";
    }
  }, [moodChartData]);

  // Generate AI mood predictions using Gemini
  const generatePredictions = async () => {
    setLoadingPredictions(true);
    
    try {
      // Use EXPO_PUBLIC_GEMINI_API_KEY for client-side access in Expo
      const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY 
      
      if (!apiKey) {
        console.error("Gemini API key not found");
        // Use fallback predictions
        setPredictions([
          { day: "Mon", emoji: "😊", mood: "content", confidence: 70 },
          { day: "Tue", emoji: "🙂", mood: "happy", confidence: 68 },
          { day: "Wed", emoji: "😐", mood: "neutral", confidence: 65 },
          { day: "Thu", emoji: "😊", mood: "content", confidence: 72 },
          { day: "Fri", emoji: "😃", mood: "happy", confidence: 75 },
          { day: "Sat", emoji: "🙂", mood: "content", confidence: 70 },
          { day: "Sun", emoji: "😐", mood: "neutral", confidence: 68 },
        ]);
        setLoadingPredictions(false);
        return;
      }

      // Prepare mood history for AI context
      const recentMoods = moodChartData?.chartData
        ?.filter(d => d.hasMood)
        .slice(-14) // Last 2 weeks
        .map(d => ({
          date: d.date,
          mood: d.mood?.mood_type || 'neutral',
          score: d.averageScore,
        })) || [];

      const prompt = `Based on this mood history data, predict the likely mood for the next 7 days. 
      
Recent mood data:
${JSON.stringify(recentMoods, null, 2)}

Current mental health score: ${freudScore.overall}/100
Trend: ${freudScore.trend}

Please respond with ONLY a JSON array of 7 objects with this exact format:
[
  { "day": "Mon", "mood": "content|happy|neutral|sad|frustrated", "emoji": "😊|🙂|😐|😕|😖", "confidence": 75 }
]

Consider patterns like:
- Day of week trends
- Recent trajectory
- Overall stability
Keep confidence realistic (60-85%). Use only these moods: ecstatic, happy, content, neutral, displeased, frustrated, annoyed, sad, angry.`;

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
        console.error('[AI Predictions] API Error:', response.status, response.statusText);
        const errorData = await response.text();
        console.error('[AI Predictions] Error details:', errorData);
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[AI Predictions] API Response:', JSON.stringify(data, null, 2));
      
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      console.log('[AI Predictions] Generated text:', generatedText);
      
      // Extract JSON from response (might be wrapped in markdown code blocks)
      const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        console.log('[AI Predictions] Matched JSON:', jsonMatch[0]);
        const predictedMoods: PredictionDay[] = JSON.parse(jsonMatch[0]);
        console.log('[AI Predictions] Parsed predictions:', predictedMoods);
        setPredictions(predictedMoods);
      } else {
        console.log('[AI Predictions] No JSON match found, using fallback');
        // Fallback predictions
        setPredictions([
          { day: "Mon", emoji: "😊", mood: "content", confidence: 70 },
          { day: "Tue", emoji: "🙂", mood: "happy", confidence: 68 },
          { day: "Wed", emoji: "😐", mood: "neutral", confidence: 65 },
          { day: "Thu", emoji: "😊", mood: "content", confidence: 72 },
          { day: "Fri", emoji: "😃", mood: "happy", confidence: 75 },
          { day: "Sat", emoji: "🙂", mood: "content", confidence: 70 },
          { day: "Sun", emoji: "😐", mood: "neutral", confidence: 68 },
        ]);
      }
    } catch (error) {
      console.error("Prediction error:", error);
      // Fallback predictions on error
      setPredictions([
        { day: "Mon", emoji: "😊", mood: "content", confidence: 70 },
        { day: "Tue", emoji: "🙂", mood: "happy", confidence: 68 },
        { day: "Wed", emoji: "😐", mood: "neutral", confidence: 65 },
        { day: "Thu", emoji: "😊", mood: "content", confidence: 72 },
        { day: "Fri", emoji: "😃", mood: "happy", confidence: 75 },
        { day: "Sat", emoji: "🙂", mood: "content", confidence: 70 },
        { day: "Sun", emoji: "😐", mood: "neutral", confidence: 68 },
      ]);
    } finally {
      setLoadingPredictions(false);
    }
  };

  // Mood distribution for bar chart
  const moodDistribution = useMemo(() => {
    if (!moodChartData?.chartData) return [];

    const allDays = moodChartData.chartData;
    const moodsWithScores = allDays.filter(d => d.hasMood && d.averageScore);
    const total = allDays.length;
    if (total === 0) return [];

    const distribution = [
      { label: "Positive", count: 0, color: "#4CAF50" },
      { label: "Neutral", count: 0, color: "#FFC107" },
      { label: "Negative", count: 0, color: "#F44336" },
      { label: "Skipped", count: total - moodsWithScores.length, color: "#9E9E9E" },
    ];

    moodsWithScores.forEach(d => {
      const score = d.averageScore || 0;
      if (score >= 3.5) {
        distribution[0]!.count++;
      } else if (score >= 2.5) {
        distribution[1]!.count++;
      } else {
        distribution[2]!.count++;
      }
    });

    return distribution.map(d => ({
      ...d,
      percentage: Math.round((d.count / total) * 100),
    }));
  }, [moodChartData]);

  // Generate AI Risk Analysis using Gemini
  const generateRiskAnalysis = async () => {
    setLoadingRiskAnalysis(true);
    
    try {
      // Use EXPO_PUBLIC_GEMINI_API_KEY for client-side access in Expo
      const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY 
      
      if (!apiKey) {
        console.error("Gemini API key not found");
        setLoadingRiskAnalysis(false);
        return;
      }

      // Prepare comprehensive mood data for risk analysis
      const recentMoods = moodChartData?.chartData
        ?.filter(d => d.hasMood)
        .slice(-30) // Last 30 days
        .map(d => ({
          date: d.date,
          mood: d.mood?.mood_type || 'neutral',
          score: d.averageScore,
          notes: d.mood?.notes || '',
        })) || [];

      const prompt = `You are a mental health risk assessment AI. Analyze this user's mood data from the last 30 days and provide a comprehensive risk assessment.

Mood History (last 30 days):
${JSON.stringify(recentMoods, null, 2)}

Current Statistics:
- Freud Score: ${freudScore.overall}/100
- Trend: ${freudScore.trend}
- Positive moods: ${freudScore.positive}%
- Negative moods: ${freudScore.negative}%

Provide a risk assessment with this EXACT JSON format:
{
  "level": "low|moderate|high|critical",
  "score": 0-100,
  "summary": "Brief 2-3 sentence summary of mental health status",
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],
  "concerningPatterns": ["pattern 1", "pattern 2"]
}

Risk Level Guidelines:
- LOW (0-25): Stable mood, positive trends, good coping
- MODERATE (26-50): Some fluctuation, manageable stress
- HIGH (51-75): Concerning patterns, increasing negative moods, declining trend
- CRITICAL (76-100): Severe negative patterns, crisis indicators, immediate support needed

Focus on:
1. Frequency of negative moods
2. Intensity of mood swings
3. Recent trend direction
4. Consistency of mood patterns
5. Any concerning notes content

Respond with ONLY the JSON object, no other text.`;

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
        console.error('[Risk Analysis] API Error:', response.status, response.statusText);
        const errorData = await response.text();
        console.error('[Risk Analysis] Error details:', errorData);
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[Risk Analysis] API Response:', JSON.stringify(data, null, 2));
      
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      console.log('[Risk Analysis] Generated text:', generatedText);
      
      // Extract JSON from response
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        console.log('[Risk Analysis] Matched JSON:', jsonMatch[0]);
        const analysis: RiskAnalysis = JSON.parse(jsonMatch[0]);
        console.log('[Risk Analysis] Parsed analysis:', analysis);
        setRiskAnalysis(analysis);
      } else {
        console.log('[Risk Analysis] No JSON match found, using fallback');
        // Fallback analysis based on Freud score
        const fallbackAnalysis: RiskAnalysis = {
          level: freudScore.overall >= 70 ? "low" : freudScore.overall >= 50 ? "moderate" : freudScore.overall >= 30 ? "high" : "critical",
          score: Math.max(0, 100 - freudScore.overall),
          summary: freudScore.overall >= 70 
            ? "Your mood patterns show stability and positive mental health indicators."
            : freudScore.overall >= 50
            ? "Some mood fluctuations detected. Consider stress management techniques."
            : "Concerning mood patterns identified. Professional support recommended.",
          recommendations: [
            "Continue regular mood tracking",
            "Practice mindfulness and relaxation",
            "Connect with support network",
          ],
          concerningPatterns: freudScore.negative > 40 ? ["High frequency of negative moods"] : [],
        };
        setRiskAnalysis(fallbackAnalysis);
      }
    } catch (error) {
      console.error("Risk analysis error:", error);
      // Fallback analysis
      const fallbackAnalysis: RiskAnalysis = {
        level: freudScore.overall >= 70 ? "low" : freudScore.overall >= 50 ? "moderate" : "high",
        score: Math.max(0, 100 - freudScore.overall),
        summary: "Analysis based on available mood data. Consider consulting a professional for comprehensive assessment.",
        recommendations: [
          "Continue regular mood tracking",
          "Maintain healthy routines",
          "Seek professional support if needed",
        ],
        concerningPatterns: [],
      };
      setRiskAnalysis(fallbackAnalysis);
    } finally {
      setLoadingRiskAnalysis(false);
    }
  };

  const styles = useMemo(() => createStyles(scaledFontSize, theme), [scaledFontSize, theme]);

  return (
    <CurvedBackground>
      <View style={styles.container}>
        <AppHeader title="Statistics & AI Insights" showBack={true} />
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Time Filter */}
          <View style={styles.filterContainer}>
            {(["Day", "Week", "Month", "Year"] as TimeFilter[]).map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterButton,
                  timeFilter === filter && styles.filterButtonActive,
                ]}
                onPress={() => setTimeFilter(filter)}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    timeFilter === filter && styles.filterButtonTextActive,
                  ]}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Freud Score Card */}
          <View style={[styles.card, styles.freudCard]}>
            <View style={styles.freudHeader}>
              <Text style={styles.cardTitle}>Freud Score</Text>
              <TouchableOpacity 
                style={styles.helpButton}
                onPress={() => setShowFreudTooltip(true)}
              >
                <Ionicons name="help-circle-outline" size={20} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <Text style={styles.freudSubtitle}>See your mental score insights</Text>

            {/* Score Display */}
            <View style={styles.scoreCircle}>
              <Text style={styles.scoreValue}>{freudScore.overall}</Text>
              <Text style={styles.scoreLabel}>/ 100</Text>
            </View>

            {/* Trend Indicator */}
            <View style={styles.trendContainer}>
              <Ionicons
                name={
                  freudScore.trend === "improving"
                    ? "trending-up"
                    : freudScore.trend === "declining"
                    ? "trending-down"
                    : "remove"
                }
                size={20}
                color={
                  freudScore.trend === "improving"
                    ? "#4CAF50"
                    : freudScore.trend === "declining"
                    ? "#F44336"
                    : "#FFC107"
                }
              />
              <Text style={styles.trendText}>
                {freudScore.trend === "improving"
                  ? "Improving"
                  : freudScore.trend === "declining"
                  ? "Declining"
                  : "Stable"}
              </Text>
            </View>

            {/* Positive/Negative Bars */}
            <View style={styles.barContainer}>
              <View style={styles.barRow}>
                <View style={styles.barLabel}>
                  <View style={[styles.colorDot, { backgroundColor: "#4CAF50" }]} />
                  <Text style={styles.barLabelText}>Positive</Text>
                </View>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      { width: `${freudScore.positive}%`, backgroundColor: "#4CAF50" },
                    ]}
                  />
                </View>
                <Text style={styles.barPercentage}>{freudScore.positive}%</Text>
              </View>

              <View style={styles.barRow}>
                <View style={styles.barLabel}>
                  <View style={[styles.colorDot, { backgroundColor: "#F44336" }]} />
                  <Text style={styles.barLabelText}>Negative</Text>
                </View>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      { width: `${freudScore.negative}%`, backgroundColor: "#F44336" },
                    ]}
                  />
                </View>
                <Text style={styles.barPercentage}>{freudScore.negative}%</Text>
              </View>
            </View>
          </View>

          {/* Mood Distribution Bars */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Mood Distribution</Text>
            <View style={styles.distributionContainer}>
              {moodDistribution.map((item, index) => (
                <View key={index} style={styles.distributionBar}>
                  <View style={styles.distributionBarInner}>
                    <View
                      style={[
                        styles.distributionBarFill,
                        { height: `${item.percentage}%`, backgroundColor: item.color },
                      ]}
                    />
                  </View>
                  <Text style={styles.distributionLabel}>{item.label}</Text>
                  <Text style={styles.distributionPercentage}>{item.percentage}%</Text>
                </View>
              ))}
            </View>
            <View style={styles.distributionStatsRow}>
              <Text style={styles.distributionStatsText}>
                Date Range: {dateRangeLabel || `last ${getDaysFromFilter(timeFilter)} days`}
              </Text>
              <Text style={styles.distributionStatsText}>
                Logged: {distributionStats.logged}   Skipped: {distributionStats.skipped}
              </Text>
            </View>
          </View>

          {/* AI Risk Analysis */}
          <View style={styles.card}>
            <View style={styles.predictionHeader}>
              <Text style={styles.cardTitle}>AI Risk Analysis</Text>
              <Ionicons name="shield-checkmark" size={20} color={theme.colors.text} />
            </View>

            {riskAnalysis === null ? (
              <TouchableOpacity
                style={styles.generateButton}
                onPress={generateRiskAnalysis}
                disabled={loadingRiskAnalysis}
              >
                {loadingRiskAnalysis ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="analytics" size={20} color="#FFF" />
                    <Text style={styles.generateButtonText}>Analyze Risk Level</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <>
                {/* Risk Level Badge */}
                <View style={[
                  styles.riskBadge,
                  {
                    backgroundColor:
                      riskAnalysis.level === "low" ? "#E8F5E9" :
                      riskAnalysis.level === "moderate" ? "#FFF9C4" :
                      riskAnalysis.level === "high" ? "#FFE0B2" :
                      "#FFCDD2"
                  }
                ]}>
                  <View style={[
                    styles.riskDot,
                    {
                      backgroundColor:
                        riskAnalysis.level === "low" ? "#4CAF50" :
                        riskAnalysis.level === "moderate" ? "#FFC107" :
                        riskAnalysis.level === "high" ? "#FF9800" :
                        "#F44336"
                    }
                  ]} />
                  <Text style={[
                    styles.riskLevelText,
                    {
                      color:
                        riskAnalysis.level === "low" ? "#2E7D32" :
                        riskAnalysis.level === "moderate" ? "#F57F17" :
                        riskAnalysis.level === "high" ? "#E65100" :
                        "#C62828"
                    }
                  ]}>
                    {riskAnalysis.level.toUpperCase()} RISK
                  </Text>
                  <Text style={styles.riskScore}>
                    {riskAnalysis.score}/100
                  </Text>
                </View>

                {/* Summary */}
                <Text style={styles.riskSummary}>{riskAnalysis.summary}</Text>

                {/* Concerning Patterns */}
                {riskAnalysis.concerningPatterns.length > 0 && (
                  <View style={styles.patternsContainer}>
                    <View style={styles.sectionHeaderRow}>
                      <Ionicons name="warning" size={16} color="#FF9800" />
                      <Text style={styles.patternsSectionTitle}>Concerning Patterns</Text>
                    </View>
                    {riskAnalysis.concerningPatterns.map((pattern, index) => (
                      <View key={index} style={styles.patternItem}>
                        <View style={styles.patternBullet} />
                        <Text style={styles.patternText}>{pattern}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Recommendations */}
                <View style={styles.recommendationsContainer}>
                  <View style={styles.sectionHeaderRow}>
                    <Ionicons name="bulb" size={16} color={Colors.primary} />
                    <Text style={styles.recommendationsSectionTitle}>Recommendations</Text>
                  </View>
                  {riskAnalysis.recommendations.map((rec, index) => (
                    <View key={index} style={styles.recommendationItem}>
                      <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                      <Text style={styles.recommendationText}>{rec}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={styles.regenerateButton}
                  onPress={generateRiskAnalysis}
                  disabled={loadingRiskAnalysis}
                >
                  <Ionicons name="refresh" size={16} color={Colors.primary} />
                  <Text style={styles.regenerateButtonText}>Re-analyze</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* AI Mood Predictions */}
          <View style={styles.card}>
            <View style={styles.predictionHeader}>
              <Text style={styles.cardTitle}>AI Mood Predictions</Text>
              <View style={styles.nextWeekButton}>
                <Ionicons name="calendar-outline" size={16} color={theme.colors.text} />
                <Text style={styles.nextWeekText}>Next 1w</Text>
              </View>
            </View>

            {predictions.length === 0 ? (
              <TouchableOpacity
                style={styles.generateButton}
                onPress={generatePredictions}
                disabled={loadingPredictions}
              >
                {loadingPredictions ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={20} color="#FFF" />
                    <Text style={styles.generateButtonText}>Generate Predictions</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <>
                <View style={styles.predictionsGrid}>
                  {predictions.map((pred, index) => (
                    <View key={index} style={styles.predictionDay}>
                      <Text style={styles.predictionEmoji}>{pred.emoji}</Text>
                      <Text style={styles.predictionDayLabel}>{pred.day}</Text>
                      <Text style={styles.predictionConfidence}>{pred.confidence}%</Text>
                    </View>
                  ))}
                </View>
                <TouchableOpacity
                  style={styles.regenerateButton}
                  onPress={generatePredictions}
                  disabled={loadingPredictions}
                >
                  <Ionicons name="refresh" size={16} color={Colors.primary} />
                  <Text style={styles.regenerateButtonText}>Regenerate</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Bottom Padding */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Freud Score Tooltip Modal */}
        <Modal
          visible={showFreudTooltip}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowFreudTooltip(false)}
        >
          <View style={styles.tooltipOverlay}>
            {/* Backdrop to close on outside tap */}
            <Pressable style={styles.backdrop} onPress={() => setShowFreudTooltip(false)} />

            {/* Modal Card */}
            <View style={styles.tooltipContainer}>
              <View style={styles.tooltipHeader}>
                <Text style={styles.tooltipTitle}>How Freud Score is Calculated</Text>
                <TouchableOpacity onPress={() => setShowFreudTooltip(false)}>
                  <Ionicons name="close-circle" size={24} color={theme.colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.tooltipContent}
                contentContainerStyle={styles.tooltipContentContainer}
                showsVerticalScrollIndicator
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.tooltipSection}>
                  <Text style={styles.tooltipSectionTitle}>Overall Score (0-100)</Text>
                  <Text style={styles.tooltipText}>
                    Your overall mental health score is calculated by averaging all mood scores (1-5 scale) 
                    and converting to a 0-100 scale.
                  </Text>
                  <Text style={styles.tooltipFormula}>
                    Formula: (Average Mood Score / 5) × 100
                  </Text>
                </View>

                <View style={styles.tooltipSection}>
                  <Text style={styles.tooltipSectionTitle}>Positive Percentage</Text>
                  <Text style={styles.tooltipText}>
                    Percentage of days where your mood score was 3.5 or higher (content, happy, ecstatic).
                  </Text>
                  <Text style={styles.tooltipFormula}>
                    Current: {freudScore.positive}%
                  </Text>
                </View>

                <View style={styles.tooltipSection}>
                  <Text style={styles.tooltipSectionTitle}>Negative Percentage</Text>
                  <Text style={styles.tooltipText}>
                    Percentage of days where your mood score was below 2.5 (frustrated, sad, angry).
                  </Text>
                  <Text style={styles.tooltipFormula}>
                    Current: {freudScore.negative}%
                  </Text>
                </View>

                <View style={styles.tooltipSection}>
                  <Text style={styles.tooltipSectionTitle}>Trend Analysis</Text>
                  <Text style={styles.tooltipText}>
                    Compares the first half and second half of your selected time period:
                  </Text>
                  <View style={styles.tooltipBulletList}>
                    <Text style={styles.tooltipBullet}>• <Text style={styles.tooltipBulletText}>Improving: Second half average is 0.3+ points higher</Text></Text>
                    <Text style={styles.tooltipBullet}>• <Text style={styles.tooltipBulletText}>Stable: Change is less than 0.3 points</Text></Text>
                    <Text style={styles.tooltipBullet}>• <Text style={styles.tooltipBulletText}>Declining: Second half average is 0.3+ points lower</Text></Text>
                  </View>
                  <Text style={styles.tooltipFormula}>
                    Current Trend: {freudScore.trend}
                  </Text>
                </View>

                <View style={[styles.tooltipSection, { borderBottomWidth: 0 }]}>
                  <Text style={styles.tooltipSectionTitle}>Mood Score Scale</Text>
                  <View style={styles.tooltipBulletList}>
                    <Text style={styles.tooltipBullet}>• <Text style={styles.tooltipBulletText}>5.0: Ecstatic</Text></Text>
                    <Text style={styles.tooltipBullet}>• <Text style={styles.tooltipBulletText}>4.0: Happy</Text></Text>
                    <Text style={styles.tooltipBullet}>• <Text style={styles.tooltipBulletText}>3.0: Content</Text></Text>
                    <Text style={styles.tooltipBullet}>• <Text style={styles.tooltipBulletText}>2.0: Neutral</Text></Text>
                    <Text style={styles.tooltipBullet}>• <Text style={styles.tooltipBulletText}>1.0 and below: Negative moods</Text></Text>
                  </View>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        <BottomNavigation tabs={tabs} activeTab={activeTab} onTabPress={handleTabPress} />
      </View>
    </CurvedBackground>
  );
};

const createStyles = (scaledFontSize: (size: number) => number, theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "transparent",
    },
    scrollView: {
      flex: 1,
    },
    scrollContainer: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.md,
    },
    filterContainer: {
      flexDirection: "row",
      backgroundColor: theme.isDark ? "#2A2A2A" : "#F5F5F5",
      borderRadius: 24,
      padding: 4,
      marginBottom: Spacing.lg,
    },
    filterButton: {
      flex: 1,
      paddingVertical: 8,
      alignItems: "center",
      borderRadius: 20,
    },
    filterButtonActive: {
      backgroundColor: theme.isDark ? "#444" : "#FFF",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    filterButtonText: {
      fontSize: scaledFontSize(13),
      color: theme.colors.textSecondary,
      fontWeight: "500",
    },
    filterButtonTextActive: {
      color: theme.colors.text,
      fontWeight: "600",
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: Spacing.lg,
      marginBottom: Spacing.lg,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    freudCard: {
      alignItems: "center",
    },
    freudHeader: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "stretch",
      justifyContent: "center",
      marginBottom: 4,
    },
    cardTitle: {
      fontSize: scaledFontSize(20),
      fontWeight: "700",
      color: theme.colors.text,
      marginRight: 8,
    },
    helpButton: {
      padding: 4,
    },
    freudSubtitle: {
      fontSize: scaledFontSize(13),
      color: theme.colors.textSecondary,
      marginBottom: Spacing.lg,
    },
    scoreCircle: {
      width: 140,
      height: 140,
      borderRadius: 70,
      backgroundColor: theme.isDark ? "#1a1a1a" : "#F8F8F8",
      alignItems: "center",
      justifyContent: "center",
      marginVertical: Spacing.lg,
      borderWidth: 8,
      borderColor: Colors.primary,
    },
    scoreValue: {
      fontSize: scaledFontSize(48),
      fontWeight: "700",
      color: theme.colors.text,
    },
    scoreLabel: {
      fontSize: scaledFontSize(16),
      color: theme.colors.textSecondary,
      marginTop: -8,
    },
    trendContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: Spacing.lg,
    },
    trendText: {
      fontSize: scaledFontSize(14),
      fontWeight: "600",
      color: theme.colors.text,
    },
    barContainer: {
      width: "100%",
      gap: Spacing.md,
      marginBottom: Spacing.md,
    },
    barRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    barLabel: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      width: 80,
    },
    colorDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    barLabelText: {
      fontSize: scaledFontSize(13),
      color: theme.colors.text,
      fontWeight: "500",
    },
    barTrack: {
      flex: 1,
      height: 8,
      backgroundColor: theme.isDark ? "#2A2A2A" : "#E0E0E0",
      borderRadius: 4,
      overflow: "hidden",
    },
    barFill: {
      height: "100%",
      borderRadius: 4,
    },
    barPercentage: {
      fontSize: scaledFontSize(13),
      color: theme.colors.text,
      fontWeight: "600",
      width: 40,
      textAlign: "right",
    },
    distributionContainer: {
      flexDirection: "row",
      justifyContent: "space-around",
      marginTop: Spacing.lg,
      height: 200,
    },
    distributionBar: {
      alignItems: "center",
      gap: 8,
    },
    distributionBarInner: {
      width: 60,
      height: 150,
      backgroundColor: theme.isDark ? "#2A2A2A" : "#E0E0E0",
      borderRadius: 8,
      justifyContent: "flex-end",
      overflow: "hidden",
    },
    distributionBarFill: {
      width: "100%",
      borderRadius: 8,
    },
    distributionLabel: {
      fontSize: scaledFontSize(12),
      color: theme.colors.text,
      fontWeight: "600",
    },
    distributionPercentage: {
      fontSize: scaledFontSize(11),
      color: theme.colors.textSecondary,
    },
    distributionStatsRow: {
      marginTop: Spacing.md,
      flexDirection: "row",
      justifyContent: "space-between",
    },
    distributionStatsText: {
      fontSize: scaledFontSize(11),
      color: theme.colors.textSecondary,
    },
    predictionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: Spacing.md,
    },
    nextWeekButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 16,
      backgroundColor: theme.isDark ? "#2A2A2A" : "#F5F5F5",
    },
    nextWeekText: {
      fontSize: scaledFontSize(12),
      color: theme.colors.text,
      fontWeight: "500",
    },
    generateButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: Colors.primary,
      paddingVertical: 14,
      borderRadius: 12,
      marginTop: Spacing.md,
    },
    generateButtonText: {
      fontSize: scaledFontSize(15),
      color: "#FFF",
      fontWeight: "600",
    },
    predictionsGrid: {
      flexDirection: "row",
      justifyContent: "space-around",
      marginTop: Spacing.md,
      paddingVertical: Spacing.md,
    },
    predictionDay: {
      alignItems: "center",
      gap: 4,
    },
    predictionEmoji: {
      fontSize: scaledFontSize(28),
    },
    predictionDayLabel: {
      fontSize: scaledFontSize(11),
      color: theme.colors.text,
      fontWeight: "600",
    },
    predictionConfidence: {
      fontSize: scaledFontSize(10),
      color: theme.colors.textSecondary,
    },
    regenerateButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 10,
      marginTop: Spacing.md,
    },
    regenerateButtonText: {
      fontSize: scaledFontSize(13),
      color: Colors.primary,
      fontWeight: "600",
    },
    // Risk Analysis Styles
    riskBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      padding: 16,
      borderRadius: 12,
      marginTop: Spacing.md,
    },
    riskDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
    },
    riskLevelText: {
      flex: 1,
      fontSize: scaledFontSize(16),
      fontWeight: "700",
    },
    riskScore: {
      fontSize: scaledFontSize(18),
      fontWeight: "700",
      color: theme.colors.text,
    },
    riskSummary: {
      fontSize: scaledFontSize(14),
      color: theme.colors.text,
      lineHeight: 22,
      marginTop: Spacing.md,
    },
    patternsContainer: {
      marginTop: Spacing.lg,
      padding: Spacing.md,
      backgroundColor: theme.isDark ? "#2A2A2A" : "#FFF3E0",
      borderRadius: 12,
      borderLeftWidth: 3,
      borderLeftColor: "#FF9800",
    },
    sectionHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: Spacing.sm,
    },
    patternsSectionTitle: {
      fontSize: scaledFontSize(14),
      fontWeight: "600",
      color: theme.colors.text,
    },
    patternItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
      marginTop: 8,
    },
    patternBullet: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: "#FF9800",
      marginTop: 6,
    },
    patternText: {
      flex: 1,
      fontSize: scaledFontSize(13),
      color: theme.colors.text,
      lineHeight: 20,
    },
    recommendationsContainer: {
      marginTop: Spacing.lg,
      padding: Spacing.md,
      backgroundColor: theme.isDark ? "#2A2A2A" : "#E8F5E9",
      borderRadius: 12,
      borderLeftWidth: 3,
      borderLeftColor: "#4CAF50",
    },
    recommendationsSectionTitle: {
      fontSize: scaledFontSize(14),
      fontWeight: "600",
      color: theme.colors.text,
    },
    recommendationItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
      marginTop: 8,
    },
    recommendationText: {
      flex: 1,
      fontSize: scaledFontSize(13),
      color: theme.colors.text,
      lineHeight: 20,
    },
    // Tooltip Modal Styles
    tooltipOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
      padding: Spacing.lg,
      position: "relative",
    },
    backdrop: {
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      backgroundColor: "transparent",
    },
    tooltipContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      width: "100%",
      maxWidth: 500,
      maxHeight: "85%",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
      overflow: "hidden",
      flexShrink: 1,
    },
    tooltipHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: Spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: theme.isDark ? "#333" : "#E0E0E0",
    },
    tooltipTitle: {
      fontSize: scaledFontSize(18),
      fontWeight: "700",
      color: theme.colors.text,
      flex: 1,
    },
    tooltipContent: {
      padding: Spacing.lg,
    },
    tooltipContentContainer: {
      paddingBottom: Spacing.lg,
    },
    tooltipSection: {
      marginBottom: Spacing.lg,
      paddingBottom: Spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: theme.isDark ? "#333" : "#E0E0E0",
    },
    tooltipSectionTitle: {
      fontSize: scaledFontSize(16),
      fontWeight: "600",
      color: Colors.primary,
      marginBottom: Spacing.sm,
    },
    tooltipText: {
      fontSize: scaledFontSize(14),
      color: theme.colors.text,
      lineHeight: 22,
      marginBottom: Spacing.sm,
    },
    tooltipFormula: {
      fontSize: scaledFontSize(13),
      color: theme.colors.textSecondary,
      fontStyle: "italic",
      backgroundColor: theme.isDark ? "#2A2A2A" : "#F5F5F5",
      padding: Spacing.sm,
      borderRadius: 8,
      fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    },
    tooltipBulletList: {
      marginTop: Spacing.sm,
      gap: 6,
    },
    tooltipBullet: {
      fontSize: scaledFontSize(14),
      color: theme.colors.textSecondary,
    },
    tooltipBulletText: {
      color: theme.colors.text,
    },
  });

export default StatisticsScreen;
