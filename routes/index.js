const express = require('express');
const router  = express.Router();

router.get('/', (req, res) => res.render('home'));
router.get('/hospitals', (req, res) => res.render('hospitals'));
router.get('/about',     (req, res) => res.render('about'));

module.exports = router;
