const router = require('express').Router();
const { protect } = require('../middleware/auth');
const c = require('../controllers/insightController');

router.get('/meta', c.meta);
router.use(protect);
router.get('/dashboard', c.dashboard);
router.get('/analysis', c.analysis);
router.get('/recommendations', c.recommendations);

module.exports = router;
