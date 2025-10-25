const express = require('express');
const factoryController = require('../controllers/factoryController');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');

const router = express.Router();

router.use(authController.protect);

router.route('/updatePassword').patch(userController.updatePassword);

router.route('/register').post(userController.registerForContest);

// Get current logged-in user used for refreshing user data
router.route('/me').get(userController.getMe);

router.use(authController.restrictTo('admin'));

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/update')
  .patch(userController.setUserId, userController.updateUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
