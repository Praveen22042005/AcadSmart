import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./components/Home";
import Login from "./components/Login";
import ProfileSetup from "./components/ProfileSetup";
import FacultyDashboard from "./FacultyDashboard";
import UniversityDashboard from "./components/UniversityDashboard";
import PublicProfile from "./components/PublicProfile";

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

  const handleProfileUpdate = (updatedFaculty) => {
    setFaculty(updatedFaculty);
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/faculty-login"
          element={
            !faculty ? (
              <Login onLogin={handleLogin} />
            ) : !faculty.isProfileComplete ? (
              <ProfileSetup
                faculty={faculty}
                onProfileComplete={handleProfileComplete}
              />
            ) : (
              <FacultyDashboard
                faculty={faculty}
                onLogout={handleLogout}
                onProfileUpdate={handleProfileUpdate}
              />
            )
          }
        />
        <Route path="/university" element={<UniversityDashboard />} />
        <Route
          path="/public-profile/:token"
          element={<PublicProfile />}
        /> {/* New Route */}
      </Routes>
    </Router>
  );
};

export default App;