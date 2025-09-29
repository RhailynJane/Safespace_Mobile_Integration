// utils/assessmentTracker.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@clerk/clerk-expo";

// Use your computer's IP for physical devices or emulator address
const API_URL = "http://10.0.2.2:3001"; // For Android emulator
// const API_URL = "http://192.168.1.100:3001"; // For physical device (update IP)

export const assessmentTracker = {
  // Check if assessment is due (from database)
  async isAssessmentDue(clerkUserId: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${API_URL}/api/assessments/is-due/${clerkUserId}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
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
      const sixMonths = 6 * 30 * 24 * 60 * 60 * 1000;

      return timeDiff >= sixMonths;
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
      const response = await fetch(`${API_URL}/api/assessments/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clerkUserId,
          responses,
          totalScore,
          assessmentType: "pre-survey",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit assessment");
      }

      const data = await response.json();
      console.log("Assessment submitted successfully:", data);

      // Also update local storage as backup
      await AsyncStorage.setItem(
        "last_assessment_date",
        new Date().toISOString()
      );
    } catch (error) {
      console.error("Error submitting assessment:", error);
      throw error;
    }
  },

  // Get assessment history
  async getAssessmentHistory(clerkUserId: string): Promise<any[]> {
    try {
      const response = await fetch(
        `${API_URL}/api/assessments/history/${clerkUserId}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.assessments || [];
    } catch (error) {
      console.error("Error fetching assessment history:", error);
      return [];
    }
  },
};