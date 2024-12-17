import React, { useState, useEffect } from "react";
import defaultAvatar from './assets/default-avatar.png';
import axios from "axios";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Importing custom icons
import { ReactComponent as PublicationsIcon } from "./icons/publications.svg";
import { ReactComponent as CitationsIcon } from "./icons/citations.svg";
import { ReactComponent as HIndexIcon } from "./icons/hindex.svg";
import { ReactComponent as I10IndexIcon } from "./icons/i10index.svg";

const FacultyDashboard = ({ faculty, onLogout, onProfileUpdate }) => {
  const [publications, setPublications] = useState([]);
  const [filteredPublications, setFilteredPublications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalPublications: 0,
    totalCitations: 0,
    hIndex: 0,
    i10Index: 0,
  });

  const [newPublication, setNewPublication] = useState({
    type: "paper",
    title: "",
    authors: "",
    journal: "",
    year: "",
    citations: "",
    url: "",
    abstract: "",
  });

  const [activeSection, setActiveSection] = useState("dashboard");
  const [editingPublication, setEditingPublication] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");

  const [chartData, setChartData] = useState({
    typesData: [],
    yearsData: [],
    journalsData: [],
  });

  // Updated state for profile editing
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    profilePhoto: defaultAvatar,
    firstName: '',
    lastName: '',
    email: '',
  });

 // Update useEffect
