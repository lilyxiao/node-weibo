var mongo = require('mongodb').MongoClient;

var assert = require('assert');

var url = 'mongodb://localhost:27017/blog';

var Q = require('q');

function find(name,data,ret) {

    var deferred = Q.defer() ;

    openDB(name,function (db,collection) {
        collection.find(data,ret).sort({time: -1}).toArray(function(err, docs) {

            db.close();

            if(err){
                deferred.reject(err);
            }
            else{
                deferred.resolve(docs);
            }

        });
    });

    return deferred.promise;
}

function findOne(name,data,ret) {

    var deferred = Q.defer();

    openDB(name,function (db,collection) {

        collection.findOne(data,ret).sort({time:-1}).toArray(function (err,docs) {
            db.close();

            if(err){
                deferred.reject(err);
            }
            else
                deferred.resolve(docs);
        })
    })

    return deferred.promise;

}

function insert(name,data,ret) {

    var deferred = Q.defer();

    openDB(name,function (db,colloection) {
        colloection.insert(data,function (err,docs) {

            db.close();

            if(err){
                deferred.reject(err);
            }
            else
                deferred.resolve(docs);
        })
    });

    return deferred.promise;
}

function deleteD(name,data,ret) {

}

function update(name,data,ret) {

}

function openDB(name, callback) {
    mongo.connect(url, function (err, db) {
        assert.equal(null, err);
        var collection = db.collection(name);
        if (typeof collection === 'undefined') {
            db.createCollection(name);
            collection = db.collection(name);
        }
        if (typeof callback === 'function') {
            callback(db, collection);
        }
    });
}


module.exports = {
    find:find,
    findOne:findOne,
    insert:insert,
    delete:deleteD,
    update:update,
    DB:openDB
}
