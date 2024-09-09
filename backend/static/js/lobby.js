const socket = io();
const messageList = document.getElementById('messages');
const form = document.getElementById('form');
const input = document.getElementById('input');
const chatBtn = document.getElementById('chatBtn');
const chatroom = document.getElementById('chatroom');
const sendBtn = document.getElementById('sendBtn');
const createRoomBtn = document.getElementById('createRoomBtn');
const joinRoomBtn = document.getElementById('joinRoomBtn');
const createRoomModal = document.getElementById('popupCreateRoomModal');
const joinRoomModal = document.getElementById('popupJoinRoomModal');
const closeModalBtns = document.querySelectorAll('.close');

async function fetchUserRooms(username) {
    try {
        const response = await fetch(`/api/user_rooms?username=${username}`);
        if (!response.ok) {
            throw new Error('Failed to fetch user rooms');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching user rooms:', error);
        return [];
    }
}

async function displayUserRooms(username) {
    try {
        const rooms = await fetchUserRooms(username);
        const userRoomsList = document.getElementById('userRoomsList');
        userRoomsList.innerHTML = '';
        if (rooms.length === 0) {
            const li = document.createElement('li');
            li.textContent = 'No rooms found';
            userRoomsList.appendChild(li);
        } else {
            rooms.forEach(room => {
                const li = document.createElement('li');
                const roomLink = document.createElement('a');
                roomLink.href = `/game?invitationCode=${room}`;
                roomLink.textContent = `Room ${room}`;
                li.appendChild(roomLink);
                userRoomsList.appendChild(li);
            });
        }
    } catch (error) {
        console.error('Error displaying user rooms:', error);
    }
}

function joinRoom() {
    const roomCodeInput = joinRoomModal.querySelector('#roomCode');
    const roomCode = roomCodeInput.value.trim();

    fetch(`/checkInvitationCode?invitationCode=${roomCode}`)
        .then(response => response.json())
        .then(data => {
            if (data) {
                window.location.href = `/game_room?invitationCode=${roomCode}`;
            } else {
                alert('Invalid invitation code. Please try again.');
                roomCodeInput.value = '';
            }
        })
        .catch(error => {
            console.error('Error checking invitation code:', error);
            alert('An error occurred while validating the invitation code. Please try again later.');
            roomCodeInput.value = '';
        });
    roomCodeInput.value = '';
}

createRoomBtn.addEventListener('click', function () {
    showModal('Create Room', createRoomModal);
});
joinRoomBtn.addEventListener('click', function () {
    showModal('Join Room', joinRoomModal);
});

createRoomPlayBtn.addEventListener('click', function () {
    createRoom();
});

joinRoomPlayBtn.addEventListener('click', function () {
    joinRoom();
});
closeModalBtns.forEach(btn => {
    btn.addEventListener('click', function () {
        closeModal();
    });
});

window.addEventListener('click', function (event) {
    if (event.target == createRoomModal || event.target == joinRoomModal) {
        closeModal();
    }
});

function showModal(title, modal) {
    const modalTitle = modal.querySelector('h2');
    modalTitle.textContent = title;
    modal.classList.add('active');
}

function createRoom() {
    fetch('/create_room', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => { throw new Error(err.error); });
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            const invitationCode = generateInvitationCode();
            console.log('Invitation Code:', invitationCode);
            const queryString = `?invitationCode=${invitationCode}`;
            window.location.href = `/game_room${queryString}`;
        } else {
            console.error('Error creating room:', data.error);
        }
    })
    .catch(error => {
        console.error('Error creating room:', error);
    });
}

function generateInvitationCode() {
    const characters = '0123456789';
    const codeLength = 6;
    let code = '';
    for (let i = 0; i < codeLength; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
}

function closeModal() {
    createRoomModal.classList.remove('active');
    joinRoomModal.classList.remove('active');
}

chatBtn.addEventListener('click', function () {
    chatroom.style.display = 'block';
    chatBtn.style.display = 'none';
});

document.getElementById('closeBtn').addEventListener('click', function () {
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

async function fetchAndDisplayMessages(username) {
    try {
        const response = await fetch(`/messages?username=${username}`);
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
                created_at: currentDate
            };
            const messageElement = createMessageElement(messageData, username);
            messageList.appendChild(messageElement);
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
    return false;
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

window.addEventListener('DOMContentLoaded', async () => {
    const usernameElement = document.querySelector('.username');
    const username = await getUsername();
    if (username) {
        displayUserRooms(username);
    }
    if (usernameElement && username) {
        usernameElement.textContent = username;
        fetchAndDisplayMessages(username);
    } else {
        usernameElement.textContent = 'Guest';
        const messageContainer = document.getElementById('messageContainer');
        messageContainer.textContent = 'Please log in to send messages.';
        input.disabled = true;
        sendBtn.disabled = true;
    }

    document.getElementById('joinRoomBtn').addEventListener('click', async function() {
        try {
            const username = await getUsername();
            const invitationCodeInput = document.getElementById('roomCode');
            const invitationCode = invitationCodeInput.value.trim();
            const response = await fetch('/join_room', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, invitationCode })
            });

            const data = await response.json();
            if (data.success) {
                window.location.href = '/game_room?invitationCode=' + invitationCode;
            } else {
                console.error('Error joining room:', data.message);
            }
        } catch (error) {
            console.error('Error joining room:', error);
        }
    });

    if (usernameElement && username) {
        usernameElement.textContent = username;
        fetchAndDisplayMessages(username);
        
    } else {
        usernameElement.textContent = 'Guest';
        const messageContainer = document.getElementById('messageContainer');
        messageContainer.textContent = 'Please log in to send messages.';
        input.disabled = true;
        sendBtn.disabled = true;
    }
});

socket.on('chat message', async (msg) => {
    const username = getUsername();
    scrollChatToBottom();
});