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

import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
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
  Card,
  CardContent,
  CardActions,
  TextField, // Add this import
} from "@mui/material";

import { format } from "date-fns";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";

const EventDetails = () => {
  const { eventId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { services, loading: servicesLoading } = useServices();

  const [selectedStartTime, setSelectedStartTime] = useState(new Date());
  const [deviceId] = useState(generateUniqueHexId());

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [serviceRequests, setServiceRequests] = useState([]);
  const [openRequestModal, setOpenRequestModal] = useState(false);
  const [selectedService, setSelectedService] = useState("");
  const [requestLoading, setRequestLoading] = useState(false);

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setLoading(true);
        const { data } = await apiService.events.getById(eventId);
        setEvent(data);

        // Fetch service requests for this event
        const requestsQuery = query(
          collection(db, "serviceRequests"),
          where("eventId", "==", eventId)
        );
        const requestsSnapshot = await getDocs(requestsQuery);
        const requestsData = requestsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setServiceRequests(requestsData);
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

  // Update the handleRequestService function
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
        status: "PENDING",
        startDateTime,
        endDateTime,
        deviceId, // Use the auto-generated deviceId instead of macId
        createdAt: Timestamp.now(),
      };

      const docRef = await addDoc(
        collection(db, "serviceRequests"),
        requestData
      );

      // Update local state
      setServiceRequests([
        ...serviceRequests,
        { id: docRef.id, ...requestData },
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
          <Typography variant="h4" component="h1">
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

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Event Details
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Paper>

          <Paper sx={{ p: 3 }}>
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

            {serviceRequests.length === 0 ? (
              <Typography variant="body1" color="text.secondary">
                No service requests yet.
              </Typography>
            ) : (
              <List>
                {serviceRequests.map((request) => (
                  <ListItem key={request.id} divider>
                    <ListItemText
                      primary={request.serviceName}
                      secondary={
                        <>
                          <Typography component="span" display="block">
                            Start:{" "}
                            {format(parseDate(request.startDateTime), "PPp")}
                          </Typography>
                          <Typography component="span" display="block">
                            End: {format(parseDate(request.endDateTime), "PPp")}
                          </Typography>
                          <Typography component="span" display="block">
                            Application ID: {request.deviceId}
                          </Typography>
                          <Typography component="span" display="block">
                            Requested:{" "}
                            {format(
                              typeof request.createdAt === "object" &&
                                request.createdAt.toDate
                                ? request.createdAt.toDate()
                                : parseDate(request.createdAt),
                              "PPp"
                            )}
                          </Typography>
                        </>
                      }
                    />
                    <Chip
                      label={request.status}
                      color={
                        request.status === "APPROVED"
                          ? "success"
                          : request.status === "REJECTED"
                          ? "error"
                          : "warning"
                      }
                      size="small"
                    />
                  </ListItem>
                ))}
              </List>
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

          <TextField
            fullWidth
            margin="normal"
            label="Device ID"
            value={deviceId}
            InputProps={{
              readOnly: true,
            }}
            helperText="Auto-generated unique device identifier"
          />
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
    </Box>
  );
};

export default EventDetails;
