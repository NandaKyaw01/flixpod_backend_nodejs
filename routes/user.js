const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const Joi = require("joi");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();
const mysqlPool = require("../database");

function validateUser(user) {
  const schema = Joi.object({
    username: Joi.string().min(3).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(3).max(30).required(),
  });

  return schema.validate(user);
}

router.get("/", (req, res) => {
  const q = "SELECT * from user";
  mysqlPool
    .query(q)
    .then(([rows]) => {
      res.status(200).send(rows);
    })
    .catch((err) => res.status(404).send(err));
});

// router.get("/:id", (req, res) => {
//   const userId = req.params.id;
//   const q = "SELECT * from user WHERE `id` = ?";
//   mysqlPool
//     .query(q, [userId])
//     .then(([rows]) => {
//       if (!rows.length) {
//         return res.status(404).send({
//           status: "404 not Found",
//           error: "The course with the given ID was not found.",
//         });
//       }
//       res.status(200).send(rows);
//     })
//     .catch((err) => res.status(404).send(err));
// });

router.post("/", (req, res) => {
  // Validate Error
  const { error } = validateUser(req.body);
  if (error)
    return res
      .status(400)
      .send({ status: "400 Bad request", error: error.details[0].message });

  const searchQuery = "SELECT * from user WHERE `email` = ?";
  mysqlPool
    .query(searchQuery, [req.body.email])
    .then(([rows]) => {
      if (rows.length)
        return res.status(400).send({ error: "User already registered." });

      // Create the user and return the user object
      const id = crypto.randomBytes(16).toString("hex");
      const username = req.body.username;
      const email = req.body.email;
      bcrypt.genSalt(10).then((salt) => {
        bcrypt
          .hash(req.body.password, salt)
          .then((hash) => {
            // Store hash in your password DB.
            const insertQuery =
              "insert into user (id, username, email, password) values (?, ?, ?, ?)";
            //   Add to Database and send response
            mysqlPool
              .query(insertQuery, [id, username, email, hash])
              .then(([rows]) => {
                // const token = jwt.sign({ id: id }, process.env.jwtPrivateKey);

                // res.header("x-auth-token", token).status(200).send({
                //   id: id,
                //   username: username,
                //   email: email,
                // });
                res.status(200).send({
                  status: "user created",
                });
              })
              .catch((err) => res.status(404).send(err));
          })
          .catch((err) => res.status(404).send(err));
      });
    })
    .catch((err) => res.status(404).send(err));
});

// router.put("/:id", (req, res) => {
//   // If course not found, return 404, otherwise update it

//   const userId = req.params.id;
//   // Lookup the course
//   // If not found, return 404
//   const user = user.find((c) => c.id === parseInt(userId));
//   if (!user)
//     return res.status(404).send({
//       status: "404 not Found",
//       error: "The course with the given ID was not found.",
//     });

//   // Validate before update
//   const { error } = validateUser(req.body);
//   if (error)
//     return res
//       .status(400)
//       .send({ status: "400 Bad request", error: error.details[0].message });

//   // and return the updated object.
//   user.name = req.body.name;
//   res.send(user);
// });

// router.delete("/:id", (req, res) => {
//   // If course not found, return 404, otherwise delete it
//   // and return the deleted object.

//   const userId = req.params.id;
//   // Lookup the course
//   // If not found, return 404
//   const user = user.find((c) => c.id === parseInt(userId));
//   if (!user)
//     return res.status(404).send({
//       status: "404 not Found",
//       error: "The course with the given ID was not found.",
//     });

//   // If found, delete it

//   const index = user.indexOf(user);
//   user.splice(index, 1);

//   res.send(user);
// });

module.exports = router;
