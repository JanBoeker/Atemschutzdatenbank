//jshint esversion:6

// Environment variables
require('dotenv').config()

//////////////////////////// Modules ////////////////////////////
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

const port = process.env.PORT || 3000;

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");

//////////////////////////// Setup express-session ////////////////////////////
app.use(session({
  secret: process.env.MASTER,
  resave: false,
  saveUninitialized: false
}));

//////////////////////////// Setup passport ////////////////////////////
app.use(passport.initialize());
app.use(passport.session());

//////////////////////////// DB setup ////////////////////////////
mongoose.connect("mongodb://localhost:27017/atemschutzDB", {useNewUrlParser: true, useUnifiedTopology: true});

// To solve the DeprecationWarning "collection.ensureIndex is deprecated. Use createIndexes instead"
mongoose.set('useCreateIndex', true);

// mongoose schema is required for the encryption: https://preview.npmjs.com/package/mongoose-encryption
const userSchema = new mongoose.Schema ({
  username: String,
  email: String,
  password: String
});

// Mongoose plugin: https://mongoosejs.com/docs/plugins.html
userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//////////////////////////// routes ////////////////////////////
app.get("/", function(req, res) {
  res.render("home");
});

app.get("/login", function(req, res) {
  res.render("login");
});

app.get("/register", function(req, res) {
  res.render("register");
});

app.get("/logout", function(req, res) {

  // end current session and redirect
  req.logout();
  res.redirect("/");

});

app.get("/secrets", function(req, res) {

  if (req.isAuthenticated()) {
    res.render("secrets");
  } else {
    res.redirect("/login");
  }

});

//////////////////////////// register a new user ////////////////////////////
app.post("/register", function(req, res) {

  User.register({username: req.body.username}, req.body.password, function(err, user){
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/secrets");
      });
    }
  });

});

//////////////////////////// login the new user ////////////////////////////
app.post("/login", function(req, res) {

  const user = new User ({
    username: req.body.username,
    password: req.body.password
  });

  // use passport to login the user:
  req.login(user, function(err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function(err) {
        res.redirect("/secrets");
      });
    }

  });

});


//////////////////////////// Server ////////////////////////////
app.listen(port, () => console.log("Server started at port: "+ port));
