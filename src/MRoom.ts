import { Player } from "./data/Player";
import { MDeck } from "./MDeck";
import { Room_Client } from "./client_data/Room_Client";
import { Seat } from "./data/Seat";
import { IllegalOperationError } from "./IllegalOperationError";
import { MPlayer } from "./MPlayer";
import { Members } from "./client_data/Members_Client";
import { Action, GetTurn } from "./data/Turn";
import { Card_Client } from "./client_data/Card_Client";
import { Events } from "./Events";
import { ITable } from "./interfaces/ITable";
import { TableImpl } from "./Table/TableImpl";

export class MRoom{

    seats: Array<Seat> = [null,null,null,null,null,null,null,null]; 

    id = "";
    lastGameUpdate = 0;
    date = 0;
    player: Array<string> = []; // sessid[]
    maxSeats = 8;
    maxSpectators = 30;
    table: ITable;
    deck: MDeck; // deck stays here because the table goes to the client unfiltered
    
    msg = "";
    msg_cnt = 0;

    admins:Array<string> = [];
    alladmins = false;

    constructor(roomId: string,sessid: string){

        this.id = roomId;
        this.lastGameUpdate = Date.now();
        this.date = Date.now();
        this.deck = new MDeck();
        this.table = new TableImpl(this.seats, this.deck,this.setMessage);
        
        Events.Instance.onMessage.subscribe(async ([s,n,sess])=>{
            this.msg = s;
            this.msg_cnt=n;
            await this.NotifyClients(sess);
        });
        this.table.setMessage = (msg: string, sessid: string) =>{
            this.setMessage(msg,sessid);
        };
        this.admins.push(sessid);

        
    }

    setMessage(msg: string, sessid: string){
        this.msg = msg;
        this.msg_cnt++;

        this.NotifyClients(sessid);

    }

    

    get AgeCreated(): number{
        return Date.now() - this.date;
    }

    get Table(): ITable{
        this.table.Data.cards_center = Card_Client.From(this.table.cards_center); 
        return this.table;
    }

    get Deck(): MDeck{
        return this.deck;
    }


    get lastUpdated(): number{
        return this.lastGameUpdate;
    }
    get IsEmpty(): boolean{
        return this.player.length == 0;
        //        return this.seats.filter(e => e != null).length == 0;
    }



    public SetAdmin(p:Player,sessid_promote:string, all:boolean){

        this.checkAdmin(p.sessId);
        if (sessid_promote){
            this.admins.push(sessid_promote);

            
        }
        if (all !== undefined && all !== null){
            this.alladmins = all;
            if (all){
                this.setMessage(p.name + " made us all to admins",p.sessId);
            }else{
                this.setMessage(p.name + " took your admin rights",p.sessId);
            }
            
        }
        this.NotifyClients(p.sessId);

        
    }
    public IsAdmin(sessid:string){
        return this.alladmins  || this.admins.includes(sessid);

    }

    public checkAdmin(sessid:string){
        if (!this.IsAdmin(sessid)){
            throw new IllegalOperationError("Cannot perform admin operation","you are not an admin!");
        }
    }
    public Admin_SetAmount(p:Player, amount:number){
        this.checkAdmin(p.sessId);
        
        const [seat, num] = this.Table.getSeat(p.sessId);
        seat.money = amount;
        this.NotifyClients(p.sessId);


    }

    public async Admin_Fold_Current(p:Player){
        this.checkAdmin(p.sessId);        
        const current_turn = this.table.Data.player_turn;
        const fold_sessid = this.seats[current_turn].player;
        await this.Turn(fold_sessid,Action.fold,"0");
        this.setMessage("player force-fold by "+p.name,p.sessId);
        this.NotifyClients(p.sessId);

    }

    public async Admin_Kick_Current(p:Player){
        this.checkAdmin(p.sessId);        
        const current_turn = this.table.Data.player_turn;
        const fold_sessid = this.seats[current_turn].player;
        await this.Kick(fold_sessid,"kicked by admin");
        this.setMessage("admin kicked "+p.name,p.sessId);
        this.NotifyClients(p.sessId);

    }

    
   

    Join(p: Player, skipsesscheck = false):void{
        if (this.player.length >= this.maxSpectators){
            throw new IllegalOperationError("You cannot join","Room has too many spectators");

        }
        if (this.player.includes(p.sessId)){
            throw new IllegalOperationError("You cannot join","You are already in this room");
        }

        if (p.roomId != ""){
            
            throw new IllegalOperationError("You cannot join","You are already in this room: "+p.roomId);
        }
        p.roomId = this.id;
        this.player.push(p.sessId);
        
        this.NotifyClients(p.sessId);

    }

    Has(p:Player): boolean{
        return this.player.includes(p.sessId);
    }

 
    async Sitout(p: Player){
        await this.Table.Sitout(p);
        this.NotifyClients(p.sessId);

    }
     
