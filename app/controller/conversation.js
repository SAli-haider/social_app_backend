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

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  console.log("🟡 Fetching conversations for userId:", userId);

  const sql = `
    SELECT
        c.conversation_id,
        CASE
            WHEN c.user_one_id = ? THEN c.user_two_id
            ELSE c.user_one_id
        END AS user_id,
        u.user_name AS name,
        u.email AS email,
        u.profilePic AS profilePic,
        r.chat_id AS last_message_id,
        r.message AS last_message,
        c.deleted_by_users,
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
    LEFT JOIN 
        chatrooms r 
        ON r.chat_id = c.last_message_id
        AND r.deleted_for_all = 0
        AND (
            r.deleted_by_users IS NULL 
            OR NOT JSON_CONTAINS(r.deleted_by_users, CAST(? AS JSON))
        )
    WHERE 
        (c.user_one_id = ? OR c.user_two_id = ?)
        AND (
          c.deleted_by_users IS NULL
          OR NOT JSON_CONTAINS(
              JSON_EXTRACT(c.deleted_by_users, '$[*].user_id'),
              CAST(? AS JSON)
          )
        )
    ORDER BY 
        c.last_activity_at DESC
    LIMIT ? OFFSET ?;
  `;

  const countSql = `
    SELECT COUNT(*) AS total
    FROM Conversations
    WHERE
      (user_one_id = ? OR user_two_id = ?)
      AND (
        deleted_by_users IS NULL
        OR NOT JSON_CONTAINS(
            JSON_EXTRACT(deleted_by_users, '$[*].user_id'),
            CAST(? AS JSON)
        )
      );
  `;

  console.log("🟡 Running query for userId:", userId);

  try {
    db.query(countSql, [userId, userId, userId], (countErr, countResult) => {
      if (countErr) {
        console.error("❌ Count query error:", countErr);
        return res.status(500).json({ error: "Failed to count conversations." });
      }

      const total = countResult[0].total;
      const totalPages = Math.ceil(total / limit);

      console.log("🟢 Total conversations found:", total);

      db.query(
        sql,
        [userId, userId, userId, userId, userId, userId, limit, offset],
        (error, conversations) => {
          if (error) {
            console.error("❌ Main query error:", error);
            return res.status(500).json({ error: "Failed to retrieve conversations." });
          }

          console.log("✅ Conversations fetched:", conversations.length);
          console.log("🧾 Data:", JSON.stringify(conversations, null, 2));

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
    console.error("🔥 Unexpected error:", err);
    return res.status(500).json({ error: "Unexpected server error." });
  }
};

export const deleteConversation = (req, res) => {
  const userId = req.user.id;
  const { conversation_id } = req.body;

  if (!conversation_id) {
    return res.status(400).json({ error: "conversation_id is required." });
  }

  const date = new Date().toISOString();

  // CRITICAL FIX: Use JSON_OBJECT instead of JSON.stringify
  const sql = `
    UPDATE conversations
    SET deleted_by_users = 
      CASE
        WHEN deleted_by_users IS NULL 
        THEN JSON_ARRAY(JSON_OBJECT('user_id', ?, 'deleted_at', ?))
        
        WHEN NOT JSON_CONTAINS(
          JSON_EXTRACT(deleted_by_users, '$[*].user_id'),
          CAST(? AS JSON)
        )
        THEN JSON_ARRAY_APPEND(
          deleted_by_users, 
          '$', 
          JSON_OBJECT('user_id', ?, 'deleted_at', ?)
        )
        
        ELSE deleted_by_users
      END
    WHERE conversation_id = ?;
  `;

  db.query(
    sql,
    [userId, date, userId, userId, date, conversation_id],
    (err, result) => {
      if (err) {
        console.error("❌ Error updating conversation:", err);
        return res.status(500).json({ error: "Failed to soft delete conversation." });
      }

      console.log("✅ Conversation soft deleted for user:", userId);
      return res.status(200).json({
        success: true,
        message: "Conversation soft deleted for this user.",
      });
    }
  );
};

export const deleteMessage = (req, res) => {
  const userId = req.user.id;
  const { chat_id, delete_for_all } = req.body;

  if (!chat_id) {
    return res.status(400).json({ error: "chat_id is required." });
  }

  // If delete for everyone
  if (delete_for_all === 1) {
    const sql = `
      UPDATE chatrooms 
      SET deleted_for_all = 1 
      WHERE chat_id = ?;
    `;
    
    db.query(sql, [chat_id], (err) => {
      if (err) {
        console.error("❌ Error deleting for everyone:", err);
        return res.status(500).json({ error: "Failed to delete message for everyone." });
      }
      console.log("✅ Message deleted for everyone");
      return res.status(200).json({ 
        success: true, 
        message: "Message deleted for everyone." 
      });
    });

  } else {
    // Delete only for current user - store as simple array [1, 2]
    const sqlForMe = `
      UPDATE chatrooms
      SET deleted_by_users = 
        CASE 
          WHEN deleted_by_users IS NULL 
          THEN JSON_ARRAY(?)
          
          WHEN NOT JSON_CONTAINS(deleted_by_users, CAST(? AS JSON)) 
          THEN JSON_ARRAY_APPEND(deleted_by_users, '$', ?)
          
          ELSE deleted_by_users
        END
      WHERE chat_id = ?;
    `;

    db.query(sqlForMe, [userId, userId, userId, chat_id], (err) => {
      if (err) {
        console.error("❌ Error deleting for me:", err);
        return res.status(500).json({ error: "Failed to hide message for you." });
      }
      console.log("✅ Message hidden for user:", userId);
      return res.status(200).json({ 
        success: true, 
        message: "Message hidden for you only." 
      });
    });
  }
};



export const getAllMessage = (req, res) => {
  const userId = req.user.id; // numeric userId
  const conversation_id = req.query.conversation_id;

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const sql = `
    SELECT chat_id, conversation_id, message, message_type, sender_id, created_at 
    FROM chatrooms
    WHERE conversation_id = ? 
      AND (deleted_for_all = 0 OR deleted_for_all IS NULL)
      AND (
        deleted_by_users IS NULL 
        OR NOT JSON_CONTAINS(deleted_by_users, ?)
      )
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?;
  `;

  db.query(sql, [conversation_id, JSON.stringify(userId), limit, offset], (error, messages) => {
    if (error) {
      console.error("Database error fetching messages:", error);
      return res.status(500).json({ error: "Failed to retrieve messages." });
    }

    const countSql = `
      SELECT COUNT(*) AS total 
      FROM chatrooms 
      WHERE conversation_id = ?
        AND (deleted_for_all = 0 OR deleted_for_all IS NULL)
        AND (
          deleted_by_users IS NULL 
          OR NOT JSON_CONTAINS(deleted_by_users, ?)
        );
    `;

    db.query(countSql, [conversation_id, JSON.stringify(userId)], (countErr, countResult) => {
      if (countErr) {
        console.error("Error counting messages:", countErr);
        return res.status(500).json({ error: "Failed to count messages." });
      }

      const total = countResult[0].total;
      const totalPages = Math.ceil(total / limit);

      return res.status(200).json({
        success: true,
        page,
        limit,
        total,
        totalPages,
        messages,
      });
    });
  });
};

export const sendMessage = (req, res) => {
  const userId = req.user.id;
  const { conversation_id, message, message_type } = req.body;


  if (!conversation_id || !message ) {
    return res.status(400).json({ error: "Missing required fields." });
  }



  // 1️⃣ Insert the new message
  const insertMessageSql = `
    INSERT INTO chatrooms (conversation_id, sender_id, message, message_type)
    VALUES (?, ?, ?, ?)
  `;

  db.query(insertMessageSql, [conversation_id, userId, message, message_type], (error, result) => {
    if (error) {
      console.error("Database error sending message:", error);
      return res.status(500).json({ error: "Failed to send message." });
    }

    const message_id = result.insertId;

    // 2️⃣ Fetch the newly inserted message
    const getMessageSql = `SELECT * FROM chatrooms WHERE chat_id = ?`;
    db.query(getMessageSql, [message_id], (err, messageResult) => {
      if (err) {
        console.error("Database error fetching message:", err);
        return res.status(500).json({ error: "Failed to fetch message." });
      }

      const messageData = messageResult[0];
      const lastMessageId = messageData.chat_id;

      // 3️⃣ Update the conversation’s last_message_id and last_activity_at
      const updateConversationSql = `
        UPDATE Conversations
        SET last_message_id = ?, last_activity_at = NOW()
        WHERE conversation_id = ?
      `;

      db.query(updateConversationSql, [lastMessageId, conversation_id], (updateErr) => {
        if (updateErr) {
          console.error("Database error updating conversation:", updateErr);
          return res.status(500).json({ error: "Failed to update conversation." });
        }

        // 4️⃣ Everything done — send success response
        return res.status(201).json({
          success: true,
          message: "Message sent successfully.",
          data: messageData,
        });
      });
    });
  });
};



