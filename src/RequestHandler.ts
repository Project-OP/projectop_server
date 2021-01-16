import { request, Request, Response } from "express";
import { Room_Client } from "./client_data/Room_Client";
import { Player } from "./data/Player";
import { Heartbeat } from "./Heartbeat";
import { IllegalOperationError } from "./IllegalOperationError";
import { MRoom } from "./MRoom";
import { MRooms } from "./MRooms";
import { WS, WSType } from "./WS";

export class RequestHandler{
    
    rooms: MRooms;
    hb: Heartbeat;

    static Instance: RequestHandler;
    constructor(rooms:MRooms){
        this.hb = new Heartbeat(rooms, false);
        this.rooms = rooms;
        RequestHandler.Instance = this;
    }

    public wsConn(ws: WebSocket, req: Request){
        WS.Send(ws, WSType.HELLO);
    }
  
    
    async StartGame(sessid: string, r: MRoom): Promise<void>{
        
        await r.Table.Startover(sessid);
        r.NotifyClients(sessid);
        
    }

    GetRoom(id: string): MRoom{
        const room = this.rooms.Get(id);
        if (room == null){
            throw new IllegalOperationError("cannot get room "+id,"no such room available");
        }else{
            return room;
        }
    }

    RevealCards(player: Player, visible: boolean){
        const room = this.rooms.Get(player.roomId);
        room.RevealCards(player.sessId, visible);
    }

    async Turn(sessid: string, rid: string, t: string, amount: string): Promise<MRoom>{
        const room = this.GetRoom(rid);
        await room.Turn(sessid,t, amount);
        room.NotifyClients(sessid);

        return room;
        
    }

    MyRoom(player: Player, req: Request, res: Response): void{
        if (player == null){
            throw new IllegalOperationError("cannot get room","you are not registered");

        }
        const rid = player.roomId;
        res.send({status:"success",roomid:""+rid});
        
    }

    RoomInfo(p: Player, r: MRoom, req: Request, res: Response): void{
        const c = r.RoomInfo(p);
        
        if (c == null){
            throw new IllegalOperationError("failed","error getting room info");
        }
        res.json(c); 
        
    }

    
}
