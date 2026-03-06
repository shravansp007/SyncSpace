let stompClient = null;

function connectChat() {
    const socket = new SockJS("http://localhost:8080/chat");
    stompClient = Stomp.over(socket);

    stompClient.connect({}, function () {

        stompClient.subscribe("/topic/messages", function (msg) {
            showMessage(msg.body);
        });

    });
}

function sendMessage() {
    const input = document.getElementById("chatInput");
    const message = input.value.trim();

    if (message && stompClient) {
        stompClient.send("/app/send", {}, message);
        input.value = "";
    }
}

function showMessage(message) {
    const chatBox = document.getElementById("chatBox");
    const p = document.createElement("p");
    p.innerText = message;
    chatBox.appendChild(p);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Connect chat when page loads
connectChat();
