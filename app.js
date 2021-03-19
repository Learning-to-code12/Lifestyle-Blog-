require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");

const encrypt = require('mongoose-encryption');
const _ = require('lodash');
const flash = require('connect-flash');
var session = require('express-session');
const cookieParser = require('cookie-parser');

// bcrypt hashing

const bcrypt = require('bcrypt');
const saltRounds = 10;

// passport
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
// google authentication
const GoogleStrategy = require('passport-google-oauth20').Strategy;
//facebook authentication
const FacebookStrategy = require('passport-facebook').Strategy;


const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(session({ secret: process.env.SESSION_SECRET,
                  cookie: { maxAge: 60000},
                  saveUninitialized: false,
                  resave: false }));
app.use(flash());

app.use(passport.initialize());
// app.use(passport.session());

// // **********************************************************
const homeStartingContent = "This is a sample blog written. You can write as many practice blogs by clicking on the + button in bottom left. They just belong to you. You can manage them any way you want. Explore! :)";
const aboutContent = 'Hiii, I am Vartika. A software engineer currently studying in DTU. You can find me on insta and facebook, though I am not a very active user :") ';
const contactContent = "Email :- vartika12durgapal@gmail.com";
var userName = 0;
var userEmail = 0;
var usertotalPosts = 0;
var userpublicPosts = 0;
var userprivatePosts = 0;
var publicPosts = 0;
//
//
const homeContentPublic = "These blogs are viewed publicly. To add up anything try composing your blogs publicly! and to compose one click on + button in bottom left";


// mongoose.connect("mongodb+srv://admin-vartika:vartika12pandit@cluster0.m6p98.mongodb.net/blogDB", {useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connect("mongodb://localhost:27017/blogDB", {useNewUrlParser: true, useUnifiedTopology: true});
// , useFindAndModify: false
mongoose.set("useCreateIndex", true);
//
const userSchema = new mongoose.Schema ({
  email: String,
  password: String,
  name: String,
  googleId: String,
  facebookId: String
});



const articleSchema = new mongoose.Schema({
  name: String,
  email: String,
  title: String,
  content: String,
  private: Boolean
});

//passport plugin:
userSchema.plugin(passportLocalMongoose);


const User = new mongoose.model("User", userSchema, 'users');
const Article = new mongoose.model("Article", articleSchema, 'users');

// passport:-
passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});


// GoogleStrategy
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/lovelyLifestyle",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb){
    User.findOne({googleId: profile.id}, function(err, foundUser){
      if(!err){
        if(foundUser){
          // if(profile.id == foundUser.id){
            userName = foundUser.name;
            userEmail = foundUser.email;
            console.log(userName);
            console.log(userEmail);
            return cb(null, foundUser);
          // }

        }else{
          console.log(profile);
          userName = profile.displayName;
          userEmail = profile.emails[0].value;
          const newUser = new User({
            name: profile.displayName,
            email: profile.emails[0].value,
            googleId: profile.id
          });
          newUser.save(function(err) {
            if(!err){
              return cb(null, newUser);
            }
          });
        }
      }else{
        console.log(err);
      }
    })
  }
));

//FacebookStrategy
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_CLIENT_ID,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/lovelyLifestyle",
    profileFields: ['email','id', 'displayName', 'gender']
  },
  function(accessToken, refreshToken, profile, cb){
    // var email = profile.email || profile.emails[0].value;
    // if (! email){
    //   console.log('this user has no email in his FB');
    // }else{
    //   console.log(email);
    // }
    User.findOne({facebookId: profile.id}, function(err, foundUser){

      if(!err){
        if(foundUser){
            userName = foundUser.name;
            userEmail = foundUser.email;
            console.log(userName);
            console.log(userEmail);
            return cb(null, foundUser);

        }else{
          console.log(profile);
          console.log(profile.emails[0].value);
          userName = profile.displayName;
          userEmail = profile.emails[0].value
          const newUser = new User({
            name: profile.displayName,
            email: profile.emails[0].value,
            facebookId: profile.id
          });
          newUser.save(function(err) {
            if(!err){
              return cb(null, newUser);
            }
          });
        }
      }else{
        console.log(err);
      }
    })
  }
));


