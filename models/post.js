var mongodb = require('./db');

function Post(name, title, tag, article){
    this.name = name;
    this.title = title;
    this.tag = tag;
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
        tag: this.tag,
        article: this.article,
        comments: [],
        pv: 0,
        reprint_info: {}

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

Post.getPart = function (name, page, callback) {
    mongodb.open(function (err, db) {
        if(err){
            return callback(err);
        }
        db.collection('posts', function (err, collection) {
            if(err){
                return callback(err);
            }
            var query = {};
            if(name){
                query.name = name;
            }
            collection.count(query, function (err, total) {
                collection.find(query,{
                    skip: (page - 1) * 3,
                    limit: 3
                }).sort({time: -1}).toArray(function (err, docs) {
                    mongodb.close();
                    if(err){
                        return callback(err);
                    }
                    callback(null, docs, total);
                });
            })
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
            //如果删除的是转载来的文章，那么为了转载统计的正确性，需要 把更新作为依据的原文的reprint_to
            collection.findOne({
                "name": name,
                "time.day": day,
                "title": title
            }, function (err, doc) {
                if(err){
                    mongodb.close();
                    return callback(err);
                }
                var reprint_from = {};
                if(doc.reprint_info.reprint_from){
                    reprint_from = doc.reprint_info.reprint_from;
                }
                if(reprint_from){
                    collection.update({
                        "name": reprint_from.name,
                        "time.day": reprint_from.day,
                        "title": reprint_from.title
                    },{
                        $pull: {"reprint_info.reprint_to":{
                            "name": name,
                            "day": day,
                            "title": title
                        }}
                    }, function (err) {
                        if(err){
                            mongodb.close();
                            return callback(err);
                        }
                    });
                }
            });

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
Post.getTag = function (tag, callback) {
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
                "tag": tag
            };
            collection.find(query).sort({time: -1}).toArray(function (err, docs) {
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null, docs)
            });
        });
    });

};

Post.reprint = function (reprint_from, reprint_to, callback) {
  mongodb.open(function (err, db) {
      if(err){
          return callback(err);
      }
      db.collection('posts', function (err, collection) {
          if(err){
              mongodb.close();
              return callback(err);
          }
          collection.findOne({
              "name": reprint_from.name,
              "time.day": reprint_from.day,
              "title": reprint_from.title
          }, function (err, doc) {
              if(err){
                  mongodb.close();
                  return callback(err);
              }

              var date = new Date();
              var time = {
                  date: date,
                  year: date.getFullYear(),
                  month: date.getFullYear() + '-' + (date.getMonth() + 1),
                  day: date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate(),
                  minute: date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + ' ' + date.getHours() + ':' + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
              };
              delete doc._id;
              doc.name = reprint_to.name;
              doc.time = time;
              doc.title = (doc.title.search(/[转载]/) < -1) ? doc.title : "[转载]" + doc.title;
              doc.comments = [];
              doc.reprint_info = {"reprint_from": reprint_from};
              doc.pv = 0;

              collection.update({
                  "name": reprint_from.name,
                  "time.day": reprint_from.day,
                  "title": reprint_from.title
              },{
                  $push: {"reprint_info.reprint_to": {
                      "name": doc.name,
                      "day": time.day,
                      "title": doc.title
                  }}
              }, function (err) {
                  if(err){
                      mongodb.close();
                      return callback(err);
                  }
              });

              collection.insert(doc, {safe: true}, function (err) {
                  mongodb.close();
                  if(err){
                      return callback(err);
                  }
                  callback(null);
              });
          });
      });



  });
};

Post.search = function (keyword, callback) {
    mongodb.open(function (err, db) {
        if(err){
            mongodb.close();
            return callback(err);
        }
        db.collection('posts', function (err, collection) {
            if(err){
                mongodb.close();
                return callback(err);
            }
            var pattern = new RegExp(keyword, 'i');
            collection.find({
                "title": pattern
            },{
                "name" : 1,
                "time": 1,
                "title": 1
            }).sort({
                time: -1
            }).toArray(function (err, docs) {
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null, docs);
            })
        })
    });
}