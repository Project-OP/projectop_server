export class Player{
    sessId;
    name;
    gameId;
    lastUpdate;
    roomId;
    heartbeat: number;
    constructor(sessid: any, name: string){
        this.sessId = sessid;
        this.name = name;
        this.lastUpdate = Date.now();
        this.roomId = "";

    }

    //static Edit(player: Player)
}