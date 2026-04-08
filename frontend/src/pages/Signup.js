import React, { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import ParkIcon from "@mui/icons-material/Park";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import AutoGraphIcon from "@mui/icons-material/AutoGraph";
import axios from "axios";
import { useTranslation } from "react-i18next";

const BASE_URL = "http://localhost:5000";

export default function Signup({ switchToLogin }) {
  const { t, i18n } = useTranslation();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [msg, setMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${BASE_URL}/signup`, form);
      setMsg(t("signup_success"));
    } catch (err) {
      setMsg(err.response?.data?.error || t("signup_failed"));
    }
  };

  const infoRow = (icon, title, text) => (
    <Box
      sx={{
        display: "flex",
        gap: 1.5,
        p: 1.6,
        borderRadius: "18px",
        background: "rgba(255,255,255,0.12)",
        border: "1px solid rgba(255,255,255,0.12)",
        backdropFilter: "blur(8px)",
      }}
    >
      <Box sx={{ color: "#d8f4c7", mt: 0.3 }}>{icon}</Box>
      <Box>
        <Typography sx={{ fontWeight: 700, color: "#fff" }}>{title}</Typography>
        <Typography sx={{ color: "rgba(255,255,255,0.78)", fontSize: "0.92rem" }}>{text}</Typography>
      </Box>
    </Box>
  );

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", lg: "1.05fr 0.95fr" },
        gap: 4,
        alignItems: "stretch",
      }}
    >
      <Box sx={{ color: "#fff", py: { xs: 1, lg: 3 }, px: { xs: 0, md: 2 } }}>
        <Typography
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 1,
            px: 2,
            py: 1,
            borderRadius: "999px",
            backgroundColor: "rgba(255,255,255,0.12)",
            mb: 2,
            fontWeight: 700,
          }}
        >
          <HowToRegIcon fontSize="small" />
          {t("signup_side_badge", { defaultValue: "Build a simple digital farm record" })}
        </Typography>
        <Typography variant="h2" sx={{ fontWeight: 800, lineHeight: 1.05, mb: 2 }}>
          {t("signup_side_title", { defaultValue: "Start with a cleaner way to plan crops." })}
        </Typography>
        <Typography sx={{ maxWidth: 620, color: "rgba(255,255,255,0.82)", fontSize: "1.05rem", mb: 3 }}>
          {t("signup_side_text", {
            defaultValue:
              "Create your account to track predictions, compare past seasons, and keep water plus fertilizer recommendations ready whenever you need them.",
          })}
        </Typography>
        <Stack spacing={2.2} sx={{ maxWidth: 620 }}>
          {infoRow(<ParkIcon />, t("feature_ready_title", { defaultValue: "Crop readiness" }), t("feature_ready_text", { defaultValue: "Select crop and season quickly with language-friendly labels." }))}
          {infoRow(<WaterDropIcon />, t("feature_water_title", { defaultValue: "Water guidance" }), t("feature_water_text", { defaultValue: "See stage-wise irrigation suggestions for each prediction." }))}
          {infoRow(<AutoGraphIcon />, t("feature_records_title", { defaultValue: "Useful records" }), t("feature_records_text", { defaultValue: "Review past reports and compare expected yield visually." }))}
        </Stack>
      </Box>

      <Card
        sx={{
          borderRadius: "28px",
          background: "rgba(255,255,255,0.92)",
          boxShadow: "0 24px 60px rgba(10, 27, 14, 0.28)",
          backdropFilter: "blur(10px)",
          overflow: "hidden",
        }}
      >
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: "#17441f" }}>
                {t("sign_up")}
              </Typography>
              <Typography sx={{ color: "#52715a", mt: 0.5 }}>
                {t("create_farmer_account", { defaultValue: "Create your farmer account" })}
              </Typography>
            </Box>

            <TextField
              select
              size="small"
              label={t("language")}
              value={i18n.language}
              onChange={(e) => i18n.changeLanguage(e.target.value)}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="en">{t("english")}</MenuItem>
              <MenuItem value="hi">{t("hindi")}</MenuItem>
              <MenuItem value="mr">{t("marathi")}</MenuItem>
            </TextField>
          </Box>

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label={t("username")}
              name="username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label={t("email")}
              name="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label={t("password")}
              type="password"
              name="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              margin="normal"
              required
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{
                mt: 3,
                py: 1.5,
                borderRadius: "16px",
                fontWeight: 700,
                textTransform: "none",
                background: "linear-gradient(135deg, #2e7d32, #7cb342)",
                "&:hover": {
                  background: "linear-gradient(135deg, #25672a, #689f38)",
                },
              }}
            >
              {t("sign_up")}
            </Button>
          </form>

          <Typography
            sx={{
              mt: 2.5,
              textAlign: "center",
              cursor: "pointer",
              fontWeight: 700,
              color: "#2e7d32",
            }}
            onClick={switchToLogin}
          >
            {t("already_have_account")}
          </Typography>

          <Typography
            sx={{
              mt: 1.5,
              minHeight: 24,
              color: msg === t("signup_success") ? "#2e7d32" : "#c62828",
              fontWeight: 600,
            }}
          >
            {msg}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
