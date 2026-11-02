const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, adminOnly } = require('../middleware/auth');
const c = require('../controllers/familyController');

router.use(protect);
router.get('/', c.get);
router.put('/', adminOnly, [body('name').trim().notEmpty().withMessage('Family name is required')], validate, c.update);
router.post('/members', adminOnly, [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], validate, c.addMember);
router.delete('/members/:id', adminOnly, c.removeMember);

module.exports = router;
