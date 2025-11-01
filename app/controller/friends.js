import db from '../db.js'

export const addFriend = (req, res) => {
    const requester_id = req.user.id;
    const { receiver_id } = req.body;

    if (requester_id === receiver_id)
        return res.status(400).json({ message: "You cannot add yourself." });

    const sql = 'SELECT * FROM friends WHERE requester_id=? and receiver_id=?';

    db.query(sql, [requester_id, receiver_id], (err, result) => {
        if (err) return res.status(500).json({ message: "Database error" });
        if (result.length > 0)
            return res.status(400).json({ message: "Friend request already exists" });
        const inserSql = "INSERT INTO friends(requester_id,receiver_id,status) VALUES (?,?,'pending')";
        db.query(inserSql, [requester_id, receiver_id], (error) => {
            if (error) return res.status(500).json({ message: "Failed to send request" });
            res.status(200).json({ message: "Friend request sent successfully" });
        })
    })
}


export const respondFriendReq = (req, res) => {
  const { requester_id, status } = req.body;
  const receiver_id = req.user.id;

  // ✅ Validation
  if (!requester_id || !status) {
    return res.status(400).json({ error: "requester_id and status are required" });
  }

  if (!['accepted', 'rejected'].includes(status)) {
    return res.status(400).json({ error: "status must be either 'accepted' or 'rejected'" });
  }

  // ✅ Check if a pending request exists
  const checkSql = "SELECT * FROM friends WHERE requester_id = ? AND receiver_id = ? AND status = 'pending'";
  db.query(checkSql, [requester_id, receiver_id], (error, result) => {
    if (error) {
      console.error(error);
      return res.status(500).json({ message: "Database error while checking request" });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: "No pending request found" });
    }

    // ✅ Update the request
    const updateSql = "UPDATE friends SET status = ? WHERE requester_id = ? AND receiver_id = ?";
    db.query(updateSql, [status, requester_id, receiver_id], (updateErr) => {
      if (updateErr) {
        console.error(updateErr);
        return res.status(500).json({ message: "Failed to update request" });
      }

      res.status(200).json({ message: `Friend request ${status} successfully` });
    });
  });
};


export const getAllPendingRequests = (req, res) => {
    const user_id = req.user.id;
    const sql = `
        SELECT f.id, u.id AS requester_id, u.user_name, u.profilePic  FROM friends f
        JOIN user u ON f.requester_id = u.id
        WHERE f.receiver_id = ? AND f.status = 'pending'
    `;
    db.query(sql, [user_id], (err, result) => {
        if (err) return res.status(500).json({ message: "Database error" });
        if (result.length === 0) {
            return res.status(404).json({ message: "No pending requests found" });
        }
        return res.status(200).json(result);
    });
}


export const blockUser = (req, res) => {
  const { requester_id, status } = req.body;
  const receiver_id = req.user.id;

  // ✅ Validation
  if (!requester_id || !status) {
    return res.status(400).json({ error: "requester_id and status are required" });
  }

  if (!['blocked'].includes(status)) {
    return res.status(400).json({ error: "status must be  'blocked'" });
  }

  // ✅ Check if a pending request exists
  const checkSql = "SELECT * FROM friends WHERE requester_id = ? AND receiver_id = ? AND status = 'blocked'";
  db.query(checkSql, [requester_id, receiver_id], (error, result) => {
    if (error) {
      console.error(error);
      return res.status(500).json({ message: "Database error while checking request" });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: "Already blocked" });
    }

    // ✅ Update the request
    const updateSql = "UPDATE friends SET status = ? WHERE requester_id = ? AND receiver_id = ?";
    db.query(updateSql, [status, requester_id, receiver_id], (updateErr) => {
      if (updateErr) {
        console.error(updateErr);
        return res.status(500).json({ message: "Failed to update request" });
      }

      res.status(200).json({ message: `Friend request ${status} successfully` });
    });
  });
};


export const getFriendsSuggestions = (req, res) => {
    const user_id = req.user.id;
    
    const sql = `
        SELECT u.id,u.user_name,u.profilePic FROM user u 
        left JOIN friends f ON 
            ( (f.requester_id=? AND f.receiver_id = u.id) 
            OR (f.receiver_id=? AND f.requester_id = u.id) )
            
        WHERE u.id != ? AND f.id IS NULL
        LIMIT 10
    `;
    
    db.query(sql, [user_id, user_id, user_id], (err, result) => {
        if (err) return res.status(500).json({ message: "Database error" });
        
        if (result.length === 0) {
            return res.status(404).json({ message: "No suggestions found" });
        }
        
        return res.status(200).json(result);
    });
};
