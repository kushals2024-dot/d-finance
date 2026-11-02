const router = require('express').Router();
const { protect } = require('../middleware/auth');
const c = require('../controllers/expenseController');

router.use(protect);
router.get('/priority', c.priorityView);
router.route('/').get(c.list).post(c.create);
router.route('/:id').put(c.update).delete(c.remove);

module.exports = router;
