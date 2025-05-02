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

const LicenseCertificate = ({ event, onClose }) => {
  const [certificate, setCertificate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!event) {
      setError("Event information is missing");
      setLoading(false);
      return;
    }

    // Calculate expiration date (1 year from now by default)
    const expirationDate = event.endDateTime
      ? new Date(
          event.endDateTime.toDate().getTime() + 365 * 24 * 60 * 60 * 1000
        )
      : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    generateLicenseCertificate(event.userId, event.id, expirationDate)
      .then((cert) => {
        setCertificate(cert);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error generating certificate:", err);
        setError("Failed to generate license certificate");
        setLoading(false);
      });
  }, [event]);

  const handleDownload = () => {
    downloadCertificate(certificate, event?.name);
  };

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 600, mx: "auto" }}>
      <Typography variant="h5" gutterBottom>
        License Certificate
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
            This license certificate allows offline authentication for the
            Photobooth app. Please download and keep it secure.
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
            >
              Download Certificate
            </Button>
          </Box>
        </>
      )}
    </Paper>
  );
};

export default LicenseCertificate;
