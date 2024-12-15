const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const publicationSchema = new Schema(
  {
    facultyEmail: { type: String, required: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    authors: [{ type: String, required: true }],
    journal: { type: String },
    year: { type: Number },
    citations: { type: Number, default: 0 },
    url: { type: String },
    abstract: { type: String },
  },
  {
    timestamps: true,
  }
);

const Publication = mongoose.model('Publication', publicationSchema);
module.exports = Publication;