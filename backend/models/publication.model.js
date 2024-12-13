// backend/models/publication.model.js
const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const publicationSchema = new Schema(
  {
    title: { type: String, required: true },
    authors: { type: [String], required: true }, // Updated to be an array of strings
    journal: { type: String, required: true },
    year: { type: Number, required: true },
    citations: { type: Number, default: 0 },
    url: { type: String },
    abstract: { type: String },
    type: { type: String, required: true }
  },
  {
    timestamps: true,
  }
);

const Publication = mongoose.model('Publication', publicationSchema);

module.exports = Publication;