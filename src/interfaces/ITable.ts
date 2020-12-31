import { Player } from "../data/Player";
import { Seat } from "../data/Seat";
import { Table } from "../data/Table";
import { MDeck } from "../MDeck";
import {Action} from "../data/Turn";
import { Card } from "../data/Card";

export interface ITable{
    Data: Table;
    cards_center: Card[];
    
    setMessage: (msg: string,sessid: string)=>void;    
    Sitout(p: Player): Promise<void>;
    Sitin(p: Player): Promise<void>;
    NewGame(initial: boolean, sessid: string): Promise<void>;
    Startover(sessid: string): Promise<void>;
    Turn(sessid: string, action: Action, amount:number): Promise<void>;
    isPlayerTurn(sessid: string):boolean;
    UpdatePlayerList(sessid: string):Promise<void>;
    getSeat(sessid: string): [Seat, number];
}