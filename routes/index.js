var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

// module.exports = router;
module.exports = function(app){
	app.get('/',function(req, res){
		res.render('index', {title: '昭昭Blog'})
	});
	app.route('/reg')
		.get(function (req, res) {
			res.render('reg', { title: '注册页'})
		})
		.post(function (req, res) {
			// body...
		});
	app.route('/login')
		.get(function (req, res) {
			res.render('login', {title: '登录'})
		})
		.post(function (req, res) {
			// body...
		});
	app.route('/post')
		.get(function (req, res) {
			res.render('post', {title: '发表文章'})
		})
		.post(function (req, res) {
			// body...
		});
	app.get('/logout', function (req, res) {
		res.redirect();
	});
}
