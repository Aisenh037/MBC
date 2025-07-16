import Subject from '../models/Subject.js';

export const getAllSubjects = async (req, res) => {
  const subjects = await Subject.find().populate('class').populate('faculty');
  res.json(subjects);
};

export const getSubjectById = async (req, res) => {
  const subject = await Subject.findById(req.params.id).populate('class').populate('faculty');
  if (!subject) return res.status(404).json({ error: 'Subject not found' });
  res.json(subject);
};

export const createSubject = async (req, res) => {
  const subject = await Subject.create(req.body);
  res.status(201).json(subject);
};

export const updateSubject = async (req, res) => {
  const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!subject) return res.status(404).json({ error: 'Subject not found' });
  res.json(subject);
};

export const deleteSubject = async (req, res) => {
  const subject = await Subject.findByIdAndDelete(req.params.id);
  if (!subject) return res.status(404).json({ error: 'Subject not found' });
  res.json({ message: 'Subject deleted' });
};
