import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  generateLicenseCertificate,
  downloadCertificate,
} from "../hooks/licenseService";

const LicenseCertificate = ({ serviceRequest, onClose }) => {
  const [certificate, setCertificate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const generateCertificate = async () => {
      if (!serviceRequest) {
        setError("Service request information is missing");
        setLoading(false);
        return;
      }

      try {
        // Set default dates if not available in the service request
        // Use current date for start and add 1 year for end date
        const now = new Date();
        const oneYearLater = new Date();
        oneYearLater.setFullYear(now.getFullYear() + 1);

        // Properly convert dates to ensure they're valid Date objects
        let startDate, endDate;

        // Handle startDateTime
        if (serviceRequest.startDateTime) {
          if (
            typeof serviceRequest.startDateTime === "object" &&
            serviceRequest.startDateTime.toDate
          ) {
            // Handle Firestore Timestamp
            startDate = serviceRequest.startDateTime.toDate();
          } else if (serviceRequest.startDateTime instanceof Date) {
            // Already a Date object
            startDate = serviceRequest.startDateTime;
          } else if (typeof serviceRequest.startDateTime === "string") {
            // Parse string to Date
            startDate = new Date(serviceRequest.startDateTime);
          } else if (typeof serviceRequest.startDateTime.seconds === "number") {
            // Handle Firestore Timestamp-like object
            startDate = new Date(serviceRequest.startDateTime.seconds * 1000);
          } else {
            // Fallback to current date
            startDate = now;
          }
        } else {
          startDate = now;
        }

        // Handle endDateTime
        if (serviceRequest.endDateTime) {
          if (
            typeof serviceRequest.endDateTime === "object" &&
            serviceRequest.endDateTime.toDate
          ) {
            // Handle Firestore Timestamp
            endDate = serviceRequest.endDateTime.toDate();
          } else if (serviceRequest.endDateTime instanceof Date) {
            // Already a Date object
            endDate = serviceRequest.endDateTime;
          } else if (typeof serviceRequest.endDateTime === "string") {
            // Parse string to Date
            endDate = new Date(serviceRequest.endDateTime);
          } else if (typeof serviceRequest.endDateTime.seconds === "number") {
            // Handle Firestore Timestamp-like object
            endDate = new Date(serviceRequest.endDateTime.seconds * 1000);
          } else {
            // Fallback to one year later
            endDate = oneYearLater;
          }
        } else {
          endDate = oneYearLater;
        }

        // Validate dates
        if (isNaN(startDate.getTime())) {
          console.error("Invalid start date:", serviceRequest.startDateTime);
          startDate = now;
        }

        if (isNaN(endDate.getTime())) {
          console.error("Invalid end date:", serviceRequest.endDateTime);
          endDate = oneYearLater;
        }

        // Ensure we have a valid deviceId
        const deviceId =
          serviceRequest.deviceId ||
          `device_${Math.random().toString(36).substring(2, 15)}`;

        console.log("Using dates:", {
          startDate,
          endDate,
          deviceId,
        });

        const cert = await generateLicenseCertificate(
          serviceRequest.userId || "anonymous",
          serviceRequest.id,
          serviceRequest.serviceId,
          deviceId,
          startDate,
          endDate
        );

        setCertificate(cert);
      } catch (err) {
        console.error("Error generating certificate:", err);
        setError(
          "Failed to generate license certificate: " +
            (err.message || "Unknown error")
        );
      } finally {
        setLoading(false);
      }
    };

    generateCertificate();
  }, [serviceRequest]);

  const handleDownload = () => {
    if (!certificate) {
      setError("No certificate available to download");
      return;
    }

    try {
      downloadCertificate(certificate, serviceRequest?.serviceName);
    } catch (err) {
      console.error("Error downloading license key:", err);
      setError(
        "Failed to download license key: " + (err.message || "Unknown error")
      );
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 600, mx: "auto" }}>
      <Typography variant="h5" gutterBottom>
        License Key
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
            This license key allows offline authentication for the{" "}
            {serviceRequest?.serviceName} service. Please download and keep it
            secure.
          </Typography>

          <TextField
            fullWidth
            multiline
            rows={6}
            value={certificate}
            InputProps={{ readOnly: true }}
            sx={{ my: 2, fontFamily: "monospace" }}
          />

          <Box display="flex" justifyContent="space-between" mt={3}>
            <Button variant="outlined" color="primary" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleDownload}
              disabled={!certificate}
            >
              Download Key
            </Button>
          </Box>
        </>
      )}
    </Paper>
  );
};

export default LicenseCertificate;
