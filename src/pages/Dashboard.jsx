import React from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  Card,
  CardContent,
  CardActions,
  Alert,
  Container,
  Divider,
  Avatar,
  Stack,
  IconButton,
  Tooltip,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import EventIcon from "@mui/icons-material/Event";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import PaymentIcon from "@mui/icons-material/Payment";
import PersonIcon from "@mui/icons-material/Person";
import BarChartIcon from "@mui/icons-material/BarChart";
import RequestQuoteIcon from "@mui/icons-material/RequestQuote";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";

const StatCard = ({ title, value, color, icon }) => {
  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        bgcolor: "white",
        borderRadius: 3,
        borderTop: `4px solid ${color}`,
        transition: "transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out",
        "&:hover": {
          transform: "translateY(-5px)",
          boxShadow: 6,
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography
          variant="h6"
          component="h2"
          color="text.secondary"
          fontWeight="medium"
        >
          {title}
        </Typography>
        <Avatar sx={{ bgcolor: color, width: 40, height: 40 }}>{icon}</Avatar>
      </Box>
      <Typography
        variant="h3"
        component="div"
        fontWeight="bold"
        color="text.primary"
      >
        {value}
      </Typography>
    </Paper>
  );
};

const ActionCard = ({
  title,
  description,
  primaryAction,
  secondaryAction,
  icon,
  color,
}) => {
  return (
    <Card
      elevation={2}
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 3,
        overflow: "hidden",
        transition: "transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out",
        "&:hover": {
          transform: "translateY(-5px)",
          boxShadow: 6,
        },
      }}
    >
      <Box
        sx={{
          bgcolor: color,
          py: 2,
          px: 3,
          display: "flex",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Avatar sx={{ bgcolor: "white" }}>
          {React.cloneElement(icon, { sx: { color: color } })}
        </Avatar>
        <Typography
          variant="h5"
          component="div"
          color="white"
          fontWeight="medium"
        >
          {title}
        </Typography>
      </Box>
      <CardContent sx={{ flexGrow: 1, p: 3 }}>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          {description}
        </Typography>
      </CardContent>
      <Divider />
      <CardActions sx={{ p: 2 }}>
        <Stack direction="row" spacing={2}>
          <Button
            size="medium"
            variant="contained"
            sx={{
              bgcolor: color,
              "&:hover": {
                bgcolor: color,
                filter: "brightness(90%)",
              },
            }}
            startIcon={primaryAction.icon}
            onClick={primaryAction.onClick}
          >
            {primaryAction.label}
          </Button>
          {secondaryAction && (
            <Button
              size="medium"
              variant="outlined"
              sx={{ color: color, borderColor: color }}
              startIcon={secondaryAction.icon}
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )}
        </Stack>
      </CardActions>
    </Card>
  );
};

const Dashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box
        sx={{
          mb: 5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box>
          <Typography
            variant="h4"
            component="h1"
            fontWeight="bold"
            gutterBottom
          >
            Welcome, {currentUser?.displayName || "User"}!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your events and service requests from this dashboard.
          </Typography>
        </Box>
        <Box>
          <Tooltip title="View Profile">
            <IconButton
              sx={{
                bgcolor: "primary.light",
                color: "white",
                "&:hover": { bgcolor: "primary.main" },
              }}
              onClick={() => navigate("/profile")}
            >
              <PersonIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {!currentUser?.hasPurchasedPlan && (
        <Alert
          severity="info"
          variant="filled"
          sx={{
            mb: 4,
            borderRadius: 2,
            boxShadow: 2,
          }}
          action={
            <Button
              color="inherit"
              variant="outlined"
              size="small"
              onClick={() => navigate("/payments")}
              sx={{ borderColor: "white", color: "white" }}
            >
              View Plans
            </Button>
          }
        >
          Unlock full features by subscribing to one of our plans
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 5 }}>
        {" "}
        {/* Changed mb: 0 back to mb: 5 */}
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Available Requests"
            value={currentUser?.totalRequests || 0}
            color="primary.main"
            icon={<RequestQuoteIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Used Requests"
            value={currentUser?.usedRequests || 0}
            color="secondary.main"
            icon={<BarChartIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Total Events"
            value={currentUser?.totalEvents || 0}
            color="success.main"
            icon={<CalendarTodayIcon />}
          />
        </Grid>
      </Grid>

      <Box sx={{ mt: 10, mb: 1 }}>
        {" "}
        {/* Added a Box wrapper with proper margins */}
        <Typography variant="h5" component="h2" fontWeight="medium">
          Quick Actions
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <ActionCard
            title="Event Management"
            description="Create a new event or manage your existing events. Track event status and generate authentication codes."
            color="#3f51b5"
            icon={<EventIcon />}
            primaryAction={{
              label: "View Events",
              icon: <EventIcon />,
              onClick: () => navigate("/events"),
            }}
            secondaryAction={{
              label: "Create New",
              icon: <AddCircleOutlineIcon />,
              onClick: () =>
                navigate("/events", { state: { openCreateModal: true } }),
            }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <ActionCard
            title="Subscription"
            description={
              currentUser?.hasPurchasedPlan
                ? `Your current plan includes ${currentUser?.totalRequests} service requests. Upgrade to get more requests.`
                : "Purchase a plan to get started with service requests and unlock all features."
            }
            color="#f50057"
            icon={<PaymentIcon />}
            primaryAction={{
              label: currentUser?.hasPurchasedPlan
                ? "Upgrade Plan"
                : "View Plans",
              icon: <PaymentIcon />,
              onClick: () => navigate("/payments"),
            }}
          />
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
