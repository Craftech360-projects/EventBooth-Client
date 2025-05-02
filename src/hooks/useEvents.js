import { useState, useEffect } from "react";
import apiService from "../services/apiService";
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
        const { data } = await apiService.events.getAll();
        setEvents(data);
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
      const { data } = await apiService.events.create(eventData);

      // Update local state
      setEvents((prevEvents) => [...prevEvents, data]);
      return data;
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
      const { data } = await apiService.events.update(eventId, updatedData);

      // Update local state
      setEvents((prevEvents) =>
        prevEvents.map((event) =>
          event.id === eventId ? { ...event, ...data } : event
        )
      );

      return data;
    } catch (err) {
      console.error("Error updating event:", err);
      setError("Failed to update event. Please try again later.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const generateAuthCode = async (eventId) => {
    try {
      const { data } = await apiService.events.generateAuthCode(eventId);
      return data.authCode;
    } catch (err) {
      console.error("Error generating auth code:", err);
      setError(
        "Failed to generate authentication code. Please try again later."
      );
      return null;
    }
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
