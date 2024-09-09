document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const invitationCode = urlParams.get('invitationCode');
    document.getElementById('invitationCode').textContent = invitationCode;

    const socket = io();
    const username = await getUsername();
    document.getElementById('username').textContent = username;

    const invitationCodeExists = await checkInvitationCode(invitationCode);
    if (!invitationCodeExists) {
        postInvitationCode(invitationCode);
    } else {
        console.log('Invitation code already exists');
    }  
    await fetchRoomDetails(invitationCode);

    async function checkInvitationCode(invitationCode) {
        try {
            const response = await fetch(`/api/checkInvitationCode?invitationCode=${invitationCode}`);
            if (!response.ok) {
                throw new Error('Failed to check invitation code');
            }
            const data = await response.json();
            return data.exists;
        } catch (error) {
            console.error('Error checking invitation code:', error);
            return false;
        }
    }
    socket.emit('joinRoom', { invitationCode, username });

    socket.on('playerJoined', ({ username, playerNumber }) => {
        updatePlayerBox(playerNumber, username);
    });

    socket.on('bothPlayersReady', () => {
        startCountdown();
    });

    document.getElementById('readyBtn').addEventListener('click', () => {
        socket.emit('playerReady', { invitationCode, username });
    });

    async function fetchRoomDetails(invitationCode) {
        try {
            const response = await fetch(`/get_room_details?invitationCode=${invitationCode}`);
            if (!response.ok) throw new Error('Failed to fetch room details');
            const data = await response.json();
            document.getElementById('player1-name').textContent = data.player1Name;
            document.getElementById('player2-name').textContent = data.player2Name;
        } catch (error) {
            console.error('Error fetching room details:', error);
        }
    }

    async function getUsername() {
        try {
            const response = await fetch('/api/username');
            if (!response.ok) throw new Error('Failed to get username from session');
            const data = await response.json();
            return data.username;
        } catch (error) {
            console.error('Error getting username from session:', error);
            return null;
        }
    }

    function postInvitationCode(invitationCode) {
        fetch('/post_invitation_code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ invitationCode })
        }).catch(error => console.error('Error posting invitation code:', error));
    }

    function updatePlayerBox(playerNumber, username) {
        document.getElementById(`player${playerNumber}-name`).textContent = username;
    }

    function startCountdown() {
        let seconds = 3;
        const countdownElement = document.getElementById('countdown');
        const countdownInterval = setInterval(() => {
            countdownElement.textContent = seconds;
            seconds--;
            if (seconds < 0) {
                clearInterval(countdownInterval);
                countdownElement.textContent = '';
                window.location.href = '/game?invitationCode=' + invitationCode;
            }
        }, 1000);
    }
});