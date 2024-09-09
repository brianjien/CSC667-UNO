import bcrypt from 'bcrypt';
import db from "../db/connection.js";

export async function authenticateUser(userData) {
    try {
        const query = `
            SELECT 
                username, password
            FROM 
                users 
            WHERE 
                username = $1 ;
        `;
        const result = await db.query(query, [userData.username]);
        if (result.length === 0) {
            return { success: false, error: 'Invalid username' };
        }
        const isValidPassword = await bcrypt.compare(userData.password, result[0].password);
        if (!isValidPassword) {
            return { success: false, error: 'Invalid password' };
        }
        return { success: true, user: { username: userData.username } };
    } catch (error) {
        console.error('Error during login:', error);
        return { success: false, error: 'Server error during login' };
    }
}
