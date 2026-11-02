const router = require('express').Router();
const { protect } = require('../middleware/auth');
const c = require('../controllers/incomeController');

router.use(protect);
router.route('/').get(c.list).post(c.create);
router.route('/:id').put(c.update).delete(c.remove);

module.exports = router;
