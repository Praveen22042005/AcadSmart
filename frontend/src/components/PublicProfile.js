import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, Link } from "react-router-dom";
import defaultAvatar from '../assets/default-avatar.png';

const PublicProfile = () => {
  const { token } = useParams();
  const [faculty, setFaculty] = useState(null);
  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchPublicProfile = async () => {
      try {
        const response = await axios.get(`http://localhost:4000/faculty/public-profile/${token}`);
        if (response.data.success) {
          setFaculty(response.data.faculty);
          setPublications(response.data.publications);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Error fetching public profile:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicProfile();
  }, [token]);

  if (loading) {
    return <div className="text-center py-4">Loading...</div>;
  }

  if (error || !faculty) {
    return (
      <div className="text-center py-4">
        <p className="text-red-600">Invalid or expired profile URL.</p>
        <Link to="/">
          <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded">
            Go Back
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <header className="bg-blue-600 text-white p-4 flex justify-between items-center">
        <h1 className="text-3xl font-bold">AcadSmart - Public Profile</h1>
        <Link to="/">
          <button className="bg-white text-blue-600 px-4 py-2 rounded hover:bg-gray-200">
            Home
          </button>
        </Link>
      </header>

      <main className="p-6">
        {/* Faculty Details */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="flex items-center space-x-6">
            <img
              src={faculty.profilePhoto || defaultAvatar}
              alt={`${faculty.firstName} ${faculty.lastName}`}
              className="w-24 h-24 rounded-full object-cover border-2 border-blue-500"
            />
            <div>
              <h2 className="text-2xl font-bold">
                {faculty.firstName} {faculty.lastName}
              </h2>
              <p className="text-gray-600">{faculty.email}</p>
            </div>
          </div>
        </div>

        {/* Publications */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Publications</h2>
          {publications.length === 0 ? (
            <div className="text-gray-500 text-center py-4">
              No publications found.
            </div>
          ) : (
            <div className="space-y-4">
              {publications.map((pub, index) => (
                <div key={index} className="border-b pb-4">
                  <h3 className="font-semibold text-lg">{pub.title}</h3>
                  <p className="text-gray-600">
                    {Array.isArray(pub.authors)
                      ? pub.authors.join(", ")
                      : pub.authors}
                  </p>
                  <p className="text-gray-500">
                    {pub.journal} ({pub.year})
                  </p>
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
      </main>
    </div>
  );
};

export default PublicProfile;