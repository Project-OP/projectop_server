import { Table } from "../data/Table";
import { Player } from "../data/Player";
import { Player_Client } from "./Player_Client";
import { Hand } from "../CardSolver";
import { Hand_Client } from "./Hand_Client";
import { Card_Client } from "./Card_Client";
import { MRoom } from "../MRoom";

export class Room_Client{

    id = "";
    table: Table;
    update_notification: string;
    update_notification_id: number;
    seats: Array<Player_Client> = [];
    msg = "";
    msg_cnt = -1;
    constructor(p: Player, r: MRoom){


        this.id = r.id;
        this.table = r.table.Data;
        let egoPos = -1;
        r.seats.forEach( (v,i) =>{
            if (v != null){
                const player = new Player_Client(p,v,r.alladmins || r.admins.includes(p.sessId),v.player == p.sessId);
                this.seats.push(player);
                if (v.player == p.sessId){
                    egoPos = i;
                }
            
            }else{
                this.seats.push(Player_Client.Empty());
            }
            
        });
        this.table.cards_center = Card_Client.From(r.table.cards_center);
        this.table.egoPos = egoPos;
        this.msg_cnt = r.msg_cnt;
        this.msg = r.msg;
        
        
        
    }
}