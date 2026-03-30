const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  const token = req.header("Authorization");

  if (!token) {
    return res.status(401).json({ msg: "No token, denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user; // contains user.id
    next(); // pass control to the next middleware/route
  } catch (err) {
    res.status(401).json({ msg: "Token is not valid" });
  }
};
