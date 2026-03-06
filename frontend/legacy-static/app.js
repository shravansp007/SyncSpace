const socket = io("http://localhost:3000");
const room = "team-room";
const localVideo = document.getElementById("local");
const remoteDiv = document.getElementById("remote");
const peers = {};

navigator.mediaDevices.getUserMedia({ video: true, audio: true })
.then(stream => {
  localVideo.srcObject = stream;
  socket.emit("join-room", room);

  socket.on("user-joined", id => {
    const pc = new RTCPeerConnection();
    peers[id] = pc;

    stream.getTracks().forEach(t => pc.addTrack(t, stream));

    pc.ontrack = e => {
      const v = document.createElement("video");
      v.srcObject = e.streams[0];
      v.autoplay = true;
      remoteDiv.appendChild(v);
    };

    pc.onicecandidate = e => {
      if (e.candidate)
        socket.emit("signal", { candidate: e.candidate });
    };
  });

  socket.on("signal", data => {
    const pc = peers[data.from];
    if (data.signal?.candidate)
      pc.addIceCandidate(new RTCIceCandidate(data.signal.candidate));
  });
});
