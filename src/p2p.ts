import {todoApp} from "./app";
import {P2pConnectionClient, P2pConnectionHost} from "p2pConnection";

const isHost = window.location.search.indexOf("host") !== -1;

const connection = isHost
    ? new P2pConnectionHost(todoApp)
    : new P2pConnectionClient(todoApp);
connection.connect();