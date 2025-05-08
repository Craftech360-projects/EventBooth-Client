import { useState } from "react";
import apiService from "../services/apiService";
import { collection, addDoc, query, where, getDocs, Timestamp } from "firebase/firestore";
import { db } from "../firebase/config";

export const useServiceRequests = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getRequestsByEventId = async (eventId) => {
    try {
      setLoading(true);
      const requestsQuery = query(
        collection(db, "serviceRequests"),
        where("eventId", "==", eventId)
      );
      const requestsSnapshot = await getDocs(requestsQuery);
      const requestsData = requestsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return requestsData;
    } catch (err) {
      console.error("Error fetching service requests:", err);
      setError("Failed to load service requests. Please try again later.");
      return [];
    } finally {
      setLoading(false);
    }
  };

  const createRequest = async (requestData) => {
    try {
      setLoading(true);
      
      // Add timestamp
      const dataWithTimestamp = {
        ...requestData,
        createdAt: Timestamp.now(),
        status: "PENDING"
      };
      
      // Create in Firestore
      const docRef = await addDoc(collection(db, "serviceRequests"), dataWithTimestamp);
      
      return {
        id: docRef.id,
        ...dataWithTimestamp
      };
    } catch (err) {
      console.error("Error creating service request:", err);
      setError("Failed to create service request. Please try again later.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    getRequestsByEventId,
    createRequest
  };
};