import {todoApp} from "./app";
import {RemoteOffer, SignallingServer} from "./signallingServer";

const signallingServer = new SignallingServer();

const isHost = window.location.search.indexOf("host") !== -1;

const connection = new RTCPeerConnection({
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
    ]
});

const iceCandidatesPromise: Promise<string[]> = new Promise((resolve, reject) => {
    const iceCandidates: string[] = [];
    connection.onicecandidate = (event) => {
        if (event.candidate) {
            iceCandidates.push(event.candidate.candidate);
        } else {
            resolve(iceCandidates);
        }
    };
});

const channelExport = {
    channel: null as null | RTCDataChannel,
    send: (msg: string) => channelExport.channel && channelExport.channel.send(msg),
    onMessage: (msg: MessageEvent) => {
        console.log("default onMessage", msg);
    },
};
const p2pConnectionReady: () => Promise<{
    send: (msg: string) => void;
    onMessage: (msg: MessageEvent) => void;
}> = () => new Promise((resolve, reject) => {
    let channel: RTCDataChannel = connection.createDataChannel('dataChannel');
    channelExport.channel = channel;
    channel.onopen = () => {
        const readyState = channel.readyState;
        console.log('channel state is: ' + readyState);
        resolve(channelExport);
    };
    connection.ondatachannel = (event) => {
        console.log("ondatachannel");
        channel = event.channel;
        channelExport.channel = channel;
    };
    channel.onmessage = (data) => {
        channelExport.onMessage(data);
    };
});

const addIceCandidate = (candidate: any) => {
    connection.addIceCandidate(new RTCIceCandidate({
        candidate: candidate,
        sdpMLineIndex: 0,
        sdpMid: "data",
    }));
};
const createOffer = (): Promise<RemoteOffer> => {
    return connection.createOffer().then((desc) => {
        connection.setLocalDescription(desc);
        return iceCandidatesPromise.then((iceCandidates) => {
            const originOffer = {
                offer: desc.sdp!,
                answer: "",
                ice: iceCandidates,
            };
            signallingServer.send(originOffer);
            return originOffer;
        });
    });
};

const connectToRemote = (args: RemoteOffer, isOffer: boolean) => {
    connection.setRemoteDescription(new RTCSessionDescription({
        sdp: isOffer ? args.offer : args.answer,
        type: isOffer ? "offer" : "answer",
    }));
};

const reofferOnHost = () => {
    createOffer().then(offer => {
        setConnectingStatus();
        signallingServer.onMessage(offer, data => {
            connectToRemote(data, false);
        });
    });
};

const reofferOnClient = () => {
    p2pConnectionReady().then((channel) => {
        channel.onMessage = (msg: MessageEvent) => {
            console.log("Received", msg);
            const data = JSON.parse(msg.data);
            todoApp.store.setLocalStorage(data);
            todoApp._filter(true);
        };
    });
    setConnectingStatus();
    signallingServer.onMessage(null, data => {
        connectToRemote(data, true);
        data.ice.forEach(addIceCandidate);
        connection.createAnswer().then((desc) => {
            connection.setLocalDescription(desc);
            signallingServer.send({
                offer: data.offer,
                answer: desc.sdp!,
                ice: data.ice,
            });
        });
    });
};

const reoffer = isHost ? reofferOnHost : reofferOnClient;
if (isHost) {
    p2pConnectionReady().then((channel) => {
        console.log("Send data");
        setInterval(() => {
            channel.send(JSON.stringify(todoApp.store.getLocalStorage()));
        }, 5000);
    });
}
reoffer();

let isReconnecting = false;
window.addEventListener('unhandledrejection', (error) => {
    if (isReconnecting) return;
    console.log("Fail to connect");
    setDisconnectedStatus();
    isReconnecting = true;
    setTimeout(() => {
        reoffer();
        isReconnecting = false;
    }, 1000);
});

connection.oniceconnectionstatechange = () => {
    console.log("iceConnectionState", connection.iceConnectionState);
    switch(connection.iceConnectionState) {
        case "connected":
        case "completed":
            setConnectedStatus();
            break;
        case "closed":
        case "failed":
        case "disconnected":
            setDisconnectedStatus();
            reoffer();
            break;
    }
};

function setConnectedStatus() {
    console.log("setConnectedStatus");
    const bar = document.querySelector("[name=theme-color]") as HTMLMetaElement;
    bar.content = "green";
    const favicon = document.getElementById('favicon') as HTMLLinkElement;
    favicon.href = "circle-green.png";
}

function setDisconnectedStatus() {
    console.log("setDisconnectedStatus");
    const bar = document.querySelector("[name=theme-color]") as HTMLMetaElement;
    bar.content = "red";
    const favicon = document.getElementById('favicon') as HTMLLinkElement;
    favicon.href = "circle-red.png";
}

function setConnectingStatus() {
    console.log("setConnectingStatus");
    const bar = document.querySelector("[name=theme-color]") as HTMLMetaElement;
    bar.content = "orange";
    const favicon = document.getElementById('favicon') as HTMLLinkElement;
    favicon.href = "circle-orange.png";
}