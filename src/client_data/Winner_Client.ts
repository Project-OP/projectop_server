import { SidePot } from "../SidePotCalculator";

export class Winner_Client{
    name:string[] = [];
    seat_num:number[] = [];
    amount = 0;

    constructor(sidepot: SidePot, pos:number[]){
        this.amount = sidepot.amount;
        this.seat_num = pos;
        this.name = sidepot.winner.map(v=>v.name);
    }
    
}