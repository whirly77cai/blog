var express = require('express');
var router = express.Router();
var crypto = require('crypto'),
	User = require('../models/user.js'),
	Post = require('../models/post.js'),
	Comment = require('../models/comment.js'),
	Tag = require('../models/tags.js');



// module.exports = router;
module.exports = function(app){
	app.get('/',function(req, res){
		Post.getPart(null, 1, function (err, posts) {
			if(err){
				posts = [];
			}
			res.render('index', {
				user: req.session.user,
				posts: posts,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
		});

	});
	app.route('/reg')
		.get(checkNoLogin)
		.get(function (req, res) {
			res.render('reg', {
				user: req.session.user,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
		})
		.post(checkNoLogin)
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
			//console.log(newUser.name);
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
					//req.session.user = newUser;
					//console.log(req.session.user);
					req.flash('sucess', 'u r the one of us!');
					res.redirect('/login');
				});
			});
		});
	app.route('/login')
		.get(checkNoLogin)
		.get(function (req, res) {
			res.render('login', {
				title: '登录',
				user: req.session.user,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
		})
		.post(checkNoLogin)
		.post(function (req, res) {
			// body...
			var md5 = crypto.createHash('md5'),
				password = md5.update(req.body.password_l).digest('hex');
			User.get(req.body.username_l, function (err, user) {
				if(!user){
					req.flash('error', 'there is no this guy');
					return res.redirect('/login');
				}else if(user.password != password){
					req.flash('error', 'wrong password');
					return res.redirect('/login');
				}
				console.log(user);
				req.session.user = user;
				req.flash('success', 'login successfully');
				res.redirect('/');
			})
		});
	app.route('/post')
		.get(checkLogin)
		.get(function (req, res) {
			var currentUser = req.session.user;
			User.get(currentUser.name, function (err, user) {
				if(err){
					req.flash("error", err);
					return res.redirect('/');
				}
				req.session.user = user;
				res.render('post',{
					user: req.session.user,
					success: req.flash('success').toString(),
					error: req.flash('error').toString()
				});
			});

		})
		.post(checkLogin)
		.post(function (req, res) {
			// body...
			var currentUser = req.session.user,
				post = new Post(currentUser.name, req.body.title, req.body.tag, req.body.article);
			post.save(function (err) {
				if(err){
					return res.redirect('/');
				}
				req.flash('success', '发布成功');
				res.redirect('/');
			});
		});
	app.get('/u/:name', function (req, res) {
		var page = req.query.p ? parseInt(req.query.p) : 1;
		User.get(req.params.name, function (err, user) {
			if(!user){
				req.flash("error", "该用户不存在");
				return res.redirect('/');
			}
			Post.getPart(user.name, page, function (err, posts, total) {
				if(err){
					req.flash("error", err);
					return res.redirect('/');
				}
				console.log(posts);
				res.render('user',{
					username: user.name,
					posts: posts,
					page: page,
					isFirstPage: ((page - 1) == 0),
					isLastPage: ((page - 1) * 3 + posts.length) == total,
					user: req.session.user,
					success: req.flash('success').toString(),
					error: req.flash('error').toString()
				});
			});
		});
	});
	app.route('/u/:name/:day/:title')
		.get(function (req, res) {
			Post.getOne(req.params.name, req.params.day, req.params.title, function (err, post) {
				if(err){
					req.flash("error", err);
					return res.redirect('/');
				}
				res.render('article', {

					post: post,
					user: req.session.user,
					success: req.flash('success').toString(),
					error: req.flash('error').toString()
				});
			});
		})
		.post(function (req, res) {
			var currentUser = req.session.user;
			var date = new Date(),
				time = date.getFullYear() + '-' + (date.getMonth()+1) + '-' + date.getDate() + ' ' + date.getHours() + ':' + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
			var comment = {
				name: currentUser.name,
				time: time,
				comment: req.body.comments
			};
			console.log(comment);
			var newComment = new Comment(req.params.name, req.params.day, req.params.title, comment);
			newComment.save(function (err) {
				if(err){
					req.flash("error", err);
					return res.redirect('back');
				}else{
					req.flash("success", "留言成功啦");
					res.redirect('back');
				}
			})
		});
	app.route('/edit/:name/:day/:title')
		.get(checkLogin)
		.get(function (req, res) {
			var currentUser = req.session.user;
			Post.getOne(currentUser.name, req.params.day, req.params.title, function (err, post) {
				if(err){
					req.flash('error', err);
					return res.redirect('back');
				}
				res.render('edit', {
					post: post,
					user: req.session.user,
					success: req.flash('success').toString(),
					error: req.flash('error').toString()
				});
			});
		})
		.post(checkLogin)
		.post(function (req, res) {
			var currentUser = req.session.user;
			Post.update(currentUser.name, req.params.day, req.params.title, req.body.article, function (err) {
				var url = encodeURI('/u' + '/' + req.params.name + '/' + req.params.day + '/' + req.params.title);
				if(err){
					req.flash("error", err);
					return res.redirect(url);
				}
				req.flash('success', '修改成功');
				res.redirect(url);
			});
		});
	app.get('/remove/:name/:day/:title', function (req, res) {
		Post.remove(req.params.name, req.params.day, req.params.title, function (err) {
			if(err){
				req.flash("error", err);
				return res.redirect('/');
			}
			res.redirect('/');
		})
	});
	app.route('/tag')
		.get(checkLogin)
		.get(function (req, res) {
			var currentUser = req.session.user;
			User.get(currentUser.name, function (err, user) {
				if(err){
					req.flash("error", err);
					return res.redirect('/');
				}
				res.render('tag',{
					user: user,
					success: req.flash('success').toString(),
					error: req.flash('error').toString()
				});
			});
		})
		.post(function (req, res) {
			var currentUser = req.session.user,
				newTag = new Tag(currentUser.name, req.body.addTag);
			newTag.save(function (err) {
				if(err){
					req.flash("error", err);
					return res.redirect('back');
				}else{
					req.flash("success", "添加成功");
					res.redirect('back');
				}
			});
		});
	app.route('/tag/:tag')
		.get(checkLogin)
		.get(function (req, res) {
			Post.getTag(req.params.tag, function (err, posts) {
				if(err){
					req.flash("error", err);
					return res.redirect('/');
				}
				console.log(posts);
				res.render('tagArticles',{
					user: req.session.user,
					tag: req.params.tag,
					posts: posts,
					success: req.flash('success').toString(),
					error: req.flash('error').toString()
				});
			})
		});
	app.route('/reprint/:name/:day/:title')
		.get(checkLogin)
		.get(function (req, res) {
			Post.getOne(req.params.name, req.params.day, req.params.title, function (err, post) {
				if(err){
					req.flash("error", err);
					return res.redirect('back');
				}
				var currentUser = req.session.user,
					reprint_from = { "name": post.name, "day": post.time.day, "title": post.title},
					reprint_to = {"name": currentUser.name};
				Post.reprint(reprint_from, reprint_to, function (err) {
					if(err){
						req.flash("error", err);
						return res.redirect('back');
					}
					req.flash("success", "转载成功啦");
					res.redirect('/u/'+ currentUser.name);
				});
			});
		});
	app.get('/logout', function (req, res) {
		req.session.user = null;
		req.flash('success', 'do not leave me!');
		res.redirect('/');
	});
	app.get('/search', function (req, res) {
		Post.search(req.query.keyword, function (err, posts) {
			if(err){
				req.flash("error", err);
				return res.redirect('/');
			}
			res.render('search', {
				posts: posts,
				user: req.session.user,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
		});
	});
	app.get('/link', function (req, res) {
		res.render('link');
	})

	app.use(function (req, res) {
		res.render('404');
	});


}


function checkLogin(req, res, next){
	if(!req.session.user){
		req.flash('error', 'please login');
		res.redirect('/login');
	}else
	next();
}
function checkNoLogin(req, res, next){
	if(req.session.user){
		req.flash('error', 'have login');
		res.redirect('back');
	}else
	next();
}