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
import AgricultureIcon from "@mui/icons-material/Agriculture";
import GrassIcon from "@mui/icons-material/Grass";
import OpacityIcon from "@mui/icons-material/Opacity";
import InsightsIcon from "@mui/icons-material/Insights";
import axios from "axios";
import { useTranslation } from "react-i18next";

const BASE_URL = "http://localhost:5000";

export default function Login({ onLogin, switchToSignup }) {
  const { t, i18n } = useTranslation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [msg, setMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${BASE_URL}/login`, form);
      localStorage.setItem("user_id", res.data.user_id);
      onLogin(res.data.user_id);
    } catch (err) {
      setMsg(err.response?.data?.error || t("login_failed"));
    }
  };

  const featureCard = (icon, title, text) => (
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
      <Box sx={{ color: "#d4f7c5", mt: 0.3 }}>{icon}</Box>
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
        gridTemplateColumns: { xs: "1fr", lg: "1.1fr 0.9fr" },
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
          <AgricultureIcon fontSize="small" />
          {t("login_side_badge", { defaultValue: "Farmer friendly crop intelligence" })}
        </Typography>
        <Typography variant="h2" sx={{ fontWeight: 800, lineHeight: 1.05, mb: 2 }}>
          {t("login_side_title", { defaultValue: "Better yield planning for every season." })}
        </Typography>
        <Typography sx={{ maxWidth: 620, color: "rgba(255,255,255,0.82)", fontSize: "1.05rem", mb: 3 }}>
          {t("login_side_text", {
            defaultValue:
              "View crop predictions, irrigation advice, fertilizer guidance, and field-ready reports in one simple workspace designed for real farm use.",
          })}
        </Typography>
        <Stack spacing={2.2} sx={{ maxWidth: 620 }}>
          {featureCard(<GrassIcon />, t("feature_crop_title", { defaultValue: "Crop-based guidance" }), t("feature_crop_text", { defaultValue: "Choose your crop and season to get tailored recommendations." }))}
          {featureCard(<OpacityIcon />, t("feature_water_title", { defaultValue: "Water planning" }), t("feature_water_text", { defaultValue: "Stage-wise water requirement helps farmers plan irrigation more confidently." }))}
          {featureCard(<InsightsIcon />, t("feature_report_title", { defaultValue: "Actionable insights" }), t("feature_report_text", { defaultValue: "Reports are easy to print and carry for field decisions." }))}
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
                {t("login")}
              </Typography>
              <Typography sx={{ color: "#52715a", mt: 0.5 }}>
                {t("continue_dashboard", { defaultValue: "Continue to your field dashboard" })}
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
              {t("login")}
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
            onClick={switchToSignup}
          >
            {t("no_account")}
          </Typography>

          <Typography sx={{ mt: 1.5, minHeight: 24, color: "#c62828", fontWeight: 600 }}>{msg}</Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