// *********************************************
app.get("/", function(req, res){
    res.render("main", {userName: userName});

});

app.get("/auth/google", function(req, res, next) {
  passport.authenticate('google', {scope: ['profile', 'email']} )(req, res, next);
});

app.get("/auth/google/lovelyLifestyle",
  passport.authenticate('google', { failureRedirect: "/Login" }),
    function(req, res) {
      // Successful authentication, redirect home.
      res.redirect('/');
});

app.get("/auth/facebook", function(req, res, next) {
  passport.authenticate('facebook', {scope: ['public_profile', 'email']} )(req, res, next);
});

app.get("/auth/facebook/lovelyLifestyle",
  passport.authenticate('facebook', { failureRedirect: "/Login" }),
    function(req, res) {
      // Successful authentication, redirect home.
      res.redirect('/');
});


app.get("/Login", function(req, res){
  res.render("Login", {loginMessage: req.flash('loginMessage')});
});

app.get("/SignUp", function(req, res){
  res.render("SignUp", {message: req.flash('message')});
});

app.get("/contact", function(req, res) {
  res.render("contact", {contactInfo: contactContent, aboutInfo: aboutContent});
});

app.get("/Logout", function(req, res){
  req.logout();
  res.redirect("/");
  userName = 0;
});

app.post("/SignUp", function (req, res) {
  User.findOne({email: req.body.email}, function(err, alreadyExisting) {
    if(err){
      console.log(err);

    }else{
      if(alreadyExisting){
        if(alreadyExisting.email ==  req.body.email){
          console.log(alreadyExisting);
          req.flash('message',  'This account already exists. Please login!');
          res.redirect("/SignUp");
        }

      }else{

        bcrypt.hash(req.body.password, saltRounds, function(err, hash){
          const newUser = new User({
            name:  req.body.name,
            email: req.body.email,
            password: hash
          });
          newUser.save(function(err){
            if (err) {
              console.log(err);
            } else {
              console.log(newUser.name);
              userName = newUser.name;
              userEmail = newUser.email;
              res.render("main", {userName: newUser.name});
            }
          });
        });
      }
    }
  })
});
//
app.post("/Login", function (req, res) {
    const email = req.body.email;
    const password =  req.body.password;

  User.findOne({email:email},function(err,foundUser){
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
        bcrypt.compare(password, foundUser.password, function(err, result) {
          if(result == true){
            userName = foundUser.name;
            userEmail = foundUser.email;
            console.log(userName);
            res.render("main", {userName: foundUser.name});
          }else{
            req.flash('loginMessage',  'Check the password and try again!');
            res.redirect("Login");
            console.log("Error please login again");
          }
        });
      }
    }
  });

});

app.get("/account", function(req, res){
  if(userEmail != 0){
    User.findOne({email: userEmail}, function(err, foundUser){
      if(err){
        res.send(err);
      }else{
        if(foundUser){
          res.render("account", {myDetails: foundUser, total: usertotalPosts, publicP: userpublicPosts, privateP: userprivatePosts});
        }
      }
    });
  }else{
    res.render("Login");
  }

});

app.delete("/account/:mail", function(req, res) {
  // var foundUserEmail = 0;
  User.findOneAndDelete({email: req.params.mail}, function(err, foundUser){
    if(err){
      res.send(err);
    }else{
      if(foundUser){
        // foundUserEmail = foundUser.email;
        userName = 0;
        userEmail = 0;
        res.redirect('/');
        console.log("Successfully deleted");
      }
    }
  });
  Article.deleteMany({email: userEmail}).then(function(){
    privatePosts = 0;
    console.log("data deleted");
  }).catch(function(err){
    console.log(err);
  });
});

app.get("/allPosts", function(req, res) {
  Article.find(function(err, foundArticles){
    if(!err){
      if(userEmail != 0){
        res.render("allPosts", {masterUser: userEmail, allArticles: foundArticles, total: usertotalPosts});
      }else{
        res.redirect("SignUp");
      }
      console.log(foundArticles);
    }else{
      res.send(err);
    }
  });
});


