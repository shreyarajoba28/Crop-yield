import React, { useState } from "react";
import { Container, Typography, TextField, MenuItem, Button } from "@mui/material";
import { ToastContainer } from "react-toastify";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import "./i18n";

function App() {
  const [userId, setUserId] = useState(localStorage.getItem("user_id") || null);
  const [showSignup, setShowSignup] = useState(false);

  if (!userId) {
    return (
      <Container maxWidth="sm">
        <ToastContainer />
        {showSignup ? <Signup switchToLogin={()=>setShowSignup(false)} /> : <Login onLogin={setUserId} switchToSignup={()=>setShowSignup(true)} />}
      </Container>
    );
  }

  return (
    <Container maxWidth="md" style={{ marginTop: 40 }}>
      
      <ToastContainer />
      <Typography variant="h4" gutterBottom align="center">🌾 Crop Yield Prediction</Typography>
      <Button variant="outlined" color="secondary" fullWidth onClick={()=>{ localStorage.removeItem("user_id"); setUserId(null); }} style={{ marginBottom:20 }}>Logout</Button>
      <Dashboard user_id={userId} />
    </Container>
  );
}

export default App;