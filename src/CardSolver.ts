import { Card, Color, Value } from "./data/Card";
import { Player } from "./data/Player";
import { Seat } from "./data/Seat";
import { MDeck } from "./MDeck";

export class CardSolver{

    permuts7: Array<Array<number>> = []    

    permuts6: Array<Array<number>> = []    
    constructor(){
        this.permuts6 = allPermuts(true);
        this.permuts7 = allPermuts();
        
    }

    
    public SolveTable(player: Array<PlayerHand>, table: Array<Card>, dontorder=false):Array<Hand>{

        const final = [];
        for(const p of player){
            const bighand = new BigHand (p.owner, [].concat(table,p.cards));
            bighand.cards.sort(Card.GetComparator());
            const playerHand = this.GetBest5(bighand);
            final.push(playerHand);
        }
        if (dontorder){
            return final;
        }
        return this.GetBestHand(final);
        
    }
    
    private GetBestHand(final: Array<Hand>): Array<Hand>{

        final.sort(Hand.GetComparator());
        return final;
    }

    GetBest5(bighand: BigHand): Hand{
        const playerHand:Hand[] = [];
        let pa = this.permuts7;
        if (bighand.cards.length == 6){
            pa = this.permuts6;
        }
        if (bighand.cards.length < 6){
            let hand = this.EvalHand(new Hand(bighand.owner, bighand.cards));
            playerHand.push(hand);
        }else{
            for(const permut of pa){
                let  hand = bighand.GetHand(permut);            
                hand = this.EvalHand(hand);

                playerHand.push(hand);
            }    
        }
               

        playerHand.sort(Hand.GetComparator());
        const best = playerHand[0];
        return best;
    }

    
    EvalHand(hand: Hand): Hand{

        hand.cards = Array.from(hand.cards);
        // straight
        const acelow =  hand.query(Value.v_2).length != 0; // if there is a 2, we use the ace as 1
        hand.cards.sort(Card.GetComparator(acelow));

        let isStraight = false;
        for (let i = 0; i < hand.cards.length-1; i++){
            const cur = hand.cards[i].ValueAsInt(acelow);
            if (!hand.cards[i+1]){
                break;
            }
            const next = hand.cards[i+1].ValueAsInt(acelow);
            //console.log("cur",cur);
            
            if (cur != next + 1){
                isStraight = false;
                break;
            }
            
            isStraight = true;
        }
        // check flush
        let isFlush = hand.cards.filter(v=>v != null && v != undefined).every((v,i) => {
           return v.color ==  hand.cards[0].color;
        });

        if (hand.cards.length < 5){
            isFlush = false;
            isStraight = false;
        }
       

        // check pairs, triple, 4 of a kind
        
        const consecutives = [1,1,1,1,1];
        let cumsum = 1;
        for (let i = 1; i < hand.cards.length; i++){
            const cur = hand.cards[i];
            const last = hand.cards[i-1];
            if (!cur){
                break;
            }
            if (cur.ValueAsInt() == last.ValueAsInt()){
                cumsum++;
                consecutives[i-1] = 1;
                
                
            }else{
                cumsum=1;
            }
            consecutives[i]=cumsum;
            
        }
        // indices
        const i4 = consecutives.indexOf(4);
        const i3 = consecutives.indexOf(3);
        const i2 = consecutives.indexOf(2);
        const i2_2 = consecutives.lastIndexOf(2);
        
        let p4 = -1;
        let p3 = -1;
        let p2 = -1;
        let p2_2 = -1;

        if (i4 >= 0){
            p4 = i4 - 3;
        }
        if (i3 >= 0){
            p3 = i3-2;
        }
        if (i2 >= 0){
            p2 = i2 -1;
        }
        if (i2_2 >= 0){
            p2_2 = i2_2 -1;
        }

        hand.pair_index = p2;
        hand.pair_2_index = p2_2;
        hand.triple_index = p3;
        hand.four_index = p4;

            
        if (p4 != -1){
            hand.HandType = HandValues.Fourofakind;
        }else if (p3 != -1 && (p2 != -1 || p2_2!=-1)){
            hand.HandType = HandValues.Fullhouse;
        }else if (p3 != -1){
            hand.HandType = HandValues.Triple;
        }else if (p2 != -1 && p2_2 != -1 && p2_2 != p2){
            hand.HandType = HandValues.Twopair;
        }else if (p2 != -1){
            hand.HandType = HandValues.Pair;
        }else if (isFlush && isStraight){
            hand.HandType = HandValues.Straightflush;
            //check royalflush
            const withace = hand.query(Value.v_A).length != 0
            if (withace){
                hand.HandType = HandValues.Royalflush;
            }
        }else if (isFlush){
            hand.HandType = HandValues.Flush;
        }else if (isStraight){
            hand.HandType = HandValues.Straight;
        }else{
            hand.HandType = HandValues.Highcard;
        }

        let valueIndex;
        switch(hand.HandType){
            case HandValues.Highcard:
                hand.ValueCards = [];
                hand.Highcards = hand.cards;
                break;
            case HandValues.Pair:
                valueIndex = [hand.pair_index,hand.pair_index+1];
                hand.SetValueNonValueByIndexArray(valueIndex);
                break;
            case HandValues.Twopair:
                valueIndex = [hand.pair_index,hand.pair_index+1,hand.pair_2_index,hand.pair_2_index+1];
                hand.SetValueNonValueByIndexArray(valueIndex);
                break;
            case HandValues.Triple:
                valueIndex = [hand.triple_index,hand.triple_index+1,hand.triple_index+2];
                hand.SetValueNonValueByIndexArray(valueIndex);
                break;
            case HandValues.Straight:
                break;
            case HandValues.Flush:
                break;
            case HandValues.Fullhouse:
                valueIndex = [hand.triple_index,hand.triple_index+1,hand.triple_index+2, hand.pair_index,hand.pair_index+1];
                hand.SetValueNonValueByIndexArray(valueIndex);
                break;
            case HandValues.Fourofakind:
                valueIndex = [hand.four_index,hand.four_index+1,hand.four_index+2, hand.four_index+3];
                hand.SetValueNonValueByIndexArray(valueIndex);
                break;
            case HandValues.Straightflush:
                break;
            case HandValues.Royalflush:
                break;
            default:
                
                break;
        }
        
        if (isStraight ||isFlush){
            hand.ValueCards = hand.cards;
        }
        //hand.str = hand.owner.name;
        return hand;
    }


