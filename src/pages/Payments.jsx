import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
} from "@mui/material";
import { doc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "../firebase/config";

const plans = [
  {
    id: "silver",
    name: "Silver",
    price: 200,
    requests: 60,
    color: "#A9A9A9",
    features: ["60 Service Requests", "Basic Support", "30-day validity"],
  },
  {
    id: "gold",
    name: "Gold",
    price: 100,
    requests: 80,
    color: "#FFD700",
    features: ["80 Service Requests", "Priority Support", "60-day validity"],
  },
  {
    id: "platinum",
    name: "Platinum",
    price: 300,
    requests: 100,
    color: "#E5E4E2",
    features: ["100 Service Requests", "Premium Support", "90-day validity"],
  },
];

const Payments = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handlePayment = (plan) => {
    setSelectedPlan(plan);

    // Initialize Razorpay payment
    const options = {
      key: "rzp_test_YourTestKey", // Replace with your Razorpay test key
      amount: plan.price * 100, // Amount in paise
      currency: "INR",
      name: "Event Booth",
      description: `${plan.name} Plan Subscription`,
      image: "https://your-logo-url.png", // Replace with your logo URL
      handler: function (response) {
        // Handle successful payment
        handlePaymentSuccess(plan, response.razorpay_payment_id);
      },
      prefill: {
        name: currentUser?.displayName || "",
        email: currentUser?.email || "",
      },
      theme: {
        color: "#3f51b5",
      },
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();
  };

  const handlePaymentSuccess = async (plan, paymentId) => {
    try {
      setLoading(true);

      // Update user document in Firestore
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        totalRequests: plan.requests,
        hasPurchasedPlan: true,
        planId: plan.id,
        planName: plan.name,
        planPurchasedAt: Timestamp.now(),
        paymentId: paymentId,
      });

      setSuccess(true);

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (error) {
      console.error("Error updating user data:", error);
      setError("Failed to update subscription. Please contact support.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Subscription Plans
      </Typography>
      <Typography variant="body1" paragraph>
        Choose a plan that suits your needs
      </Typography>

      {loading && (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      )}

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {plans.map((plan) => (
          <Grid item xs={12} md={4} key={plan.id}>
            <Card
              elevation={4}
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                position: "relative",
                transition: "transform 0.3s ease",
                "&:hover": {
                  transform: "translateY(-5px)",
                },
                ...(plan.id === "gold" && {
                  border: "2px solid #FFD700",
                }),
              }}
            >
              {plan.id === "gold" && (
                <Chip
                  label="Best Value"
                  color="primary"
                  sx={{
                    position: "absolute",
                    top: -12,
                    right: 20,
                    fontWeight: "bold",
                  }}
                />
              )}
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography
                  variant="h5"
                  component="h2"
                  gutterBottom
                  sx={{
                    color: plan.color,
                    fontWeight: "bold",
                  }}
                >
                  {plan.name}
                </Typography>
                <Typography variant="h4" component="div" gutterBottom>
                  ₹{plan.price}
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {plan.features.map((feature, index) => (
                    <Typography
                      key={index}
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1 }}
                    >
                      • {feature}
                    </Typography>
                  ))}
                </Box>
              </CardContent>
              <CardActions>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  onClick={() => handlePayment(plan)}
                  disabled={loading}
                >
                  Subscribe Now
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Snackbar
        open={success}
        autoHideDuration={6000}
        onClose={() => setSuccess(false)}
      >
        <Alert severity="success" onClose={() => setSuccess(false)}>
          Payment successful! Your plan has been activated.
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

export default Payments;
