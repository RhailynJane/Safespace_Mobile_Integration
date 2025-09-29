// utils/assessmentTracker.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

const ASSESSMENT_KEY = "last_assessment_date";
const ASSESSMENT_INTERVAL = 6 * 30 * 24 * 60 * 60 * 1000; // 6 months in milliseconds

export const assessmentTracker = {
  // Check if assessment is due
  async isAssessmentDue(): Promise<boolean> {
    try {
      const lastAssessmentDate = await AsyncStorage.getItem(ASSESSMENT_KEY);
      
      // If no assessment has been completed, it's due (first time user)
      if (!lastAssessmentDate) {
        return true;
      }

      const lastDate = new Date(lastAssessmentDate);
      const now = new Date();
      const timeDiff = now.getTime() - lastDate.getTime();

      // Check if 6 months have passed
      return timeDiff >= ASSESSMENT_INTERVAL;
    } catch (error) {
      console.error("Error checking assessment due date:", error);
      return false;
    }
  },

  // Mark assessment as completed
  async markAssessmentCompleted(): Promise<void> {
    try {
      const now = new Date().toISOString();
      await AsyncStorage.setItem(ASSESSMENT_KEY, now);
      console.log("Assessment marked as completed:", now);
    } catch (error) {
      console.error("Error marking assessment completed:", error);
    }
  },

  // Get days until next assessment
  async getDaysUntilNextAssessment(): Promise<number | null> {
    try {
      const lastAssessmentDate = await AsyncStorage.getItem(ASSESSMENT_KEY);
      
      if (!lastAssessmentDate) {
        return null;
      }

      const lastDate = new Date(lastAssessmentDate);
      const nextDueDate = new Date(lastDate.getTime() + ASSESSMENT_INTERVAL);
      const now = new Date();
      const daysRemaining = Math.ceil((nextDueDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

      return daysRemaining;
    } catch (error) {
      console.error("Error calculating days until next assessment:", error);
      return null;
    }
  },

  // For testing: Reset assessment
  async resetAssessment(): Promise<void> {
    try {
      await AsyncStorage.removeItem(ASSESSMENT_KEY);
      console.log("Assessment reset");
    } catch (error) {
      console.error("Error resetting assessment:", error);
    }
  }
};