const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

// helper function 1: generate a random ID
const generateRandomString = (numOfChars) => {
  return Math.random().toString(36).substring(3, numOfChars + 3);
};

// helper function 2: look up an email in users
const lookUpEmail = (email) => {
  for (let user in users) {
    if (users[user].email === email) {
      return users[user];
    }
  }
  return null;
};


app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {};

// middleware(s) before any route
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]]
  };
  res.render("urls_new", templateVars);
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  console.log(urlDatabase);
  res.redirect("/urls");
});


app.post("/urls", (req, res) => {
  console.log(req.body); // Log the POST request body to the console
  const shortUrl = generateRandomString(6);
  urlDatabase[shortUrl] = req.body.longURL;
  console.log(urlDatabase);
  res.redirect(`/urls/${shortUrl}`);

});

app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.newURL;
  res.redirect("/urls");
});


app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  console.log(longURL);
  if (longURL.startsWith("http://") || longURL.startsWith("https://")) {
    res.redirect(longURL);
  } else {
    res.redirect(`http://${longURL}`);
  }
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  // sad path: no email or password
  if (!email || !password) {
    return res.status(400).send("Email/password cannot be empty");
  }

  // sad path: email already resgistered
  if (lookUpEmail(email)) {
    return res.status(400).send("Email already registered, please use a different one.");
  }

  const randomId = generateRandomString(6);
  users[randomId] = {
    id: randomId,
    email: email,
    password: password
  };
  console.log(users);
  res.cookie("user_id", randomId);
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  // sad path 1: empty email or password
  if (!email || !password) {
    return res.status(400).send("Email/password cannot be empty");
  }
  // sad path 2: email doesn't exist
  if (!lookUpEmail(email)) {
    return res.status(403).send("Email doesn't exist.");
  }
  // sad path 3: email and password doesn't match
  if (lookUpEmail(email).password !== password) {
    return res.status(403).send("Invalid password.");
  }
  // happy path
  res.cookie("user_id", lookUpEmail(email).id);
  res.redirect("/urls");

});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase, user: users[req.cookies["user_id"]] }; // send the variables inside an object
  res.render("urls_index", templateVars); // don't include /views/... or the file extension ".ejs"
});

app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id], user: users[req.cookies["user_id"]] };
  res.render("urls_show", templateVars);
});


app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("*", (req, res) => {
  res.send("Oops, this page doesn't exist.");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});