import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useProfile } from "../hooks/useProfile";
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Button,
  TextField,
  Grid,
  Divider,
  Alert,
  Snackbar,
  CircularProgress,
  Chip,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const { currentUser } = useAuth();
  const { updateProfile, loading, error: profileError } = useProfile();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    displayName: currentUser?.displayName || "",
    email: currentUser?.email || "",
    phone: currentUser?.phone || "",
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Get plan details based on user's plan ID
  const getPlanDetails = (planId) => {
    const plans = {
      silver: {
        name: "Silver",
        price: 299,
        requests: 60,
        validity: "30-day",
      },
      gold: {
        name: "Gold",
        price: 499,
        requests: 80,
        validity: "60-day",
      },
      platinum: {
        name: "Platinum",
        price: 699,
        requests: 100,
        validity: "90-day",
      },
    };

    return (
      plans[planId] || {
        name: "No Plan",
        price: 0,
        requests: 0,
        validity: "N/A",
      }
    );
  };

  const planId = currentUser?.planId || "silver";
  const planDetails = getPlanDetails(planId);
  const hasActivePlan = currentUser?.hasPurchasedPlan || false;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setError("");
      await updateProfile({
        displayName: formData.displayName,
        phone: formData.phone,
      });
      setSuccess(true);
    } catch (error) {
      setError("Failed to update profile. Please try again later.");
    }
  };

  const handleUpgradeClick = () => {
    navigate("/payments");
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Profile
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          <Avatar
            src={currentUser?.photoURL}
            alt={currentUser?.displayName}
            sx={{ width: 80, height: 80, mr: 2 }}
          />
          <Box>
            <Typography variant="h5">{currentUser?.displayName}</Typography>
            <Typography variant="body1" color="text.secondary">
              {currentUser?.email}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                name="displayName"
                label="Display Name"
                value={formData.displayName}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                name="email"
                label="Email"
                value={formData.email}
                fullWidth
                margin="normal"
                disabled
                helperText="Email cannot be changed"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                name="phone"
                label="Phone Number"
                value={formData.phone}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </Box>
        </form>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Subscription Details
        </Typography>
        {hasActivePlan ? (
          <Box sx={{ mb: 2 }}>
            <Chip label="Active Subscription" color="success" sx={{ mb: 2 }} />
          </Box>
        ) : (
          <Box sx={{ mb: 2 }}>
            <Chip label="No Active Subscription" color="error" sx={{ mb: 2 }} />
          </Box>
        )}
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="text.secondary">
              Total Requests
            </Typography>
            <Typography variant="h6">
              {currentUser?.totalRequests || planDetails.requests || 0}
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="text.secondary">
              Used Requests
            </Typography>
            <Typography variant="h6">
              {currentUser?.usedRequests || 0}
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="text.secondary">
              Subscription Plan
            </Typography>
            <Typography variant="h6">
              {hasActivePlan
                ? `${planDetails.name} (₹${planDetails.price})`
                : "No Active Plan"}
            </Typography>
            {hasActivePlan && (
              <Typography variant="body2" color="text.secondary">
                {planDetails.validity} validity
              </Typography>
            )}
          </Grid>
        </Grid>

        <Box sx={{ mt: 3 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleUpgradeClick}
          >
            {hasActivePlan ? "Upgrade Subscription" : "Get Subscription"}
          </Button>
        </Box>
      </Paper>

      <Snackbar
        open={success}
        autoHideDuration={6000}
        onClose={() => setSuccess(false)}
      >
        <Alert severity="success" onClose={() => setSuccess(false)}>
          Profile updated successfully!
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError("")}
      >
        <Alert severity="error" onClose={() => setError("")}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Profile;
