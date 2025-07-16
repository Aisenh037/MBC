import Notice from "../models/Notice.js";

// Get all notices (with filter & pagination)
export const getNotices = async (req, res) => {
  const { target, classId, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (target) filter.target = target;
  if (classId) filter.class = classId;
  const notices = await Notice.find(filter)
    .populate("class")
    .populate("createdBy", "name email role")
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 })
    .lean();
  res.json(notices);
};

// Create a notice (admin/teacher)
export const addNotice = async (req, res) => {
  const { title, content, target, class: classId } = req.body;
  const createdBy = req.user.id;
  const notice = await Notice.create({
    title,
    content,
    target,
    class: classId || undefined,
    createdBy
  });
  res.status(201).json({ message: "Notice created", notice });
};

// Update notice
export const updateNotice = async (req, res) => {
  const { id } = req.params;
  const updated = await Notice.findByIdAndUpdate(id, req.body, { new: true });
  if (!updated) return res.status(404).json({ error: "Notice not found" });
  res.json({ message: "Notice updated", notice: updated });
};

// Delete notice
export const deleteNotice = async (req, res) => {
  const { id } = req.params;
  const deleted = await Notice.findByIdAndDelete(id);
  if (!deleted) return res.status(404).json({ error: "Notice not found" });
  res.json({ message: "Notice deleted" });
};
