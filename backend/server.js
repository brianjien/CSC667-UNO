import express from 'express';
import { createServer } from 'http';
import * as routes from "./routes/index.js";
import path from 'path';
import { Server } from 'socket.io';
import bodyParser from 'body-parser';
import session from 'express-session';
import db from './db/connection.js';
import morgan from 'morgan';
import "dotenv/config.js";
import { registerUser } from './db/Users/index.js';
import { authenticateUser } from './routes/authentication.js';
import { saveMessage, getMessages } from './db/message/index.js';
import { render } from 'ejs';
import isLoggedIn from './middleware/IsLoggedIn.js';
import flashMiddleware from './middleware/flashMiddleware.js';
import { saveGameState, getGameState } from './db/game/getGamestate.js';
import { checkInvitationCode, getGameRoom, saveInvitationCodeAndUsernames, updatePlayerUsername, fetchRoomStatusFromDatabase, getJoinedRooms } from './db/room/joinRoom.js';
import flash from 'express-flash';
import { storeInvitationCodeAndUsername } from './db/room/index.js';
import { getUsernamesByInvitationCode } from './db/Users/index.js';

const app = express();
const PORT = 3001;
const server = createServer(app);
const __dirname = path.dirname(new URL(import.meta.url).pathname);
const frontendDir = path.join(__dirname, '..', 'frontend');
const nodeModulesDir = path.join(__dirname, '..', 'node_modules');
let gameRooms = {};

app.use(express.static('public'));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(morgan('dev'));
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
}));
app.use(express.static(path.join(__dirname, 'static')));
app.use(express.static(frontendDir));
app.use(express.static(nodeModulesDir));
app.use('/node_modules', express.static(path.join(__dirname, '..', 'node_modules')));

app.use(flash());
app.use(flashMiddleware);

app.get('/', (req, res) => {
    const username = req.session.username;
    res.render('lobby/index', { username });
});

app.get('/api/user_rooms', async (req, res) => {
    const username = req.session.username;
    if (!username) {
        return res.status(400).json({ error: 'Username is required' });
    }

    try {
        const rooms = await getJoinedRooms(username);
        res.json(rooms);
    } catch (error) {
        console.error('Error fetching user rooms:', error);
        res.status(500).json({ error: 'Failed to fetch user rooms' });
    }
});

