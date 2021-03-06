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
var userNo = 0;
var full_name = 0;
var t_posts = 0;
var pr_posts = 0;
var pb_posts = 0;


const homeContentPublic = "These blogs are viewed publicly. To add up anything try composing your blogs publicly! and to compose one click on + button in bottom left";


mongoose.connect("mongodb://localhost:27017/blogDB", {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false});

mongoose.set("useCreateIndex", true);
//
const userSchema = new mongoose.Schema ({
  email: String,
  password: String,
  name: String,
  googleId: String,
  facebookId: String,
  first_name: String,
  last_name: String,
  phone_number: Number,
  status: String,
  social_link: String,
  about: String

});



const articleSchema = new mongoose.Schema({
  name: String,
  email: String,
  title: String,
  content: String,
  private: Boolean,
  likes: [String],
  noLikes: Number,
  dislikes: [String],
  noDisLikes: Number

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
    passReqToCallback   : true,
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(request, accessToken, refreshToken, profile, done){
    User.findOne({googleId: profile.id}, function(err, foundUser){
      if(!err){
        if(foundUser){

            userName = foundUser.name;
            userEmail = foundUser.email;
            userNo = foundUser.phone_number;
            full_name = foundUser.first_name;
            console.log(userName);
            console.log(userEmail);
            return done(err, foundUser);


        }else{
          console.log(profile);
          userName = profile.displayName;
          userEmail = profile.emails[0].value;

          const newUser = new User({
            name: profile.displayName,
            email: profile.emails[0].value,
            googleId: profile.id,
            first_name: "not-given",
            last_name: "not-given",
            phone_number: 0,
            status: "not-given",
            social_link: "not-given",
            about: "not-given"


          });
          newUser.save(function(err){
            if (err) {
              console.log(err);
            } else {
              console.log(newUser.name);
              return done(err, newUser);
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

    User.findOne({facebookId: profile.id}, function(err, foundUser){

      if(!err){
        if(foundUser){
            userName = foundUser.name;
            userEmail = foundUser.email;
            userNo = foundUser.phone_number;
            full_name = foundUser.first_name;
            console.log(userName);
            console.log(userEmail);
            return cb(err, foundUser);

        }else{
          console.log(profile);
          console.log(profile.emails[0].value);
          userName = profile.displayName;
          userEmail = profile.emails[0].value;
          const newUser = new User({
            name: profile.displayName,
            email: profile.emails[0].value,
            facebookId: profile.id,
            first_name: "not-given",
            last_name: "not-given",
            phone_number: 0,
            status: "not-given",
            social_link: "not-given",
            about: "not-given"
//
          });
          newUser.save(function(err){
            if (err) {
              console.log(err);
            } else {
              console.log(newUser.name);
              return cb(err, newUser);
            }
          });
        }
      }else{
        console.log(err);
      }
    })
  }
));
//
//
// *********************************************
app.get("/", function(req, res){
    res.render("main", {userName: userName, userNo: userNo});

});

app.get('/auth/google',
  passport.authenticate('google', { scope:
      [ 'email', 'profile' ] }
));

app.get( '/auth/google/lovelyLifestyle',
    passport.authenticate( 'google', {
        successRedirect: "/",
        failureRedirect: "/login"
}));
//
app.get("/auth/facebook",
  passport.authenticate('facebook', {scope: ['public_profile', 'email']}
));

app.get("/auth/facebook/lovelyLifestyle",
  passport.authenticate('facebook', { failureRedirect: "/Login" }),
    function(req, res) {
      // Successful authentication, redirect home.
      res.redirect('/');
});


app.get("/Login", function(req, res){
  res.render("Login", {message: req.flash('message')});
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
  userNo = 0;
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
            password: hash,
            first_name: "not-given",
            last_name: "not-given",
            phone_number: 0,
            status: "not-given",
            social_link: "not-given",
            about: "not-given"


          });
          newUser.save(function(err){
            if (err) {
              console.log(err);
            } else {
              console.log(newUser.name);
              userName = newUser.name;
              userEmail = newUser.email;
              res.render("main", {userName: newUser.name, userNo: userNo});
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
            userNo = foundUser.phone_number;
            full_name = foundUser.first_name;
            console.log(userName);
            res.render("main", {userName: foundUser.name, userNo: userNo});
          }else{
            req.flash('message',  'Check the password and try again!');
            res.redirect("Login");
            console.log("Error please login again");
          }
        });
      }
    }
  });

});

// profile page:
app.get("/profile", function(req, res) {
  res.render("profile", {message: req.flash('message'), email: userEmail});
});

app.post("/profile", function(req, res) {
  if (userName != 0) {
    if(req.body.email == userEmail){
      User.findOneAndUpdate(
          {email: req.body.email},
          {
            $set: {
              first_name: req.body.first_name,
              last_name: req.body.last_name,
              phone_number: req.body.phone_number,
              status: req.body.status,
              social_link: req.body.social,
              about: req.body.about
            },
          },
          {new: true},
          function(err, foundObject){
          if(err){
            res.send(err);
          }else{
            console.log(foundObject);
            userNo = req.body.phone_number;
            full_name = req.body.first_name;
            res.render("main", {userName: userName, userNo: userNo});
          }
         }
       );
    }else{
      req.flash('message',  'kindly enter the registered email only and try again!');
      res.render("profile");
    }

  }else{
    res.redirect("Login");
  }
});

//
// getting account page:
app.get("/account", function(req, res){
  if(userEmail != 0){
    User.findOne({email: userEmail}, function(err, foundUser){
      if(err){
        res.send(err);
      }else{
        if(foundUser){
          res.render("account", {myDetails: foundUser, masterEmail: userEmail, t_posts: t_posts, pb_posts: pb_posts, pr_posts: pr_posts});
        }
      }
    });
  }else{
    res.render("Login");
  }
});

app.get("/account/:postMail", function(req, res){
  if(userEmail != 0){
    User.findOne({email: req.params.postMail}, function(err, foundUser){
      if(err){
        res.send(err);
      }else{
        if(foundUser){
          res.render("account", {myDetails: foundUser , masterEmail: userEmail});
        }
      }
    });
  }else{
    res.render("Login");
  }
});


// deleting every data of user along with its account:
app.delete("/account/:mail", function(req, res) {
  // var foundUserEmail = 0;
  User.findOneAndDelete({email: req.params.mail}, function(err, foundUser){
    if(err){
      res.send(err);
    }else{
      if(foundUser){

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


// rendering all psts page through accounts of a particular user:
app.get("/allPosts", function(req, res) {
  Article.find(function(err, foundArticles){
    if(!err){
      if(userEmail != 0){
        res.render("allPosts", {masterUser: userEmail, allArticles: foundArticles, requiredUser: userEmail});
      }else{
        res.redirect("SignUp");
      }
      console.log(foundArticles);
    }else{
      res.send(err);
    }
  });
});


app.get("/allPosts/:postMail", function(req, res) {
  Article.find(function(err, foundArticles){
    if(!err){
      if(userEmail != 0){
        res.render("allPosts", {masterUser: userEmail, allArticles: foundArticles, requiredUser: req.params.postMail});
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
  if (userName == 0 || userEmail == 0) {
    res.redirect("/SignUp");
  } else {
    res.render("compose" );
  }

});


// composing a blog post:

app.post("/compose", function (req, res) {
  if(req.body.hasOwnProperty("private")){
    const newArticle = new Article({
      name: userName,
      email: userEmail,
      title: req.body.postTitle,
      content: req.body.postBody,
      private: true,
      noLikes: 0,
      noDisLikes: 0
    });
    newArticle.save(function(err){
      if(!err){
        pr_posts = pr_posts + 1;
        t_posts = t_posts + 1;
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
      private: false,
      noLikes: 0,
      noDisLikes: 0
    });
    newArticle.save(function(err){
      if(!err){
        pb_posts = pb_posts + 1;
        t_posts = t_posts + 1;
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

// rendering home or private blog page:
app.get("/home", function(req, res){
  if (userName != 0) {
    Article.find(function(err, foundArticles){
      if(!err){
        res.render("home", {masterUser: userName, home: homeStartingContent, postingPosts: foundArticles,  addMessage: req.flash('addMessage')});
      }else{
        res.send(err);
      }
    });
  } else {
    console.log("Please sign up or login first!!");
    res.redirect("/SignUp");
  }

});


// rendering blog page:
app.get("/blog", function(req, res) {
  Article.find(function(err, foundArticles){
    if(!err){
        res.render("blog", {publicHome: homeContentPublic, postingPublicPosts: foundArticles, addMessage: req.flash('addMessage')});

    }else{
      res.send(err);
    }

  });
});

//
// likes button and api:
app.post('/addLike/:postId', function (req, res) {
  if(userName != 0){

    Article.findById(req.params.postId, function(err, foundArticle) {
      if(err){
        res.send(err);
      }else{

        Article.findOne({_id: foundArticle._id, dislikes: userEmail}, function(err, found){
          if(!err){
            if(found){
              console.log(" found in dislike");

            }else{
              Article.findOne({_id: foundArticle._id, likes: userEmail}, function(err, found2){
                if (found2) {
                  console.log("not found in dislike but in like");
                  Article.updateOne(
                    {_id: req.params.postId},
                    {$pullAll: {likes:[userEmail]}},
                    function(err, foundObject){
                    if(err){
                      res.send(err);
                    }else{
                      console.log("removed");
                    }
                   }
                  );
                  Article.updateOne(
                    {_id: req.params.postId},
                    {$set: {
                      noLikes: foundArticle.noLikes-1
                    }},
                    function(err, foundObject){
                    if(err){
                      res.send(err);
                    }else{
                      res.send("");
                    }
                   }
                  );
                } else {
                  console.log("user not found");
                  Article.updateOne(
                    {"_id": req.params.postId},
                    {$push: {likes:userEmail}},
                    function(err, foundObject){
                    if(err){
                      res.send(err);
                    }else{
                      console.log("added");
                    }
                   }
                  );
                  Article.updateOne(
                    {_id: req.params.postId},
                    {$set: {
                      noLikes: foundArticle.noLikes+1
                    }},
                    function(err, foundObject){
                    if(err){
                      res.send(err);
                    }else{
                      res.send("");
                    }
                   }
                  );
                }

              });
              }
            }
          });
          }
        });
    }else{
      res.redirect("SignUp");
    }
  });



  app.post('/removeLike/:postId', function (req, res) {
    if(userName != 0){

      Article.findById(req.params.postId, function(err, foundArticle) {
        if(err){
          res.send(err);
        }else{

          Article.findOne({_id: foundArticle._id, likes: userEmail}, function(err, found){
            if(!err){
              if(found){
                  console.log("found in likes");

              }else{
                Article.findOne({_id: foundArticle._id, dislikes: userEmail}, function(err, found2){
                  if(!err){
                    if(found2){
                      console.log("not in likes but in dislikes");
                      Article.updateOne(
                        {_id: req.params.postId},
                        {$pullAll: {dislikes:[userEmail]}},
                        function(err, foundObject){
                        if(err){
                          res.send(err);
                        }else{
                          console.log("removed");
                        }
                       }
                      );
                      Article.updateOne(
                        {_id: req.params.postId},
                        {$set: {
                          noDisLikes: foundArticle.noDisLikes-1
                        }},
                        function(err, foundObject){
                        if(err){
                          res.send(err);
                        }else{
                          res.send("");
                        }
                       }
                      );
                    }else{
                      console.log("user not found");
                      Article.updateOne(
                        {"_id": req.params.postId},
                        {$push: {dislikes:userEmail}},
                        function(err, foundObject){
                        if(err){
                          res.send(err);
                        }else{
                          console.log("added");
                        }
                       }
                      );
                      Article.updateOne(
                        {_id: req.params.postId},
                        {$set: {
                          noDisLikes: foundArticle.noDisLikes+1
                        }},
                        function(err, foundObject){
                        if(err){
                          res.send(err);
                        }else{
                          res.send("");
                        }
                       }
                      );
                    }
                  }
                });

                }
              }
            });
            }
          });
      }else{
          res.redirect("/blog");
      }
    });

// rendering each individual post: from both home and blog page:
app.get("/publicPosts/:postId", function (req, res) {
  // var public_posts;
  Article.findOne({_id: req.params.postId}, function(err, foundArticle){
    if(foundArticle){
      res.render("post",{
        post: foundArticle,
        // public_posts: userpublicPosts,
        full_name: full_name,
        masterEmail: userEmail
      });
    }else{
      res.send("No articles matching that title was found.");
    }
  });
});

app.get("/likes/:postId", function(req, res) {
  Article.findOne({_id: req.params.postId}, function(err, foundArticle){
    if(foundArticle){
      res.render("likesPage",{
        post: foundArticle
      });
    }else{
      res.send("No articles matching that title was found.");
    }
  });
});

app.get("/dislikes/:postId", function(req, res) {
  Article.findOne({_id: req.params.postId}, function(err, foundArticle){
    if(foundArticle){
      res.render("dislikesPage",{
        post: foundArticle
      });
    }else{
      res.send("No articles matching that title was found.");
    }
  });
});

//
// deleting post from posts page and from database:
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


// upading post in database from update page:(get request)
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

// upading post in database from update page:(post request) and redirecting to home and blog page:
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

// for heroku setup:

let port = process.env.PORT;
if(port == null || port == ""){
  port = 3000;
}

app.listen(port, function() {
  console.log("Server has started successfully");
});
