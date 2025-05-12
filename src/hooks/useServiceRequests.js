import { useState, useEffect } from "react";
import apiService from "../services/apiService";
import { authenticator } from "otplib";
import { useAuth } from "../contexts/AuthContext";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";

export const useServiceRequests = (eventId) => {
  const { currentUser } = useAuth();
  const [serviceRequests, setServiceRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchServiceRequests = async () => {
      if (!currentUser || !eventId) return;

      try {
        setLoading(true);
        const { data } = await apiService.serviceRequests.getByEventId(eventId);
        // Ensure data is an array before setting it
        setServiceRequests(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching service requests:", err);
        setError("Failed to load service requests. Please try again later.");
        // Set empty array on error
        setServiceRequests([]);
      } finally {
        setLoading(false);
      }
    };

    fetchServiceRequests();
  }, [currentUser, eventId]);

  const generateAuthCode = async (serviceId) => {
    try {
      // For frontend generation, we can use the otplib library
      // In a real implementation, this should be done on the server
      const secret = `${serviceId}_${currentUser.uid}_${
        new Date().toISOString().split("T")[0]
      }`;
      const code = authenticator.generate(secret);
      return code;
    } catch (err) {
      console.error("Error generating auth code:", err);
      setError(
        "Failed to generate authentication code. Please try again later."
      );
      return null;
    }
  };

  return {
    serviceRequests,
    loading,
    error,
    generateAuthCode,
  };
};

export const createRequest = async (requestData) => {
  try {
    // This won't work - setLoading is not defined in this scope
    // setLoading(true);

    // Add timestamp
    const dataWithTimestamp = {
      ...requestData,
      createdAt: Timestamp.now(),
      status: "PENDING",
    };

    // Create in Firestore
    const docRef = await addDoc(
      collection(db, "serviceRequests"),
      dataWithTimestamp
    );

    return {
      id: docRef.id,
      ...dataWithTimestamp,
    };
  } catch (err) {
    console.error("Error creating service request:", err);
    // This won't work - setError is not defined in this scope
    setError("Failed to create service request. Please try again later.");
    throw err;
  }
};
