const { asyncHandler, ApiError, range } = require('../utils/helpers');

// Builds list/create/update/remove handlers for family-scoped records (income, expenses).
// Members can edit only their own records; admins can edit any record in the family.
module.exports = (Model, { fields, categoryField, searchFields }) => {
  const pick = (body) => fields.reduce((o, f) => (body[f] !== undefined ? { ...o, [f]: body[f] } : o), {});

  const findOwned = async (req) => {
    const doc = await Model.findOne({ _id: req.params.id, familyId: req.user.familyId });
    if (!doc) throw new ApiError(404, 'Record not found');
    if (req.user.role !== 'Admin' && String(doc.userId) !== String(req.user._id)) throw new ApiError(403, 'You can only change your own records');
    return doc;
  };

  return {
    list: asyncHandler(async (req, res) => {
      const { from, to, category, search, month, year } = req.query;
      const q = { familyId: req.user.familyId };
      if (month || year) { const { start, end } = range(year, month); q.date = { $gte: start, $lt: end }; }
      if (from || to) { q.date = {}; if (from) q.date.$gte = new Date(from); if (to) q.date.$lte = new Date(`${to}T23:59:59`); }
      if (category) q[categoryField] = category;
      if (search) q.$or = searchFields.map((f) => ({ [f]: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } }));
      const items = await Model.find(q).sort({ date: -1, createdAt: -1 }).limit(1000).populate('userId', 'name');
      const total = items.reduce((s, i) => s + i.amount, 0);
      res.json({ items, total, count: items.length });
    }),
    create: asyncHandler(async (req, res) => {
      const doc = await Model.create({ ...pick(req.body), userId: req.user._id, familyId: req.user.familyId });
      res.status(201).json(doc);
    }),
    update: asyncHandler(async (req, res) => {
      const doc = await findOwned(req);
      Object.assign(doc, pick(req.body));
      await doc.save(); // runs validators and priority hook
      res.json(doc);
    }),
    remove: asyncHandler(async (req, res) => {
      const doc = await findOwned(req);
      await doc.deleteOne();
      res.json({ message: 'Deleted' });
    }),
  };
};
