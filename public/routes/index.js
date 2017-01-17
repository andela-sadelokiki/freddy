var express  = require('express');
var router   = express.Router();
var crypto   =require('crypto');
var bcrypt = require('bcrypt-nodejs');
var async    =require('async');
var mailOptions=require('./mailOptions');
var User     = require('../models/user');
var Chat = require('../models/chat');
//var mid      = require('../middleware');//"connect-ensure-login" can do this for us
var passport = require('passport');
var passportStrategies=require('./passportStrategies')
var conEnsure=require('connect-ensure-login');//midleware used to check authentication of every request 

//setting up passport configuration

passportStrategies(passport);

//GET /login
router.get('/login',conEnsure.ensureLoggedOut("/") ,function(req, res, next){
	return res.render('login', { title: 'Sign In'})
});

//POST /login
router.post('/login',passport.authenticate('local',{ failureRedirect: '/login' }), function(req, res){
	 res.redirect("/");
});

// GET /sign_up
router.get('/sign_up',conEnsure.ensureLoggedOut('/'),function(req, res, next){
	return res.render('sign_up', {title: 'Sign up'});
});


//POST /sign_up
router.post('/sign_up', passport.authenticate('local-signup', {
    successRedirect : '/', // redirect to the secure profile section
    failureRedirect : '/sign_up' // redirect back to the signup page if there is an error
}));


//GET /user
router.get('/user',conEnsure.ensureLoggedIn("/login"),function(req, res, next){
	if (! req.user._id) {
		var err = new Error('You are not authorized to view this page.');
		err.status = 403;
		return next(err);
	}
	User.findById(req.user._id)
		.exec(function(error, user){
		if (error) {
			return next(error);
		} else {
			var dbUser = {
				_id: user.id,
				email: user.local.email ||user.facebook.email||user.google.email,
        activated: user.local.activated,
				displayName: user.displayName||user.facebook.name||user.google.name,
				pictureUrl: user.pictureUrl||"",
				chats: user.chats||[],
			};
			return res.json(dbUser);
		}
	});
});

//GET /usersearch + input
router.get('/usersearch/:input', conEnsure.ensureLoggedIn("/login"), function(req, res){
  var username = req.params.input.replace(/(\s|[\n\r])/g,""); //remove spaces/whites
      username =username.toUpperCase(); // to uppercase (bypass the key sensitive issue)
  User.find({/* "displayName": username */})
    .exec(function(error, users){
    if (error) {
      res.status(404).json(error);
    }
    else if(users && users.length){
     var obj={},NAME='';
     //------filter the users to keep only those matching the input
     users=users.filter(function(user){
        //also the name in db must be transformed
        NAME=user.displayName.replace(/(\s|[\n\r])/g,"");
        NAME=NAME.toUpperCase();
        return (NAME.includes(username));
     });
     //-------make the users array compatible with the front end 
     users=users.map(function(user){
        obj={
          _id        : user._id,
          email      : user.local.email || user.facebook.email || user.google.email,
          displayName: user.displayName||user.facebook.name||user.google.name,
          pictureUrl : user.pictureUrl||"",
        };
        return obj;
     });
     res.json({"Response": true, "Search": users});
    }
    else res.json({"Response": true, "Search":users});
  })  
});

//GET /person + id
router.get('/person/:id', conEnsure.ensureLoggedIn("/login"), function(req, res){
  var id = req.params.id;
  User.findById(id)
    .exec(function(error, user){
    if (error) {
      return next(error);
    } else {
      var dbuser = {
        _id: user._id,
        displayName: user.displayName,
        pictureUrl: user.pictureUrl,
      };
      return res.json(dbuser);
    }
  });
});

//PUT /user + id
// router.put('/user/:id',conEnsure.ensureLoggedIn("/login"), function(req, res){
// 	var id = req.params.id;
// 	var user = req.body;
// 	if (user && user._id !== id) {
// 		return res.status(500).json({ err: "Ids don't match!" });
// 	}
//     User.findByIdAndUpdate(id, user, {new: true}, function(err, user) {
// 		if (err) {
// 	      return res.status(500).json({ err: err.message });
// 	    };
// 	    return res.json({ 'user': user, message: 'User updated' });
// 	});
// });

//PUT /user + id
router.put('/user/:id',conEnsure.ensureLoggedIn("/login"), function(req, res){
  var id = req.params.id;
  var action = req.body.action;
  var user = req.body.user;
  var chat = req.body.chat;
  if (user && user._id !== id) {
    return res.status(500).json({ err: "Ids don't match!" });
  }
  if (action == 'full'){
      User.findByIdAndUpdate(id, user, {new: true}, function(err, user) {
      if (err) {
          return res.status(500).json({ err: err.message });
        };
        return res.json({ 'user': user, message: 'User updated' });
      });
  };
  if (action == 'newChat'){
      User.update({_id: id}, { $push: { chats: chat} }, function(err) {
        if (err) {
            return res.status(500).json({ err: err.message });
          };
        return res.json({ 'user': user, message: 'Chat added to ' + user.displayName + '\'s database' });
      });
  };
});


//GET /logout
router.get('/logout', conEnsure.ensureLoggedIn("/login"),function(req, res, next){
	if (req.session) {
		//delete session object
		req.session.destroy(function(err){
			if(err){
				return next(err);
			} else {
				return res.redirect('/');
			}
		});
	}
});


// GET /home
router.get('/home',conEnsure.ensureLoggedIn("/login"), function(req, res){
		res.render('home', {title: 'Home'});
});


/* GET home page. */
router.get('/',conEnsure.ensureLoggedIn("/login"),function(req, res) {
	return res.render('home', { title: 'Express'})
});

router.get('/forgot',function(req,res){
  res.render('forgot');
});

