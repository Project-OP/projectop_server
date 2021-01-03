import { MemoryStore } from "express-session";
import { Player } from "./data/Player";
import { Heartbeat } from "./Heartbeat";
import { MRoom } from "./MRoom";
import { MRooms } from "./MRooms";



export class MPlayer{
    
    static memoryStore: MemoryStore;
    static heartbeats: Heartbeat;
    static rooms: MRooms;
    static BySessionId(sess: string): Promise<Player>{

        return new Promise<Player>((resolve, reject) => {

            MPlayer.memoryStore.get(sess, function(err, ses){
                if (ses){
                    resolve(ses['player']);
                }else{
                    reject(err);
                }
            });
        });
    }
    static EditBySessionId(sess: string, p: (Player)=>Player): Promise<Player>{

        return new Promise<Player>((resolve, reject) => {

            MPlayer.memoryStore.get(sess, function(elem, ses){
                if (ses){
                    if (!ses['player']){
                        return reject();
                    }
                    const edited = p(ses['player']);
                    ses['player'] = edited;
                    MPlayer.memoryStore.set(sess,ses, function(){
                        resolve(ses['player']);
                    });
                    
                }else{
                    reject();
                }
            });
        });
    }


    static Notify(sid: string): void{
        if (!this.heartbeats){
            console.log("error, heartbeat is null");
        }else{
            const item = this.heartbeats.GetWS(sid);
            if (!item){
                console.log("error, heartbeat item is null");

            }else{
                const ws = item.ws;
                if (!ws){
                    console.log("error, heartbeat ws is null");
                }else{
                    try{
                        ws.send("Update");                    
                    }catch(e){
                        console.log()
                    }
    

                }
                
            }
        }
        
    }

    static async *All(): AsyncGenerator<Player>{
        const elem = await new Promise<Player>((resolve, reject)=>{
            try{
                MPlayer.memoryStore.all(async (err,s)=>{
                
                    for (const sid of Object.keys(s)){
                        const player = await MPlayer.BySessionId(sid);
                        resolve(player);
                    }
                    resolve(null);
                    
                });
            }catch(e){
                reject(e);
            }
            
        });

        if (!elem){
            return;
        }
        yield elem;
    }

    static async Delete(sessid: string): Promise<void>{
        try{
            MPlayer.memoryStore.destroy(sessid);
        }catch(e){
            //session already gone
        }
    }
    
    static  RegisterDisconnects(): void{
        this.heartbeats.AddDisconnectListener(async (p: Player)=>{
            const room = this.rooms.Get(p.roomId);
            if (!room){
                return;
            }
            await room.Kick(p.sessId, "user closed heartbeat connection");

        });
    }

    static UpdateRoomHB(p: Player){
        const r = this.rooms.Get(p.roomId);
        if (r){
            r.lastGameUpdate = Date.now();  
        }
    }
    
/*
    static SessionCount(): void{
        this.memoryStore.length((l)=>{
            console.log(l);  
        });
    }
    */
}

export function InitMPlayer(m: MemoryStore): void{
    MPlayer.memoryStore = m;
}