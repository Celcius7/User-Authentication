//jshint esversion:6

const express = require('express')
const ejs = require('ejs')
const mongoose = require("mongoose")
const bodyParser = require("body-parser");

const app = express()
app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));


mongoose.connect("mongodb://localhost:27017/userDB", {
  useNewUrlParser: true
});

const userSchema = {
  email: String,
  password: String
}

const User = new mongoose.model("User", userSchema);

//Rendering initial routing pages
app.get("/", function(req, res) {
  res.render("home");
});

app.get("/login", function(req, res) {
  res.render("login");
});

app.get("/register", function(req, res) {
  res.render("register");
});
app.get("/forgot", function(req, res) {
  res.render("forgot")
})


// Post operation after user registration
//1)Create a new user and database
//2)Store related username and password in the user database
app.post("/register", function(req, res) {
  const newUser = new User({
    email: req.body.username,
    password: req.body.password
  })
  newUser.save(function(err) {
    if (err) {
      console.log(err)
    } else {
      res.render("secrets")
    }
  });
});


// Post operation after user try to log in
//1) Authenticate username and Password
//2) If Authorized, user can access the secret page.
app.post("/login", function(req, res) {
  const username = req.body.username
  const password = req.body.password

  User.findOne({
    email: username
  }, function(err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      if (foundUser.password === password) {
        res.render("secrets")
      }
    }
  });
});


// Post operation if user forgets his Password.
// 1) Authenticate the username
// 2) Assign a random Password
// 3) Send a email with new Password
// 4) Update the User database

app.post("/forgot", function(req, res) {
  const username = req.body.username
  const random_number = Math.floor(Math.random() * 10000) + 999;
  User.findOne(
    {email: username},
    function(err, foundUser) {
      if (foundUser) {
        const sgMail = require('@sendgrid/mail');
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        const msg = {
          to: username,
          from: 'rajhanscse@gmail.com',
          subject: "Password Reset",
          text: 'Hey '+username+"!",
          html: 'Ahoy '+username+'!   Here is your new password : '+random_number+', change after logging in.',
        };
        sgMail.send(msg)
          .then((response) => {
              console.log(response[0].statusCode)
              console.log(response[0].headers)
            })
          .catch((error) => {
            console.error(error)
          })

        User.update(
          {email : username},
          {password : random_number},
          function(err, foundArticle){
            if(foundArticle){
              res.send("Sucessfully updated the password, check your registered email");
            }else{
              res.send(err)
            }
          }

        )
      } else {
        res.send("Email not found...!")
      }
  })
})


app.listen(3000, function() {
  console.log('Server is running on port 3000');
})
