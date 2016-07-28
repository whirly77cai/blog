var mongodb = require('./db');

function Tag(name, tag) {
    this.name = name;
    this.tag = tag;
};

module.exports = Tag;

Tag.prototype.save = function(callback) {
    var tag = this.tag;
    var name = this.name;

    mongodb.open(function (err, db) {
        if(err){
            return callback(err);
        }
        db.collection('users', function (err, collection) {
            if(err){
                mongodb.close();
                return callback(err);
            }
            collection.update({
                "name" : name
            },{
                $push: {"tags": tag}
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

