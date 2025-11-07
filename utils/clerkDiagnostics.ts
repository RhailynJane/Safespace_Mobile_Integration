/**
 * Clerk Diagnostics Utility
 * 
 * Use this to diagnose Clerk configuration issues
 * Especially useful for debugging email verification problems
 */

export const clerkDiagnostics = {
  /**
   * Check if Clerk is properly initialized
   */
  checkClerkConfig: () => {
    const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
    
    console.log("🔍 Clerk Configuration Diagnostics");
    console.log("===================================");
    
    if (!publishableKey) {
      console.error("❌ EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY is not set!");
      console.error("   Add it to your .env file or environment variables");
      return false;
    }
    
    console.log("✅ Publishable key found");
    console.log("   Key prefix:", publishableKey.substring(0, 15) + "...");
    
    // Check if it's a test or live key
    if (publishableKey.startsWith("pk_test_")) {
      console.log("🧪 Using TEST mode");
      console.log("   Email delivery might be limited in test mode");
    } else if (publishableKey.startsWith("pk_live_")) {
      console.log("🚀 Using LIVE mode");
    } else {
      console.warn("⚠️  Unknown key format");
    }
    
    return true;
  },

  /**
   * Log signup attempt details
   */
  logSignupAttempt: (email: string, step: string) => {
    console.log("📝 Signup Attempt");
    console.log("================");
    console.log("Email:", email);
    console.log("Step:", step);
    console.log("Timestamp:", new Date().toISOString());
    console.log("================");
  },

  /**
   * Log email verification details
   */
  logEmailVerification: (email: string, success: boolean, error?: any) => {
    console.log("📧 Email Verification Request");
    console.log("============================");
    console.log("Email:", email);
    console.log("Status:", success ? "✅ Sent" : "❌ Failed");
    
    if (error) {
      console.error("Error details:", JSON.stringify(error, null, 2));
      
      if (error.errors && Array.isArray(error.errors)) {
        console.error("Clerk errors:");
        error.errors.forEach((err: any, idx: number) => {
          console.error(`  ${idx + 1}. ${err.message}`);
          console.error(`     Code: ${err.code}`);
        });
      }
    }
    
    console.log("============================");
    console.log("💡 Troubleshooting tips:");
    console.log("   1. Check your spam/junk folder");
    console.log("   2. Verify email settings in Clerk Dashboard");
    console.log("   3. Try a different email address");
    console.log("   4. Check Clerk Dashboard > User & Authentication > Email");
    console.log("============================");
  },

  /**
   * Get recommendations based on error
   */
  getRecommendations: (error: any): string[] => {
    const recommendations: string[] = [];

    if (!error) return recommendations;

    const errorStr = JSON.stringify(error).toLowerCase();

    if (errorStr.includes("captcha")) {
      recommendations.push("Clear browser cache and try again");
      recommendations.push("Try from a different browser or device");
      recommendations.push("Check if you have ad blockers that might interfere");
    }

    if (errorStr.includes("email") || errorStr.includes("verification")) {
      recommendations.push("Check your Clerk Dashboard email settings");
      recommendations.push("Verify that email verification is enabled");
      recommendations.push("Check spam/junk folder");
      recommendations.push("Try a different email address (Gmail, Outlook, etc.)");
    }

    if (errorStr.includes("rate") || errorStr.includes("limit")) {
      recommendations.push("You may have hit a rate limit");
      recommendations.push("Wait a few minutes before trying again");
      recommendations.push("Check Clerk Dashboard for rate limit settings");
    }

    if (errorStr.includes("network") || errorStr.includes("timeout")) {
      recommendations.push("Check your internet connection");
      recommendations.push("Try again in a few moments");
    }

    // Default recommendations
    if (recommendations.length === 0) {
      recommendations.push("Check the Clerk Dashboard for any alerts");
      recommendations.push("Review Clerk status page: https://status.clerk.com");
      recommendations.push("Contact Clerk support if the issue persists");
    }

    return recommendations;
  },

  /**
   * Display troubleshooting info
   */
  displayTroubleshooting: (error?: any) => {
    console.log("\n🔧 Troubleshooting Steps");
    console.log("=======================");
    
    const recommendations = clerkDiagnostics.getRecommendations(error);
    recommendations.forEach((rec, idx) => {
      console.log(`${idx + 1}. ${rec}`);
    });
    
    console.log("=======================\n");
  }
};

/**
 * Helper function to test email sending
 * Call this from your signup screen to test
 */
export const testEmailDelivery = async (signUp: any, email: string) => {
  console.log("\n🧪 Testing Email Delivery");
  console.log("========================");
  console.log("Email:", email);
  
  try {
    await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
    console.log("✅ Email verification request successful");
    console.log("📬 Check your email inbox (and spam folder)");
    return { success: true };
  } catch (error: any) {
    console.error("❌ Email verification request failed");
    clerkDiagnostics.logEmailVerification(email, false, error);
    clerkDiagnostics.displayTroubleshooting(error);
    return { success: false, error };
  } finally {
    console.log("========================\n");
  }
};
