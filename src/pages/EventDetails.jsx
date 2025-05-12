import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import useServices from "../hooks/useServices";
import apiService from "../services/apiService";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { addHours } from "date-fns";
import { generateUniqueHexId } from "../utils/generateCode";
import LicenseCertificate from "../components/LicenseCertificate";
import AuthCode from "../components/AuthCode";

import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Chip,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";

import { format } from "date-fns";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "../firebase/config";

const EventDetails = () => {
  const { eventId } = useParams();

  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { services, loading: servicesLoading } = useServices();

  // Initialize serviceRequests as an empty array
  const [serviceRequests, setServiceRequests] = useState([]);
  const [serviceRequestsLoading, setServiceRequestsLoading] = useState(true);
  const [serviceRequestsError, setServiceRequestsError] = useState(null);

  const [selectedStartTime, setSelectedStartTime] = useState(new Date());
  const [deviceId] = useState(generateUniqueHexId());

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openRequestModal, setOpenRequestModal] = useState(false);
  const [selectedService, setSelectedService] = useState("");
  const [requestLoading, setRequestLoading] = useState(false);
  const [openAuthCodeModal, setOpenAuthCodeModal] = useState(false);
  const [openLicenseModal, setOpenLicenseModal] = useState(false);
  const [selectedServiceRequest, setSelectedServiceRequest] = useState(null);

  // Define the missing handler functions
  const handleGetCode = (request) => {
    setSelectedServiceRequest(request);
    setOpenAuthCodeModal(true);
  };

  const handleGetCertificate = (request) => {
    setSelectedServiceRequest(request);
    setOpenLicenseModal(true);
  };

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setLoading(true);
        const { data } = await apiService.events.getById(eventId);

        setEvent(data);
      } catch (err) {
        console.error("Error fetching event details:", err);
        setError("Failed to load event details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchEventDetails();
    }
  }, [eventId]);

  // Add a separate effect for fetching service requests
  useEffect(() => {
    const fetchServiceRequests = async () => {
      if (!eventId) return;

      try {
        setServiceRequestsLoading(true);
        const response = await apiService.serviceRequests.getByEventId(eventId);
        console.log("Service Requests Response:", response);

        // Check if response.data exists and is properly structured
        if (response && response.data) {
          // If data is directly an array, use it; otherwise check if it has a data property
          const requestsData = Array.isArray(response.data)
            ? response.data
            : response.data.data || [];

          console.log("Processed Service Requests:", requestsData);
          setServiceRequests(requestsData);
        } else {
          console.error("Invalid response format:", response);
          setServiceRequests([]);
        }
      } catch (err) {
        console.error("Error fetching service requests:", err);
        setServiceRequestsError("Failed to load service requests");
        // Ensure serviceRequests is an array even on error
        setServiceRequests([]);
      } finally {
        setServiceRequestsLoading(false);
      }
    };

    fetchServiceRequests();
  }, [eventId]);

  const parseDate = (dateString) => {
    if (!dateString) return new Date();
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? new Date() : date;
  };

  const calculateEndTime = (startTime, plan) => {
    switch (plan?.toLowerCase()) {
      case "silver":
        return addHours(startTime, 24);
      case "gold":
        return addHours(startTime, 48);
      case "platinum":
        return addHours(startTime, 72);
      default:
        return addHours(startTime, 24); // Default to Silver plan
    }
  };

  const handleRequestService = async () => {
    if (!selectedService) return;

    try {
      setRequestLoading(true);

      // Find the selected service details
      const serviceDetails = services.find((s) => s.id === selectedService);

      const startDateTime = selectedStartTime;
      const endDateTime = calculateEndTime(startDateTime, currentUser?.plan);

      // Create service request in Firestore
      const requestData = {
        eventId,
        userId: currentUser.uid,
        serviceId: selectedService,
        serviceName: serviceDetails.name,
        status: "ACCEPTED",
        startDateTime,
        endDateTime,
        deviceId, // Use the auto-generated deviceId instead of macId
        createdAt: Timestamp.now(),
      };

      const docRef = await addDoc(
        collection(db, "serviceRequests"),
        requestData
      );

      // Add the new request to the local state
      setServiceRequests((prev) => [
        ...prev,
        {
          id: docRef.id,
          ...requestData,
        },
      ]);

      // Close modal and reset selection
      setOpenRequestModal(false);
      setSelectedService("");
      setSelectedStartTime(new Date());
    } catch (err) {
      console.error("Error requesting service:", err);
      setError("Failed to request service. Please try again later.");
    } finally {
      setRequestLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!event) {
    return (
      <Alert severity="warning" sx={{ mt: 2 }}>
        Event not found.
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Box>
          <Typography variant="h5" component="h5">
            {event.name}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          color="primary"
          onClick={() => navigate("/events")}
        >
          Back to Events
        </Button>
      </Box>

      <Grid container spacing={0}>
        <Grid item xs={12} md={8}>
          {/* <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Event Details
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Paper> */}

          {/* Service Requests Section */}
          <Paper sx={{ p: 3, mt: 4 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6" sx={{ mr: 3 }}>
                Service Requests
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => setOpenRequestModal(true)}
              >
                Request Service
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />

            {serviceRequestsLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
                <CircularProgress />
              </Box>
            ) : serviceRequestsError ? (
              <Alert severity="error">{serviceRequestsError}</Alert>
            ) : serviceRequests.length === 0 ? (
              <Typography variant="body1" color="text.secondary">
                No service requests yet.
              </Typography>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Service</TableCell>

                      <TableCell>Start Date</TableCell>
                      <TableCell>End Date</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {serviceRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>{request.serviceName}</TableCell>
                        {/* <TableCell>
                          <Chip
                            label={request.status}
                            color={
                              request.status === "ACCEPTED"
                                ? "success"
                                : request.status === "PENDING"
                                ? "warning"
                                : "error"
                            }
                            size="small"
                          />
                        </TableCell> */}
                        <TableCell>
                          {request.startDateTime &&
                            format(parseDate(request.startDateTime), "PPp")}
                        </TableCell>
                        <TableCell>
                          {request.endDateTime &&
                            format(parseDate(request.endDateTime), "PPp")}
                        </TableCell>
                        <TableCell>
                          {request.status === "ACCEPTED" && (
                            <Box sx={{ display: "flex", gap: 1 }}>
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={() => handleGetCode(request)}
                              >
                                Get Code
                              </Button>
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={() => handleGetCertificate(request)}
                              >
                                Download License Key
                              </Button>
                            </Box>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Request Service Modal */}
      <Dialog
        open={openRequestModal}
        onClose={() => setOpenRequestModal(false)}
      >
        <DialogTitle>Request Service</DialogTitle>
        <DialogContent sx={{ minWidth: 400 }}>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel id="service-select-label">Select Service</InputLabel>
            <Select
              labelId="service-select-label"
              value={selectedService}
              label="Select Service"
              onChange={(e) => setSelectedService(e.target.value)}
            >
              {services.map((service) => (
                <MenuItem key={service.id} value={service.id}>
                  {service.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ mt: 3 }}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DateTimePicker
                label="Start Date & Time"
                value={selectedStartTime}
                onChange={(newValue) => setSelectedStartTime(newValue)}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </LocalizationProvider>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenRequestModal(false)}>Cancel</Button>
          <Button
            onClick={handleRequestService}
            variant="contained"
            color="primary"
            disabled={!selectedService || requestLoading}
          >
            {requestLoading ? "Requesting..." : "Request"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Auth Code Modal */}
      <Dialog
        open={openAuthCodeModal}
        onClose={() => setOpenAuthCodeModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogContent>
          <AuthCode
            serviceRequest={selectedServiceRequest}
            onClose={() => setOpenAuthCodeModal(false)}
          />
        </DialogContent>
      </Dialog>

      {/* License Certificate Modal */}
      <Dialog
        open={openLicenseModal}
        onClose={() => setOpenLicenseModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogContent>
          <LicenseCertificate
            serviceRequest={selectedServiceRequest}
            onClose={() => setOpenLicenseModal(false)}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default EventDetails;
