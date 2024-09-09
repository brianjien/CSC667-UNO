const colors = ['red', 'green', 'blue', 'yellow'];
const values = ['0','1','2','3','4','5','6','7','8','9','skip','reverse','drawtwo'];
const specialCards = ['wild', 'wilddrawfour'];

let deck = [];
let discardPile = [];
let players = [];
let currentPlayer = 0;
let direction = 1;

function createDeck() {
  for (let color of colors) {
    for (let value of values) {
      if (value !== '0') {
        deck.push({ color, value });
        deck.push({ color, value });
      }
    }
  }
  for (let color of colors) {
    for (let card of specialCards) {
      deck.push({ color, value: card });
      deck.push({ color, value: card });
    }
  }
}

function shuffleDeck() {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}

function drawCard(player, numCards = 1) {
  for (let i = 0; i < numCards; i++) {
    if (deck.length === 0) {
      refillDeckFromDiscard();
    }
    player.hand.push(deck.pop());
  }
  displayHand(player);
}

function refillDeckFromDiscard() {
  const topCard = discardPile.pop();
  deck = discardPile.reverse();
  discardPile = [topCard];
  shuffleDeck(); 
}

function displayHand(player) {
  const handElement = document.getElementById(`hand${player.id}`);
  handElement.innerHTML = '';
  for (let card of player.hand) {
    const cardElement = document.createElement('div');
    cardElement.classList.add('card');
    cardElement.style.backgroundColor = card.color;
    cardElement.textContent = card.value;
    cardElement.addEventListener('click', () => playCard(player, card));
    handElement.appendChild(cardElement);
  }
}

function playCard(player, card) {
  if (isValidMove(card)) {
    const index = player.hand.findIndex(c => c === card);
    player.hand.splice(index, 1);
    discardPile.push(card);
    displayHand(player);
    displayDiscard();
    if (checkWinner()) {
      return;
    }
    applyCardEffects(card);
    switchPlayer();
  } else {
    alert('Invalid move! You cannot play this card.');
  }
}

function isValidMove(card) {
  const topCard = discardPile[discardPile.length - 1];
  return card.color === topCard.color || card.value === topCard.value || card.color === 'any';
}

function applyCardEffects(card) {
  switch (card.value) {
    case 'skip':
      currentPlayer = getNextPlayerIndex();
      break;
    case 'reverse':
      direction *= -1;
      break;
    case 'drawtwo':
      const nextPlayer = getNextPlayer();
      drawCard(nextPlayer, 2);
      break;
    case 'wild':
      // Ask the current player to choose a color
      chooseColor(card);
      break;
    case 'wilddrawfour':
      const wildNextPlayer = getNextPlayer();
      drawCard(wildNextPlayer, 4);
      // Ask the current player to choose a color
      chooseColor(card);
      break;
    default:
      break;
  }
}

function chooseColor(card) {
  const colors = ['red', 'green', 'blue', 'yellow'];
  const colorChoice = prompt('Choose a color: red, green, blue, or yellow');
  if (colors.includes(colorChoice.toLowerCase())) {
    card.color = colorChoice.toLowerCase();
    switchPlayer();
  } else {
    alert('Invalid color choice. Please choose from red, green, blue, or yellow.');
    chooseColor(card);
  }
}

function switchPlayer() {
  currentPlayer = getNextPlayerIndex();
}

function getNextPlayerIndex() {
  let nextPlayer = currentPlayer + direction;
  if (nextPlayer < 0) {
    nextPlayer = players.length - 1;
  } else if (nextPlayer >= players.length) {
    nextPlayer = 0;
  }
  return nextPlayer;
}

function getNextPlayer() {
  return players[getNextPlayerIndex()];
}

function startGame() {
  createDeck();
  shuffleDeck();
  players = [
    { id: 1, hand: [] },
    { id: 2, hand: [] }
  ];
  dealCards();
  discardPile.push(deck.pop());
  displayDiscard();
  for (let player of players) {
    displayHand(player);
  }
}

function dealCards() {
  for (let i = 0; i < 7; i++) {
    drawCard(players[0]);
    drawCard(players[1]);
  }
}

function displayDiscard() {
  const discardElement = document.getElementById('discard');
  discardElement.innerHTML = '';
  const card = discardPile[discardPile.length - 1];
  const cardElement = document.createElement('div');
  cardElement.classList.add('card');
  cardElement.style.backgroundColor = card.color;
  cardElement.textContent = card.value;
  discardElement.appendChild(cardElement);
}

function checkWinner() {
  for (let player of players) {
    if (player.hand.length === 0) {
      alert(`Player ${player.id} wins!`);
      return true;
    }
  }
  return false;
}

window.onload = function() {
  document.getElementById('startBtn').addEventListener('click', startGame);
};