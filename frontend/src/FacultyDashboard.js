// FacultyDashboard.js
import React, { useState, useEffect } from "react";
import axios from "axios";

const FacultyDashboard = ({ faculty, onLogout }) => {
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

  useEffect(() => {
    const fetchPublications = async () => {
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
          const citations = pubs.map((p) => p.citations || 0);
          const totalCitations = citations.reduce((a, b) => a + b, 0);

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
            totalPublications: pubs.length,
            totalCitations,
            hIndex,
            i10Index,
          });
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

    if (faculty.email) {
      fetchPublications();
    }
  }, [faculty.email]);

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
          setStats({
            totalPublications: pubs.length,
            totalCitations: pubs.reduce(
              (sum, pub) => sum + (pub.citations || 0),
              0
            ),
            hIndex: calculateHIndex(pubs),
            i10Index: calculateI10Index(pubs),
          });
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
          setStats({
            totalPublications: pubs.length,
            totalCitations: pubs.reduce(
              (sum, pub) => sum + (pub.citations || 0),
              0
            ),
            hIndex: calculateHIndex(pubs),
            i10Index: calculateI10Index(pubs),
          });
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
          setStats({
            totalPublications: pubs.length,
            totalCitations: pubs.reduce(
              (sum, pub) => sum + (pub.citations || 0),
              0
            ),
            hIndex: calculateHIndex(pubs),
            i10Index: calculateI10Index(pubs),
          });
        }
      } else {
        setError("Failed to delete publication");
      }
    } catch (err) {
      setError(err.message || "Failed to delete publication");
      console.error("Error deleting publication:", err);
    }
  };

  const calculateHIndex = (publications) => {
    const citations = publications.map((p) => p.citations || 0);
    const sortedCitations = [...citations].sort((a, b) => b - a);
    let hIndex = 0;
    for (let i = 0; i < sortedCitations.length; i++) {
      if (sortedCitations[i] >= i + 1) hIndex = i + 1;
      else break;
    }
    return hIndex;
  };

  const calculateI10Index = (publications) => {
    return publications.filter((p) => (p.citations || 0) >= 10).length;
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">
            Welcome, {faculty.firstName} {faculty.lastName}!
          </h1>
          <p className="text-sm">{faculty.email}</p>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-1/5 bg-blue-800 text-white p-4 space-y-6">
          <nav>
            <ul className="space-y-4">
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
            className="w-full bg-red-600 text-white p-2 rounded hover:bg-red-700"
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
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="text-gray-700 font-semibold">
                    Total Publications
                  </h3>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.totalPublications}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="text-gray-700 font-semibold">
                    Total Citations
                  </h3>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.totalCitations}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="text-gray-700 font-semibold">h-index</h3>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.hIndex}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="text-gray-700 font-semibold">i10-index</h3>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.i10Index}
                  </p>
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
                  <div className="text-red-600 text-center py-4">{error}</div>
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
                            onClick={() =>
                              handleDeletePublication(pub._id)
                            }
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
                <h2 className="text-xl font-bold mb-4">Add New Publication</h2>
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

          {activeSection === "settings" && (
            <>
              {/* Settings Page */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4">Settings</h2>
                {/* Settings content goes here */}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default FacultyDashboard;