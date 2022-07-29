const express = require("express");
const mysql = require("mysql");
const app = express();
const pool = require("./dbPool");
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({extended: true}));

//routes
app.get("/", (req, res) => {
    res.render("index");
});

app.get("/authors/new", (req, res) => {
    res.render("newAuthor");
});
app.get("/quotes/new", (req, res) => {
    res.render("newQuote");
});

app.get("/authors", async function (req, res) {
    let sql = `SELECT *
               FROM q_authors
               ORDER BY lastName`;
    let rows = await executeSQL(sql);
    res.render("authorList", {authors: rows});
});

//update authors
app.get("/authors/edit", async function (req, res) {
    let authorId = req.query.authorId;

    let sql = `SELECT *, DATE_FORMAT(dob, '%Y-%m-%d') dobISO
               FROM q_authors
               WHERE authorId = ${authorId}`;
    let rows = await executeSQL(sql);
    res.render("editAuthor", {authorInfo: rows});
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
    res.render("newAuthor", {message: "Author added!"});
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
    res.render("editAuthor", {authorInfo: rows, message: "Author Updated!"});
});

// delete records
app.get("/authors/delete", async function (req, res) {
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
    res.render("quoteList", {quotes: rows});
});

// update quotes
app.get("/quotes/edit", async function (req, res) {

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

    res.render("editQuote", {quoteInfo: rows, authors: authors, categories: categories});
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
        req.body.quoteId
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

    res.render("editQuote", {quoteInfo: rows, authors: authors, categories: categories, message: "Quote Updated!"});
});

app.get("/quotes/delete", async function (req, res) {
    let sql = `DELETE
               FROM q_quotes
               WHERE quoteId = ${req.query.quoteId}`;
    let rows = await executeSQL(sql);
    res.redirect("/quotes");
});

//functions
async function executeSQL(sql, params) {
    return new Promise(function (resolve, reject) {
        pool.query(sql, params, function (err, rows, fields) {
            if (err) throw err;
            resolve(rows);
        });
    });
} //executeSQL

//start server
app.listen(3000, () => {
    console.log("Expresss server running...");
});
