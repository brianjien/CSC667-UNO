// CREATE TABLE uno_game_state (
//     game_id INT AUTO_INCREMENT PRIMARY KEY,
//     deck TEXT,
//     discard_pile TEXT,
//     players TEXT,
//     current_player_index INT,
//     direction INT,
//     skip_turn BOOLEAN,
//     draw_card_pending BOOLEAN
// );
import db from "../connection.js";

export async function saveGameState(gameState) {
    try {
        const {
            deck,
            discardPile,
            players,
            currentPlayerIndex,
            direction,
            skipTurn,
            drawCardPending
        } = gameState;

        const query = 'INSERT INTO uno_game_state (deck, discard_pile, players, current_player_index, direction, skip_turn, draw_card_pending) VALUES (?, ?, ?, ?, ?, ?, ?)';
        const values = [JSON.stringify(deck), JSON.stringify(discardPile), JSON.stringify(players), currentPlayerIndex, direction, skipTurn, drawCardPending];

        const result = await db.query(query, values);
        return result.insertId;
    } catch (error) {
        console.error('Error saving game state:', error);
        throw error;
    }
}

export async function getGameState(gameId) {
    try {
        const query = 'SELECT * FROM uno_game_state WHERE game_id = ?';
        const results = await db.query(query, [gameId]);

        if (results.length === 0) {
            throw new Error('Game state not found');
        } else {
            const gameState = {
                deck: JSON.parse(results[0].deck),
                discardPile: JSON.parse(results[0].discard_pile),
                players: JSON.parse(results[0].players),
                currentPlayerIndex: results[0].current_player_index,
                direction: results[0].direction,
                skipTurn: results[0].skip_turn,
                drawCardPending: results[0].draw_card_pending
            };
            return gameState;
        }
    } catch (error) {
        console.error('Error getting game state:', error);
        throw error;
    }
}
