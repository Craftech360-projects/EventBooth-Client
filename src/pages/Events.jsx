import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import LicenseCertificate from "../components/LicenseCertificate";

import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Tab,
  Tabs,
  Modal,
  CircularProgress,
} from "@mui/material";

import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";

import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore";

import { db } from "../firebase/config";
import { format } from "date-fns";

const Events = () => {
  const { currentUser } = useAuth();
  const location = useLocation();
  const [openLicenseModal, setOpenLicenseModal] = useState(false);
  const [events, setEvents] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openAuthModal, setOpenAuthModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [authCode, setAuthCode] = useState("");
  const [tabValue, setTabValue] = useState(0);
  const [countdown, setCountdown] = useState(30);
  const [formData, setFormData] = useState({
    name: "",
    startDateTime: new Date(),
    endDateTime: new Date(),
    services: [],
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    status: "PENDING",
  });

  // Add useEffect to fetch events and services
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch events for the current user
        const eventsQuery = query(
          collection(db, "events"),
          where("userId", "==", currentUser.uid)
        );
        const eventsSnapshot = await getDocs(eventsQuery);
        const eventsData = eventsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setEvents(eventsData);

        // Fetch services
        const servicesCollection = collection(db, "services");
        const servicesSnapshot = await getDocs(servicesCollection);
        const servicesData = servicesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setServices(servicesData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  // Add function to filter events based on tab selection
  const getFilteredEvents = () => {
    const now = new Date();

    switch (tabValue) {
      case 1: // Live Events
        return events.filter(
          (event) =>
            event.startDateTime.toDate() <= now &&
            event.endDateTime.toDate() >= now
        );
      case 2: // Upcoming Events
        return events.filter((event) => event.startDateTime.toDate() > now);
      case 3: // Past Events
        return events.filter((event) => event.endDateTime.toDate() < now);
      case 0: // All Events
      default:
        return events;
    }
  };

  const handleGenerateLicense = (event) => {
    setSelectedEvent(event);
    setOpenLicenseModal(true);
  };

  // Get filtered events based on current tab
  const filteredEvents = getFilteredEvents();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Update handleCreateEvent
  const handleCreateEvent = async () => {
    try {
      setLoading(true);

      // Generate a base32 encoded secret
      const array = new Uint8Array(20);
      crypto.getRandomValues(array);
      const base32Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
      let secret = "";
      for (let i = 0; i < array.length; i++) {
        secret += base32Chars[array[i] % 32];
      }

      // Create event document
      const eventData = {
        ...formData,
        startDateTime: Timestamp.fromDate(formData.startDateTime),
        endDateTime: Timestamp.fromDate(formData.endDateTime),
        userId: currentUser.uid,
        createdAt: Timestamp.now(),
        secret: secret,
        eventId: generateEventId(), // Add a unique event ID
      };

      const docRef = await addDoc(collection(db, "events"), eventData);

      // Update local state
      setEvents([...events, { id: docRef.id, ...eventData }]);

      // Close modal and reset form
      setOpenCreateModal(false);
      setFormData({
        name: "",
        startDateTime: new Date(),
        endDateTime: new Date(),
        services: [],
        contactName: "",
        contactEmail: "",
        contactPhone: "",
        status: "PENDING",
      });
    } catch (error) {
      console.error("Error creating event:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateEventId = () => {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  };

  // Update handleDateChange to work with Date objects
  const handleDateChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleServicesChange = (e) => {
    setFormData({
      ...formData,
      services: e.target.value,
    });
  };

  const handleGetAuthCode = async (event) => {
    setSelectedEvent(event);
    setOpenAuthModal(true);
    setCountdown(30); // Reset countdown when modal opens

    try {
      // Convert the secret to a CryptoKey
      const secretBytes = new TextEncoder().encode(event.secret);
      const cryptoKey = await crypto.subtle.importKey(
        "raw",
        secretBytes,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );

      // Generate initial code
      const generateCode = async () => {
        // Use the same timestamp calculation as the test app
        const timestamp = Math.floor(Date.now() / 30000);
        console.log("Current timestamp:", timestamp); // Add this for debugging

        const timestampBytes = new TextEncoder().encode(timestamp.toString());
        const signature = await crypto.subtle.sign(
          "HMAC",
          cryptoKey,
          timestampBytes
        );
        const dataView = new DataView(signature);
        const code = Math.abs(dataView.getInt32(0) % 1000000)
          .toString()
          .padStart(6, "0");
        console.log("Generated code:", code); // Add this for debugging
        setAuthCode(code);
        setCountdown(30);
      };

      // Generate initial code and set up timers
      await generateCode();
      const codeTimer = setInterval(generateCode, 30000);
      const countdownTimer = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 30));
      }, 1000);

      // Return cleanup function
      return () => {
        clearInterval(codeTimer);
        clearInterval(countdownTimer);
      };
    } catch (error) {
      console.error("Error generating auth code:", error);
      setAuthCode("Error");
    }
  };

  const getStatusChip = (status) => {
    let color;
    switch (status) {
      case "ACCEPTED":
        color = "success";
        break;
      case "DECLINED":
        color = "error";
        break;
      case "PENDING":
      default:
        color = "warning";
    }
    return <Chip label={status} color={color} size="small" />;
  };

  // Update the services rendering in the table
  const getServiceName = (serviceId) => {
    const service = services.find((s) => s.id === serviceId);
    return service ? service.name : "Unknown Service";
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" component="h1">
          Events
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setOpenCreateModal(true)}
        >
          Create Event
        </Button>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="All Events" />
          <Tab label="Live Events" />
          <Tab label="Upcoming Events" />
          <Tab label="Past Events" />
        </Tabs>
      </Paper>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
          <CircularProgress />
        </Box>
      ) : filteredEvents.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: "center" }}>
          <Typography variant="body1">No events found.</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Event Name</TableCell>
                <TableCell>Start Date</TableCell>
                <TableCell>End Date</TableCell>
                <TableCell>Services</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredEvents.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>{event.name}</TableCell>
                  <TableCell>
                    {format(event.startDateTime.toDate(), "PPp")}
                  </TableCell>
                  <TableCell>
                    {format(event.endDateTime.toDate(), "PPp")}
                  </TableCell>
                  <TableCell>
                    {event.services.map((serviceId) => (
                      <Chip
                        key={serviceId}
                        label={getServiceName(serviceId)}
                        size="small"
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))}
                  </TableCell>
                  <TableCell>{getStatusChip(event.status)}</TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleGetAuthCode(event)}
                    >
                      Get Auth Code
                    </Button>
                    &nbsp;
                    <Button
                      variant="outlined"
                      size="small"
                      color="secondary"
                      onClick={() => handleGenerateLicense(event)}
                    >
                      License
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create Event Modal */}
      <Dialog
        open={openCreateModal}
        onClose={() => setOpenCreateModal(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Create New Event</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                name="name"
                label="Event Name"
                fullWidth
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DateTimePicker
                  label="Start Date & Time"
                  value={formData.startDateTime}
                  onChange={(newValue) =>
                    handleDateChange("startDateTime", newValue)
                  }
                  slotProps={{ textField: { fullWidth: true, required: true } }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DateTimePicker
                  label="End Date & Time"
                  value={formData.endDateTime}
                  onChange={(newValue) =>
                    handleDateChange("endDateTime", newValue)
                  }
                  slotProps={{ textField: { fullWidth: true, required: true } }}
                  minDateTime={formData.startDateTime}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Services</InputLabel>
                <Select
                  multiple
                  name="services"
                  value={formData.services}
                  onChange={handleServicesChange}
                  renderValue={(selected) => (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {selected.map((serviceId) => (
                        <Chip
                          key={serviceId}
                          label={getServiceName(serviceId)}
                        />
                      ))}
                    </Box>
                  )}
                >
                  {services.map((service) => (
                    <MenuItem key={service.id} value={service.id}>
                      {service.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                name="contactName"
                label="Contact Name"
                fullWidth
                value={formData.contactName}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                name="contactEmail"
                label="Contact Email"
                fullWidth
                value={formData.contactEmail}
                onChange={handleInputChange}
                required
                type="email"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                name="contactPhone"
                label="Contact Phone"
                fullWidth
                value={formData.contactPhone}
                onChange={handleInputChange}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateModal(false)}>Cancel</Button>
          <Button
            onClick={handleCreateEvent}
            variant="contained"
            color="primary"
            disabled={loading}
          >
            Create Event
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add this dialog for license certificate */}
      <Dialog
        open={openLicenseModal}
        onClose={() => setOpenLicenseModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogContent>
          <LicenseCertificate
            event={selectedEvent}
            onClose={() => setOpenLicenseModal(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Authentication Code Modal */}
      <Modal
        open={openAuthModal}
        onClose={() => setOpenAuthModal(false)}
        aria-labelledby="auth-code-modal"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 400,
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
            textAlign: "center",
          }}
        >
          <Typography variant="h6" component="h2" gutterBottom>
            Authentication Code
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Code refreshes in {countdown} seconds
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Event ID: {selectedEvent?.eventId}
          </Typography>

          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              mb: 2,
              "& > span": {
                display: "inline-block",
                width: "40px",
                height: "50px",
                margin: "0 4px",
                fontSize: "32px",
                fontWeight: "bold",
                border: "1px solid #ccc",
                borderRadius: "4px",
                lineHeight: "50px",
                backgroundColor: "#f5f5f5",
              },
            }}
          >
            {authCode.split("").map((digit, index) => (
              <span key={index}>{digit}</span>
            ))}
          </Box>

          <Button
            variant="contained"
            onClick={() => setOpenAuthModal(false)}
            fullWidth
          >
            Close
          </Button>
        </Box>
      </Modal>
    </Box>
  );
};

export default Events;
