import db from "../db.js"

export const getPostComments = (req, res) => {
    const postId = req.query.postId;
    
    // ⭐ NEW: Get pagination parameters from query, default to page 1 and limit 10
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    if (!postId) {
        return res.status(400).json({ error: "PostId is missing" });
    }

    // ⭐ STEP 1: SQL to fetch all comments and replies for the given postId.
    // We must fetch all to ensure all replies are available for threading.
    const sql = `
      SELECT 
        c.*, 
        u.user_name, 
        u.profilePic 
      FROM 
        comments c 
      JOIN 
        user u ON c.commentUserId = u.id 
      WHERE 
        c.commentPostId = ? 
      ORDER BY 
        c.created_at ASC; 
    `;

    db.query(sql, [postId], (error, result) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ error: "Failed to fetch comments" });
        }

        // ⭐ STEP 2: Transform the flat array into a threaded structure
        const commentsMap = {};
        const allThreadedComments = []; // This array will hold ALL top-level comments

        // 1. Create a map and initialize a 'replies' array for every comment
        result.forEach(comment => {
            // Ensure comment has a valid ID for mapping
            if (comment.id) {
                commentsMap[comment.id] = { ...comment, replies: [] };
            }
        });

        // 2. Iterate through the map to build the tree
        for (const commentId in commentsMap) {
            const comment = commentsMap[commentId];
            
            // 🐛 FIX APPLIED HERE: Using the correct property name: 'parentCommentId'
            const parentId = comment.parentCommentId;
            
            // Check if it's a reply (has a parentCommentId) AND if the parent exists in the map
            if (parentId !== null && parentId !== undefined && commentsMap[parentId]) {
                
                // Attach the reply to its parent's replies array
                commentsMap[parentId].replies.push(comment);
            } else {
                // If parentCommentId is NULL or doesn't exist, it's a top-level comment
                allThreadedComments.push(comment);
            }
        }

        // ⭐ STEP 3: Apply pagination to the top-level comments array
        const totalComments = allThreadedComments.length;
        // Use slice() to get only the comments for the current page
        const paginatedComments = allThreadedComments.slice(offset, offset + limit);

        res.status(200).json({ 
            message: "successful!",
            // Add pagination metadata
            totalComments: totalComments, // Total number of top-level comments across all pages
            currentPage: page,
            limit: limit,
            totalPages: Math.ceil(totalComments / limit),
            data: paginatedComments // Only the limited set of top-level comments + their replies
        });
    });
};






export const createComment = (req, res) => {
    const userId = req.user.id;
    const { postId, comment } = req.body;

    if (!comment && !postId) {
        return res.status(400).json({ error: "comment cant be empty" });
    }

    const sql = "INSERT INTO comments (comment,commentPostId,commentUserId,created_at) VALUES (?,?,?,?)"
    const createdAt = new Date();

    db.query(sql, [comment, postId, userId, createdAt], (error, result) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ error: "Failed create comments" });
        }
        const commentId = result.insertId;

        const filterCommentSql = "SELECT c.*,u.profilePic,user_name FROM comments c JOIN user u ON c.commentUserId=u.id WHERE c.id=?"

        db.query(filterCommentSql, [commentId], (commentError, commentResult) => {
            if (commentError) {
                console.error(commentError);
                return res.status(500).json({ error: "Failed create comments" });
            }
            res.status(201).json(
                {
                    message: "Post created successfully!",
                    data: commentResult[0]
                }
            )
        })

    })
}



export const commentReply = (req, res) => {
    const userId = req.user.id;
    const { postId, comment,parentCommentId } = req.body;

    if (!comment && !postId && !parentCommentId) {
        return res.status(400).json({ error: "comment or parentCommentId cant be null" });
    }

    const sql = "INSERT INTO comments (comment,commentPostId,commentUserId,created_at,parentCommentId) VALUES (?,?,?,?,?)"
    const createdAt = new Date();

    db.query(sql, [comment, postId, userId, createdAt,parentCommentId], (error, result) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ error: "Failed create comments" });
        }
        const commentId = result.insertId;

        const filterCommentSql = "SELECT c.*,u.profilePic,user_name FROM comments c JOIN user u ON c.commentUserId=u.id WHERE c.id=? AND c.parentCommentId=?"

        db.query(filterCommentSql, [commentId,parentCommentId], (commentError, commentResult) => {
            if (commentError) {
                console.error(commentError);
                return res.status(500).json({ error: "Failed create comments" });
            }
            res.status(201).json(
                {
                    message: "Post created successfully!",
                    data: commentResult[0]
                }
            )
        })

    })
}

export const deleteComment = (req, res) => {
    const userId = req.user.id;
    const { postId, commentId } = req.body;
    if (!postId && !commentId) {
        return res.status(404).json({ error: "postId or commentId not found" });
    }

    const filterSqlBeforeDelte = "SELECT * FROM comments WHERE id=? AND commentPostId=? AND commentUserId=?";

    db.query(filterSqlBeforeDelte, [commentId, postId, userId], (err, filterResult) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Failed delete post" });
        }
        if (filterResult.length > 0) {
            const sql = 'DELETE FROM comments where id=? AND commentPostId=? AND commentUserId=?'
            db.query(sql, [commentId, postId, userId], (error, result) => {
                if (error) {
                    console.error(error);
                    return res.status(500).json({ error: "Failed delete post" });
                }

                res.status(200).json({
                    'message': "Your comment deleted sucessfully"
                })
            })
        } else {
            res.status(404).json({
                'message': "You're not authorized to delete this comment or the comment ID/Post ID is incorrect"
            })
        }
    })
}