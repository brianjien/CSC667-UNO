import db from "../connection.js";

export async function saveGameState(invitationCode, gameState) {
    const { deck, discardPile, players, currentPlayerIndex, direction, skipTurn, drawCardPending } = gameState;

    try {
        const roomSql = `
            SELECT player1_username, player2_username
            FROM game_room1
            WHERE invitation_codes = $1
        `;
        const roomData = await db.query(roomSql, [invitationCode]);

        if (!roomData) {
            throw new Error('Room not found');
        }

        const player1Username = roomData[0].player1_username;
        const player2Username = roomData[0].player2_username;

        const sql = `
            INSERT INTO uno_game_state1 (deck, discard_pile, player1_hand, player2_hand, current_player_index, direction, skip_turn, draw_card_pending, invitation_codes, player1_name, player2_name)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            ON CONFLICT (invitation_codes)
            DO UPDATE SET deck = $1, discard_pile = $2, player1_hand = $3, player2_hand = $4, current_player_index = $5, direction = $6, skip_turn = $7, draw_card_pending = $8, player1_name = $10, player2_name = $11
            RETURNING invitation_codes
        `;

        const values = [
            JSON.stringify(deck),
            JSON.stringify(discardPile),
            JSON.stringify(players[0].hand),
            JSON.stringify(players[1].hand),
            currentPlayerIndex,
            direction,
            skipTurn,
            drawCardPending,
            invitationCode,
            player1Username,
            player2Username
        ];

        const result = await db.query(sql, values);
        return result[0].invitation_codes;
    } catch (error) {
        console.error('Error saving game state:', error);
        throw error;
    }
}
export async function getGameState(invitationCode) {
    try {
        const roomSql = `
            SELECT player1_username, player2_username
            FROM game_room1
            WHERE invitation_codes = $1
            LIMIT 1
        `;
        const roomData = await db.query(roomSql, [invitationCode]);

        if (!roomData) {
            throw new Error('Room not found');
        }

        const player1Username = roomData[0].player1_username;
        const player2Username = roomData[0].player2_username;

        const gameStateSql = `
            SELECT *
            FROM uno_game_state1
            WHERE invitation_codes = $1
            LIMIT 1
        `;
        const gameStateData = await db.query(gameStateSql, [invitationCode]);

        if (!gameStateData.rows.length) {
            return {
                deck: [],
                discardPile: [],
                players: [
                    { id: 0, hand: [], name: player1Username },
                    { id: 1, hand: [], name: player2Username }
                ],
                currentPlayerIndex: 0,
                direction: 1,
                skipTurn: false,
                drawCardPending: false
            };
        }

        return {
            deck: JSON.parse(gameStateData[0].deck),
            discardPile: JSON.parse(gameStateData[0].discard_pile),
            players: [
                { id: 0, hand: JSON.parse(gameStateData[0].player1_hand), name: player1Username },
                { id: 1, hand: JSON.parse(gameStateData[0].player2_hand), name: player2Username }
            ],
            currentPlayerIndex: gameStateData[0].current_player_index,
            direction: gameStateData[0].direction,
            skipTurn: gameStateData[0].skip_turn,
            drawCardPending: gameStateData[0].draw_card_pending
        };
    } catch (error) {
        console.error('Error retrieving game state:', error);
        throw error;
    }
}
