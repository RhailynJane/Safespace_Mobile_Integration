// lib/api.ts
const getBaseURL = () => {
  if (__DEV__) {
    // Replace with YOUR actual IP address
    return "http://192.168.1.100:3001";
  } else {
    return "https://your-production-api.com";
  }
};

const API_BASE_URL = getBaseURL();
export interface SyncUserData {
  clerkUserId: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

export const syncUserToDatabase = async (userData: SyncUserData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/sync-user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to sync user");
    }

    return data;
  } catch (error) {
    console.error("API call failed:", error);
    throw error;
  }
};
