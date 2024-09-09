import db from "../connection.js";

// CREATE TABLE game_room (
//     room_id SERIAL PRIMARY KEY,
//     user_id INTEGER NOT NULL,
//    
//     invitation_codes VARCHAR(6) NOT NULL,
//     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//     FOREIGN KEY (user_id) REFERENCES users(user_id) 
// );

// CREATE TABLE game_room1 (
//     room_id SERIAL PRIMARY KEY,
//     user_id INTEGER,
//     invitation_codes VARCHAR(6) UNIQUE NOT NULL,
//     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
// 	player_username TEXT[],
//     FOREIGN KEY (user_id) REFERENCES users(user_id) 
// );

export async function storeInvitationCodeAndUsername(username, invitationCode) {
    try {
        const insertOrUpdateSql = `
            INSERT INTO game_room1 (user_id, invitation_codes, player_username)
            VALUES (
                (SELECT user_id FROM users WHERE username = $1), 
                $2,
                ARRAY[(SELECT username FROM users WHERE username = $1)]::TEXT[]
            )
            ON CONFLICT (invitation_codes)
            DO UPDATE SET 
                user_id = (SELECT user_id FROM users WHERE username = $1),
                player_username = game_room1.player_username || ARRAY[(SELECT username FROM users WHERE username = $1)]::TEXT[]
            RETURNING room_id;
        `;
        const insertOrUpdateValues = [username, invitationCode];
        const { rows: insertedOrUpdateRows } = await db.query(insertOrUpdateSql, insertOrUpdateValues);
        return insertedOrUpdateRows;
    } catch (error) {
        console.error('Error storing invitation code and username:', error);
        throw error;
    }
}