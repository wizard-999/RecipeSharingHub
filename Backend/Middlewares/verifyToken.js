const jwt = require('jsonwebtoken');
require('dotenv').config();

function verifyToken(req, res, next) {
  // Get bearer token from headers of request
  const bearerToken = req.headers.authorization;
  
  // If bearer token is not available
  if (!bearerToken) {
    return res.status(401).send({ message: "Unauthorized access. Please login to continue" });
  }
  
  // Split the bearer token
  const parts = bearerToken.split(' ');
  
  // Check if token is formatted correctly
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).send({ message: "Malformed token. Please login again" });
  }

  // Extract token from bearer token
  const token = parts[1];
  
  // Verify the token
  jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Invalid token. Please login again" });
    }
    
    req.user = decoded; // Attach the decoded token data to the request object
    next();
  });
}

module.exports = verifyToken;
