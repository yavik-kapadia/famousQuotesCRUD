const express = require("express");
const mysql = require("mysql");
const app = express();
const pool = require("./dbPool");
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

//routes
app.get("/", (req, res) => {
  res.render("index");
});

app.get("/author/new", (req, res) => {
  res.render("newAuthor");
});

app.get("/authors", async function (req, res) {
  let sql = `SELECT *
            FROM q_authors
            ORDER BY lastName`;
  let rows = await executeSQL(sql);
  res.render("authorList", { authors: rows });
});

//update authors
app.get("/author/edit", async function (req, res) {
  let authorId = req.query.authorId;

  let sql = `SELECT *, DATE_FORMAT(dob, '%Y-%m-%d') dobISO
            FROM q_authors
            WHERE authorId =  ${authorId}`;
  let rows = await executeSQL(sql);
  res.render("editAuthor", { authorInfo: rows });
});

// post
app.post("/author/new", async function (req, res) {
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
app.post("/author/edit", async function (req, res) {
  let sql = `UPDATE q_authors
            SET firstName = ?,
               lastName = ?,
               dob = ?,
               sex = ?
            WHERE authorId =  ?`;

  let params = [
    req.body.fName,
    req.body.lName,
    req.body.dob,
    req.body.sex,
    req.body.authorId,
  ];
  let rows = await executeSQL(sql, params);

  sql = `SELECT *, 
        DATE_FORMAT(dob, '%Y-%m-%d') dobISO
        FROM q_authors
        WHERE authorId= ${req.body.authorId}`;
  rows = await executeSQL(sql);
  res.render("editAuthor", { authorInfo: rows, message: "Author Updated!" });
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
