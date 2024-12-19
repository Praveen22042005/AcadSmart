import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import defaultAvatar from '../assets/default-avatar.png';
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

// Import SVG icons as React components
import { ReactComponent as PublicationsIcon } from "./icons/publications.svg";
import { ReactComponent as CitationsIcon } from "./icons/citations.svg";
import { ReactComponent as HIndexIcon } from "./icons/hindex.svg";
import { ReactComponent as I10IndexIcon } from "./icons/i10index.svg";

const PublicProfile = () => {
  const { token } = useParams();
  const [faculty, setFaculty] = useState(null);
  const [publications, setPublications] = useState([]);
  const [filteredPublications, setFilteredPublications] = useState([]);
  const [stats, setStats] = useState({
    totalPublications: 0,
    totalCitations: 0,
    hIndex: 0,
    i10Index: 0,
  });
  const [chartData, setChartData] = useState({
    typesData: [],
    yearsData: [],
    journalsData: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");

  // Define COLORS for charts
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AA336A", "#33AABB", "#BB33AA", "#AABB33"];

  useEffect(() => {
    const fetchPublicProfile = async () => {
      try {
        const response = await axios.get(`http://localhost:4000/faculty/public-profile/${token}`);
        if (response.data.success) {
          setFaculty(response.data.faculty);
          setPublications(response.data.publications);
          setFilteredPublications(response.data.publications);
          calculateStats(response.data.publications);
          processChartData(response.data.publications);
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

  useEffect(() => {
    const filtered = publications.filter((pub) => {
      const matchesSearch = pub.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === "all" || pub.type === filterType;
      return matchesSearch && matchesType;
    });
    setFilteredPublications(filtered);
  }, [searchQuery, filterType, publications]);

  const calculateStats = (publications) => {
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

    setStats({ totalPublications, totalCitations, hIndex, i10Index });
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

  if (loading) {
    return <div className="text-center py-4">Loading...</div>;
  }

  if (error || !faculty) {
    return (
      <div className="text-center py-4">
        <p className="text-red-600">Invalid or expired profile URL.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <header className="bg-blue-600 text-white p-4 flex justify-center items-center">
        <h1 className="text-3xl font-bold">AcadSmart - Faculty Profile</h1>
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {/* Total Publications */}
          <div className="bg-white p-4 rounded-lg shadow flex items-center">
            <PublicationsIcon className="w-12 h-12 text-blue-500 mr-4" />
            <div>
              <h3 className="text-lg font-semibold">Total Publications</h3>
              <p className="text-2xl font-bold text-blue-600">
                {stats.totalPublications}
              </p>
            </div>
          </div>
          {/* Total Citations */}
          <div className="bg-white p-4 rounded-lg shadow flex items-center">
            <CitationsIcon className="w-12 h-12 text-green-500 mr-4" />
            <div>
              <h3 className="text-lg font-semibold">Total Citations</h3>
              <p className="text-2xl font-bold text-green-600">
                {stats.totalCitations}
              </p>
            </div>
          </div>
          {/* H-Index */}
          <div className="bg-white p-4 rounded-lg shadow flex items-center">
            <HIndexIcon className="w-12 h-12 text-red-500 mr-4" />
            <div>
              <h3 className="text-lg font-semibold">H-Index</h3>
              <p className="text-2xl font-bold text-red-600">
                {stats.hIndex}
              </p>
            </div>
          </div>
          {/* i10-Index */}
          <div className="bg-white p-4 rounded-lg shadow flex items-center">
            <I10IndexIcon className="w-12 h-12 text-yellow-500 mr-4" />
            <div>
              <h3 className="text-lg font-semibold">i10-Index</h3>
              <p className="text-2xl font-bold text-yellow-600">
                {stats.i10Index}
              </p>
            </div>
          </div>
        </div>

        {/* Data Visualization */}
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
                  outerRadius={80}
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

        {/* Top 10 Journals */}
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
                  fontSize: 13,
                  angle: 0,
                  dx: -10,
                }}
              />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#FF8042" name="Publications" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Filter and Search Options */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-6">
          <div className="mb-4 md:mb-0">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="p-2 border rounded w-full md:w-5/5"
            >
              <option value="all">All Types</option>
              <option value="paper">Paper</option>
              <option value="patent">Patent</option>
            </select>
          </div>
          <div className="w-full md:w-4/5">
            <input
              type="text"
              placeholder="Search Publications"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>

        {/* Publications Section */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Publications</h2>
          {/* Publications List */}
          {filteredPublications.length === 0 ? (
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