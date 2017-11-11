var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080
app.set('view engine','ejs');
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
var cookieParser = require('cookie-parser')
app.use(cookieParser())
const bcrypt = require('bcrypt');
const password = "purple-monkey-dinosaur"; // you will probably this from req.params
const hashedPassword = bcrypt.hashSync(password, 10);

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
    password: "i-am-not-a-dork",
  },
  "ksdk54": {
    id: "ksdk54",
    email: "chris@example.com",
    password: "also-not-a-dork"
  }
}

function generateRandomString() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < 6; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

function IDChecker(username) {
  var ID = '';
  for (let user in users){
    if (users[user].email === username) {
      ID = user;
      return ID;
    }
  }
  return ID;
}

//checks the email being used in the register page and compares it to the other emails in the database
function emailChecker(email) {
  console.log("I am in the function" )
  for (user in users) {
    if (users[user].email === email) {
      return true;
    }
  }
}

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

app.get("/", (req, res) => {
  res.end("Hello!");
});
//Places 'Hello!' into the web page, visible on the home page or '/' directory.
app.get("/shorten", (req, res) => {
  res.end("Placeholder for shortening a URL!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});
//When they request goes to the server for a directory named '/urls.json' the sit will display our urlDatabase on the site.
app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

//When they requested directory '/hello' the site will redirect to that directory which has 'Hello World' written as the body. 'World' will be in bold.
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls", (req, res) => {
  var userID = req.cookies.user_id;
  var user = users[userID];
  let templateVars = {
    urls: urlsForUser(userID),
    user: user
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  var userID = req.cookies.user_id;
  var user = users[userID];
  let templateVars = {
    urls: urlDatabase,
    user: user
  };
  res.render("urls_new", templateVars);
});

app.get("/register", (req, res) =>{
  var userID = req.cookies.user_id;
  var user = users[userID];
  let templateVars = {
    urls: urlDatabase,
    user: user
  };
  res.render("urls_reg", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
    if (!(req.params.shortURL in urlDatabase)){
    res.send(404);
    return;
  }
  var short = req.params.shortURL ;
  let longURL = urlDatabase[short].longURL;
  res.redirect(longURL);

});

app.get("/urls/:id", (req, res) => {
  var userID = req.cookies.user_id;
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

app.get("/login", (req, res) => {
  var userID = req.cookies.user_id;
  var user = users[userID];
  let templateVars = {
    urls: urlDatabase,
    user: user};
  res.render("urls_login", templateVars)
});

/* POSTS */

//Moves the url info from urlDatabase to our 'urls_show' file, giving it the value listed in the 'let templateVars' (shortURL);
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});
//Deletes url from the database and redirects to database once completed;
app.post("/urls/:id", (req, res) => {
  var value = req.body.longURL;
  urlDatabase[req.params.id] = value
  res.redirect("/urls");
});
//renames the longURL to what was placed in the

app.post("/login", (req, res) => {
  var userEmail = req.body.email;
  var userPass = req.body.password;
  var emailID = IDChecker(userEmail);
  if (emailID === '') {
    res.send(403);
  }
  if (userPass !== users[emailID].password) {
    res.send(403);
  }
  res.cookie( "user_id", emailID);
  res.redirect("/urls");
});

app.post("/logout", (req, res) =>{
  res.clearCookie('user_id', {})
  res.redirect("/urls");
});

app.post("/urls", (req, res) => {
  console.log(req.body);  // debug statement to see POST parameters
  var key = generateRandomString();
  var value = req.body.longURL;
  urlDatabase[key] = {
    longURL: value,
    shortURL: key,
    userID: req.cookies.user_id,
  };
  res.redirect('/urls');         // Respond with 'Ok' (we will replace this)
});
//Moves the url information from urlDatabase to our 'urls_index' file , giving it the value listed in 'let templateVars' (urls);

app.post("/register", (req, res) => {
  let userId = generateRandomString();
  let myEmail = req.body.email;
  let myPassword = bcrypt.hashSync(req.body.password, 10);
  let user = {
    id: userId,
    email: myEmail,
    password: myPassword
  };
  if (!myEmail || !myPassword) {
    res.status(400).send("400 - Registration not completed");
  } else if (emailChecker(myEmail)) {
    res.status(400).send("400 - User e-mail exists already");
  } else {
    res.cookie('user_id', userId)
    users[userId] = user;
    console.log(users); // see POST parameters - check if users database is being updated properly;
    res.redirect('/urls')
  };
});