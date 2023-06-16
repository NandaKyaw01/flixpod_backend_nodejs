const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const users = require("./routes/user");
const auth = require("./routes/auth");
const bookmarks = require("./routes/bookmark");
const comments = require("./routes/comment");
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Welcome to My Api!");
});
app.use("/api/users", users);
app.use("/api/auth", auth);
app.use("/api/bookmarks", bookmarks);
app.use("/api/comments", comments);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`My API is listening on ${PORT}`);
});
