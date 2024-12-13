// frontend/src/components/Home.js
import React from "react";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96 text-center">
        <h2 className="text-2xl font-bold mb-6">Welcome to AcadSmart</h2>
        <div className="space-y-4">
          <Link to="/faculty-login">
            <button className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 mb-4">
              Faculty Login
            </button>
          </Link>
          <Link to="/university">
            <button className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700">
              University Login
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;