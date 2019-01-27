
export function setConnectedStatus() {
    console.log("setConnectedStatus");
    const bar = document.querySelector("[name=theme-color]") as HTMLMetaElement;
    bar.content = "green";
    const favicon = document.getElementById('favicon') as HTMLLinkElement;
    favicon.href = "circle-green.png";
}

export function setDisconnectedStatus() {
    console.log("setDisconnectedStatus");
    const bar = document.querySelector("[name=theme-color]") as HTMLMetaElement;
    bar.content = "red";
    const favicon = document.getElementById('favicon') as HTMLLinkElement;
    favicon.href = "circle-red.png";
}

export function setConnectingStatus() {
    console.log("setConnectingStatus");
    const bar = document.querySelector("[name=theme-color]") as HTMLMetaElement;
    bar.content = "orange";
    const favicon = document.getElementById('favicon') as HTMLLinkElement;
    favicon.href = "circle-orange.png";
}