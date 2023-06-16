const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const Joi = require("joi");
const dotenv = require("dotenv");
dotenv.config();
const mysqlPool = require("../database");
const auth = require("../middlewares/auth");

function validateUser(req) {
  const schema = Joi.object({
    movie_id: Joi.string().required(),
  });

  return schema.validate(req);
}

router.get("/", auth, (req, res) => {
  const searchQuery = "SELECT * from bookmark WHERE `user_id` = ?";
  mysqlPool
    .query(searchQuery, [req.user.id])
    .then(([rows]) => {
      res.status(200).send(rows);
    })
    .catch((err) => res.status(404).send(err));
});

router.get("/isbookmark/:movie_id", auth, (req, res) => {
  const user_id = req.user.id;
  const searchQuery = "SELECT * from bookmark WHERE `user_id` = ?";
  mysqlPool
    .query(searchQuery, [user_id])
    .then(([rows]) => {
      const movie = rows.find((item) => item.movie_id === req.params.movie_id);
      if (movie) return res.status(200).send({ isBookmark: true });
      res.status(200).send({ isBookmark: false });
    })
    .catch((err) => res.status(404).send(err));
});

router.post("/", auth, (req, res) => {
  // Validate Error
  const { error } = validateUser(req.body);
  if (error)
    return res
      .status(400)
      .send({ status: "400 Bad request", error: error.details[0].message });

  const searchQuery = "SELECT * from bookmark WHERE `movie_id` = ?";
  mysqlPool
    .query(searchQuery, [req.body.movie_id])
    .then(([rows]) => {
      if (rows.length)
        return res.status(400).send({ error: "Movie already bookmarked." });

      // Create the user and return the user object
      const id = crypto.randomBytes(16).toString("hex");
      const user_id = req.user.id;
      const movie_id = req.body.movie_id;

      // Store hash in your password DB.
      const insertQuery =
        "insert into bookmark (id, user_id, movie_id) values (?, ?, ?)";
      //   Add to Database and send response
      mysqlPool.query(insertQuery, [id, user_id, movie_id]).then((rows) => {
        res.status(200).send("bookmark success");
      });
    })
    .catch((err) => res.status(404).send(err));
});

router.delete("/:id", auth, (req, res) => {
  // If movie not found, return 404, otherwise delete it
  // and return the deleted object.

  const movie_id = req.params.id;
  // Lookup the movie
  // If not found, return 404
  const searchQuery = "SELECT * FROM bookmark WHERE `movie_id` = ?";
  mysqlPool
    .query(searchQuery, [movie_id])
    .then(([rows]) => {
      if (!rows.length)
        return res.status(400).send({ error: "Movie Not Found." });

      // If found, Detele it
      const deleteQuery = "DELETE FROM bookmark WHERE `movie_id` = ?";
      mysqlPool.query(deleteQuery, [movie_id]).then(() => {
        res.status(200).send("bookmark Removed");
      });
    })
    .catch((err) => res.status(404).send(err));
});

module.exports = router;
