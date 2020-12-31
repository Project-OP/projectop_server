import { Player } from "../data/Player";
import { Seat } from "../data/Seat";
import { Player_Client } from "./Player_Client";

export class Members{
    players: Array<string> = [];
    seats: Array<string> = ["empty","empty","empty","empty","empty","empty","empty","empty"];

    constructor(ps: Array<Player>, seats: Array<Seat> ){
        //

        for (const p of ps){
            const e = p.name;
            this.players.push(e);            
        }
        
        for (const s of seats){
            if (s){
                const e = s.name;
                this.seats.push(e);
            }
                        
        }

    }
}