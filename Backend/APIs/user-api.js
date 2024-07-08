const exp = require("express");
const userApp = exp.Router();
const bcryptjs = require("bcryptjs");
const expressAsyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const verifyToken = require('../Middlewares/verifyToken');
require("dotenv").config();

let usercollection;
let recipescollection;

// Get collections from the app
userApp.use((req, res, next) => {
  usercollection = req.app.get("userscollection");
  recipescollection = req.app.get("recipescollection");
  next();
});

// User registration route
userApp.post(
  "/user",
  expressAsyncHandler(async (req, res) => {
    const newUser = req.body;
    const dbuser = await usercollection.findOne({ username: newUser.username });

    if (dbuser !== null) {
      res.send({ message: "User existed" });
    } else {
      const hashedPassword = await bcryptjs.hash(newUser.password, 6);
      newUser.password = hashedPassword;
      await usercollection.insertOne(newUser);
      res.send({ message: "User created" });
    }
  })
);

// User login
userApp.post(
  "/login",
  expressAsyncHandler(async (req, res) => {
    const userCred = req.body;
    const dbuser = await usercollection.findOne({ username: userCred.username });

    if (dbuser === null) {
      res.send({ message: "Invalid username" });
    } else {
      const status = await bcryptjs.compare(userCred.password, dbuser.password);

      if (status === false) {
        res.send({ message: "Invalid password" });
      } else {
        const signedToken = jwt.sign(
          { username: dbuser.username },
          process.env.SECRET_KEY,
          { expiresIn: '1d' }
        );

        res.send({
          message: "login success",
          token: signedToken,
          user: dbuser,
        });
      }
    }
  })
);

// Get recipes of all authors with filters
userApp.get(
  "/recipes", verifyToken,
  expressAsyncHandler(async (req, res) => {
    const { author, recipeType } = req.query;
    
    const query = { status: true };

    if (author) {
      query.username = author;
    }

    if (recipeType) {
      query.recipeType = recipeType;
    }

    const recipesList = await recipescollection.find(query).toArray();

    res.send({ message: "recipes", payload: recipesList });
  })
);

// Post comments for a recipe by recipe ID
userApp.post(
  "/comment/:recipeId", verifyToken,
  expressAsyncHandler(async (req, res) => {
    const userComment = req.body;
    const recipeIdFromUrl = (+req.params.recipeId);

    let result = await recipescollection.updateOne(
      { recipeId: recipeIdFromUrl },
      { $addToSet: { comments: userComment } }
    );
    console.log(result);
    res.send({ message: "Comment posted" });
  })
);

// Export userApp
module.exports = userApp;
