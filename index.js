const express = require("express");
const mysql = require("mysql");
const app = express();
const session = require("express-session");
const bcrypt = require("bcrypt");
const pool = require("./dbPool");
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(
  session({
    secret: "hushhushdontsayanything",
    resave: true,
    saveUninitialized: true,
  })
);
app.use(express.urlencoded({ extended: true }));

//routes
//homepage
app.get("/", async (req, res) => {
  let authors = await getAuthors();

  let category = await getCategories();

  res.render("index", {
    authors: authors,
    categories: category,
    auth: req.session.authenicated,
  });
});

//login page get
app.get("/login", (req, res) => {
  res.render("login", { auth: req.session.authenicated });
});

// get new authors page
app.get("/authors/new", isAuthenticated, (req, res) => {
  res.render("newAuthor", { auth: req.session.authenicated });
});
// get new quotes page
app.get("/quotes/new", isAuthenticated, async (req, res) => {
  let sql = "SELECT * FROM q_authors";
  let authors = await executeSQL(sql);

  sql = "SELECT DISTINCT category from q_quotes";

  let categories = await executeSQL(sql);

  res.render("newQuote", {
    authors: authors,
    categories: categories,
    auth: req.session.authenicated,
  });
});

app.get("/authors", async function (req, res) {
  let sql = `SELECT *
               FROM q_authors
               ORDER BY lastName`;
  let rows = await executeSQL(sql);
  res.render("authorList", { authors: rows, auth: req.session.authenicated });
});

//update authors
app.get("/authors/edit", isAuthenticated, async function (req, res) {
  let authorId = req.query.authorId;

  let sql = `SELECT *, DATE_FORMAT(dob, '%Y-%m-%d') dobISO
               FROM q_authors
               WHERE authorId = ${authorId}`;
  let rows = await executeSQL(sql);
  res.render("editAuthor", {
    authorInfo: rows,
    auth: req.session.authenicated,
  });
});
app.get("/authors/viewAuthor", async function (req, res) {
  let authorId = req.query.authorId;

  let sql = `SELECT *, DATE_FORMAT(dob, '%Y-%m-%d') dobISO
               FROM q_authors
               WHERE authorId = ${authorId}`;
  let rows = await executeSQL(sql);
  res.render("viewAuthor", {
    authorInfo: rows,
    auth: req.session.authenicated,
  });
});
// post
app.post("/authors/new", async function (req, res) {
  let fName = req.body.fName;
  let lName = req.body.lName;
  let birthDate = req.body.birthDate;
  let deathDate = req.body.deathDate;
  let country = req.body.country;
  //get radio button value
  let sex = req.body.sex;
  console.log(sex);
  let profession = req.body.profession;
  let portrait = req.body.portrait;
  let biography = req.body.biography;

  let sql =
    "INSERT INTO q_authors (firstName, lastName, dob, dod, sex, profession, country, portrait, biography) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
  let params = [
    fName,
    lName,
    birthDate,
    deathDate,
    sex,
    profession,
    country,
    portrait,
    biography,
  ];
  let rows = await executeSQL(sql, params);
  res.render("newAuthor", { message: "Author added!" });
});

//update authors post
app.post("/authors/edit", async function (req, res) {
  let sql = `UPDATE q_authors
               SET firstName  = ?,
                   lastName   = ?,
                   dob        = ?,
                   dod        = ?,
                   sex        = ?,
                   profession = ?,
                   country    = ?,
                   portrait   = ?,
                   biography  = ?
               WHERE authorId = ?`;

  let params = [
    req.body.fName,
    req.body.lName,
    req.body.dob,
    req.body.dod,
    req.body.sex,
    req.body.profession,
    req.body.country,
    req.body.portrait,
    req.body.biography,
    req.body.authorId,
  ];
  let rows = await executeSQL(sql, params);

  sql = `SELECT *,
                  DATE_FORMAT(dob, '%Y-%m-%d') dobISO,
                  DATE_FORMAT(dod, '%Y-%m-%d') dodISO
           FROM q_authors
           WHERE authorId = ${req.body.authorId}`;
  rows = await executeSQL(sql);
  res.render("editAuthor", { authorInfo: rows, message: "Author Updated!" });
});

