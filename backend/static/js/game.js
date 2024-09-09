document.addEventListener("DOMContentLoaded", async () => {
    const colors = ['red', 'yellow', 'blue', 'green'];
    const values = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    const specialCards = ['drawtwo', 'skip', 'reverse'];
    let deck = [];
    let discardPile = [];
    let players = [];
    let currentPlayerIndex = 0;
    let direction = 1;
    let skipTurn = false;
    let drawCardPending = false;
    const socket = io();
    const messageList = document.getElementById('messages');
    const form = document.getElementById('form');
    const input = document.getElementById('input');
    const chatBtn = document.getElementById('chatBtn');
    const chatroom = document.getElementById('chatroom');
    const sendBtn = document.getElementById('sendBtn');
    const closeBtn = document.getElementById('closeBtn');
    const invitationCode = new URLSearchParams(window.location.search).get('invitationCode');

    const usernames = await getPlayerUsernames(invitationCode);
    console.log('Fetched usernames:', usernames);
    const username = await getUsername();
    console.log('Fetched username:', username);

    // Chatroom functionality
    chatBtn.addEventListener('click', function () {
        chatroom.style.display = 'block';
        chatBtn.style.display = 'none';
    });

    closeBtn.addEventListener('click', function () {
        chatroom.style.display = 'none';
        chatBtn.style.display = 'block';
    });

    function scrollChatToBottom() {
        messageList.scrollTop = messageList.scrollHeight;
    }

    function formatTimestamp(timestamp) {
        return new Date(timestamp).toLocaleString('en-US', {
            hour: 'numeric',
            minute: 'numeric',
            hour12: true
        });
    }

    function createMessageElement(message, currentUsername) {
        const messageItem = document.createElement('li');
        const usernameSpan = document.createElement('span');
        if (message.username === currentUsername) {
            messageItem.classList.add('current-user-message');
        } else {
            messageItem.classList.add('other-user-message');
        }
        usernameSpan.classList.add('user-id');
        usernameSpan.textContent = `${message.username}:`;
        messageItem.appendChild(usernameSpan);
        
        const messageContentSpan = document.createElement('span');
        messageContentSpan.classList.add('message-content');
        messageContentSpan.textContent = message.content;

        const timestampSpan = document.createElement('span');
        timestampSpan.classList.add('timestamp');
        timestampSpan.textContent = formatTimestamp(message.created_at);

        messageItem.appendChild(messageContentSpan);
        messageItem.appendChild(timestampSpan);
        
        return messageItem;
    }

    async function fetchAndDisplayMessages() {
        try {
            const response = await fetch(`/messages?invitationCode=${invitationCode}`);
            if (!response.ok) {
                throw new Error('Failed to fetch messages');
            }
            const data = await response.json();
            displayMessages(data, username);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    }

    function displayMessages(messages, username) {
        messages.forEach(message => {
            const messageElement = createMessageElement(message, username);
            messageList.appendChild(messageElement);
        });
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const message = input.value.trim();
        if (message !== '') {
            const username = await getUsername();
            if (username) {
                const currentDate = new Date();
                const messageData = {
                    content: message,
                    username: username,
                    created_at: currentDate,
                    invitationCode: invitationCode // Include invitation code
                };
                socket.emit('chat message', messageData);
                input.value = '';
                scrollChatToBottom();
            } else {
                const messageContainer = document.getElementById('messageContainer');
                messageContainer.textContent = 'Please log in to send messages.';
                input.disabled = true;
                sendBtn.disabled = true;
            }
        }
    });

    async function getUsername() {
        try {
            const response = await fetch('/api/username');
            if (!response.ok) {
                throw new Error('Failed to get username from session');
            }
            const data = await response.json();
            return data.username;
        } catch (error) {
            console.error('Error getting username from session:', error);
            return null;
        }
    }

    socket.on('chat message', (msg) => {
        if (msg.invitationCode === invitationCode) { // Ensure the message is for the current room
            const messageElement = createMessageElement(msg, username);
            messageList.appendChild(messageElement);
            scrollChatToBottom();
        }
    });

    // Game-related functionality
    async function getPlayerUsernames(invitationCode) {
        try {
            const response = await fetch(`/api/getUsernames?invitationCode=${invitationCode}`);
            if (!response.ok) {
                throw new Error('Failed to get usernames from database');
            }
            const data = await response.json();
            return data.usernames;
        } catch (error) {
            console.error('Error getting usernames from database:', error);
            return null;
        }
    }

    socket.emit('joinGame', { invitationCode, username });

    let lastClickTime = 0;
    document.querySelectorAll('.card').forEach(cardElement => {
        cardElement.addEventListener('click', () => {
            const currentTime = new Date().getTime();
            if (currentTime - lastClickTime < 500) return;
            lastClickTime = currentTime;

            const currentPlayer = players[currentPlayerIndex];
            const selectedCard = getCardFromElement(cardElement);
            if (selectedCard) {
                const action = {
                    type: 'playCard',
                    player: currentPlayer,
                    card: selectedCard
                };
                socket.emit('playerAction', { invitationCode, action });
            }
        });
    });

    socket.emit('requestGameStateSync', { invitationCode });

    socket.on('gameState', function (gameState) {
        deck = gameState.deck;
        discardPile = gameState.discardPile;
        players = gameState.players;
        currentPlayerIndex = gameState.currentPlayerIndex;
        direction = gameState.direction;
        skipTurn = gameState.skipTurn;
        drawCardPending = gameState.drawCardPending;

        updateGameDisplay(username);
    });

    document.getElementById('drawArea').addEventListener('click', handleDrawCard);

    function createDeck() {
        for (let color of colors) {
            for (let value of values) {
                deck.push({ color, value });
                if (value !== '0') {
                    deck.push({ color, value });
                }
            }
            for (let card of specialCards) {
                deck.push({ color, value: card });
                deck.push({ color, value: card });
            }
        }
        for (let i = 0; i < 4; i++) {
            deck.push({ color: null, value: 'wild' });
            deck.push({ color: null, value: 'wilddrawfour' });
        }
        shuffleDeck();
    }

    function shuffleDeck() {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
    }

    function startGame(usernames) {
        console.log(usernames);
        const player1Name = usernames[0];
        const player2Name = usernames[1];
        console.log(player1Name);
        console.log(player2Name);
        deck = [];
        discardPile = [];
        players = [
            { id: 0, hand: [], name: player1Name },
            { id: 1, hand: [], name: player2Name }
        ];
        currentPlayerIndex = 0;
        direction = 1;
        skipTurn = false;
        drawCardPending = false;

        createDeck();
        dealCards();
        
        // 确保初始卡牌不是功能卡
        let initialCard;
        do {
            initialCard = deck.pop();
        } while (initialCard.value === 'wild' || initialCard.value === 'wilddrawfour' || 
                 initialCard.value === 'skip' || initialCard.value === 'reverse' || 
                 initialCard.value === 'drawtwo');
        
        discardPile.push(initialCard);
        updateGameDisplay(username);
        saveGameState();
    }

    function dealCards() {
        for (let player of players) {
            drawCard(player, 7);
        }
    }

    function drawCard(player, numCards = 1) {
        for (let i = 0; i < numCards; i++) {
            if (deck.length === 0) {
                refillDeckFromDiscard();
            }
            player.hand.push(deck.pop());
        }
        updateGameDisplay(username);
        saveGameState();
    }

    function refillDeckFromDiscard() {
        const topCard = discardPile.pop();
        deck = discardPile;
        discardPile = [topCard];
        shuffleDeck();
    }

    function endTurn() {
        if (players[currentPlayerIndex].hand.length === 0) {
            alert(`${players[currentPlayerIndex].name.split(' ')[0]} wins!`);
            resetGame();
            return;
        }

        if (skipTurn) {
            currentPlayerIndex = getNextPlayerIndex();
            skipTurn = false;
        }

        currentPlayerIndex = getNextPlayerIndex();
        updateGameDisplay(username);
        saveGameState();
    }

    function getNextPlayerIndex() {
        let nextIndex = currentPlayerIndex + direction;
        if (nextIndex >= players.length) {
            return 0;
        } else if (nextIndex < 0) {
            return players.length - 1;
        }
        return nextIndex;
    }

    socket.on('gameStateUpdate', function (gameState) {
        deck = gameState.deck;
        discardPile = gameState.discardPile;
        players = gameState.players;
        currentPlayerIndex = gameState.currentPlayerIndex;
        direction = gameState.direction;
        skipTurn = gameState.skipTurn;
        drawCardPending = gameState.drawCardPending;
        updateGameDisplay(username);
    });

    function isValidMove(card) {
        const topCard = discardPile[discardPile.length - 1];
        return card.color === topCard.color || card.value === topCard.value || card.value === 'wild' || card.value === 'wilddrawfour';
    }

    function playCard(player, card) {
        if (isValidMove(card)) {
            const index = player.hand.findIndex(c => c.color === card.color && c.value === card.value);
            if (index !== -1) {
                player.hand.splice(index, 1);
                if (player.hand.length === 0) {
                    endGame(player);
                    return;
                }
                if (card.value === 'wild' || card.value === 'wilddrawfour') {
                    showColorSelection(card);
                } else {
                    discardPile.push(card);
                    handleSpecialCard(card);
                    displayHand(player, username);
                    displayDiscard();
                    switchPlayer();
                    updateGameDisplay(username);
                    saveGameState();
                }
            }
        } else {
            alert("你不能打出这张牌!");
        }
    }

    function endGame(winner) {
        alert(`${winner.name} 赢了游戏!`);
        // 这里可以添加更多的结束游戏逻辑,比如更新分数,重置游戏等
        resetGame();
    }

    function resetGame() {
        // 重置游戏状态
        deck = [];
        discardPile = [];
        players.forEach(player => player.hand = []);
        currentPlayerIndex = 0;
        direction = 1;
        skipTurn = false;
        drawCardPending = false;

        // 重新开始游戏
        startGame(players.map(player => player.name));
    }

    function showColorSelection(card) {
        const colorSelection = document.getElementById('colorSelection');
        colorSelection.style.display = 'block';
        const colorButtons = colorSelection.getElementsByClassName('color-btn');
        Array.from(colorButtons).forEach(button => {
            button.onclick = function() {
                const selectedColor = this.id.replace('Btn', '');
                card.color = selectedColor;
                discardPile.push(card);
                colorSelection.style.display = 'none';
                if (card.value === 'wilddrawfour') {
                    drawCard(players[getNextPlayerIndex()], 4);
                }
                handleSpecialCard(card);
                displayHand(players[currentPlayerIndex], username);
                displayDiscard();
                switchPlayer();
                updateGameDisplay(username);
                saveGameState();
            };
        });
    }

    function handleSpecialCard(card) {
        if (card.value === 'drawtwo') {
            drawCard(players[getNextPlayerIndex()], 2);
            skipTurn = true;
        } else if (card.value === 'skip') {
            skipTurn = true;
        } else if (card.value === 'reverse') {
            direction *= -1;
        }
    }

    function handleDrawCard() {
        if (players[currentPlayerIndex].name === username) {
            if (deck.length === 0) {
                reshuffleDeck();
            }
            if (deck.length > 0) {
                const drawnCard = deck.pop();
                players[currentPlayerIndex].hand.push(drawnCard);
                displayHand(players[currentPlayerIndex], username);
                switchPlayer();
                updateGameDisplay(username);
                saveGameState();
            } else {
                alert("牌堆已空,游戏结束!");
                endGame(null); // 没有赢家,游戏平局
            }
        }
    }

    function reshuffleDeck() {
        if (discardPile.length > 1) {
            const topCard = discardPile.pop();
            deck = discardPile;
            discardPile = [topCard];
            shuffleDeck();
        }
    }

    function updateGameDisplay(username) {
        updateTurnDisplay();
        displayDiscard();
        players.forEach(player => displayHand(player, username));
        document.getElementById('player1-name').textContent = players[0]?.name || 'Player 1';
        document.getElementById('player2-name').textContent = players[1]?.name || 'Player 2';

        const currentPlayer = players[currentPlayerIndex];
        const drawArea = document.getElementById('drawArea');
        if (currentPlayer && currentPlayer.name === username) {
            drawArea.style.display = 'block';
        } else {
            drawArea.style.display = 'none';
        }
    }

    function updateTurnDisplay() {
        const currentPlayer = players[currentPlayerIndex];
        if (currentPlayer) {
            document.getElementById('turnDisplay').textContent = `Turn: ${currentPlayer.name}`;
        } else {
            document.getElementById('turnDisplay').textContent = 'Turn: Unknown';
        }
    }

    function displayHand(player, username) {
        const handElement = document.getElementById(`hand${player.id + 1}`);
        handElement.innerHTML = '';
        player.hand.forEach(card => {
            const cardElement = document.createElement('div');
            cardElement.classList.add('card');
            let imageName;
            if (card.value === 'wild') {
                imageName = 'wild';
            } else if (card.value === 'wilddrawfour') {
                imageName = 'Wild_draw_four';
            } else if (card.value === 'drawtwo') {
                imageName = `${card.color}_draw_two`;
            } else {
                imageName = `${card.color}_${card.value}`;
            }
            
            if (player.name === username) {
                cardElement.style.backgroundImage = `url('/images/cards/${imageName}.png')`;
                cardElement.addEventListener('click', () => playCard(player, card));
            } else {
                cardElement.classList.add('card-back');
                cardElement.style.backgroundImage = `url('/images/cards/card_back.png')`;
            }
            
            cardElement.onerror = function() {
                console.error(`Failed to load image: ${imageName}.png`);
                this.style.backgroundImage = 'none';
                this.style.backgroundColor = card.color;
                this.textContent = '';
            };
            
            handElement.appendChild(cardElement);
        });
    }

    function displayDiscard() {
        const discardElement = document.getElementById('discard');
        discardElement.innerHTML = '';
        if (discardPile.length > 0) {
            const topCard = discardPile[discardPile.length - 1];
            const cardElement = document.createElement('div');
            cardElement.classList.add('card', 'discard-card');
            let imageName;
            if (topCard.value === 'wild') {
                imageName = 'wild';
            } else if (topCard.value === 'wilddrawfour') {
                imageName = 'Wild_draw_four';
            } else if (topCard.value === 'drawtwo') {
                imageName = `${topCard.color}_draw_two`;
            } else {
                imageName = `${topCard.color}_${topCard.value}`;
            }
            cardElement.style.backgroundImage = `url('/images/cards/${imageName}.png')`;
            cardElement.onerror = function() {
                console.error(`Failed to load image: ${imageName}.png`);
                this.style.backgroundImage = 'none';
                this.style.backgroundColor = topCard.color;
                this.textContent = topCard.value;
            };
            discardElement.appendChild(cardElement);
        }
    }

    function saveGameState() {
        const gameState = {
            deck,
            discardPile,
            players,
            currentPlayerIndex,
            direction,
            skipTurn,
            drawCardPending
        };
        socket.emit('saveGameState', { invitationCode, gameState });
    }

    function getCardFromElement(cardElement) {
        const cardValue = cardElement.textContent;
        const cardColor = cardElement.style.backgroundColor;
        return {
            value: cardValue,
            color: cardColor
        };
    }

    function switchPlayer() {
        if (skipTurn) {
            currentPlayerIndex = getNextPlayerIndex();
            skipTurn = false;
        }
        currentPlayerIndex = getNextPlayerIndex();
    }

    startGame(usernames);
});
