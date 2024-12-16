const jwt = require("jsonwebtoken")


module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch(err) {
    res.status(401).json({message: "Auth failed!"});
  }
}