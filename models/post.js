var mongodb = require('./db');

function Post(name, title, article){
    this.name = name;
    this.title = title;
    this.article = article;
};

module.exports = Post;

Post.prototype.save = function (callback) {
    var date = new Date();
    var time = {
        date: date,
        year: date.getFullYear(),
        month: date.getFullYear() + '-' + (date.getMonth() + 1),
        day: date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate(),
        minute: date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + ' ' + date.getHours() + ':' + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
    };

    var post = {
        name: this.name,
        time: time,
        title: this.title,
        article: this.article,
        comments: []
    };

    mongodb.open(function (err, db) {
        if (err){
            return callback(err);
        }
        db.collection('posts', function(err, collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            collection.insert(post, {safe: true}, function (err) {
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null);
            });
        });
    });
};

Post.getAll = function (name, callback) {
    mongodb.open(function (err, db) {
        if(err){
            return callback(err);
        }
        db.collection('posts', function (err, collectoin) {
            if(err){
                return callback(err);
            }
            var query = {};
            if(name){
                query.name = name;
            }
            collectoin.find(query).sort({time: -1}).toArray(function (err, docs) {
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null, docs);
            });
        });
    });
};

Post.getOne = function (name, day, title, callback) {
  mongodb.open(function (err, db) {
      if(err){
          return callback(err);
      }
      db.collection('posts', function (err, collection) {
          if(err){
              mongodb.close();
              return callback(err);
          }
          var query = {
              "name": name,
              "time.day": day,
              "title": title,

          };
          collection.findOne(query, function (err, doc) {
              mongodb.close();
              if(err){
                  return callback(err);
              }
              callback(null, doc)
          });
      });
  });

};

Post.update = function (name, day, title, article, callback) {
  mongodb.open(function (err, db) {
      if(err){
          return callback(err);
      }
      db.collection('posts', function (err, collection) {
          if(err){
              mongodb.close();
              return callback(err);
          }
          collection.update({
              "name": name,
              "time.day": day,
              "title": title
          },{
              $set: {article: article}
          }, function (err) {
              mongodb.close();
              if(err){
                  return callback(err);
              }
              callback(null);
          });
      });
  });
};

Post.remove = function (name, day, title, callback) {
    mongodb.open(function (err, db) {
        if(err){
            return callback(err);
        }
        db.collection('posts', function (err, collection) {
            if(err){
                mongodb.close();
                return callback(err);
            }
            collection.remove({
                "name": name,
                "time.day": day,
                "title": title
            },{
                w: 1
            }, function (err) {
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null);
            });
        });
    });
};