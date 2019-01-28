export type Offer = { sdp: string; ice: string[]; };

export type SessionInfo = Offer & {
    answer: Offer;
};

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

const fetchRemoteSdp = (path: string): Promise<SessionInfo> => {
    return fetch(path + "/latest").then(data => data.text()).then(data => JSON.parse(data));
};


export class SignallingServer {

    public sessionInfo: SessionInfo | undefined;

    public save(data: SessionInfo) {
        saveData(SERVICE_PATH + resourceID, JSON.stringify(data));
    }

    public send(data: Offer) {
        this.save({
            ...this.sessionInfo!, answer: data
        });
    }

    public getHostInfo(callback: (msg: Offer) => void) {
        const path = SERVICE_PATH + resourceID;
        fetchRemoteSdp(path).then(data => {
            this.sessionInfo = data;
            callback({
                sdp: data.sdp,
                ice: data.ice,
            });
        });
    }

    public onNewClient(originOffer: SessionInfo, callback: (msg: Offer) => void) {
        const path = SERVICE_PATH + resourceID;
        const checkData = setInterval(() => {
            fetchRemoteSdp(path).then(data => {
                this.sessionInfo = data;
                let isNewAnswer = data.answer && data.answer.sdp && data.answer.sdp !== originOffer.answer.sdp;
                if (isNewAnswer) {
                    originOffer = data;
                    callback({
                        sdp: data.answer.sdp,
                        ice: data.answer.ice,
                    });
                    clearInterval(checkData);
                }
            });
        }, 1000);
    }

}