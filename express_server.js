//middleware and dependancies
var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080
app.set('view engine','ejs');
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
const bcrypt = require('bcrypt');
var cookieSession = require('cookie-session')
app.use(cookieSession({
  name: 'session',
  keys: ['chris'],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))

//URL Database - Where you'll store urls for the website
var urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "s33kkd"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "ksdk54"
  }
};

//User Database - Where users who register will be stored
const users = {
  "s33kkd": {
    id: "s33kkd",
    email: "dork@example.com",
    password: "$2a$10$HKnkZpk.T6cAz7Jbw1N6WexWV8HI/jykKrYzJULg4XPR8/yfS/nNi"    // password: "i-am-not-a-dork",
  },
  "ksdk54": {
    id: "ksdk54",
    email: "chris@example.com",
    password: "$2a$10$zWhHPrbnUpZliyiq6DaIY.h52GPEGz1grttPhTLJenfm.8957ddcG"
  }
}

//generates a random string out of 6 alphanumeric characters
function generateRandomString() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < 6; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

//compares the e-mail in the argument to the email in the user database
function IDChecker(candidate_email) {
  for (let user_id in users) {
    const user = users[user_id];
    if (user.email === candidate_email) {
      return user_id;
    }
  }
  return '';
}

//checks the email being used in the register page and compares it to the other emails in the database
function emailChecker(email) {
  for (user in users) {
    if (users[user].email === email) {
      return true;
    }
  }
}

//finds the urls that are associated with the user based on their id
function urlsForUser(userId) {
  const output = {}
  for(const url in urlDatabase) {
    if(userId === urlDatabase[url].userID) {
      output[url] = urlDatabase[url];
    }
  }
  return output;
}

/* ROUTES */

//req is short for request
//res is short for response

/* GETS */

//testing page to check function of server
app.get("/", (req, res) => {
  res.end("Hello!");
});

//testing page
app.get("/shorten", (req, res) => {
  res.end("Placeholder for shortening a URL!");
});

//When they request goes to the server for a directory named '/urls.json' the sit will display our urlDatabase on the site.
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

//will display that the server is running and one what port
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

//displays the URLs that are in the database according to the user, should not show any other urls but the one that are related to the user
app.get("/urls", (req, res) => {
  var userID = req.session.user_id;
  var user = users[userID];
  let templateVars = {
    urls: urlsForUser(userID),
    user: user
  };
  res.render("urls_index", templateVars);
});

//landing page to add a new long URL into database which will in turn generate a random string through the generateRandomString function
app.get("/urls/new", (req, res) => {
  var userID = req.session.user_id;
  var user = users[userID];
  let templateVars = {
    urls: urlDatabase,
    user: user
  };
  res.render("urls_new", templateVars);
});

//register page, should contain two parameters to fill in (if not filled in should not allow further use - see post)
app.get("/register", (req, res) =>{
  var userID = req.session.user_id;
  var user = users[userID];
  let templateVars = {
    urls: urlDatabase,
    user: user
  };
  res.render("urls_reg", templateVars);
});

//entering the generated short URL should redirect you to the location of the long URL
app.get("/u/:shortURL", (req, res) => {
    if (!(req.params.shortURL in urlDatabase)){
    res.send(404);
    return;
  }
  var short = req.params.shortURL ;
  let longURL = urlDatabase[short].longURL;
  res.redirect(longURL);
});

//displays the url you are trying to edit, and provies an input area to edit the url - reassigns the long URL to the short URL
app.get("/urls/:id", (req, res) => {
  var userID = req.session.user_id;
  if(userID !== urlDatabase[req.params.id].userID){
    res.send(403);
    return;
  }
  var user = users[userID];
  let templateVars = {
    urls: urlDatabase,
    user: user,
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,};
  res.render("urls_show", templateVars);
});
// login page, should contain two parameters for email and password
app.get("/login", (req, res) => {
  var userID = req.session.user_id;
  var user = users[userID];
  let templateVars = {
    urls: urlDatabase,
    user: user};
  res.render("urls_login", templateVars)
});

/* POSTS */

//deletes url from the database and redirects to database once completed;
app.post("/urls/:id/delete", (req, res) => {
  if (req.session.user_id !== users[req.session.user_id] ){
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
  } else {
    res.send(403);
  }
});

//renames the url that is listed to what the user inputs into the body of the edit bar
app.post("/urls/:id", (req, res) => {
   if (req.session.user_id !== users[req.params.id] ){
    var value = req.body.longURL;
    urlDatabase[req.params.id].longURL = value
    res.redirect("/urls");
  } else {
    res.send(403);
  }
});

//login page , checks for any empty strings on the login page (either username/password) and if either have no value returns 403.
//If password does not match the password in the database, sends a 403
app.post("/login", (req, res) => {
  var userEmail = req.body.email;
  var userPass = req.body.password;
  var userId = IDChecker(userEmail);
  if (userId === '' || userPass === '') {
    res.send(403);
    return;
  }
  if (!bcrypt.compareSync(userPass, users[userId].password)) {
    res.send(403);
    return;
  }
  //create the session cookie
  req.session.user_id = userId;
  res.redirect("/urls");
});

//clears all cookies and logs the user out once they press the button
app.post("/logout", (req, res) =>{
  req.session = null;
  res.redirect("/urls");
});

//posts the information to the url databse, and ties the short url handle to the user that input the information
app.post("/urls", (req, res) => {
  var key = generateRandomString();
  var value = req.body.longURL;
  urlDatabase[key] = {
    longURL: value,
    shortURL: key,
    userID: req.session.user_id,
  };
  res.redirect('/urls');
});

//check the requires for registration, if either parameter is not completed, returns a 400. Else it will encrypt the password and register
//information to database
app.post("/register", (req, res) => {
  let userId = generateRandomString();
  let myEmail = req.body.email;
  let myPassword = req.body.password;
  if (!myEmail || !myPassword) {
    res.status(400).send("400 - Registration not completed");
  } else if (emailChecker(myEmail)) {
    res.status(400).send("400 - User e-mail exists already");
  } else {
    let hashedPassword = bcrypt.hashSync(myPassword, 10);
    let user = {
      id: userId,
      email: myEmail,
      password: hashedPassword
    };
req.session.user_id = userId;
    users[userId] = user;
    res.redirect('/urls')
  };
});