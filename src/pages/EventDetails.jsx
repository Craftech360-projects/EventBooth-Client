import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import apiService from "../services/apiService";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import LicenseCertificate from "../components/LicenseCertificate";
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
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
  Checkbox,
  ListItemText,
  OutlinedInput,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
} from "@mui/material";

import { format } from "date-fns";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "../firebase/config";

const EventDetails = () => {
  const { eventId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [serviceRequests, setServiceRequests] = useState([]);
  const [serviceRequestsLoading, setServiceRequestsLoading] = useState(true);
  const [serviceRequestsError, setServiceRequestsError] = useState(null);

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openRequestModal, setOpenRequestModal] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const [openLicenseModal, setOpenLicenseModal] = useState(false);
  const [selectedServiceRequest, setSelectedServiceRequest] = useState(null);

  const [photoboothRequest, setPhotoboothRequest] = useState({
    startDateTime: new Date(),
    endDateTime: new Date(),
    themes: [],
    builds: [],
    mode: "Online",
  });

  const themes = ["Stranger Things", "Jurassic Park", "Final Destination"];

  const builds = ["Android", "iOS", "Web", "Windows", "macOS"];

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
        setError("Failed to load event details.");
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchEventDetails();
    }
  }, [eventId]);

  useEffect(() => {
    const fetchServiceRequests = async () => {
      if (!eventId) return;

      try {
        setServiceRequestsLoading(true);
        const response = await apiService.serviceRequests.getByEventId(eventId);
        if (response && response.data) {
          const requestsData = Array.isArray(response.data)
            ? response.data
            : response.data.data || [];
          setServiceRequests(requestsData);
        } else {
          setServiceRequests([]);
        }
      } catch (err) {
        setServiceRequestsError("Failed to load service requests");
        setServiceRequests([]);
      } finally {
        setServiceRequestsLoading(false);
      }
    };

    fetchServiceRequests();
  }, [eventId]);

  const parseDate = (dateValue) => {
    if (!dateValue) return null;
    if (dateValue.toDate) return dateValue.toDate();
    if (dateValue._seconds) return new Date(dateValue._seconds * 1000);
    const d = new Date(dateValue);
    return isNaN(d.getTime()) ? null : d;
  };

  const handleRequestInputChange = (e) => {
    const { name, value } = e.target;
    setPhotoboothRequest({ ...photoboothRequest, [name]: value });
  };

  const handleRequestPhotobooth = async () => {
    try {
      setRequestLoading(true);

      const requestData = {
        eventId,
        userId: currentUser.uid,
        ...photoboothRequest,
        createdAt: Timestamp.now(),
      };

      const docRef = await addDoc(
        collection(db, "serviceRequests"),
        requestData
      );

      setServiceRequests((prev) => [...prev, { id: docRef.id, ...requestData }]);
      setOpenRequestModal(false);
    } catch (err) {
      setError("Failed to request photobooth.");
    } finally {
      setRequestLoading(false);
    }
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!event) return <Alert severity="warning">Event not found.</Alert>;

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h5">{event.name}</Typography>
        <Button variant="outlined" onClick={() => navigate("/events")}>
          Back to Events
        </Button>
      </Box>

      <Paper sx={{ p: 3, mt: 4 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h6">Photobooth Requests</Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setOpenRequestModal(true)}
          >
            Request Photobooth
          </Button>
        </Box>
        <Divider sx={{ mb: 2 }} />

        {serviceRequestsLoading ? (
          <CircularProgress />
        ) : serviceRequestsError ? (
          <Alert severity="error">{serviceRequestsError}</Alert>
        ) : serviceRequests.length === 0 ? (
          <Typography>No photobooth requests yet.</Typography>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Start Date</TableCell>
                  <TableCell>End Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {serviceRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      {format(
                        parseDate(request.startDateTime),
                        "MMM d, yyyy h:mm a"
                      )}
                    </TableCell>
                    <TableCell>
                      {format(
                        parseDate(request.endDateTime),
                        "MMM d, yyyy h:mm a"
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleGetCertificate(request)}
                      >
                        Download License Certificate
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog
        open={openRequestModal}
        onClose={() => setOpenRequestModal(false)}
      >
        <DialogTitle>Request Photobooth</DialogTitle>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DateTimePicker
              label="Start Date & Time"
              value={photoboothRequest.startDateTime}
              onChange={(newValue) =>
                setPhotoboothRequest({
                  ...photoboothRequest,
                  startDateTime: newValue,
                })
              }
              renderInput={(params) => <TextField {...params} fullWidth />}
              sx={{ mt: 2 }}
            />
            <DateTimePicker
              label="End Date & Time"
              value={photoboothRequest.endDateTime}
              onChange={(newValue) =>
                setPhotoboothRequest({
                  ...photoboothRequest,
                  endDateTime: newValue,
                })
              }
              renderInput={(params) => <TextField {...params} fullWidth />}
              sx={{ mt: 2 }}
            />
          </LocalizationProvider>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Photobooth Themes</InputLabel>
            <Select
              multiple
              value={photoboothRequest.themes}
              onChange={(e) =>
                setPhotoboothRequest({
                  ...photoboothRequest,
                  themes: e.target.value,
                })
              }
              input={<OutlinedInput label="Photobooth Themes" />}
              renderValue={(selected) => selected.join(", ")}
            >
              {themes.map((theme) => (
                <MenuItem key={theme} value={theme}>
                  <Checkbox
                    checked={photoboothRequest.themes.indexOf(theme) > -1}
                  />
                  <ListItemText primary={theme} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Builds</InputLabel>
            <Select
              multiple
              value={photoboothRequest.builds}
              onChange={(e) =>
                setPhotoboothRequest({
                  ...photoboothRequest,
                  builds: e.target.value,
                })
              }
              input={<OutlinedInput label="Builds" />}
              renderValue={(selected) => selected.join(", ")}
            >
              {builds.map((build) => (
                <MenuItem key={build} value={build}>
                  <Checkbox
                    checked={photoboothRequest.builds.indexOf(build) > -1}
                  />
                  <ListItemText primary={build} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl component="fieldset" sx={{ mt: 2 }}>
            <FormLabel component="legend">Photobooth Mode</FormLabel>
            <RadioGroup
              row
              name="mode"
              value={photoboothRequest.mode}
              onChange={handleRequestInputChange}
            >
              <FormControlLabel
                value="Online"
                control={<Radio />}
                label="Online"
              />
              <FormControlLabel
                value="Offline"
                control={<Radio />}
                label="Offline"
              />
            </RadioGroup>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRequestModal(false)}>Cancel</Button>
          <Button
            onClick={handleRequestPhotobooth}
            variant="contained"
            disabled={requestLoading}
          >
            {requestLoading ? "Submitting..." : "Submit"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openLicenseModal}
        onClose={() => setOpenLicenseModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogContent>
          <LicenseCertificate serviceRequest={selectedServiceRequest} />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default EventDetails;