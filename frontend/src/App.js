// frontend/src/App.js
import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./components/Home";
import Login from "./components/Login";
import ProfileSetup from "./components/ProfileSetup";
import FacultyDashboard from "./FacultyDashboard";
import UniversityDashboard from "./components/UniversityDashboard";

const App = () => {
  const [faculty, setFaculty] = useState(null);

  const handleLogin = (facultyData) => {
    setFaculty(facultyData);
  };

  const handleLogout = () => {
    setFaculty(null);
  };

  const handleProfileComplete = (updatedFaculty) => {
    setFaculty(updatedFaculty);
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/faculty-login" element={
          !faculty ? (
            <Login onLogin={handleLogin} />
          ) : !faculty.isProfileComplete ? (
            <ProfileSetup faculty={faculty} onProfileComplete={handleProfileComplete} />
          ) : (
            <FacultyDashboard faculty={faculty} onLogout={handleLogout} />
          )
        } />
        <Route path="/university" element={<UniversityDashboard />} />
      </Routes>
    </Router>
  );
};

export default App;