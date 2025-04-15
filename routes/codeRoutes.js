const express = require('express');
const codeController = require('../controllers/codeController');
const authController = require('../controllers/authController');

const router = express.Router();

// router.use(authController.protect);

router
  .route('/')
  .get(codeController.getAllCodes)
  .post(codeController.createCodes);

router.route('/submitCode').post(codeController.checkCode);

router
  .route('/:id')
  .get(codeController.getCode)
  .patch(codeController.updateCode)
  .delete(codeController.deleteCode);

module.exports = router;
