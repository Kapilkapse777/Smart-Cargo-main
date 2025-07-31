const mongoose = require('mongoose');

const citySchema = new mongoose.Schema({
  geonameid: {
    type: String,
    unique: true,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  asciiname: {
    type: String,
    required: true,
    trim: true
  },
  lat: {
    type: Number,
    required: true,
    min: -90,
    max: 90
  },
  lng: {
    type: Number,
    required: true,
    min: -180,
    max: 180
  },
  population: {
    type: Number,
    default: 0,
    min: 0
  },
  elevation: {
    type: Number,
    default: null
  },
  admin1_code: {
    type: String,
    trim: true
  },
  admin2_code: {
    type: String,
    trim: true
  },
  timezone: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for fast searching
citySchema.index({ name: 'text', asciiname: 'text' });
citySchema.index({ lat: 1, lng: 1 });
citySchema.index({ population: -1 });
citySchema.index({ admin1_code: 1 });

// Static method to find cities by name (partial match)
citySchema.statics.searchByName = function(query, limit = 10) {
  return this.find({
    $or: [
      { name: new RegExp(query, 'i') },
      { asciiname: new RegExp(query, 'i') }
    ]
  })
  .sort({ population: -1 })
  .limit(limit);
};

// Static method to find nearest city to coordinates
citySchema.statics.findNearest = function(lat, lng, maxDistance = 50000) {
  return this.findOne({
    lat: { $gte: lat - 0.5, $lte: lat + 0.5 },
    lng: { $gte: lng - 0.5, $lte: lng + 0.5 }
  }).sort({ population: -1 });
};

// Static method to get major cities (population > 100,000)
citySchema.statics.getMajorCities = function(limit = 50) {
  return this.find({ population: { $gt: 100000 } })
    .sort({ population: -1 })
    .limit(limit);
};

// Virtual for coordinate display
citySchema.virtual('coordinates').get(function() {
  return `${this.lat.toFixed(2)}°N, ${this.lng.toFixed(2)}°E`;
});

module.exports = mongoose.model('City', citySchema); 