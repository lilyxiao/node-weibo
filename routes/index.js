var express = require('express');
var router = express.Router();
var crypto = require('crypto');
var Q = require('q');
var DB = require('../models/db');

var formidable = require('formidable'),
    util = require('util'),fs=require('fs');

/* GET home page. */
router.get('/', function(req, res) {

  DB.DB('posts',function (db,collection) {
    collection.find({}).sort({time: -1}).toArray(function(err, docs) {

      db.close();

      if(err){
        posts = [];
      }
      else{
        posts = docs;
      }
      res.render('index', {
        title: '首页',
        posts: posts
      });

    });
  })

});
router.get('/reg',checkNotLogin);
router.get('/reg',function (req,res) {
  res.render('reg',{title:'用户注册'});
});
router.post('/reg',checkNotLogin);
router.post('/reg',function (req,res) {

  if(!req.body['password-repeat'] || !req.body['password'] || !req.body['username']){
    req.flash('error', '请输入完整信息');
    return res.redirect('/reg');
  }

  //检验用户两次输入的口令是否一致
  if (req.body['password-repeat'] != req.body['password']) {
    req.flash('error', '两次输入的口令不一致');
    return res.redirect('/reg');
  }
  //生成口令的散列值
  var md5 = crypto.createHash('md5');
  var password = md5.update(req.body.password).digest('base64');

  var newUser = {
    name: req.body.username,
    password: password
  };

  //检查用户名是否已经存在

  DB.DB('users',function (db,collection) {

    collection.findOne({name:req.body.username},function (err,user) {
      db.close();
      if (user)
        err = 'Username already exists.';
      if (err) {
        req.flash('error', err);
        return res.redirect('/reg');
      }

      DB.DB('users',function (mdb,col) {

        col.ensureIndex('name', {unique: true});
        // 写入 user 文档
        col.insert(newUser, {safe: true}, function(err, user) {
          mdb.close();
          if (err) {
            req.flash('error', err);
            return res.redirect('/reg');
          }
          //req.session.user = newUser;
          req.flash('success', '注册成功');
          res.redirect('/');
        });
      })

    })
  })

});

router.get('/login',checkNotLogin);
router.get('/login',function (req,res) {
  res.render('login',{title:'用户登录'});
});

router.post('/login',checkNotLogin);
router.post('/login',function (req,res) {
  //生成口令的散列值
  var md5 = crypto.createHash('md5');
  var password = md5.update(req.body.password).digest('base64');

  DB.DB('users',function (db,collection) {
    collection.findOne({name:req.body.username},function (err,user) {
      db.close();

      if (!user) {
        req.flash('error', '用户不存在');
        return res.redirect('/login');
      }
      if (user.password != password) {
        req.flash('error', '用户口令错误');
        return res.redirect('/login');
      }
      req.session.user = req.body.username;
      req.flash('success', '登入成功');
      res.redirect('/');
    })
  })

});

router.get('/logout',checkLogin);
router.get('/logout',function (req,res) {
  req.session.user = null;
  req.flash('success', '登出成功');
  res.redirect('/');
});

router.get('/post',checkNotLogin);
router.get('/post',function (req,res) {
  res.render('posts',{title:'发表微博'});
});
router.post('/post', checkLogin);
router.post('/post', function(req, res) {
  var post = {
    user: req.session.user,
    post: req.body.post,
    time: Number(new Date())
  };

  DB.DB('posts', function(db, collection) {
    // 为 user 属性添加索引
    collection.ensureIndex('user');
    // 写入 post 文档
    collection.insert(post, {safe: true}, function(err, post) {
      db.close();
      if(err){
        req.flash('error', err);
        return res.redirect('/');
      }

      req.flash('success', '发表成功');
      res.redirect('/u/' + req.session.user);
    });
  });

});
router.get('/u/:user', function(req, res) {

  DB.DB('users',function (db,collection) {
    collection.findOne({name:req.params.user},function (err,user) {
      db.close();

      if (!user) {
        req.flash('error', '用户不存在');
        return res.redirect('/');
      }

      DB.DB('posts',function (db,collection) {
        collection.find({}).sort({time: -1}).toArray(function(err, docs) {

          db.close();

          if (err) {
            req.flash('error', err);
            return res.redirect('/');
          }
          else{
            posts = docs;
          }

          console.log("kanzheli===============");

          console.dir(user);

          res.render('user', {
            title: user.name,
            posts: posts,
            user:user
          });

        });
      })
    });

  });

});

