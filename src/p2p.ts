//// UTILS
type RemoteOffer = { offer: string; answer: string; ice: string[] };

const SERVICE_PATH = "https://api.jsonbin.io/b/";
const resourceID = "5c3fb59481fe89272a8d96b5";
const saveData = (path: string, data: string) => {
    const req = new XMLHttpRequest();

    req.onreadystatechange = () => {
        if (req.readyState == XMLHttpRequest.DONE) {
            console.log("Data saved");
        }
    };

    req.open("PUT", path, true);
    req.setRequestHeader("Content-type", "application/json");
    req.send(data);
};

const fetchRemoteSdp = (path: string): Promise<RemoteOffer> => {
    return fetch(path + "/latest").then(data => data.text()).then(data => JSON.parse(data));
};
//// UTILS

const isHost = window.location.hash.indexOf("host") !== -1;

const connection = new RTCPeerConnection(null as any);

const iceCandidatesPromise: Promise<string[]> = new Promise((resolve, reject) => {
    const iceCandidates: string[] = [];
    connection.onicecandidate = (event) => {
        if (event.candidate) {
            iceCandidates.push(btoa(event.candidate.candidate));
        } else {
            resolve(iceCandidates);
        }
    };
});

const p2pConnectionReady: Promise<{
    send: (msg: string) => void;
    onMessage: (msg: MessageEvent) => void;
}> = new Promise((resolve, reject) => {
    let channel: RTCDataChannel = connection.createDataChannel('dataChannel');
    channel.onopen = () => {
        const readyState = channel.readyState;
        console.log('channel state is: ' + readyState);
    };
    const result = {
        send: (msg: string) => channel.send(msg),
        onMessage: (msg: MessageEvent) => {},
    };
    connection.ondatachannel = (event) => {
        console.log("ondatachannel");
        channel = event.channel;
        resolve(result);
    };
    channel.onmessage = (data) => {
        result.onMessage(data);
    };
});

const addIceCandidate = (candidate: any) => {
    connection.addIceCandidate(new RTCIceCandidate({
        candidate: atob(candidate),
        sdpMLineIndex: 0,
        sdpMid: "data",
    }));
};
const createOffer = (): Promise<RemoteOffer> => {
    return connection.createOffer().then((desc) => {
        connection.setLocalDescription(desc);
        return iceCandidatesPromise.then((iceCandidates) => {
            const originOffer = {
                offer: btoa(desc.sdp!),
                answer: "",
                ice: iceCandidates,
            };
            saveData(SERVICE_PATH + resourceID, JSON.stringify(originOffer));
            return originOffer;
        });
    });
};

const connectToRemote = (args: RemoteOffer, isOffer: boolean) => {
    connection.setRemoteDescription(new RTCSessionDescription({
        sdp: atob(isOffer ? args.offer : args.answer),
        type: isOffer ? "offer" : "answer",
    }));
};

if (isHost) {
    const path = SERVICE_PATH + resourceID;
    createOffer().then(offer => {
        const originOffer = offer;
        const runChecker = () => {
            const checkData = setInterval(() => {
                fetchRemoteSdp(path).then(data => {
                    if (data.answer !== originOffer.answer) {
                        connectToRemote(data, false);
                        clearInterval(checkData);
                    }
                });
            }, 1000);
        };
        runChecker();
        connection.oniceconnectionstatechange = () => {
            switch(connection.iceConnectionState) {
                case "closed":
                case "failed":
                case "disconnected":
                    runChecker();
                    break;
            }
        };
    });
    p2pConnectionReady.then((channel) => {
        console.log("Send data");
        channel.send("Hello world");
    });
} else {
    const path = SERVICE_PATH + resourceID;
    fetchRemoteSdp(path).then(data => {
        connectToRemote(data, true);
        data.ice.forEach(addIceCandidate);
        // if (data.answer) {
        //     connection.setRemoteDescription(new RTCSessionDescription({
        //         sdp: atob(data.answer),
        //         type: "offer",
        //     }));
        // } else {
        // }
        connection.createAnswer().then((desc) => {
            connection.setLocalDescription(desc);
            saveData(path, JSON.stringify({
                offer: btoa(data.offer),
                answer: btoa(desc.sdp!),
                ice: data.ice.map(btoa),
            }));
        });
    });
    p2pConnectionReady.then((channel) => {
        channel.onMessage = (msg) => {
            console.log("Received", msg);
        };
    });
}