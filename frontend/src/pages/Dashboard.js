import React, { useEffect, useState } from "react";
import { Typography, TextField, MenuItem, Button, Card, CardContent, Table, TableHead, TableBody, TableRow, TableCell } from "@mui/material";
import { useTranslation } from "react-i18next";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const BASE_URL = "http://localhost:5000";

export default function Dashboard({ user_id }) {
  const { t, i18n } = useTranslation();

  const [form, setForm] = useState({ Crop:"", Season:"", Year:"", Area:"", Irrigation_Type:"", City:"" });
  const [options, setOptions] = useState({ crops:[], seasons:[], irrigation:[] });
  const [result, setResult] = useState(null);
  const [past, setPast] = useState([]);

  useEffect(() => {
    axios.get(`${BASE_URL}/options`).then(res => setOptions(res.data));
    axios.get(`${BASE_URL}/predictions/${user_id}`).then(res => setPast(res.data));
  }, [user_id]);

  const handleChange = (e) => setForm({...form,[e.target.name]:e.target.value});

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${BASE_URL}/predict`, {...form, user_id});
      setResult(res.data);
      toast.success("Prediction successful!");
      const updatedPast = await axios.get(`${BASE_URL}/predictions/${user_id}`);
      setPast(updatedPast.data);
    } catch(err) {
      toast.error(err.response?.data?.error || "Prediction failed");
    }
  };

  const handleLanguageChange = (e) => i18n.changeLanguage(e.target.value);

  return (
    <div>
      <ToastContainer />

      {/* Language Selector */}
      <TextField select label="Language" value={i18n.language} onChange={handleLanguageChange} style={{ marginBottom: 20 }}>
        <MenuItem value="en">English</MenuItem>
        <MenuItem value="hi">हिंदी</MenuItem>
        <MenuItem value="mr">मराठी</MenuItem>
      </TextField>

      {/* Prediction Form */}
      <Card style={{ padding: 20, marginBottom: 30 }}>
        <CardContent>
          <Typography variant="h5">Predict Crop Yield</Typography>
          <form onSubmit={handleSubmit}>
            <TextField select fullWidth label={t("select_crop")} name="Crop" value={form.Crop} onChange={handleChange} margin="normal" required>
              <MenuItem value="">Select Crop</MenuItem>
              {options.crops.map(c => <MenuItem key={c} value={c}>{t(`crops.${c}`, c)}</MenuItem>)}
            </TextField>
            <TextField select fullWidth label={t("select_season")} name="Season" value={form.Season} onChange={handleChange} margin="normal" required>
              <MenuItem value="">Select Season</MenuItem>
              {options.seasons.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
            <TextField fullWidth label="Year" name="Year" value={form.Year} onChange={handleChange} margin="normal" required />
            <TextField fullWidth type="number" label="Area (ha)" name="Area" value={form.Area} onChange={handleChange} margin="normal" required />
            <TextField select fullWidth label={t("irrigation_type")} name="Irrigation_Type" value={form.Irrigation_Type} onChange={handleChange} margin="normal" required>
              <MenuItem value="">Select Irrigation</MenuItem>
              {options.irrigation.map(i => <MenuItem key={i} value={i}>{i}</MenuItem>)}
            </TextField>
            <TextField fullWidth label="City" name="City" value={form.City} onChange={handleChange} margin="normal" required />
            <Button type="submit" variant="contained" color="success" fullWidth style={{ marginTop: 20 }}>Predict</Button>
          </form>
        </CardContent>
      </Card>

      {/* Prediction Result */}
      {result && (
        <Card style={{ padding: 20, marginBottom: 30 }}>
          <CardContent>
            <Typography variant="h6">Prediction Result</Typography>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Parameter</TableCell>
                  <TableCell>Value</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow><TableCell>Predicted Yield</TableCell><TableCell>{result.Predicted_Yield}</TableCell></TableRow>
                <TableRow><TableCell>Temperature</TableCell><TableCell>{result.Temperature} °C</TableCell></TableRow>
                <TableRow><TableCell>Humidity</TableCell><TableCell>{result.Humidity} %</TableCell></TableRow>
                <TableRow><TableCell>Weather</TableCell><TableCell>{result.Weather}</TableCell></TableRow>
                <TableRow>
                  <TableCell>Stage-wise Water (m³)</TableCell>
                  <TableCell>
                    {Object.entries(result.Stage_Water).map(([stage, val]) => (
                      <div key={stage}>{stage}: {val}</div>
                    ))}
                  </TableCell>
                </TableRow>
                <TableRow><TableCell>Total Water (m³)</TableCell><TableCell>{result.Total_Water_m3}</TableCell></TableRow>
                <TableRow><TableCell>Recommendation</TableCell><TableCell>{result.Recommendation}</TableCell></TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Past Predictions Table */}
      <Card style={{ padding: 20, marginBottom: 30 }}>
        <CardContent>
          <Typography variant="h6">Past Predictions</Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Crop</TableCell>
                <TableCell>Season</TableCell>
                <TableCell>Year</TableCell>
                <TableCell>Area</TableCell>
                <TableCell>Predicted Yield</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {past.map((p,i)=>(
                <TableRow key={i}>
                  <TableCell>{t(`crops.${p.crop}`, p.crop)}</TableCell>
                  <TableCell>{p.season}</TableCell>
                  <TableCell>{p.year}</TableCell>
                  <TableCell>{p.area}</TableCell>
                  <TableCell>{p.predicted_yield}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Prediction Graph */}
      {past.length > 0 && (
        <Card style={{ padding: 20, marginBottom: 30 }}>
          <CardContent>
            <Typography variant="h6">Prediction Graph</Typography>
            <BarChart width={600} height={300} data={past}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="predicted_yield" fill="#4caf50" />
            </BarChart>
          </CardContent>
        </Card>
      )}
    </div>
  );
}