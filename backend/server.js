require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const facultyRouter = require('./routes/faculty'); // Keep this declaration
const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use('/faculty', facultyRouter);

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/university-publications', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const connection = mongoose.connection;
connection.once('open', () => {
  console.log('MongoDB database connection established successfully');
});

// Root route
app.get('/', (req, res) => {
  res.send('Publication Management is running');
});

// Routes
const authRouter = require('./routes/auth');
const publicationsRouter = require('./routes/publication');

app.use('/auth', authRouter);
app.use('/publications', publicationsRouter);
// Remove the duplicate declaration and usage of facultyRouter here

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});