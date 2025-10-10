import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  try {
    // 1️⃣ Get token from headers
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided or invalid format" });
    }

    // 2️⃣ Extract token from header
    const token = authHeader.split(" ")[1];

    // 3️⃣ Verify token
    jwt.verify(token, "your_secret_key", (err, decoded) => {
      if (err) {
        return res.status(401).json({ error: "Invalid or expired token" });
      }

      // 4️⃣ Attach decoded user info to request
      req.user = decoded;
      next(); // Move to the next middleware/route
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
