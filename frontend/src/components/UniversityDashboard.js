import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const UniversityDashboard = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [faculty, setFaculty] = useState(null);
  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearchChange = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.length > 2) {
      try {
        const response = await axios.get(`http://localhost:4000/faculty/suggestions?query=${encodeURIComponent(query)}`);
        if (response.data.success) {
          setSuggestions(response.data.facultyNames);
        }
      } catch (err) {
        console.error("Error fetching suggestions:", err);
      }
    } else {
      setSuggestions([]);
    }
  };

  const handleSelectFaculty = async (name) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `http://localhost:4000/faculty/search?name=${encodeURIComponent(name)}`
      );
      if (response.data.success) {
        setFaculty(response.data.faculty);
        setPublications(response.data.publications);
        setSuggestions([]);
        setSearchQuery(name);
      } else {
        setError('Faculty not found');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch faculty details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <header className="bg-blue-600 text-white p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">University Dashboard</h1>
        <Link to="/">
          <button className="text-white hover:underline">Go Back</button>
        </Link>
      </header>

      <main className="p-6">
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search Faculty by Name"
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full p-2 border rounded mb-4"
          />
          {suggestions.length > 0 && (
            <ul className="bg-white border rounded shadow-md max-h-40 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <li
                  key={index}
                  className="p-2 cursor-pointer hover:bg-gray-200"
                  onClick={() => handleSelectFaculty(`${suggestion.firstName} ${suggestion.lastName}`)}
                >
                  {suggestion.firstName} {suggestion.lastName}
                </li>
              ))}
            </ul>
          )}
        </div>

        {loading ? (
          <div className="text-center py-4">Loading...</div>
        ) : error ? (
          <div className="text-red-600 text-center py-4">{error}</div>
        ) : faculty ? (
          <div>
            <div className="bg-white p-6 rounded-lg shadow mb-6">
              <h2 className="text-xl font-bold mb-4">Faculty Details</h2>
              <p><strong>Name:</strong> {faculty.firstName} {faculty.lastName}</p>
              <p><strong>Email:</strong> {faculty.email}</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-4">Publications</h2>
              {publications.length === 0 ? (
                <div className="text-gray-500 text-center py-4">No publications found</div>
              ) : (
                <div className="space-y-4">
                  {publications.map((pub, index) => (
                    <div key={index} className="border-b pb-4">
                      <h3 className="font-semibold text-lg">{pub.title}</h3>
                      <p className="text-gray-600">{Array.isArray(pub.authors) ? pub.authors.join(', ') : pub.authors}</p>
                      <p className="text-gray-500">{pub.journal} ({pub.year})</p>
                      <div className="flex items-center mt-2">
                        <span className="text-sm text-blue-600 mr-4">
                          Citations: {pub.citations || 0}
                        </span>
                        {pub.url && (
                          <a 
                            href={pub.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline"
                          >
                            View Publication
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-gray-500 text-center py-4">Search for a faculty member to see their details and publications</div>
        )}
      </main>
    </div>
  );
};

export default UniversityDashboard;