import React, { useEffect, useState } from "react";
import { Box, Button, Container, Typography } from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import { ToastContainer } from "react-toastify";
import { useTranslation } from "react-i18next";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";

import "./i18n";

function App() {
  const { t } = useTranslation();
  const [userId, setUserId] = useState(null);
  const [showSignup, setShowSignup] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user_id");
    if (storedUser) {
      setUserId(storedUser);
    }
    setLoading(false);
  }, []);

  if (loading) return null;

  if (!userId) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          backgroundImage:
            "linear-gradient(120deg, rgba(11, 43, 22, 0.78), rgba(61, 111, 54, 0.42)), url('/farm-bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          display: "flex",
          alignItems: "center",
          py: { xs: 4, md: 8 },
        }}
      >
        <Container maxWidth="lg">
          <ToastContainer />
          {showSignup ? (
            <Signup switchToLogin={() => setShowSignup(false)} />
          ) : (
            <Login
              onLogin={(id) => {
                localStorage.setItem("user_id", id);
                setUserId(id);
              }}
              switchToSignup={() => setShowSignup(true)}
            />
          )}
        </Container>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, rgba(221, 239, 216, 0.9), rgba(238, 245, 234, 0.95) 45%, rgba(230, 238, 225, 1) 100%)",
      }}
    >
      <ToastContainer />

      <Box
        sx={{
          position: "relative",
          overflow: "hidden",
          backgroundImage:
            "linear-gradient(120deg, rgba(14, 52, 29, 0.88), rgba(46, 125, 50, 0.45)), url('/dashboard-bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          color: "#fff",
          pt: { xs: 4, md: 6 },
          pb: { xs: 5, md: 7 },
          mb: -4,
        }}
      >
        <Container maxWidth="xl">
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: { xs: "flex-start", md: "center" },
              flexDirection: { xs: "column", md: "row" },
              gap: 3,
            }}
          >
            <Box sx={{ maxWidth: 720 }}>
              <Typography
                sx={{
                  display: "inline-block",
                  mb: 1.5,
                  px: 2,
                  py: 0.75,
                  borderRadius: "999px",
                  backgroundColor: "rgba(255,255,255,0.14)",
                  backdropFilter: "blur(12px)",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                }}
              >
                {t("auth_badge", { defaultValue: "Smart farming support" })}
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, lineHeight: 1.12 }}>
                {t("hero_title", { defaultValue: t("app_title") })}
              </Typography>
              <Typography sx={{ mt: 1.5, fontSize: "1.05rem", color: "rgba(255,255,255,0.88)" }}>
                {t("hero_subtitle", {
                  defaultValue:
                    "A cleaner dashboard for farmers with crop insights, irrigation guidance, fertilizer suggestions, and printable field reports.",
                })}
              </Typography>
            </Box>

            <Button
              variant="contained"
              startIcon={<LogoutIcon />}
              onClick={() => {
                localStorage.removeItem("user_id");
                setUserId(null);
              }}
              sx={{
                alignSelf: { xs: "stretch", md: "flex-start" },
                px: 3.5,
                py: 1.4,
                fontWeight: 700,
                borderRadius: "18px",
                textTransform: "none",
                background: "linear-gradient(135deg, #9ad15d, #3fa34d)",
                boxShadow: "0 16px 30px rgba(10, 30, 10, 0.22)",
                "&:hover": {
                  background: "linear-gradient(135deg, #86c24f, #318c3c)",
                },
              }}
            >
              {t("logout")}
            </Button>
          </Box>
        </Container>
      </Box>

      <Dashboard user_id={userId} />
    </Box>
  );
}

export default App;
