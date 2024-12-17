import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const Login = ({ onLogin }) => {
  const [facultyId, setFacultyId] = useState('');
  const [password, setPassword] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [credentials, setCredentials] = useState(null);

  useEffect(() => {
    // Retrieve stored credentials from localStorage
    const storedFacultyId = localStorage.getItem('facultyId');
    const storedPassword = localStorage.getItem('password');
    if (storedFacultyId && storedPassword) {
      setFacultyId(storedFacultyId);
      setPassword(storedPassword);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:4000/auth/login', {
        facultyId,
        password,
      });
      if (response.data.success) {
        const faculty = response.data.faculty;

        // Ensure faculty.email is defined before fetching publications
        if (faculty.email) {
          // Fetch publications
          await axios.get(
            `http://localhost:4000/publications/fetch/${encodeURIComponent(faculty.email)}`
          );
        }

        onLogin(faculty);
      } else {
        alert('Login failed');
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Login failed');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:4000/auth/register', {});
      if (response.data.success) {
        setCredentials(response.data.credentials);
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Registration failed');
    }
  };

  if (credentials) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md w-96">
          <h2 className="text-2xl font-bold mb-6 text-center">Registration Successful!</h2>
          <div className="mb-4">
            <p className="font-semibold">Your Faculty ID:</p>
            <p className="text-xl text-blue-600">{credentials.facultyId}</p>
          </div>
          <div className="mb-6">
            <p className="font-semibold">Your Password:</p>
            <p className="text-xl text-blue-600">{credentials.password}</p>
          </div>
          <div className="text-sm text-gray-600 mb-6">
            Please save these credentials. You'll need them to login.
          </div>
          <button
            onClick={() => {
              setCredentials(null);
              setShowRegister(false);
            }}
            className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
          >
            Proceed to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">
          {showRegister ? 'Register New Faculty' : 'Faculty Login'}
        </h2>
        {showRegister ? (
          <div>
            <p className="text-gray-600 mb-4 text-center">
              Click register to get your faculty ID and password
            </p>
            <button
              onClick={handleRegister}
              className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
            >
              Generate Credentials
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Faculty ID"
                className="w-full p-2 border rounded"
                value={facultyId}
                onChange={(e) => setFacultyId(e.target.value)}
              />
            </div>
            <div className="mb-6">
              <input
                type="password"
                placeholder="Password"
                className="w-full p-2 border rounded"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
            >
              Login
            </button>
          </form>
        )}
        <button
          onClick={() => setShowRegister(!showRegister)}
          className="w-full mt-4 text-blue-600 hover:underline"
        >
          {showRegister ? 'Back to Login' : 'Need to Register?'}
        </button>
        <Link to="/">
          <button className="w-full mt-4 text-blue-600 hover:underline">
            Go Back
          </button>
        </Link>
      </div>
    </div>
  );
};

export default Login;