router.post('/forgot', function(req, res) {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ "local.email": req.body.email }, function(err, user) {
        if (!user) {
          done({message:'No account with that email address exists.'});
          //return res.redirect('/forgot');
        }
        else{
          user.local.forgotPwdToken = token;

          user.save(function(err) {
            done(err, token, user);
          });
        }
      });
    },
    function(token, user, done) {
     
      var transporter = mailOptions.transporter;
      var options     =mailOptions.mailOptions;
        options.to    =user.local.email;
        options.text  ='You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      
      transporter.sendMail(options, function(err,info) {
        if(err) done(err);
        else done();
      });
    }
  ], function(err) {
    if (err) res.json(err);
    else res.redirect('/forgot');
  });
});

router.get('/reset/:token',function(req,res){
  if(req.params.token){
    User.findOne(
      {'local.forgotPwdToken':req.params.token},
      function(err,user){
        if(err) res.render('error',err)
        else if(user){
             res.render('reset',{token:req.params.token});
        }
        else    res.render('error',{message:'Wrong token !'});
      }
    );
  }else {
     res.render("error",{message:"forbidden"});
  }
});

router.post('/reset',function(req,res){
  //the password reset token must be performed in a hidden input (req.body.token)
  if(!req.body.password || !req.body.confirmPassword)
      res.json({message:"Missing credentials"});
  else if(req.body.password!=req.body.confirmPassword)
      res.json({message:"Passwords doesn't match"}); 
  else if(!(/^[^]{6,}$/).test(req.body.password))
      res.json({message:"Password must have more than 6 characters"});
  else{
    console.log(req.body.token);
    User.findOne(
      {'local.forgotPwdToken':req.body.token},
      function(err,user){ 
        if(err) res.render("error",{message:err.message});
        else if(user){ 
             user.local.password=user.generateHash(req.body.password);
             user.save(function(err){
               if(!err){
                 console.log(user.local.email+' '+user.local.password)
                 req.body.email    = user.local.email;
                 req.body.resetPass= true;
                 passport.authenticate('local', function(err, user, info) {
                      if (err)   { res.redirect('/login'); }
                      else if (!user) { res.sendStatus(401); }
                      // manually establish the session 
                      else {
                       req.logIn(user, function(err) {
                         if (err) { res.redirect('/login'); }
                         else res.rediect("/");
                       });
                      }
                 })(req, res);
               }
               else res.json({message:'Wrong token !'});
             });
        }
        else    res.render("error",{message:'Wrong token !'});
      }
    );
  }
});
router.get('/activate/:token',function(req,res){
    if( req.params.token=="resend" && req.user && req.isAuthenticated && req.isAuthenticated()){
       console.log(req.user.local.email);
       var options    =mailOptions.mailOptions;
       var transporter=mailOptions.transporter;
       options.to     =req.user.local.email;
       options.subject='Activation link';
       options.text   ='Activation link :\n'+
                    'http://' + req.headers.host + '/activate/' + 
                     req.user.local.activationToken + '\n\n';
       transporter.sendMail(options, function(err,info) {
         if(err) {
            
            console.log(JSON.stringify(err));
            //if()err
            res.render('error',{error:err,message:err.message});
         }
         else    res.redirect('/');
       });
    }
    else if(req.params.token && req.params.token!=""){
       User.findOne({'local.activationToken':req.params.token},function(err,user){
            if(err) res.render('error',err);
            else if(user) {
               user.local.activated=true;
               user.save(function(err){
                 if(!err) res.redirect('/');
                 else     res.status(500).json({message:'internal error'});
               });
            }
            else  res.status(404).json({message:'not found'});
       });
    }  
    else res.redirect('/login');
    
});

//FREDDY routes

//POST /chat
router.post('/chat', function(req, res){
  var chat = req.body;
  Chat.create(chat, function(err, chat){
    if (err) {
      return res.status(500).json({ err: err.message });
    } else {
      return res.json({chat, message: 'Chat added to database'});
  }
  });
});


//GET /username + id
router.get('/username/:id', function(req,res){
  var id = req.params.id;
  User.findById(id)
    .exec(function(error, user){
    if (error) {
      return next(error);
    } else {
      var dbuser = {
        _id: user._id,
        displayName: user.displayName,
        pictureUrl: user.pictureUrl
      };
      return res.json(dbuser);
    }
  })
});

//GET /chat + id
router.get('/chat/:id', function(req,res){
  var id = req.params.id;
  Chat.findById(id)
    .exec(function(error, chat){
    if (error) {
      return next(error);
    } else //if (action == 'basic')
      {
        var basicChat = {
          _id: chat.id,
          name: chat.name,
          users: chat.users,
          group: chat.group,
          messages: [chat.messages[0]],
        };
        return res.json({"chat": basicChat, "message": 'Basic chat loaded'});
      }
  })  
});

//GET /chat + id
router.get('/updateChat/:id', function(req,res){
  var id = req.params.id;
  Chat.findById(id)
    .exec(function(error, chat){
    if (error) {
      return next(error);
    } else
      {
        var messages = chat.messages;
        return res.json({messages: messages, "message": 'Latest messages loaded'});
      }
  })  
});


//PUT /chat + id
router.put('/chat/:chatID', function(req, res){
  var chatID = req.params.chatID;
  var dbMessage = req.body.dbMessage;
  console.log('Yes, we have received your message: '+ dbMessage.text);
      Chat.update({_id: chatID}, { $push: { messages: { $each: [dbMessage], $position: 0 }} }, function(err) {
        if (err) {
            return res.status(500).json({ err: err.message });
          };
      });
      res.io.emit('send message', res.req.body);
      console.log("emit here!!!!");
    return res.json({"message": 'Message sent'});
});

module.exports = router;