import express from "express";
import path from "path";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
const app = express();
mongoose
  .connect("mongodb://localhost:27017", {
    dbName: "backend",
  })
  .then(() => console.log("db connented "))
  .catch((e) => console.log(e));
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
});
const User = mongoose.model("user", userSchema);

// use middlwares
app.use(express.static(path.join(path.resolve(), "public")));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
//settings for view engine
app.set("view engine", "ejs");

const isAuthenticated = async (req, res, next) => {
  const { token } = req.cookies;
  if (token) {
    const decoded = jwt.verify(token, "saaawqeqweqqqq");
    console.log(decoded);
    req.user = await User.findById(decoded._id);
    next();
  } else {
    res.render("login");
  }
};

app.get("/", isAuthenticated, (req, res) => {
  console.log(req.user);
  res.render("logout", { name: req.user.name });
});

app.get("/register", (req, res) => {
  // console.log(req.user);
  res.render("register");
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  let user = await User.findOne({ email });

  if (!user) return res.redirect("/register");

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch)
    return res.render("login", { email, message: "Incorrect Password" });

  const token = jwt.sign({ _id: user._id }, "saaawqeqweqqqq");
  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 1000),
  });
  res.redirect("/");
});

app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  let user = await User.findOne({ email });
  if (user) {
    return res.redirect("/login");
  }
  const hashedpassword = await bcrypt.hash(password, 10);
  user = await User.create({ name, email, password: hashedpassword });
  console.log(req.body);

  const token = jwt.sign({ _id: user._id }, "saaawqeqweqqqq");
  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 1000),
  });
  res.redirect("/");
});
app.get("/logout", (req, res) => {
  res.cookie("token", null, {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  res.redirect("/");
});

// api well created with this example
app.get("/success", (req, res) => {
  res.render("success");
});

// routes well created with this example
// app.post("/contact", async (req, res) => {
//   await Message.create({ name: req.body.name, email: req.body.email });
//   res.redirect("/success");
// });

// app.get("/users", (req, res) => {
//   res.json({
//     users,
//   });
// });

app.listen(5000, () => {
  console.log("Serving");
});