    GetSplits(winners: Hand[]){
        // returns all split pots, 
        const splits = [];
        for(let i = 0; i < winners.length-1; i++){
            const cmp = Hand.GetComparator();
            const wcur = winners[i];
            const wnxt = winners[i+1];

            const r = cmp(wcur,wnxt);
            if (r == 0){
                //split pot
                if (!splits.includes(i)){
                    splits.push(i);
                }
                if (!splits.includes(i+i)){
                    splits.push(i+1);
                }

            }else{
                break;
            }
        }
        return splits;
        
    }

    GetSplitsSeat(winners: Array<{sidepotindex: number, seat:Seat}>):number[]{
        // returns all split pots, 
        const splits = [];
        for(let i = 0; i < winners.length-1; i++){
            const cmp = Hand.GetComparator();
            const wcur = winners[i].seat.hand;
            const wnxt = winners[i+1].seat.hand;

            const r = cmp(wcur,wnxt);
            if (r == 0){
                //split pot
                if (!splits.includes(i)){
                    splits.push(i);
                }
                if (!splits.includes(i+1)){
                    splits.push(i+1);
                }

            }else{
                break;
            }
        }
        if (splits.length == 0){
            return [0];
        }
        return splits;
        
    }






}

class BigHand{
    cards: Array<Card> = [];
    owner: Seat;
    constructor (owner: Seat, bighand: Array<Card>){
        this.cards = bighand;
        this.owner = owner;
    }

    GetHand(indexPermutArray: Array<number> ): Hand{
        //
        const handCards:Card[] = [];
        for (let i = 0; i < 5; i++){
            handCards.push(this.cards[indexPermutArray[i]]);

        }
        const h = new Hand(this.owner,handCards);
        return h;
    }

}


export class PlayerHand{
    owner: Seat;
    cards: Array<Card> = [];
    constructor(ownerid: Seat, cards: Array<Card>){
        this.cards = Array.from(cards);
        this.owner = ownerid;
    }
}

export class Hand{
    owner: Seat;
    cards: Array<Card> = [];


    ValueCards:Array<Card> = [];
    HandType: HandValues;
    Highcards:Array<Card> = [];

    pair_index = -1;
    pair_2_index = -1;
    triple_index = -1;
    four_index = -1;

    //str = "";

