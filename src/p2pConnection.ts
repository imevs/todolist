import {RemoteOffer, SignallingServer} from "./signallingServer";
import {setConnectedStatus, setConnectingStatus, setDisconnectedStatus} from "./connectionStatuses";

export abstract class P2pConnection {

    protected connection: RTCPeerConnection;
    protected iceCandidatesPromise: Promise<string[]>;
    protected signallingServer: SignallingServer;
    protected p2pConnectionReady: () => Promise<{
        send: (msg: string) => void;
        onMessage: (msg: MessageEvent) => void;
    }>;
    protected iceServers = [
        { urls: 'stun:stun.l.google.com:19302' },
        // { urls: 'stun:stun1.l.google.com:19302' },
        // { urls: 'stun:stun2.l.google.com:19302' },
        // { urls: 'stun:stun3.l.google.com:19302' },
        // { urls: 'stun:stun4.l.google.com:19302' },
        // {
        //     urls: 'turn:turn.bistri.com:80',
        //     credential: 'homeo',
        //     username: 'homeo'
        // }
        // {
        //     urls: 'turn:numb.viagenie.ca',
        //     credential: 'muazkh',
        //     username: 'webrtc@live.com'
        // }
    ];

    constructor(protected app: {
        _filter: (arg: true) => void;
        store: {
            setLocalStorage: (data: any) => void;
            getLocalStorage: () => any;
        }
    }) {
        this.signallingServer = new SignallingServer();
        this.connection = new RTCPeerConnection({ iceServers: this.iceServers });

        this.iceCandidatesPromise = new Promise((resolve, reject) => {
            const iceCandidates: string[] = [];
            this.connection.onicecandidate = (event) => {
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
        this.p2pConnectionReady = () => new Promise((resolve, reject) => {
            let channel: RTCDataChannel = this.connection.createDataChannel('dataChannel');
            channelExport.channel = channel;
            channel.onopen = () => {
                const readyState = channel.readyState;
                console.log('channel state is: ' + readyState);
                resolve(channelExport);
            };
            this.connection.ondatachannel = (event) => {
                console.log("ondatachannel");
                channel = event.channel;
                channelExport.channel = channel;
            };
            channel.onmessage = (data) => {
                channelExport.onMessage(data);
            };
        });
    }

    public addIceCandidate = (candidate: string) => {
        this.connection.addIceCandidate(new RTCIceCandidate({
            candidate: candidate,
            sdpMLineIndex: 0,
            sdpMid: "data",
        }));
    };

    public connectToRemote(args: RemoteOffer, isOffer: boolean) {
        this.connection.setRemoteDescription(new RTCSessionDescription({
            sdp: isOffer ? args.offer : args.answer,
            type: isOffer ? "offer" : "answer",
        }));
    };

    protected abstract sendOffer(): void;
    public abstract connect(): void;

    public setupReconnectLogic() {
        let isReconnecting = false;
        window.addEventListener('unhandledrejection', (error) => {
            if (isReconnecting) return;
            console.log("Fail to connect");
            setDisconnectedStatus();
            isReconnecting = true;
            setTimeout(() => {
                this.sendOffer();
                isReconnecting = false;
            }, 1000);
        });

        this.connection.oniceconnectionstatechange = () => {
            console.log("iceConnectionState", this.connection.iceConnectionState);
            switch(this.connection.iceConnectionState) {
                case "connected":
                case "completed":
                    setConnectedStatus();
                    break;
                case "closed":
                case "failed":
                case "disconnected":
                    setDisconnectedStatus();
                    this.sendOffer();
                    break;
            }
        };
    }
}

export class P2pConnectionHost extends P2pConnection {

    public createOffer(): Promise<RemoteOffer> {
        return this.connection.createOffer().then((desc) => {
            this.connection.setLocalDescription(desc);
            return this.iceCandidatesPromise.then((iceCandidates) => {
                const originOffer = {
                    offer: desc.sdp!,
                    answer: "",
                    iceAnswer: [],
                    iceOffer: iceCandidates,
                };
                this.signallingServer.send(originOffer);
                return originOffer;
            });
        });
    };

    protected sendOffer() {
        this.createOffer().then(offer => {
            setConnectingStatus();
            this.signallingServer.onMessage(offer, data => {
                this.connectToRemote(data, false);
                data.iceAnswer.forEach(this.addIceCandidate);
            });
        });
    }

    public connect() {
        this.p2pConnectionReady().then((channel) => {
            console.log("Send data");
            setInterval(() => {
                channel.send(JSON.stringify(this.app.store.getLocalStorage()));
            }, 5000);
        });
        this.sendOffer();
        this.setupReconnectLogic();
    }
}

export class P2pConnectionClient extends P2pConnection {
    protected sendOffer() {
        this.p2pConnectionReady().then((channel) => {
            channel.onMessage = (msg: MessageEvent) => {
                console.log("Received", msg);
                const data = JSON.parse(msg.data);
                this.app.store.setLocalStorage(data);
                this.app._filter(true);
            };
        });
        setConnectingStatus();
        this.signallingServer.onMessage(null, data => {
            this.connectToRemote(data, true);
            data.iceOffer.forEach(this.addIceCandidate);
            this.connection.createAnswer().then((desc) => {
                this.connection.setLocalDescription(desc);
                this.iceCandidatesPromise.then((iceAnswer) => {
                    this.signallingServer.send({
                        offer: data.offer,
                        answer: desc.sdp!,
                        iceAnswer: iceAnswer,
                        iceOffer: data.iceOffer,
                    });
                });
            });
        });
    }

    public connect() {
        this.sendOffer();
        this.setupReconnectLogic();
    }
}