// delete records
app.get("/authors/delete", isAuthenticated, async function (req, res) {
  let sql = `DELETE
               FROM q_authors
               WHERE authorId = ${req.query.authorId}`;
  let rows = await executeSQL(sql);
  res.redirect("/authors");
});

//list quotes
app.get("/quotes", async function (req, res) {
  let sql = `SELECT *
               FROM q_quotes,
                    q_authors
               WHERE q_quotes.authorId = q_authors.authorId
               ORDER BY quoteId`;

  let rows = await executeSQL(sql);
  res.render("quoteList", { quotes: rows, auth: req.session.authenicated });
});
// add new quotes
app.post("/quotes/new", async function (req, res) {
  let authorId = req.body.authorId;
  let quote = req.body.quote;
  let category = req.body.category;
  let likes = req.body.likes;
  let sql =
    "INSERT INTO q_quotes (authorId, quote, category, likes) VALUES (?, ?, ?, ?)";
  let params = [authorId, quote, category, likes];
  let rows = await executeSQL(sql, params);

  sql = "SELECT * FROM q_authors";
  let authors = await executeSQL(sql);
  sql = "SELECT DISTINCT category from q_quotes";
  let categories = await executeSQL(sql);

  res.render("newQuote", {
    authors: authors,
    categories: categories,
    message: "Quote added!",
  });
});
//post new quotes

// update quotes
app.get("/quotes/edit", isAuthenticated, async function (req, res) {
  let quoteId = req.query.quoteId;
  let sql = `SELECT *
               FROM q_quotes
               WHERE quoteId = ${quoteId}`;
  rows = await executeSQL(sql);

  sql = `SELECT *
           from q_authors`;
  let authors = await executeSQL(sql);

  sql = `SELECT DISTINCT category
           FROM q_quotes`;
  let categories = await executeSQL(sql);

  res.render("editQuote", {
    quoteInfo: rows,
    authors: authors,
    categories: categories,
    auth: req.session.authenicated,
  });
});
//editQuote
app.post("/quotes/edit", async function (req, res) {
  let quoteId = req.body.quoteId;
  let sql = `UPDATE q_quotes
               SET quote    = ?,
                   authorId = ?,
                   category= ?,
                   likes    = ?
               WHERE quoteId = ?`;

  let params = [
    req.body.quote,
    req.body.authorId,
    req.body.category,
    req.body.likes,
    req.body.quoteId,
  ];
  let rows = await executeSQL(sql, params);

  sql = `SELECT *
           FROM q_quotes
           WHERE quoteId = ${quoteId}`;

  rows = await executeSQL(sql);

  sql = `SELECT *
           from q_authors`;
  let authors = await executeSQL(sql);

  sql = `SELECT DISTINCT category
           FROM q_quotes`;
  let categories = await executeSQL(sql);

  res.render("editQuote", {
    quoteInfo: rows,
    authors: authors,
    categories: categories,
    message: "Quote Updated!",
  });
});

app.get("/quotes/delete", isAuthenticated, async function (req, res) {
  let sql = `DELETE
               FROM q_quotes
               WHERE quoteId = ${req.query.quoteId}`;
  let rows = await executeSQL(sql);
  res.redirect("/quotes");
});

//update likes
app.get("/quotes/likes", async (req, res) => {
  let quoteId = req.query.quoteId;
  let sql = "UPDATE q_quotes SET likes = likes + 1 WHERE quoteId = ?";
  let rows = await executeSQL(sql, [quoteId]);

  res.redirect("/quotes");
});
app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

