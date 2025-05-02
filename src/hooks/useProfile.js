import { useState } from "react";
import apiService from "../services/apiService";
import { useAuth } from "../contexts/AuthContext";

export const useProfile = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateProfile = async (profileData) => {
    if (!currentUser) {
      setError("User not authenticated");
      return null;
    }

    try {
      setLoading(true);
      const { data } = await apiService.users.updateProfile(profileData);
      return data;
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Failed to update profile. Please try again later.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getProfile = async () => {
    if (!currentUser) {
      setError("User not authenticated");
      return null;
    }

    try {
      setLoading(true);
      const { data } = await apiService.users.getProfile();
      return data;
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError("Failed to fetch profile. Please try again later.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    updateProfile,
    getProfile,
  };
};