app.post('/create_room', async (req, res) => {
    try {
        const username = req.session.username;
        const user = await db.query('SELECT user_id FROM users WHERE username = $1', [username]);
        const userId = user.user_id;
        const invitationCode = generateInvitationCode();

        const existingRoom = await db.query('SELECT * FROM game_room WHERE invitation_codes = $1', [invitationCode]);

        if (existingRoom.length > 0) {
            await updatePlayerUsername(invitationCode, username);
            res.status(200).json({ success: true, invitationCode });
        } else {
            await saveInvitationCodeAndUsernames(userId, invitationCode, username, null);
            res.status(200).json({ success: true, invitationCode });
        }
    } catch (error) {
        console.error('Error creating room:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/get_room_details', async (req, res) => {
    const invitationCode = req.query.invitationCode;

    try {
        const roomDetails = await fetchRoomStatusFromDatabase(invitationCode);
        res.json(roomDetails);
    } catch (error) {
        console.error('Error fetching room details:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/join_room', async (req, res) => {
    try {
        const { invitationCode } = req.body;

        if (!invitationCode) {
            return res.status(400).json({ success: false, message: 'Invitation code is required' });
        }

        const room = await getGameRoom(invitationCode);

        if (room) {
            const currentPlayer = {
                username: req.session.username,
            };

            if (!Array.isArray(room.player_username)) {
                room.player_username = [];
            }

            room.player_username.push(currentPlayer);
            res.status(200).json({ success: true, room });
        } else {
            res.status(404).json({ success: false, message: 'Room not found' });
        }
    } catch (error) {
        console.error('Error joining room:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/update_username', async (req, res) => {
    try {
        const username = req.session.username;
        const { playerNumber, invitationCode } = req.body;
        await updatePlayerUsername(invitationCode, username);
        res.status(200).json({ success: true, message: 'Username updated successfully' });
    } catch (error) {
        console.error('Error updating username:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

function generateInvitationCode(length = 6) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let invitationCode = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        invitationCode += characters[randomIndex];
    }
    return invitationCode;
}

app.get('/game_room/:invitationCode', async (req, res) => {
    try {
        const invitationCode = req.params.invitationCode;
        const username = req.session.username;
        if (!username) {
            res.status(404).send('Username not found');
            return;
        }
        if (invitationCode !== '') {
            res.render('room', { invitationCode, username });
        } else {
            res.status(404).send('Invitation code not found');
        }
    } catch (error) {
        console.error('Error handling game room route:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/post_invitation_code', async (req, res) => {
    const { invitationCode } = req.body;
    const username = req.session.username;
    await storeInvitationCodeAndUsername(username, invitationCode);
    res.status(200).json({ success: true });
});

app.get('/checkInvitationCode', async (req, res) => {
    const { invitationCode } = req.query;

    try {
        const result = await checkInvitationCode(invitationCode);
        res.send(result);
    } catch (error) {
        console.error('Error validating invitation code:', error);
        res.status(500).json({ success: false, message: 'An error occurred while validating the invitation code.' });
    }
});

app.get('/game', (req, res) => {
    const invitationCode = req.query.invitationCode;
    res.render('game/index', { invitationCode: invitationCode });
});

app.post('/api/messages', async (req, res) => {
    try {
        const message = req.body;
        const result = await saveMessage(message);
        res.json(result);
    } catch (error) {
        console.error('Error saving message:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/game_room', isLoggedIn, async (req, res) => {
    const username = req.session.username;
    const invitationCode = req.query.invitationCode;
    res.render('room/index', { username, invitationCode });
});

app.get('/messages', async (req, res) => {
    try {
        const messages = await getMessages();
        res.json(messages);
    } catch (error) {
        console.error('Error fetching messages from the database:', error);
        throw error;
    }
});

app.use("/api", routes.api);
app.use("/chat", routes.chat);
app.use("/game", routes.game);

app.get('/registration', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'registration.html'));
});

app.post('/register', async (req, res) => {
    try {
        const userData = req.body;
        const result = await registerUser(userData);
        if (result.success) {
            req.session.username = userData.username;
            res.redirect('/');
        } else {
            res.status(500).send('Error registering user: ' + result.error);
        }
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).send('Something broke!');
    }
});

app.post('/api/saveGameState', async (req, res) => {
    const { deck, discardPile, players, currentPlayerIndex, direction, skipTurn, drawCardPending, invitationCode } = req.body;

    try {
        const gameState = {
            deck,
            discardPile,
            players,
            currentPlayerIndex,
            direction,
            skipTurn,
            drawCardPending
        };
        await saveGameState(invitationCode, gameState);
        res.json({ success: true, invitationCode });
    } catch (error) {
        console.error('Error saving game state:', error);
        res.json({ success: false, error: 'Error saving game state' });
    }
});

app.get('/api/getGameState/:invitationCode', async (req, res) => {
    const { invitationCode } = req.params;
    try {
        const gameState = await getGameState(invitationCode);
        res.status(200).json(gameState);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/username', (req, res) => {
    const username = req.session.username;
    if (username) {
        res.json({ username: username });
    } else {
        res.status(404).json({ error: 'Username not found in session' });
    }
});

app.get('/api/getUsernames', async (req, res) => {
    const { invitationCode } = req.query;
    try {
        const usernames = await getUsernamesByInvitationCode(invitationCode);
        res.json({ usernames });
    } catch (error) {
        console.error('Error fetching usernames:', error);
        res.status(500).json({ error: 'Failed to fetch usernames' });
    }
});

app.post('/api/getUsernames', async (req, res) => {
    const { invitationCode } = req.body;
    try {
        const usernames = await getUsernamesByInvitationCode(invitationCode);
        res.json({ usernames });
    } catch (error) {
        console.error('Error fetching usernames:', error);
        res.status(500).json({ error: 'Failed to fetch usernames' });
    }
});

app.post('/login', flashMiddleware, async (req, res) => {
    const userData = req.body;
    const authResult = await authenticateUser(userData);

    if (authResult.success) {
        req.session.username = userData.username;
        res.redirect('/');
    } else {
        res.redirect('/login');
    }
});

app.get('/logout', async (req, res) => {
    if (req.session.username) {
        req.session.destroy(() => {
            res.redirect('/');
        });
    } else {
        res.redirect('/');
    }
});

const io = new Server(server);
let games = {};
io.on('connection', (socket) => {
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });

    socket.on('joinGame', async ({ invitationCode, username }) => {
        const usernames = await getUsernamesByInvitationCode(invitationCode);
        if (!games[invitationCode]) {
            games[invitationCode] = {
                deck: [],
                discardPile: [],
                players: [
                    { id: 0, hand: [], name: usernames[0] },
                    { id: 1, hand: [], name: usernames[1] }
                ]
            };
        }
        const game = games[invitationCode];

        socket.join(invitationCode);
        io.to(invitationCode).emit('gameState', game);
    });

    socket.on('playerAction', ({ invitationCode, action }) => {
        const game = games[invitationCode];
        const currentPlayer = game.players[game.currentPlayerIndex];

        if (action.type === 'playCard') {
            const cardIndex = currentPlayer.hand.findIndex(c => c.value === action.card.value && c.color === action.card.color);
            if (cardIndex > -1) {
                game.discardPile.push(action.card);
                currentPlayer.hand.splice(cardIndex, 1);

                if (action.card.value === 'drawtwo') {
                    const nextPlayer = game.players[(game.currentPlayerIndex + game.direction + game.players.length) % game.players.length];
                    for (let i = 0; i < 2; i++) {
                        nextPlayer.hand.push(game.deck.pop());
                    }
                    game.skipTurn = true;
                } else if (action.card.value === 'skip') {
                    game.skipTurn = true;
                } else if (action.card.value === 'reverse') {
                    game.direction *= -1;
                }

                game.currentPlayerIndex = (game.currentPlayerIndex + game.direction + game.players.length) % game.players.length;

                io.to(invitationCode).emit('gameState', game);
            }
        } else if (action.type === 'drawCard') {
            currentPlayer.hand.push(game.deck.pop());
            game.currentPlayerIndex = (game.currentPlayerIndex + game.direction + game.players.length) % game.players.length;
            io.to(invitationCode).emit('gameState', game);
        }
    });

    socket.on('chat message', (messageData) => {
        const { invitationCode, ...message } = messageData;
        io.to(invitationCode).emit('chat message', message);
        saveMessage(messageData); // Save the message to the database
    });

    socket.on('saveGameState', async ({ invitationCode, gameState }) => {
        games[invitationCode] = gameState;
        await saveGameState(invitationCode, gameState);
        io.to(invitationCode).emit('gameState', gameState);
    });

    socket.on('requestGameStateSync', ({ invitationCode }) => {
        if (games[invitationCode]) {
            io.to(invitationCode).emit('gameState', games[invitationCode]);
        }
    });

    socket.on('joinRoom', async ({ invitationCode, username }) => {
        if (!gameRooms[invitationCode]) {
            gameRooms[invitationCode] = {
                players: [],
                readyStatus: [false, false]
            };
        }

        const room = gameRooms[invitationCode];
        if (room.players.length < 2) {
            room.players.push(username);
            const playerNumber = room.players.length;
            socket.join(invitationCode);
            socket.playerNumber = playerNumber;

            try {
                await updatePlayerUsername(invitationCode, username);
                io.to(invitationCode).emit('playerJoined', { username, playerNumber });

                const roomDetails = await fetchRoomStatusFromDatabase(invitationCode);
                if (roomDetails.player1Name && roomDetails.player2Name) {
                    io.to(invitationCode).emit('bothPlayersReady');
                }
            } catch (error) {
                console.error('Error updating player username:', error);
            }
        }
    });

    socket.on('playerReady', ({ invitationCode }) => {
        const room = gameRooms[invitationCode];
        if (room) {
            room.readyStatus[socket.playerNumber - 1] = true;
            if (room.readyStatus.every(status => status)) {
                io.to(invitationCode).emit('bothPlayersReady');
            }
        }
    });

    socket.on('chat message', async (message) => {
        try {
            await saveMessage(message);
            io.to(message.invitationCode).emit('chat message', message);
        } catch (error) {
            console.error('Error saving message:', error);
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});

export default app;
