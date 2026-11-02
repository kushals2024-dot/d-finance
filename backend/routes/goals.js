const router = require('express').Router();
const { protect } = require('../middleware/auth');
const c = require('../controllers/goalController');

router.use(protect);
router.route('/').get(c.list).post(c.create);
router.delete('/contributions/:cid', c.removeContribution);
router.route('/:id').put(c.update).delete(c.remove);
router.route('/:id/contributions').get(c.listContributions).post(c.addContribution);

module.exports = router;
