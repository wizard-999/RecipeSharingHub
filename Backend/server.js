// Create express app
const exp = require('express');
const app = exp();
require('dotenv').config(); // Load environment variables
const mongoClient = require('mongodb').MongoClient;
const path = require('path');
const cors = require('cors');

// Use CORS middleware to allow requests from the frontend
app.use(cors({
    origin: 'https://recipe-sharing-hub-frontend.vercel.app', // Update with your frontend URL
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
}));

// Deploy react build in this server
const staticPath = path.join(__dirname, '../client/build');
console.log(`Serving static files from ${staticPath}`);
app.use(exp.static(staticPath));

// To parse the body of requests
app.use(exp.json());

// Connect to DB
const mongoUrl = process.env.DB_URL;

mongoClient.connect(mongoUrl)
    .then(client => {
        // Get db obj
        const blogdb = client.db();
        // Get collection obj
        const userscollection = blogdb.collection('userscollections');
        const recipescollection = blogdb.collection('recipescollections');
        const authorscollection = blogdb.collection('authorscollections');
        const adminscollection = blogdb.collection('adminscollections');

        // Share collection obj with express app
        app.set('userscollection', userscollection);
        app.set('recipescollection', recipescollection);
        app.set('authorscollection', authorscollection);
        app.set('adminscollection', adminscollection);

        // Confirm db connection status
        console.log("DB connection success");
    })
    .catch(err => {
        console.log("Err in DB connection", err);
        process.exit(1);
    });

// Import API routes
const userApp = require('./APIs/user-api');
const authorApp = require('./APIs/author-api');
const adminApp = require('./APIs/admin-api');

// If path starts with user-api, send req to userApp
app.use('/user-api', userApp);
// If path starts with author-api, send req to authorApp
app.use('/author-api', authorApp);
// If path starts with admin-api, send req to adminApp
app.use('/admin-api', adminApp);

// Deals with page refresh
app.use((req, res, next) => {
    console.log(`Handling request to ${req.url}`);
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

// Express error handler
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).send({ message: "error", payload: err.message });
});

// Assign port number
const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Web server running on port ${port}`));
