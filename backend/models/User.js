const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  password_hash: { type: String, required: true, select: false },
  role: { type: String, enum: ['student', 'mentor', 'admin'], default: 'student', index: true },
  profile_picture_url: { type: String, default: '' },
  title: { type: String, default: '' },
  language_preference: { type: String, enum: ['en', 'ur', 'ks', 'ps'], default: 'en' },
  auto_translate_enabled: { type: Boolean, default: true },
  stats: {
    total_hours: { type: Number, default: 0 },
    certificates_count: { type: Number, default: 0 },
    weekly_goal_percent: { type: Number, default: 0 },
  },
  permissions: [{ type: String }],
  account_status: { type: String, enum: ['active', 'suspended'], default: 'active' },
  mentor_status: { type: String, enum: ['none', 'pending', 'approved', 'rejected'], default: 'none' },
  id_card_url: { type: String, default: '' },
  bio: { type: String, default: '' },
  expertise: [{ type: String }],
  last_login: { type: Date },
  reset_password_token: { type: String },
  reset_password_expires: { type: Date },
  deleted_at: { type: Date, default: null },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

userSchema.pre('save', async function() {
  if (!this.isModified('password_hash')) return;
  const salt = await bcrypt.genSalt(10);
  this.password_hash = await bcrypt.hash(this.password_hash, salt);
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password_hash);
};

userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password_hash;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