app.get("/searchByKeyword", async (req, res) => {
  let userKeyword = req.query.keyword;
  console.log(userKeyword);
  let sql = `SELECT quote, authorId, firstName, lastName
             FROM q_quotes
                      NATURAL JOIN q_authors
             WHERE quote LIKE ?`;
  let params = [`%${userKeyword}%`];

  let rows = await executeSQL(sql, params);


  res.render("results", { quotes: rows, auth: req.session.authenicated });
});

app.get("/searchByAuthor", async (req, res) => {
  let userAuthorId = req.query.authorId;

  let sql = `SELECT quote, authorId, firstName, lastName FROM q_quotes NATURAL JOIN q_authors WHERE authorId = ?`;
  let params = [userAuthorId];
  let rows = await executeSQL(sql, params);

  let bg = await setBackground();

  res.render("results", { quotes: rows, auth: req.session.authenicated });
});

//search by range of likes
app.get("/searchByLikes", async (req, res) => {
  let userMinLikes = req.query.minLikes;
  let userMaxLikes = req.query.maxLikes;

  let sql = `SELECT quote, authorId, firstName, lastName FROM q_quotes NATURAL JOIN q_authors WHERE likes between ?  and ?`;
  let params = [parseInt(userMinLikes), parseInt(userMaxLikes)];
  let rows = await executeSQL(sql, params);
  let bg = await setBackground();

  res.render("results", { quotes: rows, auth: req.session.authenicated });
});

app.get("/api/author/:id", async (req, res) => {
  let authorId = req.params.id;
  let sql = `SELECT *
             FROM q_authors
             WHERE authorId = ? `;
  let rows = await executeSQL(sql, [authorId]);
  res.send(rows);
});

app.get("/searchByCategory", async (req, res) => {
  let userCategory = req.query.category;
  let sql = `SELECT quote, authorId, firstName, lastName
             FROM q_quotes
                      NATURAL JOIN q_authors
             WHERE category = ?`;
  let params = [userCategory];

  let rows = await executeSQL(sql, params);

  let bg = await setBackground();

  res.render("results", { quotes: rows, bg: bg });
});

app.post("/login", async function (req, res) {
  let username = req.body.username;
  let password = req.body.password;
  let hashedPassword = "";
  let sql = `SELECT * FROM users WHERE username = '${username}'`;
  let rows = await executeSQL(sql);
  let authors = await getAuthors();
  let categories = await getCategories();
  if (rows.length > 0) {
    hashedPassword = rows[0].password;
  }

  let passwordMatch = bcrypt.compareSync(password, hashedPassword);
  if (passwordMatch) {
    req.session.authenicated = true;
    req.session.username = username;
    req.session.role = rows[0].role;
    res.render("index", {
      authors: authors,
      categories: categories,
      auth: req.session.authenicated,
    });
  } else {
    res.render("login", { message: true });
  }
});
async function getAuthors() {
  let sql = `SELECT authorID, firstName, lastName
               FROM q_authors
               ORDER BY lastName`;
  let authors = await executeSQL(sql);

  return authors;
}
async function getCategories() {
  sql = `SELECT DISTINCT category FROM q_quotes `;
  let category = await executeSQL(sql);

  return category;
}
function isAuthenticated(req, res, next) {
  if (!req.session.authenicated) {
    res.redirect("/");
  } else {
    next();
  }
}
//functions
async function executeSQL(sql, params) {
  return new Promise(function (resolve, reject) {
    pool.query(sql, params, function (err, rows, fields) {
      if (err) throw err;
      resolve(rows);
    });
  });
} //executeSQL
// set background image
async function setBackground() {
  let url = "https://api.unsplash.com/photos/random/?client_id=SRQjMtPIDrqVL-xWm51Gp1qpw9NFQ6YRv40_ISxn-ZE&orientation=landscape&featured=true&query=nature";
  let response = await fetch(url);
  let data = await response.json();
  let image = data.urls.regular;
  return image;
}

//start server
app.listen(3000, () => {
  console.log("Expresss server running...");
});
