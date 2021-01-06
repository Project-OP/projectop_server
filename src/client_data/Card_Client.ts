import { Card } from "../data/Card";

export class Card_Client{
    public color: string;
    public value: string;
    public visible: boolean;
    public hasWon = false;

    constructor(card: Card){
        this.color = card.color.name;
        this.value = card.value.name;
        this.visible = card.visible;
        this.hasWon = card.hasWon;

    }

    static From(a: Array<Card>): Card_Client[]{
        const ret = new Array<Card_Client>();
        for(const c of a){
            ret.push(new Card_Client(c));
        }
        return ret;
    }

}