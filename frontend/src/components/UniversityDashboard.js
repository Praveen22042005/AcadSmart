import React, { useState } from "react";
import axios from "axios";
import defaultAvatar from '../assets/default-avatar.png';
import { Link } from "react-router-dom";
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
import { FaEnvelope, FaUser } from 'react-icons/fa';


// Import SVG icons as React components
import { ReactComponent as PublicationsIcon } from "./icons/publications.svg";
import { ReactComponent as CitationsIcon } from "./icons/citations.svg";
import { ReactComponent as HIndexIcon } from "./icons/hindex.svg";
import { ReactComponent as I10IndexIcon } from "./icons/i10index.svg";

const UniversityDashboard = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [faculty, setFaculty] = useState(null);
  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [chartData, setChartData] = useState({
    typesData: [],
    yearsData: [],
    journalsData: [],
  });

  // Colors for the charts
  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#AA336A",
    "#33AA99",
    "#FF6666",
    "#66FF66",
    "#6666FF",
    "#FF66FF",
  ];

  // State for summary statistics
  const [summaryStats, setSummaryStats] = useState({
    totalPublications: 0,
    totalCitations: 0,
    hIndex: 0,
    i10Index: 0,
  });

  const handleSearchChange = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.length > 2) {
      try {
        const response = await axios.get(
          `http://localhost:4000/faculty/suggestions?query=${encodeURIComponent(query)}`
        );
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
        processChartData(response.data.publications);
        calculateSummaryStats(response.data.publications);
      } else {
        setError("Faculty not found");
        setFaculty(null);
        setPublications([]);
        setSummaryStats({
          totalPublications: 0,
          totalCitations: 0,
          hIndex: 0,
          i10Index: 0,
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch faculty details");
      setFaculty(null);
      setPublications([]);
      setSummaryStats({
        totalPublications: 0,
        totalCitations: 0,
        hIndex: 0,
        i10Index: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const processChartData = (publications) => {
    const publicationTypesCount = {};
    const publicationYearsCount = {};
    const publicationJournalsCount = {};

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
  };

  const calculateSummaryStats = (publications) => {
    const totalPublications = publications.length;
    const totalCitations = publications.reduce(
      (acc, pub) => acc + (pub.citations || 0),
      0
    );

    // Calculate h-index
    const citations = publications
      .map((pub) => pub.citations || 0)
      .sort((a, b) => b - a);
    let hIndex = 0;
    for (let i = 0; i < citations.length; i++) {
      if (citations[i] >= i + 1) {
        hIndex = i + 1;
      } else {
        break;
      }
    }

    // Calculate i10-index
    const i10Index = publications.filter(
      (pub) => (pub.citations || 0) >= 10
    ).length;

    setSummaryStats({ totalPublications, totalCitations, hIndex, i10Index });
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <header className="bg-blue-600 text-white p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">AcadSmart - University Dashboard</h1>
        <Link to="/">
          <button className="text-white hover:underline">Go Back</button>
        </Link>
      </header>

      <main className="p-6">
        {/* Search Input */}
        <div className="mb-1">
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
                  onClick={() =>
                    handleSelectFaculty(
                      `${suggestion.firstName} ${suggestion.lastName}`
                    )
                  }
                >
                  {suggestion.firstName} {suggestion.lastName}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Faculty Details */}
        {faculty && (
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <div className="flex items-center space-x-6">
              <img
                src={faculty.profilePhoto || defaultAvatar}
                alt={`${faculty.firstName}'s profile`}
                className="w-24 h-24 rounded-full object-cover border-2 border-blue-500"
              />
              <div>
                <h2 className="text-2xl font-bold mb-2">Faculty Details</h2>
                <div className="flex items-center mb-2">
                  <FaUser className="text-gray-600 mr-2" />
                  <p className="text-lg">
                    <strong>Name:</strong> {faculty.firstName} {faculty.lastName}
                  </p>
                </div>
                <div className="flex items-center">
                  <FaEnvelope className="text-gray-600 mr-2" />
                  <p className="text-lg">
                    <strong>Email:</strong> {faculty.email}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Summary Statistics */}
        {faculty && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {/* Total Publications */}
            <div className="bg-white p-6 rounded-lg shadow flex items-center">
              <div className="mr-4">
                <PublicationsIcon className="w-12 h-12 text-blue-500" />
              </div>
              <div>
              <p className="text-2xl font-bold text-blue-600">
                      {summaryStats.totalPublications}
                    </p>
                <h3 className="text-gray-700 font-bold">
                      Total Publications
                    </h3>
              </div>
            </div>

            {/* Total Citations */}
            <div className="bg-white p-6 rounded-lg shadow flex items-center">
              <div className="mr-4">
                <CitationsIcon className="w-12 h-12 text-green-500" />
              </div>
              <div>
              <p className="text-2xl font-bold text-blue-600">
                      {summaryStats.totalCitations}
                    </p>
                <h3 className="text-gray-700 font-bold">
                      Total Citations
                    </h3>
              </div>
            </div>

            {/* H-Index */}
            <div className="bg-white p-6 rounded-lg shadow flex items-center">
              <div className="mr-4">
                <HIndexIcon className="w-12 h-12 text-red-500" />
              </div>
              <div>
              <p className="text-2xl font-bold text-blue-600">
                      {summaryStats.hIndex}
                    </p>
                <h3 className="text-gray-700 font-bold">H-index</h3>
              </div>
            </div>

            {/* i10-Index */}
            <div className="bg-white p-6 rounded-lg shadow flex items-center">
              <div className="mr-4">
                <I10IndexIcon className="w-12 h-12 text-yellow-500" />
              </div>
              <div>
              <p className="text-2xl font-bold text-blue-600">
                      {summaryStats.i10Index}
                    </p>
                <h3 className="text-gray-700 font-bold">i10-index</h3>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-4">Loading...</div>
        ) : error ? (
          <div className="text-red-600 text-center py-4">{error}</div>
        ) : faculty ? (
          <div>
            {/* Charts Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Publications by Type */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4">Publications by Type</h2>
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
                <h2 className="text-xl font-bold mb-4">Publications over Years</h2>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData.yearsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#82ca9d" name="Publications" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top 10 Journals Section */}
            <div className="bg-white p-6 rounded-lg shadow mb-6">
              <h2 className="text-xl font-bold mb-4">Top 10 Journals</h2>
              <ResponsiveContainer width="100%" height={600}>
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
                    width={200}
                    tick={{
                      fontSize: 14,
                      angle: 0,
                      dx: -10,
                    }}
                  />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#8884d8" name="Publications" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Publications */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-4">Publications</h2>
              {publications.length === 0 ? (
                <div className="text-gray-500 text-center py-4">
                  No publications found
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
          </div>
        ) : (
          <div className="text-gray-500 text-center py-4">
            Search for a faculty member to see their details and publications
          </div>
        )}
      </main>
    </div>
  );
};

export default UniversityDashboard;