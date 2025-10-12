import db from "../db.js"

export const createConversation = (req, res) => {
    const userId = req.user.id;
    const otherUserId = req.body.otherUserId;

    // 2. Validate IDs
    if (!otherUserId || userId === otherUserId) {
        return res.status(400).json({ error: "Invalid participant ID." });
    }

    const userOneId = Math.min(userId, otherUserId);
    const userTwoId = Math.max(userId, otherUserId);

    const sql = "SELECT * FROM conversations where user_one_id=? AND user_two_id=?"
    db.query(sql, [userOneId, userTwoId], (error, result) => {
        if (error) return res.status(500).json({ error: "Database error failed to create connection" });

        if (result.length > 0) {
            const existingConversation = result[0];
            return res.status(200).json({
                message: "Conversation already exists.",
                conversationId: existingConversation.conversation_id,
                created: false
            });
        } else {
            const insertSql = `
                INSERT INTO Conversations (user_one_id, user_two_id)
                VALUES (?, ?);
            `;
            db.query(insertSql, [userOneId, userTwoId], (err, resul) => {
                if (err) return res.status(500).json({ error: "Database error failed to create connection.." });
                const newConversationId = resul.insertId;

                return res.status(201).json({
                    message: "Conversation created successfully.",
                    conversation_id: newConversationId,
                    created: true
                });
            });

        }
    })
}

export const getAllConversation = async (req, res) => {
  const userId = req.user.id;

  // Get pagination params (default: page=1, limit=10)
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  // Main SQL query with pagination
  const sql = `
    SELECT
        c.conversation_id,
        CASE
            WHEN c.user_one_id = ? THEN c.user_two_id
            ELSE c.user_one_id
        END AS user_id,
        u.user_name AS name,
        u.email AS email,
        c.last_activity_at
    FROM 
        Conversations c
    JOIN 
        user u ON u.id = (
            CASE
                WHEN c.user_one_id = ? THEN c.user_two_id
                ELSE c.user_one_id
            END
        )
    WHERE 
        c.user_one_id = ? OR c.user_two_id = ?
    ORDER BY 
        c.last_activity_at DESC
    LIMIT ? OFFSET ?;
  `;

  // Count total conversations for pagination info
  const countSql = `
    SELECT COUNT(*) AS total 
    FROM Conversations 
    WHERE user_one_id = ? OR user_two_id = ?;
  `;

  try {
    // Run both queries
    db.query(countSql, [userId, userId], (countErr, countResult) => {
      if (countErr) {
        console.error("Error counting conversations:", countErr);
        return res.status(500).json({ error: "Failed to count conversations." });
      }

      const total = countResult[0].total;
      const totalPages = Math.ceil(total / limit);

      db.query(
        sql,
        [userId, userId, userId, userId, limit, offset],
        (error, conversations) => {
          if (error) {
            console.error("Database error fetching conversations:", error);
            return res
              .status(500)
              .json({ error: "Failed to retrieve conversations." });
          }

          return res.status(200).json({
            page,
            limit,
            total,
            totalPages,
            conversations,
          });
        }
      );
    });
  } catch (err) {
    console.error("Error in getAllConversation:", err);
    return res.status(500).json({ error: "Unexpected server error." });
  }
};
