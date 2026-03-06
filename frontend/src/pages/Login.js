import React, { useState } from "react";
import { TextField, Button, Typography, Card, CardContent } from "@mui/material";
import axios from "axios";

const BASE_URL = "http://localhost:5000";

export default function Login({ onLogin, switchToSignup }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [msg, setMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${BASE_URL}/login`, form);
      localStorage.setItem("user_id", res.data.user_id);
      onLogin(res.data.user_id);
    } catch (err) {
      setMsg(err.response?.data?.error || "Login failed");
    }
  };

  return (
    <Card style={{ padding: 20, marginTop: 50 }}>
      <CardContent>
        <Typography variant="h5" align="center">Login</Typography>
        <form onSubmit={handleSubmit}>
          <TextField fullWidth label="Email" name="email" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})} margin="normal" required />
          <TextField fullWidth label="Password" type="password" name="password" value={form.password} onChange={(e)=>setForm({...form,password:e.target.value})} margin="normal" required />
          <Button type="submit" variant="contained" fullWidth style={{ marginTop: 20 }}>Login</Button>
        </form>
        <Typography style={{ marginTop: 10, cursor: "pointer", textAlign: "center" }} color="primary" onClick={switchToSignup}>No account? Sign Up</Typography>
        <Typography color="error" style={{ marginTop: 10 }}>{msg}</Typography>
      </CardContent>
    </Card>
  );
}