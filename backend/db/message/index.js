import db from "../connection.js";
export async function saveMessage(message) {
    try {
        const { username, content } = message;
        const created_at = new Date().toISOString();
        
        const query = `
            INSERT INTO public.message (username, content, created_at)
            VALUES ($1, $2, $3)
        `;
        
        await db.query(query, [username, content, created_at]);
    } catch (error) {
        console.error('Error saving message:', error);
        throw error;
    }
}

export async function getMessages() {
    try {
        const query = 'SELECT * FROM public.message';
        const result = await db.query(query);
        return result;
    } catch (error) {
        console.error('Error fetching messages from the database:', error);
        throw error;
    }
}

function formatTimestamp(timestamp) {
    return new Date(timestamp).toLocaleString('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    });
}
