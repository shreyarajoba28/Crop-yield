import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import AgricultureOutlinedIcon from "@mui/icons-material/AgricultureOutlined";
import OpacityOutlinedIcon from "@mui/icons-material/OpacityOutlined";
import ThermostatOutlinedIcon from "@mui/icons-material/ThermostatOutlined";
import WaterIcon from "@mui/icons-material/Water";
import GrassOutlinedIcon from "@mui/icons-material/GrassOutlined";
import WaterDropOutlinedIcon from "@mui/icons-material/WaterDropOutlined";
import SpaOutlinedIcon from "@mui/icons-material/SpaOutlined";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { ToastContainer, toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import axios from "axios";

const BASE_URL = "http://localhost:5000";

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const StatCard = ({ icon, label, value, accent }) => (
  <Card
    sx={{
      borderRadius: "22px",
      boxShadow: "0 12px 30px rgba(39, 69, 34, 0.08)",
      border: "1px solid rgba(91, 130, 83, 0.14)",
      background: "#fff",
    }}
  >
    <CardContent sx={{ display: "flex", alignItems: "center", gap: 2.2, p: 2.4 }}>
      <Box
        sx={{
          width: 52,
          height: 52,
          borderRadius: "16px",
          display: "grid",
          placeItems: "center",
          color: "#fff",
          background: accent,
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography sx={{ color: "#6c806f", fontSize: "0.92rem", fontWeight: 600 }}>{label}</Typography>
        <Typography sx={{ color: "#17351e", fontWeight: 800, fontSize: "1.25rem" }}>{value}</Typography>
      </Box>
    </CardContent>
  </Card>
);

const SectionCard = ({ title, subtitle, children, action }) => (
  <Card
    sx={{
      borderRadius: "26px",
      boxShadow: "0 18px 38px rgba(35, 69, 33, 0.08)",
      border: "1px solid rgba(91, 130, 83, 0.14)",
      background: "rgba(255,255,255,0.96)",
    }}
  >
    <CardContent sx={{ p: { xs: 2.4, md: 3.2 } }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", md: "center" },
          flexDirection: { xs: "column", md: "row" },
          gap: 1.5,
          mb: 2.2,
        }}
      >
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: "1.25rem", color: "#15361b" }}>{title}</Typography>
          {subtitle ? (
            <Typography sx={{ color: "#6a7d6d", mt: 0.5, fontSize: "0.95rem" }}>{subtitle}</Typography>
          ) : null}
        </Box>
        {action}
      </Box>
      {children}
    </CardContent>
  </Card>
);

