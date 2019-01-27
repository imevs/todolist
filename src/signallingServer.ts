export type RemoteOffer = {
    offer: string;
    iceOffer: string[];
    answers: {
        [clienId: string]: {
            answer: string;
            iceAnswer: string[];
        }
    },
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

const fetchRemoteSdp = (path: string): Promise<RemoteOffer> => {
    return fetch(path + "/latest").then(data => data.text()).then(data => JSON.parse(data));
};


export class SignallingServer {
    public send(data: RemoteOffer) {
        saveData(SERVICE_PATH + resourceID, JSON.stringify(data));
    }

    public onMessage = (originOffer: RemoteOffer | { clientId: number }, callback: (msg: RemoteOffer) => void) => {
        const path = SERVICE_PATH + resourceID;
        if ((originOffer as any).clientId !== undefined) {
            fetchRemoteSdp(path).then(data => {
                callback(data);
            });
        } else {
            const checkData = setInterval(() => {
                fetchRemoteSdp(path).then(data => {
                    let isNewAnswer = data.answers &&
                        Object.keys(data.answers).length !== Object.keys((originOffer as RemoteOffer).answers).length;
                    if (isNewAnswer) {
                        callback(data);
                        clearInterval(checkData);
                    }
                });
            }, 1000);
        }
    }

}