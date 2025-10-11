import db from "../db.js"

export const toggleLike = (req, res) => {
    const userId = req.user.id;
    const { postId } = req.body;

    if (!postId) {
        return res.status(400).json({ error: "postId is required" });
    }

    // 1️⃣ Check if the user already liked this post
    const checkSql = "SELECT * FROM likes WHERE likePostId = ? AND likeUserId = ?";
    db.query(checkSql, [postId, userId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Database error during like check." });
        }

        if (result.length > 0) {
            // 2️⃣ User already liked → remove the like
            const deleteSql = "DELETE FROM likes WHERE likePostId = ? AND likeUserId = ?";
            db.query(deleteSql, [postId, userId], (delErr) => {
                if (delErr) {
                    console.error(delErr);
                    return res.status(500).json({ error: "Failed to remove like." });
                }
                return res.status(200).json({ message: "Like removed" });
            });
        } else {
            // 3️⃣ User has not liked → add like
            const insertSql = "INSERT INTO likes (likePostId, likeUserId) VALUES (?, ?)";
            db.query(insertSql, [postId, userId], (insErr) => {
                if (insErr) {
                    console.error(insErr);
                    return res.status(500).json({ error: "Failed to add like due to database error." });
                }
                return res.status(201).json({ message: "Post liked" });
            });
        }
    });
};

export const getPostLikes = (req, res) => {
    const userId = req.user.id;
    const postId = req.query.postId;

    const sql = "SELECT lik.*,u.user_name,u.profilePic,(SELECT COUNT(*) FROM likes WHERE likePostId=?) AS totalLikes FROM likes lik JOIN user u ON lik.likeUserId=u.id WHERE lik.likePostId=?"

    db.query(sql, [postId, postId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Database error during get likes" });
        }
        if(result.length === 0){
           res.status(200).json({
            data: []
        }) 
        }
        res.status(200).json({
            data: result
        })

    })
}