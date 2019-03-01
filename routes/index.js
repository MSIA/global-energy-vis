var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});


router.get('/trends/:country', function(req, res, next) {
  res.render('trends', { country: req.params.country });
});

module.exports = router;
