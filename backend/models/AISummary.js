const mongoose = require('mongoose');

const aiSummarySchema = new mongoose.Schema({
  resource_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Resource', index: true },
  generated_for_user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['summary', 'translation', 'tag_suggestion'], required: true },
  original_query_text: { type: String },
  detected_language: { type: String, enum: ['en', 'ur', 'ks', 'ps'] },
  ai_translated_text: { type: String },
  summary_text: { type: String },
  core_concepts: [{ type: String }],
  actionable_tasks: [{ task: String, completed: { type: Boolean, default: false } }],
  key_deadlines: [{ label: String, date: Date }],
  suggested_tags: [{ type: String }],
  confidence_level: { type: String, enum: ['low', 'medium', 'high_fidelity'], default: 'medium' },
  content_hash: { type: String },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

aiSummarySchema.index({ generated_for_user: 1, created_at: -1 });

module.exports = mongoose.model('AISummary', aiSummarySchema);
