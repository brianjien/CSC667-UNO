import db from '../connection.js';

export async function checkInvitationCode(invitationCode) {
    try {
        const query = 'SELECT * FROM game_room1 WHERE invitation_codes = $1';
        const result = await db.query(query, [invitationCode]);
        return result;
    } catch (error) {
        console.error('Error checking invitation code:', error);
        throw error;
    }
}

export async function getJoinedRooms(username) {
    try {
        const query = `
            SELECT invitation_codes 
            FROM game_room1
            WHERE player1_username = $1 OR player2_username = $1 OR $1 = ANY(player_username);
        `;
        const result = await db.query(query, [username]);
        if (result) {
            return result.map(row => row.invitation_codes);
        } else {
            return [];
        }
    } catch (error) {
        console.error('Error fetching joined rooms:', error);
        throw error;
    }
}

export async function saveInvitationCodeAndUsernames(userId, invitationCode, player1Username, player2Username) {
    try {
        const query = 'UPDATE game_room1 SET user_id = $1, player1_username = $3, player2_username = $4, player_username = ARRAY[$3, $4] WHERE invitation_codes = $2 RETURNING *';
        const result = await db.query(query, [userId, invitationCode, player1Username, player2Username]);
        return result[0];
    } catch (error) {
        console.error('Error saving invitation code and usernames:', error);
        throw error;
    }
}

export async function updatePlayerUsername(invitationCode, username) {
    try {
        const checkQuery = 'SELECT player1_username, player2_username, player_username FROM game_room1 WHERE invitation_codes = $1';
        const checkResult = await db.query(checkQuery, [invitationCode]);

        if (checkResult) {
            const { player1_username, player2_username, player_username } = checkResult[0];
            if (!player1_username) {
                const updateQuery = 'UPDATE game_room1 SET player1_username = $1, player_username = array_append(player_username, $1) WHERE invitation_codes = $2 RETURNING *';
                const result = await db.query(updateQuery, [username, invitationCode]);
                return result[0];
            } else if (!player2_username) {
                const updateQuery = 'UPDATE game_room1 SET player2_username = $1, player_username = array_append(player_username, $1) WHERE invitation_codes = $2 RETURNING *';
                const result = await db.query(updateQuery, [username, invitationCode]);
                return result[0];
            } else if (!player_username.includes(username)) {
                const updateQuery = 'UPDATE game_room1 SET player_username = array_append(player_username, $1) WHERE invitation_codes = $2 RETURNING *';
                const result = await db.query(updateQuery, [username, invitationCode]);
                return result[0];
            } else {
                return checkResult[0];
            }
        } else {
            throw new Error('Invitation code not found');
        }
    } catch (error) {
        console.error('Error updating player_username:', error);
        throw error;
    }
}

export async function getGameRoom(invitationCode) {
    try {
        const result = await db.query('SELECT * FROM game_room1 WHERE invitation_codes = $1', [invitationCode]);
        if (result) {
            return result[0];
        } else {
            throw new Error('Room not found');
        }
    } catch (error) {
        console.error('Error fetching game room:', error);
        throw error;
    }
}

export async function getRoomStatus(invitationCode) {
    try {
        const exists = await checkInvitationCode(invitationCode);
        if (exists) {
            return await fetchRoomStatusFromDatabase(invitationCode);
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error getting room status:', error);
        throw error;
    }
}

export async function fetchRoomStatusFromDatabase(invitationCode) {
    try {
        const query = 'SELECT player1_username as player1Name, player2_username as player2Name FROM game_room1 WHERE invitation_codes = $1';
        const result = await db.query(query, [invitationCode]);
        if (result) {
            return result[0];
        } else {
            throw new Error('Room not found');
        }
    } catch (error) {
        console.error('Error fetching room status from database:', error);
        throw error;
    }
}

export async function getPlayer1NameFromDatabase(invitationCode) {
    try {
        const result = await db.query('SELECT player1_username FROM game_room1 WHERE invitation_codes = $1', [invitationCode]);
        if (result) {
            return result[0].player1_username; 
        } else {
            return 'Unknown'; 
        }
    } catch (error) {
        console.error('Error fetching player1 name from database:', error);
        throw error;
    }
}
