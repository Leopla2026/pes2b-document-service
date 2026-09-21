const express = require('express');
const upload = require('../config/multer');
const controller = require('../controllers/efd-contribuicoes.controller');

const router = express.Router();

router.post(
  '/auxiliary/parse',
  upload.single('file'),
  controller.parseAuxiliary
);

module.exports = router;