app.get("/compose", function(req,res){
  if (userName == 0) {
    res.redirect("/SignUp");
  } else {
    res.render("compose" );
  }

});

app.post("/compose", function (req, res) {
  if(req.body.hasOwnProperty("private")){
    const newArticle = new Article({
      name: userName,
      email: userEmail,
      title: req.body.postTitle,
      content: req.body.postBody,
      private: true
    });
    newArticle.save(function(err){
      if(!err){
        userprivatePosts = userprivatePosts + 1;
        usertotalPosts = usertotalPosts + 1;
        req.flash('addMessage',  'Your article has been added successfully');
        res.redirect("/home");
        console.log("successfully added a new article");
      }else{
        res.send(err);
      }
    });

  }else{
    console.log(userName);
    const newArticle = new Article({
      name: userName,
      email: userEmail,
      title: req.body.postTitle,
      content: req.body.postBody,
      private: false
    });
    newArticle.save(function(err){
      if(!err){
        userpublicPosts = userpublicPosts + 1;
        usertotalPosts = usertotalPosts + 1;
        req.flash('addMessage',  'Your article has been added successfully');
        res.redirect("/blog");
        console.log("successfully added a new article");
      }else{
        res.send(err);
      }
    });

  }
});
//

app.get("/home", function(req, res){
  if (userName != 0) {
    Article.find(function(err, foundArticles){
      if(!err){
        res.render("home", {masterUser: userName, home: homeStartingContent, postingPosts: foundArticles, noOfPosts: userprivatePosts, addMessage: req.flash('addMessage')});
      }else{
        res.send(err);
      }
    });
  } else {
    console.log("Please sign up or login first!!");
    res.redirect("/SignUp");
  }

});
var publicPosts = 0;
app.get("/blog", function(req, res) {
  Article.find(function(err, foundArticles){
    if(!err){
      foundArticles.forEach(function(post){
        if(post.private == false){
          publicPosts = publicPosts + 1;
        }
      });

      res.render("blog", {publicHome: homeContentPublic, postingPublicPosts: foundArticles,totalPosts: publicPosts, addMessage: req.flash('addMessage')});
    }else{
      res.send(err);
    }

  });
});

app.get("/publicPosts/:postId", function (req, res) {
  Article.findOne({_id: req.params.postId}, function(err, foundArticle){
    if(foundArticle){
      res.render("post",{
        masterEmail: userEmail,
        useremail: foundArticle.email,
        sendId: foundArticle._id,
        title: foundArticle.title,
        body: foundArticle.content,
        isPrivate: foundArticle.private
      });
    }else{
      res.send("No articles matching that title was found.");
    }
  });
});

app.delete("/publicPosts/:postId", function(req, res){
  Article.findOneAndDelete({_id: req.params.postId}, function(err, foundArticle){
    if(err){
      res.send(err);
    }else{
      if(foundArticle.private == false){
        res.redirect('/blog');
        console.log("Successfully deleted");
      }else{
        res.redirect('/home');
        console.log("Successfully deleted");
      }
    }
  });
});

app.get("/publicPosts/updatePage/:postId", function(req, res){
  Article.findOne({_id: req.params.postId}, function(err, foundArticle){
    if(foundArticle){
      res.render("updatePage",
      {id: req.params.postId,
      titlePage: foundArticle.title,
      contentPage: foundArticle.content,
      isPrivate: foundArticle.private
    });
    }else{
      res.send("No articles matching that title was found.");
    }
  });
});


app.post("/publicPosts/updatePage/:postId", function(req, res){
  Article.findOneAndUpdate(
      {_id: req.params.postId},
      {
        $set: {
          title: req.body.updateTitle,
          content: req.body.updateBody
        },
      },
      {new: true},
      function(err, foundObject){
      if(err){
        res.send(err);
      }else{
        if(foundObject.private == false){
          res.redirect('/blog');
        }else{
          res.redirect('/home');
        }
      }
     }
   );
});

app.listen(3000, function() {
  console.log("Server started successfully");
});