export default function Dashboard({ user_id }) {
  const { t, i18n } = useTranslation();
  const [form, setForm] = useState({
    Crop: "",
    Season: "",
    Year: "",
    Area: "",
    Irrigation_Type: "",
    City: "",
    Temperature: "",
    Humidity: "",
  });
  const [options, setOptions] = useState({ crops: [], seasons: [], irrigation: [] });
  const [result, setResult] = useState(null);
  const [past, setPast] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  useEffect(() => {
    axios.get(`${BASE_URL}/options`).then((res) => setOptions(res.data));
    axios.get(`${BASE_URL}/predictions/${user_id}`).then((res) => setPast(res.data));
  }, [user_id]);

  const translateCrop = (value) => t(`crops.${value}`, { defaultValue: value });
  const translateSeason = (value) => t(`seasons.${value}`, { defaultValue: value });
  const translateIrrigation = (value) => t(`irrigation_values.${value}`, { defaultValue: value });
  const translateWaterStage = (value) => t(`water_stages.${value}`, { defaultValue: value });
  const getLocalizedWaterSuggestions = (prediction) => {
    const keyedSuggestions = (prediction.recommendation_keys || [])
      .map((key) =>
        key === "water.total_needed"
          ? t("water_recommendations.total_needed", { value: prediction.total_water_m3 })
          : t(`water_recommendations.${key.split(".")[1]}`, { defaultValue: "" })
      )
      .filter(Boolean);

    if (keyedSuggestions.length > 0) {
      return keyedSuggestions;
    }

    return String(prediction.suggestion || prediction.recommendation || "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  };

  const getLocalizedFertilizerSuggestions = (prediction) => {
    const keyedSuggestions = (prediction.fertilizer_suggestion_keys || [])
      .map((key) =>
        t(`fertilizer_recommendations.${key.split(".")[1]}`, { defaultValue: "" })
      )
      .filter(Boolean);

    if (keyedSuggestions.length > 0) {
      return keyedSuggestions;
    }

    return (prediction.fertilizer_suggestions || []).filter(Boolean);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post(`${BASE_URL}/predict`, { ...form, user_id });
      const predictionResult = {
        ...res.data,
        season: form.Season,
        year: form.Year,
        area: form.Area,
        irrigation_type: form.Irrigation_Type,
        city: form.City,
      };
      setResult(predictionResult);
      toast.success(t("prediction_successful"));

      const updatedPast = await axios.get(`${BASE_URL}/predictions/${user_id}`);
      setPast(updatedPast.data);
    } catch (err) {
      toast.error(err.response?.data?.error || t("prediction_failed"));
    }

    setLoading(false);
  };

  const handleDelete = async (pred_id) => {
    try {
      const res = await axios.delete(`${BASE_URL}/predictions/${user_id}/${pred_id}`);
      setPast(res.data);
      toast.success(t("prediction_deleted"));
    } catch {
      toast.error(t("delete_failed"));
    }
  };

  const openPrintableReport = (prediction) => {
    const reportWindow = window.open("", "_blank", "width=920,height=760");
    if (!reportWindow) {
      toast.error(t("pdf_download_failed"));
      return;
    }

    const waterSupplyEntries = Object.entries(prediction.water_supply || prediction.stage_water || {});
    const fertilizerSuggestions = getLocalizedFertilizerSuggestions(prediction);
    const suggestions = getLocalizedWaterSuggestions(prediction);

    const html = `
      <!DOCTYPE html>
      <html lang="${escapeHtml(i18n.language)}">
        <head>
          <meta charset="UTF-8" />
          <title>${escapeHtml(`${translateCrop(prediction.crop)} ${t("report_file_suffix", { defaultValue: "report" })}`)}</title>
          <style>
            body { margin: 0; padding: 30px; font-family: "Segoe UI", "Nirmala UI", "Mangal", sans-serif; background: #eef5ea; color: #18321d; }
            .sheet { max-width: 860px; margin: 0 auto; background: white; border-radius: 24px; padding: 32px; box-shadow: 0 18px 50px rgba(30, 60, 25, 0.15); }
            .hero { padding: 22px 24px; border-radius: 22px; background: linear-gradient(135deg, #1f5f2e, #80b545); color: white; margin-bottom: 24px; }
            .hero h1 { margin: 0 0 8px; font-size: 30px; }
            .meta { opacity: 0.92; }
            .section { margin-top: 22px; }
            .section h2 { margin: 0 0 14px; color: #1f5f2e; }
            .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
            .cell { background: #f7fbf5; border: 1px solid #e0ebdb; border-radius: 16px; padding: 14px 16px; }
            .label { display: block; color: #67806d; font-size: 13px; margin-bottom: 6px; }
            .value { font-weight: 700; font-size: 16px; }
            ul { margin: 0; padding-left: 20px; }
            li { margin-bottom: 8px; }
          </style>
        </head>
        <body>
          <div class="sheet">
            <div class="hero">
              <h1>${escapeHtml(t("report_title"))}</h1>
              <div class="meta">${escapeHtml(t("generated_on"))}: ${escapeHtml(new Date().toLocaleString())}</div>
            </div>
            <div class="section">
              <h2>${escapeHtml(t("crop_details"))}</h2>
              <div class="grid">
                <div class="cell"><span class="label">${escapeHtml(t("crop"))}</span><span class="value">${escapeHtml(translateCrop(prediction.crop || "N/A"))}</span></div>
                <div class="cell"><span class="label">${escapeHtml(t("season"))}</span><span class="value">${escapeHtml(translateSeason(prediction.season || "N/A"))}</span></div>
                <div class="cell"><span class="label">${escapeHtml(t("year"))}</span><span class="value">${escapeHtml(prediction.year || "N/A")}</span></div>
                <div class="cell"><span class="label">${escapeHtml(t("area"))}</span><span class="value">${escapeHtml(prediction.area || "N/A")}</span></div>
                <div class="cell"><span class="label">${escapeHtml(t("irrigation_type"))}</span><span class="value">${escapeHtml(translateIrrigation(prediction.irrigation_type || "N/A"))}</span></div>
                <div class="cell"><span class="label">${escapeHtml(t("city"))}</span><span class="value">${escapeHtml(prediction.city || "N/A")}</span></div>
              </div>
            </div>
            <div class="section">
              <h2>${escapeHtml(t("prediction_summary"))}</h2>
              <div class="grid">
                <div class="cell"><span class="label">${escapeHtml(t("predicted_yield"))}</span><span class="value">${escapeHtml(prediction.predicted_yield || "N/A")}</span></div>
                <div class="cell"><span class="label">${escapeHtml(t("weather"))}</span><span class="value">${escapeHtml(prediction.weather || "N/A")}</span></div>
                <div class="cell"><span class="label">${escapeHtml(t("temperature"))}</span><span class="value">${escapeHtml(prediction.temperature || "N/A")}</span></div>
                <div class="cell"><span class="label">${escapeHtml(t("humidity"))}</span><span class="value">${escapeHtml(prediction.humidity || "N/A")}</span></div>
              </div>
            </div>
            <div class="section">
              <h2>${escapeHtml(t("water_supply_by_stage"))}</h2>
              <ul>
                ${waterSupplyEntries.length > 0 ? waterSupplyEntries.map(([stage, value]) => `<li><strong>${escapeHtml(translateWaterStage(stage))}:</strong> ${escapeHtml(`${value} m3`)}</li>`).join("") : `<li>${escapeHtml(t("water_stage_details_unavailable"))}</li>`}
              </ul>
            </div>
            <div class="section">
              <h2>${escapeHtml(t("fertilizer_suggestions", { defaultValue: "Fertilizer Suggestions" }))}</h2>
              <ul>
                ${fertilizerSuggestions.length > 0 ? fertilizerSuggestions.map((item) => `<li>${escapeHtml(item)}</li>`).join("") : `<li>${escapeHtml(t("no_suggestions_available"))}</li>`}
              </ul>
            </div>
            <div class="section">
              <h2>${escapeHtml(t("suggestions"))}</h2>
              <ul>
                ${suggestions.length > 0 ? suggestions.map((item) => `<li>${escapeHtml(item)}</li>`).join("") : `<li>${escapeHtml(t("no_suggestions_available"))}</li>`}
              </ul>
            </div>
          </div>
          <script>window.onload = function () { setTimeout(function () { window.print(); }, 250); };</script>
        </body>
      </html>
    `;

    reportWindow.document.open();
    reportWindow.document.write(html);
    reportWindow.document.close();
  };

  const handleDownload = (prediction) => {
    openPrintableReport(prediction);
    toast.success(t("pdf_print_ready"));
  };

  const filteredData = past.filter((p) => p.crop.toLowerCase().includes(search.toLowerCase()));
  const paginatedData = filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const tooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0].payload;
    return (
      <Box sx={{ background: "#21582d", color: "#fff", p: 1.5, borderRadius: "14px" }}>
        <Typography sx={{ fontWeight: 700 }}>{translateCrop(data.crop)}</Typography>
        <Typography sx={{ fontSize: "0.92rem" }}>
          {t("predicted_yield")}: {data.predicted_yield}
        </Typography>
      </Box>
    );
  };

  return (
    <Box sx={{ px: { xs: 2, md: 4 }, pb: 6 }}>
      <ToastContainer />

      <Box sx={{ maxWidth: 1360, mx: "auto", mt: { xs: 0, md: 2 }, display: "grid", gap: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Box sx={{ minWidth: 200 }}>
            <Typography sx={{ mb: 0.8, color: "#4c644f", fontWeight: 700, fontSize: "0.92rem" }}>
              {t("language")}
            </Typography>
            <TextField
              select
              size="small"
              value={i18n.language}
              onChange={(e) => i18n.changeLanguage(e.target.value)}
              sx={{ minWidth: 200, background: "#fff", borderRadius: "16px" }}
            >
              <MenuItem value="en">{t("english")}</MenuItem>
              <MenuItem value="hi">{t("hindi")}</MenuItem>
              <MenuItem value="mr">{t("marathi")}</MenuItem>
            </TextField>
          </Box>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(5, 1fr)" }, gap: 2 }}>
          <StatCard icon={<AgricultureOutlinedIcon />} label={t("crop")} value={result ? translateCrop(result.crop) : t("select_crop")} accent="linear-gradient(135deg, #2e7d32, #8bc34a)" />
          <StatCard icon={<OpacityOutlinedIcon />} label={t("total_water_required")} value={result ? `${result.total_water_m3} m3` : "--"} accent="linear-gradient(135deg, #1976d2, #4fc3f7)" />
          <StatCard icon={<ThermostatOutlinedIcon />} label={t("temperature")} value={result ? `${result.temperature} °C` : "--"} accent="linear-gradient(135deg, #ef6c00, #ffb74d)" />
          <StatCard icon={<WaterIcon />} label={t("humidity")} value={result ? `${result.humidity}%` : "--"} accent="linear-gradient(135deg, #00897b, #4dd0e1)" />
          <StatCard icon={<GrassOutlinedIcon />} label={t("predicted_yield")} value={result ? result.predicted_yield : "--"} accent="linear-gradient(135deg, #5d4037, #8d6e63)" />
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "0.95fr 1.05fr" }, gap: 3 }}>
          <SectionCard title={t("predict_crop_yield")} subtitle={t("predict_subtitle", { defaultValue: "Works with internet weather or manual offline weather input." })}>
            <Box component="form" onSubmit={handleSubmit}>
              <Typography sx={{ mb: 1.5, color: "#5e7361", fontSize: "0.93rem", fontWeight: 600 }}>
                {t("manual_weather_note", { defaultValue: "If internet is not available, enter temperature and humidity manually." })}
              </Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" }, gap: 2 }}>
                <TextField select label={t("crop")} name="Crop" value={form.Crop} onChange={handleChange} fullWidth>
                  <MenuItem value="">{t("select_crop")}</MenuItem>
                  {options.crops.map((crop) => (
                    <MenuItem key={crop} value={crop}>
                      {translateCrop(crop)}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField select label={t("season")} name="Season" value={form.Season} onChange={handleChange} fullWidth>
                  <MenuItem value="">{t("select_season")}</MenuItem>
                  {options.seasons.map((season) => (
                    <MenuItem key={season} value={season}>
                      {translateSeason(season)}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField label={t("year")} name="Year" value={form.Year} onChange={handleChange} fullWidth />
                <TextField label={t("area")} name="Area" value={form.Area} onChange={handleChange} fullWidth />
                <TextField select label={t("irrigation")} name="Irrigation_Type" value={form.Irrigation_Type} onChange={handleChange} fullWidth>
                  <MenuItem value="">{t("select_irrigation")}</MenuItem>
                  {options.irrigation.map((irrigation) => (
                    <MenuItem key={irrigation} value={irrigation}>
                      {translateIrrigation(irrigation)}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField label={t("optional_city", { defaultValue: "City (optional)" })} name="City" value={form.City} onChange={handleChange} fullWidth />
                <TextField label={t("temperature")} name="Temperature" value={form.Temperature} onChange={handleChange} fullWidth />
                <TextField label={t("humidity")} name="Humidity" value={form.Humidity} onChange={handleChange} fullWidth />
              </Box>

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
                sx={{
                  mt: 3,
                  py: 1.6,
                  borderRadius: "18px",
                  textTransform: "none",
                  fontWeight: 800,
                  fontSize: "1rem",
                  background: "linear-gradient(135deg, #2e7d32, #7cb342)",
                  boxShadow: "0 14px 28px rgba(56, 96, 47, 0.22)",
                  "&:hover": { background: "linear-gradient(135deg, #25672a, #689f38)" },
                }}
              >
                {loading ? t("predicting") : t("predict")}
              </Button>
            </Box>
          </SectionCard>

          <SectionCard
            title={t("prediction_result")}
            subtitle={result ? t("result_ready_subtitle", { defaultValue: "Water and fertilizer actions are ready for this crop." }) : t("result_empty_subtitle", { defaultValue: "Generate a prediction to view weather, irrigation, and fertilizer recommendations." })}
            action={
              result ? (
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={() => handleDownload(result)}
                  sx={{ borderRadius: "16px", textTransform: "none", fontWeight: 700, background: "linear-gradient(135deg, #1b5e20, #4caf50)", "&:hover": { background: "linear-gradient(135deg, #144b19, #3f9143)" } }}
                >
                  {t("download_prediction")}
                </Button>
              ) : null
            }
          >
            {result ? (
              <Box sx={{ display: "grid", gap: 2.2 }}>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" }, gap: 1.5 }}>
                  {[
                    [t("crop"), translateCrop(result.crop)],
                    [t("season"), translateSeason(result.season)],
                    [t("irrigation_type"), translateIrrigation(result.irrigation_type)],
                    [t("city"), result.city || "N/A"],
                    [t("predicted_yield"), result.predicted_yield],
                    [t("weather"), result.weather],
                    [t("temperature"), `${result.temperature} °C`],
                    [t("humidity"), `${result.humidity}%`],
                  ].map(([label, value]) => (
                    <Box key={label} sx={{ p: 1.8, borderRadius: "18px", background: "#f7fbf5", border: "1px solid #e0ebdb" }}>
                      <Typography sx={{ color: "#6b806f", fontSize: "0.86rem", fontWeight: 600 }}>{label}</Typography>
                      <Typography sx={{ mt: 0.4, color: "#17351e", fontWeight: 800 }}>{value}</Typography>
                    </Box>
                  ))}
                </Box>

                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
                  <Box sx={{ p: 2, borderRadius: "22px", background: "linear-gradient(180deg, #edf7ff, #ffffff)", border: "1px solid #d8e8fb" }}>
                    <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
                      <WaterDropOutlinedIcon sx={{ color: "#1976d2" }} />
                      <Typography sx={{ fontWeight: 800, color: "#184975" }}>{t("water_supply_by_stage")}</Typography>
                    </Stack>
                    <Stack spacing={1}>
                      {Object.entries(result.water_supply || {}).map(([stage, value]) => (
                        <Box key={stage} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 1.2, borderRadius: "14px", background: "#ffffff" }}>
                          <Typography sx={{ fontWeight: 600 }}>{translateWaterStage(stage)}</Typography>
                          <Chip label={`${value} m3`} sx={{ fontWeight: 700 }} />
                        </Box>
                      ))}
                      <Typography sx={{ pt: 0.5, color: "#184975", fontWeight: 800 }}>
                        {t("total_water_required")}: {result.total_water_m3} m3
                      </Typography>
                    </Stack>
                  </Box>

                  <Box sx={{ p: 2, borderRadius: "22px", background: "linear-gradient(180deg, #f3fbef, #ffffff)", border: "1px solid #deecd6" }}>
                    <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
                      <SpaOutlinedIcon sx={{ color: "#2e7d32" }} />
                      <Typography sx={{ fontWeight: 800, color: "#1f5f2e" }}>
                        {t("fertilizer_suggestions", { defaultValue: "Fertilizer Suggestions" })}
                      </Typography>
                    </Stack>
                    <Stack spacing={1.1}>
                      {getLocalizedFertilizerSuggestions(result).length > 0 ? getLocalizedFertilizerSuggestions(result).map((item, index) => (
                        <Box key={`${item}-${index}`} sx={{ p: 1.2, borderRadius: "14px", background: "#ffffff", color: "#234728", lineHeight: 1.5 }}>
                          {item}
                        </Box>
                      )) : (
                        <Box sx={{ p: 1.2, borderRadius: "14px", background: "#ffffff", color: "#234728", lineHeight: 1.5 }}>
                          {t("no_suggestions_available")}
                        </Box>
                      )}
                    </Stack>
                  </Box>
                </Box>

                <Box sx={{ p: 2, borderRadius: "22px", background: "linear-gradient(180deg, #fff8ec, #ffffff)", border: "1px solid #f2e0bf" }}>
                  <Typography sx={{ fontWeight: 800, color: "#8c5b10", mb: 1 }}>{t("suggestions")}</Typography>
                  <Typography sx={{ whiteSpace: "pre-line", color: "#4e3c1f", lineHeight: 1.7 }}>
                    {getLocalizedWaterSuggestions(result).length > 0
                      ? getLocalizedWaterSuggestions(result).join("\n")
                      : t("no_suggestions_available")}
                  </Typography>
                </Box>
              </Box>
            ) : (
              <Box sx={{ minHeight: 340, borderRadius: "24px", display: "grid", placeItems: "center", textAlign: "center", background: "linear-gradient(180deg, #f7fbf5, #ffffff)", border: "1px dashed #cadac4", px: 3 }}>
                <Box>
                  <Typography sx={{ fontWeight: 800, fontSize: "1.3rem", color: "#234728" }}>
                    {t("empty_result_title", { defaultValue: "Ready for your next crop plan" })}
                  </Typography>
                  <Typography sx={{ mt: 1, color: "#667a69", maxWidth: 460 }}>
                    {t("empty_result_text", {
                      defaultValue:
                        "Submit the form to view yield estimate, weather conditions, irrigation requirement, and fertilizer recommendations together.",
                    })}
                  </Typography>
                </Box>
              </Box>
            )}
          </SectionCard>
        </Box>

        <SectionCard title={t("past_predictions")} subtitle={t("past_predictions_subtitle", { defaultValue: "Search previous predictions and print reports any time." })}>
          <Card sx={{ mb: 2, borderRadius: "18px", boxShadow: "none", background: "#f7fbf5", border: "1px solid #e0ebdb" }}>
            <CardContent sx={{ p: 1.5 }}>
              <TextField
                fullWidth
                placeholder={t("search_crop")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </CardContent>
          </Card>

          <Table>
            <TableHead>
              <TableRow sx={{ background: "#214d2c" }}>
                <TableCell sx={{ color: "#fff", fontWeight: 700 }}>{t("table_crop")}</TableCell>
                <TableCell sx={{ color: "#fff", fontWeight: 700 }}>{t("table_season")}</TableCell>
                <TableCell sx={{ color: "#fff", fontWeight: 700 }}>{t("table_year")}</TableCell>
                <TableCell sx={{ color: "#fff", fontWeight: 700 }}>{t("table_area")}</TableCell>
                <TableCell sx={{ color: "#fff", fontWeight: 700 }}>{t("table_yield")}</TableCell>
                <TableCell sx={{ color: "#fff", fontWeight: 700 }}>{t("download")}</TableCell>
                <TableCell sx={{ color: "#fff", fontWeight: 700 }}>{t("delete")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedData.map((prediction) => (
                <TableRow key={prediction._id} hover>
                  <TableCell>{translateCrop(prediction.crop)}</TableCell>
                  <TableCell>{translateSeason(prediction.season)}</TableCell>
                  <TableCell>{prediction.year}</TableCell>
                  <TableCell>{prediction.area}</TableCell>
                  <TableCell>{prediction.predicted_yield}</TableCell>
                  <TableCell>
                    <IconButton color="primary" onClick={() => handleDownload(prediction)}>
                      <DownloadIcon />
                    </IconButton>
                  </TableCell>
                  <TableCell>
                    <IconButton color="error" onClick={() => handleDelete(prediction._id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <TablePagination
            component="div"
            count={filteredData.length}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))}
          />
        </SectionCard>

        {past.length > 0 && (
          <SectionCard title={t("prediction_graph")} subtitle={t("graph_subtitle", { defaultValue: "Quick view of how predicted yield changes across crops." })}>
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={past}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="crop" tickFormatter={translateCrop} />
                <YAxis />
                <Tooltip content={tooltip} />
                <Bar dataKey="predicted_yield" fill="#2e7d32" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </SectionCard>
        )}
      </Box>
    </Box>
  );
}
