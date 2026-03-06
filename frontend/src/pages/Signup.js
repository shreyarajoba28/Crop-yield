import React, { useState } from "react";
import { TextField, Button, Typography, Card, CardContent } from "@mui/material";
import axios from "axios";

const BASE_URL = "http://localhost:5000";

export default function Signup({ switchToLogin }) {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [msg, setMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${BASE_URL}/signup`, form);
      setMsg("Signup successful! Please login.");
    } catch (err) {
      setMsg(err.response?.data?.error || "Signup failed");
    }
  };

  return (
    <Card style={{ padding: 20, marginTop: 50 }}>
      <CardContent>
        <Typography variant="h5" align="center">Sign Up</Typography>
        <form onSubmit={handleSubmit}>
          <TextField fullWidth label="Username" name="username" value={form.username} onChange={(e)=>setForm({...form,username:e.target.value})} margin="normal" required />
          <TextField fullWidth label="Email" name="email" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})} margin="normal" required />
          <TextField fullWidth label="Password" type="password" name="password" value={form.password} onChange={(e)=>setForm({...form,password:e.target.value})} margin="normal" required />
          <Button type="submit" variant="contained" fullWidth style={{ marginTop: 20 }}>Sign Up</Button>
        </form>
        <Typography style={{ marginTop: 10, cursor: "pointer", textAlign: "center" }} color="primary" onClick={switchToLogin}>Already have account? Login</Typography>
        <Typography color="success" style={{ marginTop: 10 }}>{msg}</Typography>
      </CardContent>
    </Card>
  );
}