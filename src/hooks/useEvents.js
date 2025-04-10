import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  Timestamp,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { authenticator } from "otplib";
import { useAuth } from "../contexts/AuthContext";

export const useEvents = () => {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      if (!currentUser) return;

      try {
        setLoading(true);
        const q = query(
          collection(db, "events"),
          where("userId", "==", currentUser.uid)
        );
        const querySnapshot = await getDocs(q);
        const eventsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setEvents(eventsData);
      } catch (err) {
        console.error("Error fetching events:", err);
        setError("Failed to load events. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [currentUser]);

  const createEvent = async (eventData) => {
    try {
      setLoading(true);

      // Convert dates to Firestore Timestamps
      const startTimestamp = Timestamp.fromDate(eventData.startDateTime);
      const endTimestamp = Timestamp.fromDate(eventData.endDateTime);

      // Create event document
      const newEventData = {
        ...eventData,
        startDateTime: startTimestamp,
        endDateTime: endTimestamp,
        userId: currentUser.uid,
        createdAt: Timestamp.now(),
        secret: authenticator.generateSecret(), // Generate a secret for OTP
      };

      const docRef = await addDoc(collection(db, "events"), newEventData);

      // Update local state
      const newEvent = { id: docRef.id, ...newEventData };
      setEvents((prevEvents) => [...prevEvents, newEvent]);

      return newEvent;
    } catch (err) {
      console.error("Error creating event:", err);
      setError("Failed to create event. Please try again later.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateEvent = async (eventId, updatedData) => {
    try {
      setLoading(true);

      // Convert dates to Firestore Timestamps if they exist in the updated data
      const processedData = { ...updatedData };
      if (updatedData.startDateTime) {
        processedData.startDateTime = Timestamp.fromDate(
          updatedData.startDateTime
        );
      }
      if (updatedData.endDateTime) {
        processedData.endDateTime = Timestamp.fromDate(updatedData.endDateTime);
      }

      // Update the event in Firestore
      const eventRef = doc(db, "events", eventId);
      await updateDoc(eventRef, processedData);

      // Update local state
      setEvents((prevEvents) =>
        prevEvents.map((event) =>
          event.id === eventId ? { ...event, ...processedData } : event
        )
      );

      return { id: eventId, ...processedData };
    } catch (err) {
      console.error("Error updating event:", err);
      setError("Failed to update event. Please try again later.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const generateAuthCode = (event) => {
    if (!event || !event.secret) {
      setError("Cannot generate authentication code for this event.");
      return null;
    }

    return authenticator.generate(event.secret);
  };

  return {
    events,
    loading,
    error,
    createEvent,
    updateEvent,
    generateAuthCode,
  };
};
