var express = require('express');
var router = express.Router();
var crypto = require('crypto'),
	User = require('../models/user.js');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

// module.exports = router;
module.exports = function(app){
	app.get('/',function(req, res){
		res.render('index', {
			title: '昭昭Blog',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});
	app.route('/reg')
		.get(function (req, res) {
			res.render('reg', {
				user: req.session.user,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
		})
		.post(function (req, res) {
			// body...
			var name = req.body.username,
				password = req.body.password,
				password_con = req.body['password-confirm'];
			if(password_con != password){
				req.flash('error', 'It\'s not the same');
				return res.redirect('/reg');
			}
			var md5 = crypto.createHash('md5'),
				password = md5.update(req.body.password).digest('hex');
			var newUser = new User({
				name: req.body.username,
				password: password,
				email: req.body.email
			});
			console.log(newUser.name);
			User.get(newUser.name,function(err, user){
				if(err){
					req.flash('error', err);
					return res.redirect('/');
				}
				if(user){
					req.flash('error', 'The username was used.');
					return res.redirect('/reg');
				}

				newUser.save(function(err){
					if(err){
						req.flash('error', err);
						return res.redirect('/reg');
					}
					req.session.user = newUser;
					console.log(req.session.user);
					req.flash('sucess', 'u r the one of us!');
					res.redirect('/');
				});
			});
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