    Sitin(p: Player){
        this.Table.Sitin(p);
        this.NotifyClients(p.sessId);

    }

    
    RoomInfo(p: Player, as_update = false) : Room_Client{
        if (!as_update && (!p || !p.sessId || p.sessId == "")){
            console.trace("Error room info",p);
            throw new IllegalOperationError("cannot get room", "invalid session data");

        }
        

        return new Room_Client(p, this);
        
    }

    async Leave(p: Player): Promise<void>{
        
        if (!this.player.includes(p.sessId)){
            throw new IllegalOperationError("You cannot leave","You are not in this room");
        }
        console.log("Player "+p.name + "left the game");
        await this.LeaveRoom(p.sessId);
        

    }

    private async LeaveRoom(sessid: string, dontnotify = false): Promise<void>{
        
        try{
            this.Table.getSeat(sessid);
            if (this.Table.isPlayerTurn(sessid)){
                await this.Table.Turn(sessid,Action.fold, 0);                
            }
            
        }catch(e){
            console.log("leaving room without being seated");
        }
        
        function rm(elem, array, keepPlace=false){
            const index = array.indexOf(elem);
            if (index > -1) {
                if (keepPlace){
                    array[index] = null;
                }else{
                    array.splice(index, 1);
                }
                
            }
        }
        let delitem = null;
        this.seats.forEach(element => {
            if (element != null){   
                if (element.player == sessid){
                    delitem = element;
                }    
            }
        });
        
        rm(delitem,this.seats,true);
        rm(sessid,this.player);
        
        this.NotifyClients(sessid);



    }

    async Turn(sessid: string, action: string, amount: string): Promise<void>{
        const e_action: Action = GetTurn(action);
        let amt = undefined;
        if (amount){
            try{
                amt = Number.parseInt(amount);
            }catch(e){
                throw new IllegalOperationError("cannot take turn", "amount must be empty or a number");
            }
            
        }
        await this.table.Turn(sessid,e_action, amt);
        this.NotifyClients(sessid);

    }
    get SeatsNotNull(): Array<Seat>{
        return this.seats.filter((s) => s != null);

    }
    Sit(p: Player, pos = -1): void{

        if (this.IsSitting(p)){
            throw new IllegalOperationError("Cannot sit down","You are already sitting");
        }

        if (this.SeatsNotNull.length >= this.maxSeats){
            throw new IllegalOperationError("Cannot sit down","All seats taken");
        }
        if (pos > this.maxSeats-1 || pos < -1){
            throw new IllegalOperationError("Cannot sit down","Choose between 0 and 7");
        }
        
        if (this.seats[pos] != null){
            throw new IllegalOperationError("Cannot sit down","There is already someone sitting");
        }
        const s = new Seat(p);

        // take first free seat
        if (pos == -1){
            //this.seats.push(s);
            for(let i = 0; i < this.seats.length; i++){
                const e = this.seats[i];
                if (e == null){
                    this.seats[i] = s;
                    break;
                }
                
            }

        }else{
            this.seats[pos] = s;
        }
        if (this.table.Data.active){
            // if the game started, you sit out
            const [seat, pos ]= this.table.getSeat(p.sessId)
            seat.roundTurn.sitout = true;
            seat.roundTurn.join_next_round = true;
            seat.money = this.table.Data.startBalance;
        }
        this.NotifyClients(p.sessId);

        

    }
    IsSitting(p: Player): boolean{
        
        for (let i=0;i<this.seats.length;i++){
            const v = this.seats[i];
            if (v == null){
                continue;
            }
            if (v.player == p.sessId){

                return true;
            }
        }
        return false;
    }

    
    async Kick(sessid: string, reason: string, dontnotify = false): Promise<void>{
        console.log("Kicking "+sessid+" due to "+reason);
        try{

            await this.LeaveRoom(sessid, dontnotify);
        }catch(e){
            console.log("cannot kick player, not in the room");
        }
        
    }
    public ClearAll(): void{
        for(const p of this.player){
           this.Kick(p, "room purged"); 
        }
        this.NotifyClients("");

    }
    async NotifyClients(omit: string, skipSessionCheck = true): Promise<void>{
        //console.log("Updating all clients");
        for(const sid of this.player){
            // TODO is session valid?
            /*
            if (!skipSessionCheck){
                try{
                    await MPlayer.BySessionId(sid);
                }catch(e){
                    //await this.Kick(sid,"session invalid");
                    console.log("error notify player, session invalid")
                }
            }
            */
            if (sid != omit){
                // do not notify the cause of the change, only other observers
                MPlayer.Notify(sid);
            }
            
        }
        
    }

    
    
    async Members(): Promise<Members>{
        
        const pstrings = this.player;
        const players = []
        for(const s of pstrings){
            try{
                const p = await MPlayer.BySessionId(s);
                players.push(p);
            }catch(e){
                console.trace(e);
            }
            
        }
        const seats = this.seats; 
        const ret = new Members(players, seats);
        
        return ret;
    }

    
    
    
}

