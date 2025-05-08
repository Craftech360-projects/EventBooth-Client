import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useEvents } from "../hooks/useEvents";

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
  Grid,
  Tab,
  Tabs,
  CircularProgress,
} from "@mui/material";

import { format } from "date-fns";

const Events = () => {
  const { currentUser } = useAuth();
  const { events, loading, error, createEvent } = useEvents();
  const navigate = useNavigate();
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
  });

  const parseDate = (dateString) => {
    if (!dateString) return new Date();
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? new Date() : date;
  };

  // Function to filter events based on tab selection
  const getFilteredEvents = () => {
    const now = new Date();

    switch (tabValue) {
      case 1: // Live Events
        return events.filter(
          (event) =>
            new Date(event.startDateTime) <= now &&
            new Date(event.endDateTime) >= now
        );
      case 2: // Upcoming Events
        return events.filter((event) => new Date(event.startDateTime) > now);
      case 3: // Past Events
        return events.filter((event) => new Date(event.endDateTime) < now);
      case 0: // All Events
      default:
        return events;
    }
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

  const handleCreateEvent = async () => {
    try {
      await createEvent({
        name: formData.name,
      });

      // Close modal and reset form
      setOpenCreateModal(false);
      setFormData({ name: "" });
    } catch (error) {
      console.error("Error creating event:", error);
    }
  };

  const handleEventClick = (eventId) => {
    navigate(`/events/${eventId}`);
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
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
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      ) : filteredEvents.length === 0 ? (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography>No events found.</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Event Name</TableCell>
                <TableCell>Requests Used</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredEvents.map((event) => (
                <TableRow
                  key={event.id}
                  hover
                  onClick={() => handleEventClick(event.id)}
                  sx={{ cursor: "pointer" }}
                >
                  <TableCell>{event.name}</TableCell>

                  <TableCell>
                    {event.serviceRequests ? event.serviceRequests.length : 0}
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
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create New Event</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                name="name"
                label="Event Name"
                value={formData.name}
                onChange={handleInputChange}
                fullWidth
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
            disabled={!formData.name}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Events;
