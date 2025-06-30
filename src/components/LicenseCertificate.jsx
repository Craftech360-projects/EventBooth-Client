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
        const cert = await generateLicenseCertificate(serviceRequest);
        setCertificate(cert);
      } catch (err) {
        setError("Failed to generate license certificate.");
      } finally {
        setLoading(false);
      }
    };

    generateCertificate();
  }, [serviceRequest]);

  const handleDownload = () => {
    if (certificate) {
      downloadCertificate(certificate);
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        License Key
      </Typography>

      {loading ? (
        <CircularProgress />
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <>
          <Typography variant="body2" color="text.secondary" paragraph>
            This license key allows offline authentication for the photobooth.
            Download and keep it secure.
          </Typography>

          <TextField
            fullWidth
            multiline
            rows={8}
            value={certificate}
            InputProps={{ readOnly: true }}
            sx={{ my: 2, fontFamily: "monospace" }}
          />

          <Box display="flex" justifyContent="space-between" mt={3}>
            <Button variant="outlined" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="contained"
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