const router = require('express').Router();
const { protect, adminOnly } = require('../middleware/auth');
const c = require('../controllers/budgetController');

router.use(protect);
router.get('/', c.list);
router.get('/current', c.current);
router.put('/', adminOnly, c.upsert);
router.delete('/:id', adminOnly, c.remove);

module.exports = router;
