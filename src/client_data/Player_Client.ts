import { Card, Color, Value } from "../data/Card";
import { Player } from "../data/Player";
import { Seat } from "../data/Seat";
import { Card_Client } from "./Card_Client";
import { Hand_Client } from "./Hand_Client";
import { RoundTurn } from "./RoundTurn";

export class Player_Client{
    Name: string;
    Balance: number;
    CardsCount: number;
    Cards: Array<Card_Client> = [];
    you: boolean;
    roundturn: RoundTurn;
    empty: boolean;
    hand: Hand_Client;
    admin = false;

    static Empty(){
        const p = new Player("","");
        return new Player_Client(p,new Seat(p),false,false,true);
    }

    constructor(p: Player, v: Seat, isadmin:boolean, playerIsSelf=false, isEmpty = false){
        
        this.Name = v.name;
        this.Balance = v.money;
        this.you = playerIsSelf;
        this.CardsCount = v.cards.length;
        this.empty = isEmpty;
        this.admin = isadmin;
        this.roundturn = v.roundTurn;
        if (v){
            v.cards.forEach((c,i) =>{
                if (c.visible || playerIsSelf){
                    this.Cards.push(new Card_Client(c));
                }else{
                    this.Cards.push(new Card_Client(Card.Empty));
                }
                
            });
            const allvisible = this.Cards.every((v,i)=>{return v.visible;});
            if (playerIsSelf || allvisible){
                this.hand = new Hand_Client();
                if (v.hand){
                    this.hand.HandType  = v.hand.HandType.info;
                    this.hand.Highlights = Card_Client.From(v.hand.ValueCards);
                }
                
            }
        }
            
        
    }
}