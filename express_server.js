var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080
app.set('view engine','ejs');
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};

//req is short for request
//res is short for response

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
//Will display the port you're node is listening on (running on) - looks for the PORT variable listed at the top (8080 is the magic server port);
app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.post("/urls", (req, res) => {
  console.log(req.body);  // debug statement to see POST parameters
  var key = generateRandomString();
  var value = req.body.longURL;
  urlDatabase[key] = value;
  res.redirect('/urls/');         // Respond with 'Ok' (we will replace this)
});
//Moves the url information from urlDatabase to our 'urls_index' file , giving it the value listed in 'let templateVars' (urls);
app.get("/u/:shortURL", (req, res) => {
  var short = req.params.shortURL ;
  let longURL = urlDatabase[short];
  res.redirect(longURL);
});

app.get("/urls/:id", (req, res) => {
  let templateVars = { shortURL: req.params.id,
                       longURL: urlDatabase[req.params.id] };
  res.render("urls_show", templateVars);
});
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
function generateRandomString() {
var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 6; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}