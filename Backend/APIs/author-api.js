const exp = require('express');
const authorApp = exp.Router();
const expressAsyncHandler = require('express-async-handler');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const verifyToken = require('../Middlewares/verifyToken');
require("dotenv").config();

let authorscollection;
let recipescollection;

// Get collections from the app
authorApp.use((req, res, next) => {
  authorscollection = req.app.get('authorscollection');
  recipescollection = req.app.get('recipescollection');
  next();
});

// Author registration route
authorApp.post('/author', expressAsyncHandler(async (req, res) => {
  const newUser = req.body;
  const dbuser = await authorscollection.findOne({ username: newUser.username });

  if (dbuser !== null) {
    res.send({ message: "Author existed" });
  } else {
    const hashedPassword = await bcryptjs.hash(newUser.password, 6);
    newUser.password = hashedPassword;
    await authorscollection.insertOne(newUser);
    res.send({ message: "Author created" });
  }
}));

// Author login
authorApp.post('/login', expressAsyncHandler(async (req, res) => {
  const userCred = req.body;
  const dbuser = await authorscollection.findOne({ username: userCred.username });

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
}));

// Adding new recipe by author
authorApp.post('/recipe', verifyToken, expressAsyncHandler(async (req, res) => {
  const newRecipe = req.body;
  console.log(newRecipe);
  await recipescollection.insertOne(newRecipe);
  res.send({ message: "New Recipe Added" });
}));

// Modify recipe by author
authorApp.put('/recipe', verifyToken, expressAsyncHandler(async (req, res) => {
  const modifiedRecipe = req.body;
  let result = await recipescollection.updateOne(
    { recipeId: modifiedRecipe.recipeId },
    { $set: { ...modifiedRecipe } }
  );
  let latestRecipe = await recipescollection.findOne({ recipeId: modifiedRecipe.recipeId });
  res.send({ message: "Recipe modified", recipe: latestRecipe });
}));

// Delete or restore a recipe by recipe ID
authorApp.put('/recipe/:recipeId', verifyToken, expressAsyncHandler(async (req, res) => {
  const recipeIdFromUrl = (+req.params.recipeId);
  const recipeToDelete = req.body;

  if (recipeToDelete.status === true) {
    let modifiedRec = await recipescollection.findOneAndUpdate(
      { recipeId: recipeIdFromUrl },
      { $set: { ...recipeToDelete, status: false } },
      { returnDocument: "after" }
    );
    res.send({ message: "recipe deleted", payload: modifiedRec.value.status });
  } else if (recipeToDelete.status === false) {
    let modifiedRec = await recipescollection.findOneAndUpdate(
      { recipeId: recipeIdFromUrl },
      { $set: { ...recipeToDelete, status: true } },
      { returnDocument: "after" }
    );
    res.send({ message: "recipe restored", payload: modifiedRec.value.status });
  }
}));

// Read recipes of author
authorApp.get('/recipes/:username', verifyToken, expressAsyncHandler(async (req, res) => {
  const authorName = req.params.username;
  
  console.log("Fetching recipes for author:", authorName); // Debugging statement

  const recipesList = await recipescollection.find({ username: authorName }).toArray();
  
  console.log("Recipes fetched:", recipesList); // Debugging statement

  res.send({ message: "List of recipes", payload: recipesList });
}));

// Export authorApp
module.exports = authorApp;
