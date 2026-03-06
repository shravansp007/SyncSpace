const socket = io("http://localhost:3000");

function sendSignal(data) {
  socket.emit("signal", data);
}

socket.on("signal", async data => {
  if (data.type === "offer") {
    await handleOffer(data.offer);
  }
  if (data.type === "answer") {
    await handleAnswer(data.answer);
  }
  if (data.type === "candidate") {
    await handleCandidate(data.candidate);
  }
});

socket.on("connect", () => {
  console.log("Connected to signaling server");
});
