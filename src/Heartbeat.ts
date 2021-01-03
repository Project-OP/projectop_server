import { Request, Response, Express } from 'express';
import { Player } from './data/Player';
import { MPlayer } from './MPlayer';
import { MRooms } from './MRooms';


class Item{
    lastPing: number;
    ws: WebSocket;
    name: string;
}

export class Heartbeat{

    wss: {[key: string]: Item} = {};
    purgeInterval = 100000; //
    expireTime = 100000; // 100s
    room: MRooms;
    disconnListener: (p: Player)=>void;
    
    constructor(room: MRooms, disabled = true){
        this.room = room;
        MPlayer.heartbeats = this;
        if (disabled){
            return;
        }
        try{
            this.CheckRepeat();
        }catch(e){
            console.trace(e);
        }
    }

    CheckRepeat(): void{
        setTimeout(async ()=>{
            try{
                
                await this.Purge();
                this.CheckRepeat();

            }catch(e){
                console.trace(e);
            }
            
        },this.purgeInterval);
    }

    async UpdateHBPlayer(sessId: string):Promise<void>{
        /*
        if (!this.hasKey(sessId)){
            return -1;
        }
        */
        try{
            const p = await MPlayer.EditBySessionId(sessId, (v)=>{
                v.heartbeat = Date.now();
                return v;
            });
            MPlayer.UpdateRoomHB(p);
        }catch(e){
            
        }
        

    }

    
    async Purge(): Promise<void>{
        const tooOld = (timestamp: number, date: number): boolean =>{
            const age = date - timestamp;
            return age > this.expireTime;
        }
        const now = Date.now();
        const del = [];
        
        for (const s of Object.keys(this.wss)){
            const v = this.wss[s];
            const diff = now - v.lastPing;
            if (diff > this.expireTime){
                del.push(s);
            } 
        }
        for (const s of del){
            delete this.wss[s];            
            this.NotifyDisconnect(s, "heartbeat not received in time");

            console.log("purged "+s+" from heartbeats");

        }
                        
    }
    

    Beat(ws: WebSocket, req: Request, msg): void{
        const sess = req.session.id;
        this.UpdateHBPlayer(sess);
        this.check(ws, req, sess);
        
    }


    async Close(ws: WebSocket, req: Request, msg): Promise<void>{
        try{
            setTimeout(()=>{
                const p = req.session['player'];
                if (p){
                    if (!this.wss[p.sessId]){
                        this.NotifyDisconnect(req.session['player'].sessId, "heartbeat socket closed on remote end");
                    }else{
                        console.log("player disconnected but reconnected with new ws");
                    }
                }
                
            },30000);
            
            const e = req.session?.id;
            
            if (e){
                if (this.wss[e]){
                    ///MPlayer.Delete(e);
                    delete this.wss[e];
                }
            }
        }catch(e){
            ///console.trace(e);
        }      
    }
    

    Err(ws: WebSocket, req: Request, msg): void{
        console.log("err "+req.session.id);
        console.log(msg);
        ws.send("err");

    }
    public GetWS(sessid: string){
        return this.wss[sessid];
    }
    private async check(ws: WebSocket, req: Request, sess: string){
        //console.log("handling connection");
        try{
            let e = this.wss[sess];
            if (!e){
                e = new Item();
                this.wss[sess] = e;
                //console.log("new session "+sess);
            }
            e.ws = ws;
            e.lastPing = Date.now();
            //console.log("updating heartbeat");
            
            ws.send("pong");
            //console.log("sending pong");
            
            
        }catch(e){
            console.log("error on heartbeat",e);
            ws.close();

        }
    
    }

  
    

    
    private async NotifyDisconnect(sess: string, reason: string){
        try{
            const p = await MPlayer.BySessionId(sess);
            this.room?.Get(p.roomId)?.Kick(p.sessId, reason);
        
        }catch(e){
            // room already closed
            console.trace("cannot get player from heartbeat socket",e);
        }
        
    }
    
  

    
    

    public AddDisconnectListener(cb: (Player)=>void): void{
        this.disconnListener = cb;
    }

    
    
}