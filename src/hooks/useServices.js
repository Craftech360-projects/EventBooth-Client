import { useState, useEffect } from "react";
import apiService from "../services/apiService";

const useServices = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        const { data } = await apiService.serviceRequests.getAll();
        setServices(data.data || []); // Access the data property of the response
      } catch (error) {
        console.error("Error fetching services:", error);
        setError("Failed to load services");
        setServices([]); // Set empty array on error
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  return { services, loading, error };
};

export default useServices;
