const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question_text: { type: String, required: true },
  options: [{ type: String }],
  correct_answer: { type: Number },
  points: { type: Number, default: 10 },
}, { _id: true });

const quizSchema = new mongoose.Schema({
  course_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  questions: [questionSchema],
  time_limit_minutes: { type: Number, default: 30 },
  passing_score: { type: Number, default: 60 },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('Quiz', quizSchema);