//货源信息
router.get('/good-lists', function(req, res) {

  var post = {};

  Q.all([DB.find('guige',{},{id:1,name:1}),DB.find('fareliang',{},{}),DB.find('jiagonggy',{},{id:1,name:1}),DB.find('liufen',{},{id:1,name:1}),DB.find('goods',{},{})])

      .then(function (resp) {
        post.guige =  resp[0];
        post.frl =  resp[1];
        post.jggy =  resp[2];
        post.lf =  resp[3];
        post.goods =  resp[4];

        res.render('good-lists', {
          title: '货源信息',
          posts: post
        });
      })
});

//发布货源页面
router.get('/pubGoods',checkLogin);
router.get('/pubGoods',function (req,res) {

  Q.all([DB.find('goodsmodel',{},{}),
    DB.find('guige',{},{id:1,name:1}),
    DB.find('fareliang',{},{}),
    DB.find('jiagonggy',{},{id:1,name:1}),
    DB.find('liufen',{},{id:1,name:1}),
    DB.find('huifa',{},{id:1,name:1}),
    DB.find('huifen',{},{id:1,name:1}),
    DB.find('quanshuifen',{},{id:1,name:1})])

      .then(function (resp) {

        var goods = {};

        goods.temp = resp[0];
        goods.guige = resp[1];
        goods.fareliang = resp[2];
        goods.jiagonggy = resp[3];
        goods.liufen = resp[4];
        goods.huifa = resp[5];
        goods.huifen = resp[6];
        goods.quanshuifen = resp[7];

        res.render('pubGoods',{title:'发布货源',goods: goods});
      })


});

//发布货源
router.post('/pubGoods', checkLogin);
router.post('/pubGood',function (req,res) {
  req.body.ctime = Number(new Date());
  req.body.unit = req.session.user;
  DB.insert('goods',req.body)
      .then(function (resp) {
        console.log('success');

        res.redirect('/good-lists');
      });
});

//个人日记
router.get('/mydiary',function (req,res) {

  DB.find('mydiary',{},{})

      .then(function (resp) {
        console.dir(resp);
        res.render('mydiary',{title:'个人日记',diarys:resp});
      })
});


//写日记
router.get('/writeDiary',checkLogin);
router.get('/writeDiary',function (req,res) {
  res.render('writeDiary',{title:'写日记'});
});

//保存日记
router.post('/submydiary',checkLogin);
router.post('/submydiary',function (req,res) {

  req.body.ctime = Number(new Date());

  DB.insert('mydiary',req.body)

      .then(function (resp) {
        console.log('success');

        res.redirect('mydiary');
      })
});

//上传图片
router.post('/upload',function (req,res) {
  // parse a file upload
  var form = new formidable.IncomingForm(),files=[],fields=[],docs=[];
  var url;

  //存放目录
  form.uploadDir = 'public/tmp/';

  form.on('field', function(field, value) {
    fields.push([field, value]);
  }).on('file', function(field, file) {
    files.push([field, file]);
    docs.push(file);
    var types = file.name.split('.');
    var date = new Date();
    var ms = Date.parse(date);
    fs.renameSync(file.path, "public/tmp/" + ms + '_'+file.name);

    url = "tmp/" + ms + '_'+file.name;
  }).on('end', function() {
    res.writeHead(200, {
      'content-type': 'text/plain'
    });

    var resimg = {url:url,size:docs[0].size};

    var sout=JSON.stringify(resimg);
    res.end(sout);
  });

  form.parse(req, function(err, fields, files) {
    err && console.log('formidabel error : ' + err);

    console.log('parsing done');
  });

 // res.render('writeDiary',{});
});



function checkLogin(req, res, next) {

  if (!req.session.user) {
    req.flash('error', '未登入');
    return res.redirect('/login');
  }
  next();
}
function checkNotLogin(req, res, next) {
  if (req.session.user) {
    req.flash('error', '已登入');
    return res.redirect('/');
  }
  next();
}

module.exports = router;

