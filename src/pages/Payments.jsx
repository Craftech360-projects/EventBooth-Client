import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import apiService from "../services/apiService";
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
  Container,
  Paper,
  Divider,
  Stack,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

const plans = [
  {
    id: "silver",
    name: "Silver",
    price: 299,
    requests: 60,
    color: "#A9A9A9",
    features: ["60 Service Requests", "Basic Support", "30-day validity"],
  },
  {
    id: "gold",
    name: "Gold",
    price: 499,
    requests: 80,
    color: "#FFD700",
    features: ["80 Service Requests", "Priority Support", "60-day validity"],
  },
  {
    id: "platinum",
    name: "Platinum",
    price: 699,
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

  const handlePayment = async (plan) => {
    try {
      setLoading(true);
      setSelectedPlan(plan);

      // Create order using API service
      const { data } = await apiService.payments.createOrder({
        planId: plan.id,
        amount: plan.price,
      });

      // Initialize Razorpay payment
      const options = {
        key: data.key_id,
        // import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data.amount, // amount from the server
        currency: data.currency,
        name: "Event Booth - Photobooth",
        description: `${plan.name} Plan Subscription`,
        order_id: data.orderId,
        handler: function (response) {
          handlePaymentSuccess(plan, response);
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
    } catch (error) {
      console.error("Error initiating payment:", error);
      setError("Failed to initiate payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (plan, response) => {
    try {
      setLoading(true);

      // Verify payment using API service
      await apiService.payments.verifyPayment({
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_signature: response.razorpay_signature,
        planId: plan.id,
        amount: plan.price,
      });

      setSuccess(true);

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (error) {
      console.error("Error verifying payment:", error);
      setError("Payment verification failed. Please contact support.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper
        elevation={0}
        sx={{ p: 3, mb: 4, borderRadius: 2, textAlign: "center" }}
      >
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Choose Your Subscription Plan
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ maxWidth: 600, mx: "auto" }}
        >
          Select a plan that best fits your needs and get started with our
          premium services
        </Typography>
      </Paper>

      {loading && (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      )}

      <Grid container spacing={4} sx={{ mt: 2 }} justifyContent="center">
        {plans.map((plan) => (
          <Grid item xs={12} sm={6} md={4} key={plan.id}>
            <Card
              elevation={4}
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                position: "relative",
                transition: "all 0.3s ease",
                borderRadius: 3,
                overflow: "visible",
                "&:hover": {
                  transform: "translateY(-8px)",
                  boxShadow: 8,
                },
                ...(plan.id === "gold" && {
                  border: "2px solid #FFD700",
                  transform: "scale(1.05)",
                  zIndex: 1,
                  "&:hover": {
                    transform: "translateY(-8px) scale(1.05)",
                    boxShadow: 8,
                  },
                }),
              }}
            >
              {plan.id === "gold" && (
                <Chip
                  label="BEST VALUE"
                  color="primary"
                  sx={{
                    position: "absolute",
                    top: -15,
                    left: "50%",
                    transform: "translateX(-50%)",
                    fontWeight: "bold",
                    px: 2,
                    py: 0.5,
                  }}
                />
              )}
              <Box
                sx={{
                  bgcolor: plan.id === "gold" ? "#FFF8E1" : "#f8f9fa",
                  pt: 4,
                  pb: 2,
                  borderTopLeftRadius: 12,
                  borderTopRightRadius: 12,
                  textAlign: "center",
                }}
              >
                <Typography
                  variant="h5"
                  component="h2"
                  gutterBottom
                  sx={{
                    color: plan.color,
                    fontWeight: "bold",
                    letterSpacing: 1,
                  }}
                >
                  {plan.name.toUpperCase()}
                </Typography>
                <Typography
                  variant="h3"
                  component="div"
                  fontWeight="bold"
                  sx={{ mb: 1 }}
                >
                  ₹{plan.price}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  One-time payment
                </Typography>
              </Box>

              <Divider />

              <CardContent sx={{ flexGrow: 1, px: 3, py: 3 }}>
                <Stack spacing={2}>
                  {plan.features.map((feature, index) => (
                    <Box
                      key={index}
                      sx={{ display: "flex", alignItems: "center" }}
                    >
                      <CheckCircleOutlineIcon
                        sx={{ mr: 1, color: "success.main" }}
                        fontSize="small"
                      />
                      <Typography variant="body2" color="text.primary">
                        {feature}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </CardContent>

              <CardActions sx={{ p: 3, pt: 0 }}>
                <Button
                  fullWidth
                  variant="contained"
                  color={plan.id === "gold" ? "primary" : "secondary"}
                  onClick={() => handlePayment(plan)}
                  disabled={loading}
                  size="large"
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    fontWeight: "bold",
                    ...(plan.id === "gold" && {
                      bgcolor: "primary.main",
                      "&:hover": {
                        bgcolor: "primary.dark",
                      },
                    }),
                  }}
                >
                  {plan.id === "gold" ? "Get Started" : "Subscribe Now"}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 6, textAlign: "center" }}>
        <Typography variant="body2" color="text.secondary">
          All plans include access to our core features. Need a custom plan?{" "}
          <Button color="primary" sx={{ textTransform: "none" }}>
            Contact us
          </Button>
        </Typography>
      </Box>

      <Snackbar
        open={success}
        autoHideDuration={6000}
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="success"
          onClose={() => setSuccess(false)}
          sx={{ width: "100%" }}
        >
          Payment successful! Your plan has been activated.
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="error"
          onClose={() => setError("")}
          sx={{ width: "100%" }}
        >
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Payments;
