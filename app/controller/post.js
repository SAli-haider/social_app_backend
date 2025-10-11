import db from "../db.js"

export const createPost = (req, res) => {
    const userId = req.user.id;
    const { descrption, image,privacy } = req.body;
    const createdAt = new Date();

    if (!descrption && !image) {
        return res.status(400).json({ error: "Post must have content or image" });
    }
    const sql = "INSERT INTO post (descrption,image,likes,comments,userId,created_at,privacy) VALUES(?,?,?,?,?,?,?)";

    db.query(sql, [descrption || null, image || null, 0, 0, userId, createdAt,privacy||"public"], (error, result) => {
        if (error) return res.status(500).json({ error: "failed to creat post" })
        res.status(201).json({
            message: "Post created successfully!",
        });
    })
}

export const deletePost = (req,res)=>{
  const {postId} = req.body;

  if(!postId){
    return res.status(404).json({ error: "postId not found" });
  }

  const sql = 'DELETE FROM post where id=?'
  db.query(sql,[postId],(error,result)=>{
    if (error) {
                console.error(error);
                return res.status(500).json({ error: "Failed delete post" });
            }
            res.status(200).json({
              'message':"Your post delete sucessfully"
            })
  })
}

export const getMyPosts = (req, res) => {
    const userId = req.user.id;

    // Pagination setup
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // SQL query without duplicate columns
    const sql = `
  SELECT 
    p.*,
    (SELECT COUNT(*) FROM likes WHERE likePostId = p.id) AS likes,
    (SELECT COUNT(*) FROM comments WHERE commentPostId = p.id) AS comments,
    EXISTS(
      SELECT 1 FROM likes 
      WHERE likePostId = p.id AND likeUserId = ?
    ) AS isLiked
  FROM post p
  WHERE p.userId = ?
  ORDER BY p.created_at DESC
  LIMIT ? OFFSET ?
`;

    db.query(sql, [userId,userId, limit, offset], (error, posts) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ error: "Failed to fetch posts" });
        }

        // Count total posts
        const countSql = "SELECT COUNT(*) AS total FROM post WHERE userId = ?";
        db.query(countSql, [userId], (countError, countResult) => {
            if (countError) {
                console.error(countError);
                return res.status(500).json({ error: "Failed to count posts" });
            }

            const totalPosts = countResult[0].total;
            const totalPages = Math.ceil(totalPosts / limit);

            res.status(200).json({
                message: "Posts fetched successfully!",
                currentPage: page,
                totalPages,
                totalPosts,
                posts,
            });
        });
    });
};



export const getAllPost = (req, res) => {
  const userId = req.user.id;

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const sql = `
    SELECT 
      p.*,
      (SELECT COUNT(*) FROM likes WHERE likePostId = p.id) AS likes,
      (SELECT COUNT(*) FROM comments WHERE commentPostId = p.id) AS comments,
      EXISTS(
        SELECT 1 FROM likes WHERE likePostId = p.id AND likeUserId = ?
      ) AS isLiked
    FROM post p
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
  `;

  db.query(sql, [userId, limit, offset], (error, posts) => {
    if (error) {
      console.error("SQL Error:", error);
      return res.status(500).json({ error: "Failed to fetch posts" });
    }

    const countSql = "SELECT COUNT(*) AS total FROM post";
    db.query(countSql, (countError, countResult) => {
      if (countError) {
        console.error(countError);
        return res.status(500).json({ error: "Failed to count posts" });
      }

      const totalPosts = countResult[0].total;
      const totalPages = Math.ceil(totalPosts / limit);

      res.status(200).json({
        message: "All posts fetched successfully!",
        currentPage: page,
        totalPages,
        totalPosts,
        posts,
      });
    });
  });
};