    constructor(ownerid: Seat, cards: Array<Card>){
        this.cards = cards; 
        this.owner = ownerid;
        this.ValueCards = []; // the cards that give the hand the value, the hand is combined of valuecards and highcards
        this.HandType = HandValues.Unknown;
        this.Highcards = [];
    }

    
    public SetValueNonValueByIndexArray(valueCardsIndexArray:Array<number>){
        let nonval = Array.from(this.cards);
        let val = [];
        

        for(const i of valueCardsIndexArray){
            const valueelem = nonval.splice(i,1,null)[0] ;
            val = val.concat(valueelem);
            
        }
        nonval = nonval.filter((v,i) =>{
            return v != null;
        });

        this.ValueCards = val;
        this.Highcards = nonval;
    }

    query(v: Value = null, c: Color = null): Array<Card>{
        
        if (!c && !v){
            return [];
        }
        
        return this.cards.filter((card,i)=>{
            if (card){
                if (c && v){
                    return card.color == c && card.value == v;
                }else if (c){
                    return card.color == c;
                }else{
                    return card.value == v;   
                }
            }else{
                return [];
            }
            
            
        });
    }

    toString(){
        const who = this.owner.name.toString();
        const type = this.HandType.info.toString();
        switch(this.HandType){
            
            case HandValues.Unknown:
                return this.cards.toString();
                
            case HandValues.Pair:
            case HandValues.Triple:
            case HandValues.Fourofakind:
                return `${who}: ${type} with ${this.ValueCards[0].value}, highcards: ${this.Highcards.toString()}`;
            case HandValues.Twopair:
                return `${who}: ${type} with ${this.ValueCards[0].value} and ${this.ValueCards[2].value}, highcard: ${this.Highcards[0].toString()}`;
            case HandValues.Flush:
                return `${who}: ${type} of ${this.ValueCards[0].color}, ${this.ValueCards[0].value} high`;
            case HandValues.Straight:
                return `${who}: ${type}, ${this.ValueCards[0].toString()} high`;                                                                
            case HandValues.Straightflush:
                return `${who}: ${type}, ${this.ValueCards[0].value} high`;                                                                
            case HandValues.Fullhouse:
                return `${who}: ${type} with ${this.ValueCards[0].value} and ${this.ValueCards[3].value}`;                                                                            
            case HandValues.Royalflush:
                return `${who}: ${type} in ${this.ValueCards[0].color}`;    
            case HandValues.Highcard:
                return `${who}: ${type}: ${this.Highcards.toString()}`;
        }
        
    }

    static GetComparator(){
        return (a: Hand, b: Hand) => {
            if (!a && !b){
                return 0;
            }
            if (!a){
                return 1;
            }
            if (!b){
                return -1;
            }
            const primaryComparator = HandValues.GetComparator();
            const primary = primaryComparator(a.HandType, b.HandType);
            if (primary != 0){
                
                return primary;
            }
            for (let i = 0; i < a.ValueCards.length; i++){
                let va = 0;
                let vb = 0;
                if (a.ValueCards[i]){
                    va = a.ValueCards[i].ValueAsInt();
                }
                if (b.ValueCards[i]){
                    vb = b.ValueCards[i].ValueAsInt();
                }

                
                const cmp = vb - va;
                if (cmp != 0){
                    
                    return cmp;
                }
            }
            for (let i = 0; i < a.Highcards.length; i++){
                let va = 0;
                let vb = 0;
                if (a.Highcards[i]){
                    va = a.Highcards[i].ValueAsInt();
                }
                if (b.Highcards[i]){
                    vb = b.Highcards[i].ValueAsInt();
                }

                
                const cmp = vb - va;
                
                if (cmp != 0){
                    
                    return cmp;
                }
            }
            return 0;
        }
    }

    

    
    

}

class HandValues{
    public static Unknown        = new HandValues("Unknown",       -1);
    public static Highcard       = new HandValues("High Card",      0);
    public static Pair           = new HandValues("Pair",           1);
    public static Twopair        = new HandValues("Two Pair",       2);
    public static Triple         = new HandValues("Triple",         3);
    public static Straight       = new HandValues("Straight",       4);
    public static Flush          = new HandValues("Flush",          5);
    public static Fullhouse      = new HandValues("Full House",     6);
    public static Fourofakind    = new HandValues("Four of a Kind", 7);
    public static Straightflush  = new HandValues("Straight Flush", 8);
    public static Royalflush     = new HandValues("Royal Flush",    9);

    info: string;
    rank = 0;
    constructor(info: string, rank: number){
        this.info = info;
        this.rank = rank;
    }
    

    public static GetComparator(){
        return (a: HandValues, b: HandValues)=>{
            return b.rank - a.rank;
        };
    }

    toString(){
        return this.info;
    }
}


// test straight
// test flush
// test straightflush
// test has 4
// test triple
// test pair count; has pair, remove, has pair
// test 
function allPermuts(outof6 = false){
    let len =7;
    if (outof6){
        len = 6;
    }
    const all = new Array(len);

    for(let i = 0; i < all.length; i++){
        all[i]=i;
    }
    const removes = [];
    for (let i0 = 0; i0 < all.length; i0++){
        if (outof6){
            removes.push(i0);
        }else{
            for (let i1 = i0+1; i1 < all.length; i1++){
                removes.push([i0,i1]);
            }
        }
        
    }
    const valids = [];
    for(const rm of removes){
        const cpy = Array.from(all);

        cpy.splice(rm[0],1,null);
        if(!outof6){
            cpy.splice(rm[1],1,null);
        }
        const v = cpy.filter((v,i)=> {
            return v != null; 
        });
        valids.push(v);

    }
    return valids;
}


////// TEST 

function getHand(v: HandValues, acelow = false){
    if (v == HandValues.Royalflush){
        const cards = [
            new Card(Color.Clubs,Value.v_10),
            new Card(Color.Clubs,Value.v_K),
            new Card(Color.Clubs,Value.v_Q),
            new Card(Color.Clubs,Value.v_J),
            new Card(Color.Clubs,Value.v_A),
        ];
        return new Hand(new Seat(new Player("","Name")),cards);
    }
    if (acelow){
        if (v == HandValues.Straight){
            const cards = [
                new Card(Color.Clubs,Value.v_A),
                new Card(Color.Hearts,Value.v_2),
                new Card(Color.Clubs,Value.v_4),
                new Card(Color.Clubs,Value.v_3),
                new Card(Color.Clubs,Value.v_5),
            ];
            return new Hand(new Seat(new Player("","Name")),cards);
        }
    }
    if (v == HandValues.Straight){
        const cards = [
            new Card(Color.Clubs,Value.v_A),
            new Card(Color.Hearts,Value.v_K),
            new Card(Color.Clubs,Value.v_Q),
            new Card(Color.Clubs,Value.v_J),
            new Card(Color.Clubs,Value.v_10),
        ];
        return new Hand(new Seat(new Player("","Name")),cards);
    }
    
    if (v == HandValues.Straightflush){
        const cards = [
            new Card(Color.Clubs,Value.v_A),
            new Card(Color.Clubs,Value.v_K),
            new Card(Color.Clubs,Value.v_Q),
            new Card(Color.Clubs,Value.v_J),
            new Card(Color.Clubs,Value.v_10),
        ];
        return new Hand(new Seat(new Player("","Name")),cards);
    }
    if (v == HandValues.Flush){
        const cards = [
            new Card(Color.Clubs,Value.v_2),
            new Card(Color.Clubs,Value.v_K),
            new Card(Color.Clubs,Value.v_Q),
            new Card(Color.Clubs,Value.v_J),
            new Card(Color.Clubs,Value.v_10),
        ];
        return new Hand(new Seat(new Player("","Name")),cards);
    }
    if (v == HandValues.Fourofakind){
        const cards = [
            new Card(Color.Clubs,Value.v_2),
            new Card(Color.Hearts,Value.v_J),
            new Card(Color.Diamonds,Value.v_J),
            new Card(Color.Spades,Value.v_J),
            new Card(Color.Clubs,Value.v_J)
        ];
        return new Hand(new Seat(new Player("","Name")),cards);
    }
    if (v == HandValues.Triple){
        const cards = [
            new Card(Color.Hearts,Value.v_J),
            new Card(Color.Diamonds,Value.v_J),
            new Card(Color.Spades,Value.v_J),
            new Card(Color.Clubs,Value.v_Q),
            new Card(Color.Clubs,Value.v_A),
        ];
        return new Hand(new Seat(new Player("","Name")),cards);
    }
    if (v == HandValues.Twopair){
        const cards = [
            new Card(Color.Hearts,Value.v_J),
            new Card(Color.Diamonds,Value.v_J),
            new Card(Color.Spades,Value.v_Q),
            new Card(Color.Clubs,Value.v_Q),
            new Card(Color.Clubs,Value.v_4),
        ];
        return new Hand(new Seat(new Player("","Name")),cards);
    }
    if (v == HandValues.Pair){
        const cards = [
            new Card(Color.Hearts,Value.v_J),
            new Card(Color.Diamonds,Value.v_J),
            new Card(Color.Spades,Value.v_2),
            new Card(Color.Clubs,Value.v_Q),
            new Card(Color.Clubs,Value.v_4),
        ];
        return new Hand(new Seat(new Player("","Name")),cards);
    }
    if (v == HandValues.Fullhouse){
        const cards = [
            new Card(Color.Hearts,Value.v_A),
            new Card(Color.Diamonds,Value.v_A),
            new Card(Color.Spades,Value.v_Q),
            new Card(Color.Clubs,Value.v_Q),
            new Card(Color.Hearts,Value.v_Q),
        ];
        return new Hand(new Seat(new Player("","Name")),cards);
    }
    if (v == HandValues.Highcard){
        const cards = [
            new Card(Color.Hearts,Value.v_J),
            new Card(Color.Diamonds,Value.v_2),
            new Card(Color.Spades,Value.v_10),
            new Card(Color.Clubs,Value.v_7),
            new Card(Color.Hearts,Value.v_8),
        ];
        return new Hand(new Seat(new Player("","Name")),cards);
    }

    
}



function TestEvalHand(){
    const test = new CardSolver();
    
    console.log(test.EvalHand(getHand(HandValues.Highcard)).toString());
    console.log(test.EvalHand(getHand(HandValues.Pair)).toString());
    console.log(test.EvalHand(getHand(HandValues.Twopair)).toString());
    console.log(test.EvalHand(getHand(HandValues.Triple)).toString());
    console.log(test.EvalHand(getHand(HandValues.Straight)).toString());
    console.log(test.EvalHand(getHand(HandValues.Flush)).toString());
    console.log(test.EvalHand(getHand(HandValues.Fullhouse)).toString());
    console.log(test.EvalHand(getHand(HandValues.Fourofakind)).toString());
    console.log(test.EvalHand(getHand(HandValues.Straightflush)).toString());
    console.log(test.EvalHand(getHand(HandValues.Royalflush)).toString());

    console.log(test.EvalHand(getHand(HandValues.Straight)));

}

function TestRankHands(){
    const pair10 = new Hand(new Seat(new Player("","Name")), [
        new Card(Color.Hearts,Value.v_J),
        new Card(Color.Hearts,Value.v_2),
        new Card(Color.Hearts,Value.v_10),
        new Card(Color.Hearts,Value.v_7),
        new Card(Color.Clubs,Value.v_10),
    ]);
    const flush = new Hand(new Seat(new Player("","Name")), [
        new Card(Color.Hearts,Value.v_J),
        new Card(Color.Hearts,Value.v_2),
        new Card(Color.Hearts,Value.v_10),
        new Card(Color.Hearts,Value.v_7),
        new Card(Color.Hearts,Value.v_8),
    ])
    const flushAce = new Hand(new Seat(new Player("","Name")), [
        new Card(Color.Hearts,Value.v_A),
        new Card(Color.Hearts,Value.v_2),
        new Card(Color.Hearts,Value.v_10),
        new Card(Color.Hearts,Value.v_7),
        new Card(Color.Hearts,Value.v_8),
    ])
    const flushAce2 = new Hand(new Seat(new Player("","Name")), [
        new Card(Color.Hearts,Value.v_A),
        new Card(Color.Hearts,Value.v_2),
        new Card(Color.Hearts,Value.v_10),
        new Card(Color.Hearts,Value.v_7),
        new Card(Color.Hearts,Value.v_8),
    ])
    const pair1 = new Hand(new Seat(new Player("","Name")), [
        new Card(Color.Hearts,Value.v_7),
        new Card(Color.Clubs,Value.v_2),
        new Card(Color.Hearts,Value.v_10),
        new Card(Color.Hearts,Value.v_2),
        new Card(Color.Hearts,Value.v_8),
    ])
    const pair1HC = new Hand(new Seat(new Player("","Name")), [
        new Card(Color.Hearts,Value.v_10),
        new Card(Color.Clubs,Value.v_9),
        new Card(Color.Hearts,Value.v_5),
        new Card(Color.Clubs,Value.v_2),
        new Card(Color.Hearts,Value.v_2),
    ])
    
    const cs = new CardSolver();
    //cs.EvalHand(pair10);
    //cs.EvalHand(flush);
    //cs.EvalHand(flushAce);
    //cs.EvalHand(flushAce2);
    cs.EvalHand(pair1HC);
    //cs.EvalHand(pair1);
    const arr = [flushAce2, flush, pair10, pair1HC,flushAce,pair1];
    arr.sort(Hand.GetComparator());
    console.log(arr);
}

function TestGetBest5(){
    const Fullstack = new BigHand(new Seat(new Player("","Name")), [
            new Card(Color.Clubs,Value.v_3),
            new Card(Color.Hearts,Value.v_7),        
            new Card(Color.Hearts,Value.v_8),
            new Card(Color.Spades,Value.v_J),
            new Card(Color.Spades,Value.v_10),
            new Card(Color.Spades,Value.v_7),
            new Card(Color.Spades,Value.v_2),
        ]);

    const solver = new CardSolver();
    const hand = solver.GetBest5(Fullstack);
    console.log("TestGetBest5",hand);
}

function  testall(){
    const deck = new MDeck();
    deck.Shuffle();
    const player: Array<BigHand> = [];
    const center = deck.Take(5);
    for(let i = 0; i < 5; i++){
        player[i] = new BigHand(new Seat(new Player("","Name "+i)),[].concat(deck.Take(2), center));
        
    }
    
    const centerhand = new Hand(new Seat(new Player("","Name")),center);

}
function  CasinoRoyaleTestCase(){
    const p0 = new PlayerHand(new Seat(new Player("","B Dude")), [
        new Card(Color.Spades,Value.v_K),
        new Card(Color.Spades,Value.v_Q),
    ]);
    const p1 = new PlayerHand(new Seat(new Player("","A Dude")), [
        new Card(Color.Clubs,Value.v_8),
        new Card(Color.Diamonds,Value.v_8),
    ]);
    const p2 = new PlayerHand(new Seat(new Player("","Le Chiffre")), [
        new Card(Color.Clubs,Value.v_A),
        new Card(Color.Hearts,Value.v_6),
    ]);
    const p3 = new PlayerHand(new Seat(new Player("","James Bond")), [
        new Card(Color.Spades,Value.v_7),
        new Card(Color.Spades,Value.v_5),
    ]);
    const p4 = new PlayerHand(new Seat(new Player("","DrEvil")), [
        new Card(Color.Spades,Value.v_7),
        new Card(Color.Spades,Value.v_5),
    ]);
    
    const player = [p0, p3, p2,p1,p3,p1,p4];

    const center = [
        new Card(Color.Hearts,Value.v_A),
        new Card(Color.Spades,Value.v_8),
        new Card(Color.Spades,Value.v_6),
        new Card(Color.Spades,Value.v_4),
        new Card(Color.Spades,Value.v_A),
    ];
    const cs = new CardSolver();
    const winner = cs.SolveTable(player,center);
    const sps = cs.GetSplits(winner);

    //console.log(sps);
    console.log(winner[0]);

}

function TestStraightAceTwo(){


    const center = [
        new Card(Color.Clubs,Value.v_2),
        new Card(Color.Hearts,Value.v_3),        
        new Card(Color.Hearts,Value.v_5),
        new Card(Color.Hearts,Value.v_7),
        new Card(Color.Hearts,Value.v_4)

    ];

    const p0 = new PlayerHand(new Seat(new Player("","loser")), [
        new Card(Color.Clubs,Value.v_A),
        new Card(Color.Clubs,Value.v_3),
    ]);
    const p1 = new PlayerHand(new Seat(new Player("","winner")), [
        new Card(Color.Clubs,Value.v_6),
        new Card(Color.Clubs,Value.v_4),
    ]);

    const solver = new CardSolver();
    const hand = solver.SolveTable([p0,p1],center);
    console.log("TestGetBest5:",hand.toString());
}


function TestLessCards(){
    const p4 = new PlayerHand(new Seat(new Player("","DrEvil")), [
        new Card(Color.Hearts,Value.v_2),
        new Card(Color.Hearts,Value.v_3),
        new Card(Color.Hearts,Value.v_4)

    ]);
    
    const player = [p4];

    const center = [
    ];
    const cs = new CardSolver();
    const winner = cs.SolveTable(player,center);
    const sps = cs.GetSplits(winner);
    console.log(winner);
}
//TestLessCards();
//TestStraightAceTwo();
//TestEvalHand();
//TestRankHands();
//TestGetBest5();
//TestGetBest5();
//CasinoRoyaleTestCase();
