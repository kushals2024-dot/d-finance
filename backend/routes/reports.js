const router = require('express').Router();
const { protect } = require('../middleware/auth');
const c = require('../controllers/reportController');

router.use(protect);
router.get('/', c.json);
router.get('/csv', c.csv);
router.get('/pdf', c.pdf);

module.exports = router;
