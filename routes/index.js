var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', (req, res) => {
  res.render('index', { title: 'Express' });
});

router.get('/story', (req, res) => res.render('story'));

router.get('/map', (req, res) => res.render('map'));

router.get('/trends/:country', (req, res) => {
  console.log(req.params.country);
  res.render('trends', { country: req.params.country });
});

router.get('/compare/:country', (req, res) => {
  console.log(req.params.country);
  res.render('compare', { country: req.params.country });
});

module.exports = router;
