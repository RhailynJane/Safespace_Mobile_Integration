// utils/assessmentTracker.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiService } from "./api";

const ASSESSMENT_INTERVAL = 6 * 30 * 24 * 60 * 60 * 1000; // 6 months

export const assessmentTracker = {
  // Check if assessment is due (from database)
  async isAssessmentDue(clerkUserId: string): Promise<boolean> {
    try {
      const data = await apiService.isAssessmentDue(clerkUserId);
      return data.isDue;
    } catch (error) {
      console.error("Error checking assessment due date:", error);
      // Fallback to local storage if API fails
      return this.isAssessmentDueLocal();
    }
  },

  // Local fallback
  async isAssessmentDueLocal(): Promise<boolean> {
    try {
      const lastAssessmentDate = await AsyncStorage.getItem("last_assessment_date");
      
      if (!lastAssessmentDate) {
        return true;
      }

      const lastDate = new Date(lastAssessmentDate);
      const now = new Date();
      const timeDiff = now.getTime() - lastDate.getTime();

      return timeDiff >= ASSESSMENT_INTERVAL;
    } catch (error) {
      console.error("Error checking local assessment date:", error);
      return false;
    }
  },

  // Submit assessment to database
  async submitAssessment(
    clerkUserId: string,
    responses: Record<string, number>,
    totalScore: number
  ): Promise<void> {
    try {
      await apiService.submitAssessment({
        clerkUserId,
        responses,
        totalScore,
        assessmentType: "pre-survey",
      });

      // Also update local storage as backup
      await AsyncStorage.setItem(
        "last_assessment_date",
        new Date().toISOString()
      );
      
      console.log("Assessment submitted successfully");
    } catch (error) {
      console.error("Error submitting assessment:", error);
      throw error;
    }
  },

  // Get assessment history
  async getAssessmentHistory(clerkUserId: string): Promise<any[]> {
    try {
      const data = await apiService.getAssessmentHistory(clerkUserId);
      return data.assessments || [];
    } catch (error) {
      console.error("Error fetching assessment history:", error);
      return [];
    }
  },

  // Get latest assessment
  async getLatestAssessment(clerkUserId: string): Promise<any | null> {
    try {
      const data = await apiService.getLatestAssessment(clerkUserId);
      return data.assessment;
    } catch (error) {
      console.error("Error fetching latest assessment:", error);
      return null;
    }
  },

  // For testing: Reset assessment
  async resetAssessment(): Promise<void> {
    try {
      await AsyncStorage.removeItem("last_assessment_date");
      console.log("Assessment reset locally");
    } catch (error) {
      console.error("Error resetting assessment:", error);
    }
  }
};