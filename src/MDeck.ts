import {Card, Value, Color} from "./data/Card";
import { Deck } from "./data/Deck";
import {Helper} from "./Helper";

export class MDeck{
   
    private deck: Deck;
    constructor(){
        this.New();
    }
    
    New(){
        this.deck = new Deck();
        for (const v of Value.All()){
            for (const c of Color.All()){
                const card = new Card(c, v);
                this.deck.cards.push(card)
            }
        }
    }
    
    Shuffle(){
        this.deck.cards = Helper.shuffle(this.deck.cards);
    }
    
    Take(amount = 1): Array<Card>{

        if (this.deck.cards.length < amount){
            throw new Error("Not enough cards in the Deck to draw "+amount+" of cards");
        }
        const ret = [];
        for (let i = 0; i < amount; i++){
            ret.push(this.deck.cards.shift());
        }
        return ret;

    }

    
}



