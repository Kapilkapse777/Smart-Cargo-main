const mongoose = require('mongoose');

const cargoSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  cargo_type: {
    type: String,
    required: true,
    enum: ['electronics', 'furniture', 'clothing', 'food', 'machinery', 'chemicals', 'textiles', 'automotive', 'medical', 'other']
  },
  origin: {
    type: String,
    required: true,
    trim: true
  },
  destination: {
    type: String,
    required: true,
    trim: true
  },
  origin_coords: {
    lat: { type: Number },
    lng: { type: Number }
  },
  destination_coords: {
    lat: { type: Number },
    lng: { type: Number }
  },
  weight: {
    type: Number,
    required: true,
    min: 0
  },
  volume: {
    type: Number,
    default: 0,
    min: 0
  },
  special_requirements: {
    type: String,
    trim: true,
    default: ''
  },
  pickup_date: {
    type: Date,
    required: true
  },
  delivery_date: {
    type: Date,
    required: true
  },
  budget: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['active', 'matched', 'in_transit', 'delivered', 'cancelled'],
    default: 'active'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  }
}, {
  timestamps: true
});

// Index for efficient queries
cargoSchema.index({ origin: 1, destination: 1 });
cargoSchema.index({ status: 1 });
cargoSchema.index({ user_id: 1 });
cargoSchema.index({ pickup_date: 1 });

// Virtual for route display
cargoSchema.virtual('route').get(function() {
  return `${this.origin} → ${this.destination}`;
});

// Static method to find matching cargo (A→C and C→A pattern)
cargoSchema.statics.findMatches = async function(cargoId) {
  const cargo = await this.findById(cargoId);
  if (!cargo) return [];
  
  return this.find({
    _id: { $ne: cargoId },
    origin: cargo.destination,
    destination: cargo.origin,
    status: 'active'
  }).populate('user_id', 'name email phone company');
};

module.exports = mongoose.model('Cargo', cargoSchema); 