// controller/auth.js
import db from "../db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const registerUser = async (req, res) => {
  try {
    const { user_name, email, password, profilePic } = req.body;

    if (!user_name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required" });
    }

    const checkSql = "SELECT * FROM user WHERE email = ?";
    db.query(checkSql, [email], async (err, result) => {
      if (err) return res.status(500).json({ error: err.message });

      if (result.length > 0) {
        return res.status(400).json({ error: "User already exists with this email" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const insertSql =
        "INSERT INTO user (user_name, email, password, profilePic) VALUES (?, ?, ?, ?)";
      db.query(insertSql, [user_name, email, hashedPassword, profilePic || null], (err2) => {
        if (err2) return res.status(500).json({ error: err2.message });
        res.status(201).json({ message: "User registered successfully!" });
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const loginUser = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: "Email and password are required" });

  const sql = "SELECT * FROM user WHERE email = ?";
  db.query(sql, [email], async (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.length === 0)
      return res.status(400).json({ error: "Invalid email or password" });

    const user = result[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Invalid email or password" });

    // generate token (optional)
    const token = jwt.sign({ id: user.id, email: user.email }, "your_secret_key", {
      expiresIn: "1h",
    });

    res.json({ message: "Login successful", token });
  });
};
