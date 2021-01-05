import { Hand } from "../CardSolver";
import { RoundTurn } from "../client_data/RoundTurn";
import { Card } from "./Card";
import { Player } from "./Player";

export class Seat{
    name: string;
    player: string;
    money = 0;
    cards: Array<Card> = [];
    roundTurn: RoundTurn;
    hand: Hand;
    payment_in_round = 0;
    win = 0;

    constructor(p: Player){
        this.player = p.sessId;
        this.name = p.name;
        this.cards = [];
        this.roundTurn = new RoundTurn();
    }
}