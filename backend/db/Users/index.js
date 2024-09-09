import bcrypt from 'bcrypt';

import db from "../connection.js";

export async function registerUser(userData) {
    try {
        const hashedPassword = await bcrypt.hash(userData.password, 10);

        const query = `
            INSERT INTO users (username, password, email, firstname, lastname)
            VALUES ($1, $2, $3, $4, $5)
        `;
        await db.query(query, [
            userData.username,
            hashedPassword,
            userData.email,
            userData.firstname,
            userData.lastname
        ]);
        return { success: true };
    } catch (error) {
        console.error('Error registering user:', error);
        return { success: false, error: error.message };
    }
}
export async function getUsernamesByInvitationCode(invitationCode) {
    const query = 'SELECT player1_username, player2_username FROM game_room1 WHERE invitation_codes = $1';
    const result = await db.query(query, [invitationCode]);
    if (result) {
        const { player1_username, player2_username } = result[0];
        return [player1_username, player2_username];
    } else {
        throw new Error('No players found for this invitation code');
    }
}