const express = require("express");
const router = express.Router();
const Joi = require("joi");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

const mysqlPool = require("../database");
dotenv.config();

function validateUser(req) {
  const schema = Joi.object({
    email: Joi.string()
      .email({
        minDomainSegments: 2,
        tlds: { allow: ["com", "net"] },
      })
      .required(),
    password: Joi.string().min(3).max(30).required(),
  });

  return schema.validate(req);
}

router.use("/", (req, res) => {
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
      if (!rows.length)
        return res.status(400).send({ error: "Invalid Email or Password." });

      bcrypt.compare(req.body.password, rows[0].password).then((result) => {
        if (!result)
          return res.status(400).send({ error: "Invalid Email or Password." });

        const token = jwt.sign({ id: rows[0].id }, process.env.jwtPrivateKey);
        res.status(200).send({
          id: rows[0].id,
          username: rows[0].username,
          email: rows[0].email,
          token: token,
        });
      });
    })
    .catch((err) => res.send(err));
});

module.exports = router;
