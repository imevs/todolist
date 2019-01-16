"use strict";
const connection = new RTCPeerConnection(null);
let channel = connection.createDataChannel('dataChannel');
let isLocalDescSet = false;
const iceCandidates = [];
channel.onopen = () => {
    const readyState = channel.readyState;
    console.log('channel state is: ' + readyState);
};
connection.ondatachannel = (event) => {
    console.log("ondatachannel");
    channel = event.channel;
};
connection.onicecandidate = (event) => {
    if (event.candidate) {
        iceCandidates.push(btoa(event.candidate.candidate));
        console.log("ice candidate", btoa(event.candidate.candidate));
    }
};
const addIceCandidate = (candidate) => {
    connection.addIceCandidate(new RTCIceCandidate({
        candidate: atob(candidate),
        sdpMLineIndex: 0,
        sdpMid: "data",
    }));
};
const createOffer = () => {
    connection.createOffer().then((desc) => {
        isLocalDescSet = true;
        connection.setLocalDescription(desc);
        setTimeout(() => {
            console.log(JSON.stringify({
                offer: btoa(desc.sdp),
                ice: iceCandidates,
            })); // send to the client
        }, 500);
    });
};
const connectToRemote = (args) => {
    const desc = new RTCSessionDescription({
        sdp: atob(args.offer),
        type: isLocalDescSet ? "answer" : "offer",
    });
    connection.setRemoteDescription(desc);
    args.ice.forEach(addIceCandidate);
    if (!isLocalDescSet) {
        connection.createAnswer().then((desc) => {
            connection.setLocalDescription(desc);
            console.log(JSON.stringify({
                offer: btoa(desc.sdp),
                ice: [],
            }));
        });
    }
};
const sendData = (msg) => {
    channel.send(msg);
};
channel.onmessage = (data) => {
    console.log("Received", data);
};
//# sourceMappingURL=p2p.js.map