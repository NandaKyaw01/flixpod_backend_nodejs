const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const Joi = require("joi");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();
const mysqlPool = require("../database");
const auth = require("../middlewares/auth");

function validateUser(req) {
  const schema = Joi.object({
    movie_id: Joi.string().required(),
    comment_text: Joi.string().required(),
    parent_comment_id: Joi.string().allow(null),
  });

  return schema.validate(req);
}

router.get("/:movie_id", (req, res) => {
  const q = "SELECT * from movie_comment WHERE `movie_id` = ?";
  mysqlPool
    .query(q, [req.params.movie_id])
    .then(([rows]) => {
      res.status(200).send(rows);
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

  // Create comment and return the comment object
  const id = crypto.randomBytes(16).toString("hex");
  const user_id = req.user.id;
  const movie_id = req.body.movie_id;
  const comment_text = req.body.comment_text;
  const current_date = Date.now();
  const created_date = new Date(current_date);
  const parent_comment_id = req.body.parent_comment_id;

  const searchQuery = "SELECT username FROM user WHERE `id` = ?";
  mysqlPool
    .query(searchQuery, [user_id])
    .then(([rows]) => {
      const insertQuery =
        "insert into movie_comment (id, user_id, movie_id, username, comment_text, created_date, parent_comment_id) values (?, ?, ?, ?, ?, ?, ?)";
      // Add to Database and send response
      mysqlPool
        .query(insertQuery, [
          id,
          user_id,
          movie_id,
          rows[0].username,
          comment_text,
          created_date,
          parent_comment_id,
        ])
        .then(() => {
          const sq = "SELECT * FROM movie_comment WHERE `id` = ?";
          mysqlPool.query(sq, [id]).then(([rows]) => {
            res.status(200).send(rows[0]);
          });
        })
        .catch((err) => res.status(404).send(err));
    })
    .catch((err) => res.status(404).send(err));
});

router.put("/", auth, (req, res) => {
  // If course not found, return 404, otherwise update it

  const comment_id = req.body.id;
  const comment_text = req.body.comment_text;
  // Lookup the movie
  // If not found, return 404
  const searchQuery = "SELECT * FROM movie_comment WHERE `id` = ?";
  mysqlPool
    .query(searchQuery, [comment_id])
    .then(([rows]) => {
      if (!rows.length)
        return res.status(400).send({ error: "Comment Not Found." });

      // If found, Detele it
      const updateQuery =
        "UPDATE movie_comment SET `comment_text` = ? WHERE `id` = ?";
      mysqlPool.query(updateQuery, [comment_text, comment_id]).then((rows) => {
        res.status(200).send(rows);
      });
    })
    .catch((err) => res.status(404).send(err));
});

router.delete("/:comment_id", auth, (req, res) => {
  // If course not found, return 404, otherwise delete it
  // and return the deleted object.

  const comment_id = req.params.comment_id;
  // Lookup the movie
  // If not found, return 404
  const searchQuery = "SELECT * FROM movie_comment WHERE `id` = ?";
  mysqlPool
    .query(searchQuery, [comment_id])
    .then(([rows]) => {
      if (!rows.length)
        return res.status(400).send({ error: "Comment Not Found." });

      // If found, Detele it
      const deleteQuery = "DELETE FROM movie_comment WHERE `id` = ?";
      mysqlPool.query(deleteQuery, [comment_id]).then(() => {
        res.status(200).send("Comment Deleted");
      });
    })
    .catch((err) => res.status(404).send(err));
});

module.exports = router;