useEffect(() => {
  if (faculty) {
    setProfileData({
      profilePhoto: faculty.profilePhoto || '',
      firstName: faculty.firstName || '',
      lastName: faculty.lastName || '',
      email: faculty.email || '',
    });
  }
}, [faculty]);

  // Colors for the charts
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  useEffect(() => {
    const fetchPublications = async () => {
      if (!faculty.email) {
        console.error("Faculty email is not defined");
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(
          `http://localhost:4000/publications/fetch/${encodeURIComponent(
            faculty.email
          )}`
        );

        if (response.data.success) {
          const pubs = response.data.publications;
          setPublications(pubs);
          setFilteredPublications(pubs);
        } else {
          setError("Failed to fetch publications");
        }
      } catch (err) {
        setError(err.message || "Failed to fetch publications");
        console.error("Error fetching publications:", err);
      } finally {
        setLoading(false);
      }
    };

    if (faculty && faculty.email) {
      fetchPublications();
    }
  }, [faculty]);

  // Recalculate stats and chart data whenever publications change
  useEffect(() => {
    const publicationTypesCount = {};
    const publicationYearsCount = {};
    const publicationJournalsCount = {};
    const citations = publications.map((p) => p.citations || 0);
    let totalCitations = 0;

    publications.forEach((pub) => {
      // Count publication types
      publicationTypesCount[pub.type] =
        (publicationTypesCount[pub.type] || 0) + 1;
      // Count publications per year
      const year = pub.year;
      publicationYearsCount[year] = (publicationYearsCount[year] || 0) + 1;
      // Count publications by journal
      if (pub.journal) {
        publicationJournalsCount[pub.journal] =
          (publicationJournalsCount[pub.journal] || 0) + 1;
      }
      // Total citations
      totalCitations += pub.citations || 0;
    });

    // Calculate h-index
    const sortedCitations = [...citations].sort((a, b) => b - a);
    let hIndex = 0;
    for (let i = 0; i < sortedCitations.length; i++) {
      if (sortedCitations[i] >= i + 1) hIndex = i + 1;
      else break;
    }

    // Calculate i10-index
    const i10Index = citations.filter((c) => c >= 10).length;

    setStats({
      totalPublications: publications.length,
      totalCitations,
      hIndex,
      i10Index,
    });

    // Prepare data for charts
    const typesData = Object.keys(publicationTypesCount).map((type) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value: publicationTypesCount[type],
    }));

    const yearsData = Object.keys(publicationYearsCount)
      .map((year) => ({
        year: year,
        count: publicationYearsCount[year],
      }))
      .sort((a, b) => a.year - b.year);

    // Prepare data for journals chart
    let journalsData = Object.keys(publicationJournalsCount).map((journal) => ({
      name: journal,
      count: publicationJournalsCount[journal],
    }));

    // Sort and limit to top 10 journals
    journalsData.sort((a, b) => b.count - a.count);
    journalsData = journalsData.slice(0, 10);

    setChartData({ typesData, yearsData, journalsData });
  }, [publications]);

  useEffect(() => {
    // Update filtered publications when search query or filter type changes
    const filtered = publications.filter((pub) => {
      const matchesSearch = pub.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesType = filterType === "all" || pub.type === filterType;
      return matchesSearch && matchesType;
    });
    setFilteredPublications(filtered);
  }, [searchQuery, filterType, publications]);

  const handleLogout = () => {
    onLogout();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewPublication({ ...newPublication, [name]: value });
  };

  const handleAddPublication = async (e) => {
    e.preventDefault();
    try {
      let authorsArray = newPublication.authors
        .split(",")
        .map((a) => a.trim());

      // Ensure faculty email is included in the authors array
      if (!authorsArray.includes(faculty.email)) {
        authorsArray.push(faculty.email);
      }

      const publicationData = {
        ...newPublication,
        facultyEmail: faculty.email,
        authors: authorsArray,
        year: Number(newPublication.year),
        citations: Number(newPublication.citations) || 0,
      };

      const response = await axios.post(
        "http://localhost:4000/publications/add",
        publicationData
      );
      if (response.data.success) {
        // Refresh publications after adding
        const refreshResponse = await axios.get(
          `http://localhost:4000/publications/fetch/${encodeURIComponent(
            faculty.email
          )}`
        );

        if (refreshResponse.data.success) {
          const pubs = refreshResponse.data.publications;
          setPublications(pubs);
          setFilteredPublications(pubs);
        }

        // Clear form
        setNewPublication({
          type: "paper",
          title: "",
          authors: "",
          journal: "",
          year: "",
          citations: "",
          url: "",
          abstract: "",
        });
        setActiveSection("publications");
      } else {
        setError("Failed to add publication");
      }
    } catch (err) {
      setError(err.message || "Failed to add publication");
      console.error("Error adding publication:", err);
    }
  };

  const handleEditPublication = (publication) => {
    setEditingPublication(publication);
    setActiveSection("editPublication");
  };

  const handleUpdatePublication = async (e) => {
    e.preventDefault();
    try {
      let authorsArray = editingPublication.authors;
      if (typeof authorsArray === "string") {
        authorsArray = authorsArray.split(",").map((a) => a.trim());
      }

      // Ensure faculty email is included in the authors array
      if (!authorsArray.includes(faculty.email)) {
        authorsArray.push(faculty.email);
      }

      const updatedPublicationData = {
        ...editingPublication,
        facultyEmail: faculty.email,
        authors: authorsArray,
        year: Number(editingPublication.year),
        citations: Number(editingPublication.citations) || 0,
      };

      const response = await axios.put(
        `http://localhost:4000/publications/update/${editingPublication._id}`,
        updatedPublicationData
      );
      if (response.data.success) {
        // Refresh publications after updating
        const refreshResponse = await axios.get(
          `http://localhost:4000/publications/fetch/${encodeURIComponent(
            faculty.email
          )}`
        );

        if (refreshResponse.data.success) {
          const pubs = refreshResponse.data.publications;
          setPublications(pubs);
          setFilteredPublications(pubs);
        }

        // Clear form
        setEditingPublication(null);
        setActiveSection("publications");
      } else {
        setError("Failed to update publication");
      }
    } catch (err) {
      setError(err.message || "Failed to update publication");
      console.error("Error updating publication:", err);
    }
  };

  const handleDeletePublication = async (id) => {
    try {
      const response = await axios.delete(
        `http://localhost:4000/publications/delete/${id}`
      );
      if (response.data.success) {
        // Refresh publications after deletion
        const refreshResponse = await axios.get(
          `http://localhost:4000/publications/fetch/${encodeURIComponent(
            faculty.email
          )}`
        );
        if (refreshResponse.data.success) {
          const pubs = refreshResponse.data.publications;
          setPublications(pubs);
          setFilteredPublications(pubs);
        }
      } else {
        setError("Failed to delete publication");
      }
    } catch (err) {
      setError(err.message || "Failed to delete publication");
      console.error("Error deleting publication:", err);
    }
  };

  // Handle profile editing
  const handleProfilePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result;
        try {
          const response = await axios.put(
            `http://localhost:4000/faculty/update/${faculty._id}`,
            {
              ...profileData,
              profilePhoto: base64String
            }
          );
          
          if (response.data.success) {
            setProfileData({
              ...profileData,
              profilePhoto: base64String
            });
            if (onProfileUpdate) {
              onProfileUpdate(response.data.faculty);
            }
          }
        } catch (err) {
          console.error('Error uploading photo:', err);
          setError('Failed to upload photo');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Add the missing handleProfileUpdate function
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(
        `http://localhost:4000/faculty/update/${faculty._id}`,
        profileData
      );
      if (response.data.success) {
        setShowEditProfile(false);
        if (onProfileUpdate) {
          onProfileUpdate(response.data.faculty);
        }
      } else {
        setError("Failed to update profile");
      }
    } catch (err) {
      setError(err.message || "Failed to update profile");
      console.error("Error updating profile:", err);
    }
  };

  const [profileURL, setProfileURL] = useState("");
  const [showURLModal, setShowURLModal] = useState(false);

  const handleGenerateProfileURL = async () => {
    try {
      const response = await axios.post('http://localhost:4000/faculty/generate-profile-url', {
        facultyId: faculty.facultyId,
      });
      if (response.data.success) {
        setProfileURL(response.data.profileURL);
        setShowURLModal(true);
      } else {
        alert('Failed to generate profile URL');
      }
    } catch (error) {
      console.error('Error generating profile URL:', error);
      alert('Error generating profile URL');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">
            AcadSmart
          </h1>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleGenerateProfileURL}
            className="bg-blue-900 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded"
          >
            Generate Profile URL
          </button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-1/5 bg-blue-800 text-white p-4 space-y-6">
          {/* Profile Section */}
          <div className="text-center">
  <img
    src={profileData.profilePhoto || defaultAvatar}
    alt="Profile"
    className="w-24 h-24 rounded-full mx-auto mb-2 object-cover"
  />
  <h2 className="text-lg font-semibold">
    {profileData.firstName} {profileData.lastName}
  </h2>
  <p className="text-sm">{profileData.email}</p>
  <button
    onClick={() => setShowEditProfile(true)}
    className="mt-2 bg-blue-600 text-white p-1 rounded hover:bg-blue-700 text-sm"
  >
    Edit Profile
  </button>
</div>

          {/* Navigation */}
          <nav>
            <ul className="space-y-4 mt-6">
              <li
                className={`hover:bg-blue-700 p-2 rounded cursor-pointer ${
                  activeSection === "dashboard" ? "bg-blue-700" : ""
                }`}
                onClick={() => setActiveSection("dashboard")}
              >
                Dashboard
              </li>
              <li
                className={`hover:bg-blue-700 p-2 rounded cursor-pointer ${
                  activeSection === "publications" ? "bg-blue-700" : ""
                }`}
                onClick={() => setActiveSection("publications")}
              >
                Publications
              </li>
              <li
                className={`hover:bg-blue-700 p-2 rounded cursor-pointer ${
                  activeSection === "addPublication" ? "bg-blue-700" : ""
                }`}
                onClick={() => setActiveSection("addPublication")}
              >
                Add Publication
              </li>
              <li
                className={`hover:bg-blue-700 p-2 rounded cursor-pointer ${
                  activeSection === "settings" ? "bg-blue-700" : ""
                }`}
                onClick={() => setActiveSection("settings")}
              >
                Settings
              </li>
            </ul>
          </nav>
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 text-white p-2 rounded hover:bg-red-700 mt-6"
          >
            Logout
          </button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {activeSection === "dashboard" && (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow flex items-center">
                  <div className="mr-4">
                    {/* Icon for Total Publications */}
                    <PublicationsIcon className="w-12 h-12 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="text-gray-700 font-bold">
                      Total Publications
                    </h3>
                    <p className="text-2xl font-bold text-blue-600">
                      {stats.totalPublications}
                    </p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow flex items-center">
                  <div className="mr-4">
                    {/* Icon for Total Citations */}
                    <CitationsIcon className="w-12 h-12 text-green-500" />
                  </div>
                  <div>
                    <h3 className="text-gray-700 font-bold">
                      Total Citations
                    </h3>
                    <p className="text-2xl font-bold text-blue-600">
                      {stats.totalCitations}
                    </p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow flex items-center">
                  <div className="mr-4">
                    {/* Icon for h-index */}
                    <HIndexIcon className="w-12 h-12 text-yellow-500" />
                  </div>
                  <div>
                    <h3 className="text-gray-700 font-bold">h-index</h3>
                    <p className="text-2xl font-bold text-blue-600">
                      {stats.hIndex}
                    </p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow flex items-center">
                  <div className="mr-4">
                    {/* Icon for i10-index */}
                    <I10IndexIcon className="w-12 h-12 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="text-gray-700 font-bold">i10-index</h3>
                    <p className="text-2xl font-bold text-blue-600">
                      {stats.i10Index}
                    </p>
                  </div>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-2 gap-6">
                {/* Publications by Type */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-xl font-bold mb-4">
                    Publications by Type
                  </h2>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={chartData.typesData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        label
                      >
                        {chartData.typesData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Publications over Years */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-xl font-bold mb-4">
                    Publications over Years
                  </h2>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={chartData.yearsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="count"
                        fill="#82ca9d"
                        name="Publications"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Publications by Journal */}
                <div className="bg-white p-6 rounded-lg shadow col-span-2">
                  <h2 className="text-xl font-bold mb-4">
                    Publications by Journal
                  </h2>
                  <ResponsiveContainer width="100%" height={700}>
                    <BarChart
                      data={chartData.journalsData}
                      layout="vertical"
                      margin={{ top: 20, right: 30, left: 30, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" allowDecimals={false} />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={150}
                        tick={{
                          fontSize: 14,
                          angle: 0,
                          dx: -10,
                        }}
                      />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="count"
                        fill="#8884d8"
                        name="Publications"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}

          {activeSection === "publications" && (
            <>
              {/* Filter and Search */}
              <div className="flex items-center mb-4">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="p-2 border rounded mr-4"
                >
                  <option value="all">All Types</option>
                  <option value="paper">Paper</option>
                  <option value="patent">Patent</option>
                </select>
                <input
                  type="text"
                  placeholder="Search Publications"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 p-2 border rounded"
                />
              </div>

              {/* Publications List */}
              <div className="bg-white p-6 rounded-lg shadow mb-6">
                <h2 className="text-xl font-bold mb-4">Publications</h2>
                {loading ? (
                  <div className="text-center py-4">
                    Loading publications...
                  </div>
                ) : error ? (
                  <div className="text-red-600 text-center py-4">
                    {error}
                  </div>
                ) : filteredPublications.length === 0 ? (
                  <div className="text-gray-500 text-center py-4">
                    No publications found
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredPublications.map((pub, index) => (
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
                        <p className="text-gray-500 capitalize">
                          Type: {pub.type}
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
                          <button
                            onClick={() => handleEditPublication(pub)}
                            className="text-sm text-blue-600 hover:underline ml-4"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeletePublication(pub._id)}
                            className="text-sm text-red-600 hover:underline ml-4"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {activeSection === "addPublication" && (
            <>
              {/* Add New Publication Form */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4">
                  Add New Publication
                </h2>
                <form onSubmit={handleAddPublication}>
                  <div className="mb-4">
                    <label className="block text-gray-700">Type</label>
                    <select
                      name="type"
                      value={newPublication.type}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded"
                    >
                      <option value="paper">Paper</option>
                      <option value="patent">Patent</option>
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700">Title</label>
                    <input
                      type="text"
                      name="title"
                      value={newPublication.title}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                  {/* Additional Input Fields */}
                  <div className="mb-4">
                    <label className="block text-gray-700">Authors</label>
                    <input
                      type="text"
                      name="authors"
                      value={newPublication.authors}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded"
                      placeholder="Separate authors by commas"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700">Journal</label>
                    <input
                      type="text"
                      name="journal"
                      value={newPublication.journal}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700">Year</label>
                    <input
                      type="number"
                      name="year"
                      value={newPublication.year}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700">Citations</label>
                    <input
                      type="number"
                      name="citations"
                      value={newPublication.citations}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700">URL</label>
                    <input
                      type="text"
                      name="url"
                      value={newPublication.url}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700">Abstract</label>
                    <textarea
                      name="abstract"
                      value={newPublication.abstract}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded"
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
                  >
                    Add Publication
                  </button>
                </form>
              </div>
            </>
          )}

          {activeSection === "editPublication" && editingPublication && (
            <>
              {/* Back Button */}
              <button
                onClick={() => {
                  setEditingPublication(null);
                  setActiveSection("publications");
                }}
                className="text-blue-600 hover:underline mb-4"
              >
                Back
              </button>

              {/* Edit Publication Form */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4">Edit Publication</h2>
                <form onSubmit={handleUpdatePublication}>
                  <div className="mb-4">
                    <label className="block text-gray-700">Type</label>
                    <select
                      name="type"
                      value={editingPublication.type}
                      onChange={(e) =>
                        setEditingPublication({
                          ...editingPublication,
                          type: e.target.value,
                        })
                      }
                      className="w-full p-2 border rounded"
                    >
                      <option value="paper">Paper</option>
                      <option value="patent">Patent</option>
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700">Title</label>
                    <input
                      type="text"
                      name="title"
                      value={editingPublication.title}
                      onChange={(e) =>
                        setEditingPublication({
                          ...editingPublication,
                          title: e.target.value,
                        })
                      }
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                  {/* Additional Input Fields */}
                  <div className="mb-4">
                    <label className="block text-gray-700">Authors</label>
                    <input
                      type="text"
                      name="authors"
                      value={
                        Array.isArray(editingPublication.authors)
                          ? editingPublication.authors.join(", ")
                          : editingPublication.authors
                      }
                      onChange={(e) =>
                        setEditingPublication({
                          ...editingPublication,
                          authors: e.target.value,
                        })
                      }
                      className="w-full p-2 border rounded"
                      placeholder="Separate authors by commas"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700">Journal</label>
                    <input
                      type="text"
                      name="journal"
                      value={editingPublication.journal}
                      onChange={(e) =>
                        setEditingPublication({
                          ...editingPublication,
                          journal: e.target.value,
                        })
                      }
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700">Year</label>
                    <input
                      type="number"
                      name="year"
                      value={editingPublication.year}
                      onChange={(e) =>
                        setEditingPublication({
                          ...editingPublication,
                          year: e.target.value,
                        })
                      }
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700">Citations</label>
                    <input
                      type="number"
                      name="citations"
                      value={editingPublication.citations}
                      onChange={(e) =>
                        setEditingPublication({
                          ...editingPublication,
                          citations: e.target.value,
                        })
                      }
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700">URL</label>
                    <input
                      type="text"
                      name="url"
                      value={editingPublication.url}
                      onChange={(e) =>
                        setEditingPublication({
                          ...editingPublication,
                          url: e.target.value,
                        })
                      }
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700">Abstract</label>
                    <textarea
                      name="abstract"
                      value={editingPublication.abstract}
                      onChange={(e) =>
                        setEditingPublication({
                          ...editingPublication,
                          abstract: e.target.value,
                        })
                      }
                      className="w-full p-2 border rounded"
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
                  >
                    Update Publication
                  </button>
                </form>
              </div>
            </>
          )}

          {/* Edit Profile Modal */}
          {showEditProfile && (
  <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center">
    <div className="bg-white p-6 rounded-lg shadow w-1/3">
      <h2 className="text-xl font-bold mb-4">Edit Profile</h2>
      <form onSubmit={handleProfileUpdate}>
        <div className="mb-4">
          <label className="block text-gray-700">Profile Photo</label>
          <input
            type="file"
            onChange={handleProfilePhotoChange}
            className="w-full p-2 border rounded"
          />
          {profileData.profilePhoto && (
            <img
              src={profileData.profilePhoto}
              alt="Profile Preview"
              className="w-24 h-24 rounded-full mt-2"
            />
          )}
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">First Name</label>
          <input
            type="text"
            value={profileData.firstName}
            onChange={(e) =>
              setProfileData({
                ...profileData,
                firstName: e.target.value,
              })
            }
            className="w-full p-2 border rounded"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Last Name</label>
          <input
            type="text"
            value={profileData.lastName}
            onChange={(e) =>
              setProfileData({
                ...profileData,
                lastName: e.target.value,
              })
            }
            className="w-full p-2 border rounded"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Email</label>
          <input
            type="email"
            value={profileData.email}
            onChange={(e) =>
              setProfileData({
                ...profileData,
                email: e.target.value,
              })
            }
            className="w-full p-2 border rounded"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
        >
          Save Changes
        </button>
        <button
          type="button"
          onClick={() => setShowEditProfile(false)}
          className="w-full bg-gray-600 text-white p-2 rounded mt-2 hover:bg-gray-700"
        >
          Cancel
        </button>
      </form>
    </div>
  </div>
)}

{/* Profile URL Modal */}
{showURLModal && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-1/3">
            <h2 className="text-xl font-bold mb-4">Your Public Profile URL</h2>
            <input
              type="text"
              value={profileURL}
              readOnly
              className="w-full p-2 border rounded mb-4"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(profileURL);
                alert('URL copied to clipboard!');
              }}
              className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 mb-2"
            >
              Copy URL
            </button>
            <button
              onClick={() => setShowURLModal(false)}
              className="w-full bg-gray-600 text-white p-2 rounded hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
        </main>
      </div>
    </div>
  );
};

export default FacultyDashboard;