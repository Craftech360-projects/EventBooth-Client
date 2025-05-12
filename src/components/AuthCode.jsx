import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Alert,
  Chip,
} from "@mui/material";

const AuthCode = ({ serviceRequest, onClose }) => {
  const [authCode, setAuthCode] = useState("");
  const [timeLeft, setTimeLeft] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentTimeWindow, setCurrentTimeWindow] = useState(0);

  // Generate a code that can be verified by the server
  const generateCode = async () => {
    try {
      if (!serviceRequest || !serviceRequest.id) {
        setError("Invalid service request data");
        return;
      }

      // Calculate the current time window (30-second intervals)
      const timestamp = Math.floor(Date.now() / 30000);

      // Generate a deterministic code based on serviceId and timestamp
      const seed = `${serviceRequest.id}_${timestamp}`;

      // Use Web Crypto API instead of Node.js crypto
      const encoder = new TextEncoder();
      const data = encoder.encode(seed);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);

      // Convert hash to hex string
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      // Take the first 6 digits of the hash
      const min = 100000; // Smallest 6-digit number
      const max = 999999; // Largest 6-digit number

      // Convert the first 8 characters of the hash to a number between min and max
      const hashNum = parseInt(hashHex.substring(0, 8), 16);
      const randomCode = (hashNum % (max - min + 1)) + min;

      // Convert to string and ensure it's 6 digits
      const code = String(randomCode).padStart(6, "0");

      setAuthCode(code);
    } catch (err) {
      console.error("Error generating auth code:", err);
      setError("Failed to generate authentication code");
    }
  };

  // Check for time window changes to regenerate code
  useEffect(() => {
    const checkTimeWindow = () => {
      const newTimeWindow = Math.floor(Date.now() / 1000 / 30); // 30 seconds step
      if (newTimeWindow !== currentTimeWindow) {
        setCurrentTimeWindow(newTimeWindow);
        generateCode();
      }
    };

    // Check time window every second
    const timeWindowChecker = setInterval(checkTimeWindow, 1000);
    return () => clearInterval(timeWindowChecker);
  }, [currentTimeWindow, serviceRequest]);

  // Initialize code and timer
  useEffect(() => {
    if (!serviceRequest) {
      setError("Service request information is missing");
      return;
    }

    setLoading(true);

    try {
      // Set initial time window
      const initialTimeWindow = Math.floor(Date.now() / 1000 / 30);
      setCurrentTimeWindow(initialTimeWindow);

      // Generate initial code
      generateCode();
      setLoading(false);
    } catch (err) {
      setError("Failed to initialize authentication code");
      setLoading(false);
    }

    // Set up timer to count down seconds
    const timer = setInterval(() => {
      const secondsIntoWindow = (Date.now() / 1000) % 30;
      const secondsLeft = Math.ceil(30 - secondsIntoWindow);

      setTimeLeft(secondsLeft);
    }, 1000);

    return () => clearInterval(timer);
  }, [serviceRequest]);

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 400, mx: "auto" }}>
      <Typography variant="h5" gutterBottom>
        Authentication Code
      </Typography>

      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ my: 2 }}>
          {error}
        </Alert>
      ) : (
        <>
          <Typography variant="body2" color="text.secondary" paragraph>
            Use this code to authenticate your {serviceRequest?.serviceName}{" "}
            application. The code will refresh in {timeLeft} seconds.
          </Typography>

          <Box display="flex" flexDirection="column" alignItems="center" my={3}>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Service ID: {serviceRequest?.id}
            </Typography>

            <Box sx={{ my: 2 }}>
              <Chip
                label={authCode}
                color="primary"
                sx={{
                  fontSize: "24px",
                  py: 3,
                  letterSpacing: 2,
                  fontWeight: "bold",
                }}
              />
            </Box>

            <Typography variant="caption" color="text.secondary">
              Refreshes in: {timeLeft}s
            </Typography>
          </Box>

          <Box display="flex" justifyContent="space-between" mt={3}>
            <Button variant="outlined" color="primary" onClick={onClose}>
              Close
            </Button>
            <Button variant="contained" color="primary" onClick={generateCode}>
              Refresh Code
            </Button>
          </Box>
        </>
      )}
    </Paper>
  );
};

export default AuthCode;
