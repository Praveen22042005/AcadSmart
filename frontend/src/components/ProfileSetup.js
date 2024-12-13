// frontend/src/components/ProfileSetup.js
import React, { useState } from 'react';
import axios from 'axios';

const ProfileSetup = ({ faculty, onProfileComplete }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:4000/auth/complete-profile', {
        facultyId: faculty.facultyId,
        firstName,
        lastName,
        email
      });
      if (response.data.success) {
        onProfileComplete(response.data.faculty);
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Profile update failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">Complete Your Profile</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="text"
              placeholder="First Name"
              className="w-full p-2 border rounded"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Last Name"
              className="w-full p-2 border rounded"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
          <div className="mb-6">
            <input
              type="email"
              placeholder="Email"
              className="w-full p-2 border rounded"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
          >
            Complete Profile
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileSetup;