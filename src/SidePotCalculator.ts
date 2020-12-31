import { CardSolver, Hand, PlayerHand } from "./CardSolver";
import { Card, Color, Value } from "./data/Card";
import { Player } from "./data/Player";
import { Seat } from "./data/Seat";
import { Helper } from "./Helper";

export class SidePot{
    
    player: Seat[];
    winner: Seat[];
    amount: number;

    constructor(winner: Seat[], amount: number, player:Seat[]){
        this.player = player;
        this.amount = amount;
        this.winner = winner;
    }
    toString(){
        
        return `${this.winner.map(v=>v.name).join(", ")} wins ${this.amount} with ${this.winner[0].hand.HandType.info}`;
        
    }
}

export class SidePotCalculator{

    static solver = new CardSolver();
    static CalculateSidePots(seats: Seat[], center:Card[]):SidePot[]{
        const toSolve = [];

        for(const seat of seats){
            
            seat.cards.forEach( (v,i) => {
                v.visible = true;
            });
            const p = new PlayerHand(seat, seat.cards);
            toSolve.push(p);
            
        }
        const hands = this.solver.SolveTable(toSolve,center,true);
        const seats2: Array<Seat> = [];
        
        hands.forEach((v,i)=>{
            // invert dependencies
            const seat = v.owner;
            seat.hand = v;
            v.owner = null;
            seats2.push(seat);
        });

        //copy arry to have sidepots ordered by sidepot size, not winning hand
        const sidepots = Array.from(seats2);
        

        sidepots.sort((a, b)=>{
            // sidepots ordered from big to small
            return a.payment_in_round - b.payment_in_round;
        });
        
        const simple = sidepots.map((v,i)=>{
            return {index:i,n:v.name,amount:v.payment_in_round};
        });
        
        
        const sidepots_indices = sidepots.map((v,i)=>{
            return i;
        });
        
        const winner_of_group:{[key:string]:[{index:number, n:string,amount:number}]} = Helper.GroupBy(simple,"amount");
        const player_of_group:{[key:string]:Array<number>} = {}
        for (const g of Object.keys(winner_of_group)){
            const k = g;
            const v = winner_of_group[g];
            
            player_of_group[k] = Array.from(sidepots_indices);
                
            v.forEach((item, _)=>{
                const del = sidepots_indices.indexOf(item.index);
                sidepots_indices.splice(del, 1);

            });
            
        }
        let ignore = [];
        // pot_ranks [seat,seat,seat,...]
        const pot = simple.reduce((acc, e)=>{
            return acc + e.amount;
        },0);
        //console.log("The pot is",pot);
        let accum = 0;

        const ret:SidePot[] = [];

        for (const g of Object.keys(winner_of_group)){
            const sidepot_owner = winner_of_group[g].map((v,_)=>{
                return v.index;
            }); //these players can win their pot
            const competetors = player_of_group[g]; //they they can all win
            // get winner of each player, 
            // if winner is in  winner (winner_of_group)
            // reward them their amount and add them to ignore
            // use sidepots[]
            const k = Number.parseFloat(g);
            const pot = k*sidepot_owner.length;

            //console.log("side pot owner player",sidepot_owner.map((v,i)=>{return sidepots[v].name}),"can win",pot,"and compete with",competetors);
            accum += pot;

        
            // remove ignore from player
            // if player size == 0 return
            // get winner of player 
            // if player in winner:
            //  add player to ignore
            //  reward winner with money
            //console.log("ignores",ignore.map((v) => sidepots[v].name));
            const competetors_not_done = competetors.filter(value => !ignore.includes(value));
            if (competetors_not_done.length == 0){
                return;
            }

            
            const sidepot_candidates_seats = competetors_not_done.map((v,_)=>{
                return {sidepotindex:v,seat:sidepots[v]};
            });

            sidepot_candidates_seats.sort((a,b)=>{
                return Hand.GetComparator()(a.seat.hand,b.seat.hand);
            });

            const splits =  this.solver.GetSplitsSeat(sidepot_candidates_seats);
            
            //const winner: Array<Hand> = [];
            const winners: number[] = [];

            splits.forEach((v,_)=>{
                winners.push(sidepot_candidates_seats[v].sidepotindex);
            });
            
            
            //console.log("check all hands of:",sidepot_candidates_seats);


            /*
            console.log("owner:",sidepot_owner);
            console.log("competetors_not_done",competetors_not_done);
            console.log("winner",winners);
            */

            // winners = the winners of this sidepot
            // winner_candidates = all that can win this pot, also players
            const ignores_only_owners = winners.filter((v)=>{ 
                // if winner is also winner owner of this pot
                return sidepot_owner.includes(v);
            });
            const found = ignores_only_owners.length > 0;

            if (found){
                
                ignore = ignore.concat(ignores_only_owners);
                // pay winner, mind split pots
                const winamount = Math.floor(pot/winners.length);
                winners.forEach((v,_)=>{
                    sidepots[v].money += winamount;
                    //console.log(sidepots[v].name,"wins",winamount);
                    
                });
                ret.push(new SidePot(winners.map(v=>sidepots[v]),winamount,competetors_not_done.map(v=>sidepots[v])));
            } 

        }
        return ret;
        //console.log("accum win sum is",accum);
        
    }
}


function  SingleWinnerTestCase(){
    const player: Seat[] = [];

    {
        const p = new Seat(new Player("","B Dude"));
        p.payment_in_round = 100;
        p.name = "B Dude";
        p.cards =  [
            new Card(Color.Spades,Value.v_K),
            new Card(Color.Spades,Value.v_Q),
        ];
        player.push(p);
        
        
    }
    const center = [
        new Card(Color.Hearts,Value.v_A),
        new Card(Color.Hearts,Value.v_8),
        new Card(Color.Hearts,Value.v_6),
        new Card(Color.Spades,Value.v_4),
        new Card(Color.Spades,Value.v_A),
    ];
    const sidepots = SidePotCalculator.CalculateSidePots(player,center);
    sidepots.forEach(v=>console.log(v.toString()));
}
function  CasinoRoyaleTestCase(){
    const player: Seat[] = [];

    
    {
        const p = new Seat(new Player("","B Dude"));
        p.payment_in_round = 100;
        p.name = "B Dude";
        p.cards =  [
            new Card(Color.Spades,Value.v_K),
            new Card(Color.Spades,Value.v_Q),
        ];
        player.push(p);
        
        
    }

    {
        const p = new Seat(new Player("","A Dude"));
        p.payment_in_round = 100;
        p.name = "A Dude";
        p.cards =  [
            new Card(Color.Clubs,Value.v_8),
            new Card(Color.Diamonds,Value.v_8),
        ];
        player.push(p);

        
    }

    {
        const p = new Seat(new Player("","Le Chiffre"));
        p.payment_in_round = 100;
        p.name = "Le Chiffre";
        p.cards =  [
            new Card(Color.Clubs,Value.v_A),
            new Card(Color.Hearts,Value.v_6),
        ];
        player.push(p);

    }

    {
        const p = new Seat(new Player("","James Bond"));
        p.payment_in_round = 50;
        p.name = "James Bond";
        p.cards =  [
            new Card(Color.Spades,Value.v_7),
            new Card(Color.Spades,Value.v_5),
        ];
        player.push(p);

        
    }
    

    {
        const p = new Seat(new Player("","DrEvil"));
        p.payment_in_round = 100;
        p.name = "Dr Evil";
        p.cards =  [
            new Card(Color.Spades,Value.v_7),
            new Card(Color.Spades,Value.v_5),
        ];
        player.push(p);

        
    }
    

    const center = [
        new Card(Color.Hearts,Value.v_A),
        new Card(Color.Spades,Value.v_8),
        new Card(Color.Spades,Value.v_6),
        new Card(Color.Spades,Value.v_4),
        new Card(Color.Spades,Value.v_A),
    ];
    
    //console.log(sps);
    console.log("testing case: casino royale");
    const sidepots = SidePotCalculator.CalculateSidePots(player,center);
    sidepots.forEach(v=>console.log(v.toString()));


}

//CasinoRoyaleTestCase();
//SingleWinnerTestCase();
