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
    static CalculateSidePots(allPlayer: Seat[], center:Card[]){
        

        let payers = allPlayer.filter(v=>{
            v.win = 0;
            return v != null && !v.roundTurn.sitout;
        });

        const non_folders = payers.filter(v=>!v.roundTurn.fold);

        // get cashback from overpot
        payers.sort((a,b) => {
            return b.payment_in_round - a.payment_in_round;
        });
        
        non_folders.forEach( (v) => {
            v.cards.forEach( (c) => {
                c.visible = true;
            });
        });

        if (payers.length > 1){
            //this is >= 0 because of sorting and represents the amount that is payed too much due to a chipleader all in
            const overpayed = payers[0].payment_in_round - payers[1].payment_in_round; 
            //console.log(payers[0].name,"gets back",overpayed, "because of overpot");
            payers[0].payment_in_round = payers[0].payment_in_round - overpayed;
            payers[0].money += overpayed;
        }
        const solver_array = [];

        const tmp1 = payers.filter(v=>!v.roundTurn.fold);
        tmp1.forEach(v=>{
            const p = new PlayerHand(v, v.cards);
            solver_array.push(p);
        });
        
        const hands = this.solver.SolveTable(solver_array, center);
        hands.forEach((v)=>{
            // invert dependencies
            const seat = v.owner;
            seat.hand = v;
            v.owner = null;
        });

        
        payers.sort((a,b)=>{
            return a.payment_in_round - b.payment_in_round;
        });

        // payers are sorted for payment_in_round asc
        // winners_all_desc are sorted best hand desc, 1st is best player
        /*
        loop through payers until payers is []
	    pot(i)
            payer
            winner_candidates = payers without folders
            winners  = get_winners(winner_candidates)
            losers	 = payer without winners
            win_max  = min(payer)
            win_mult = losers.length
            win_div  = winner.length
            sidepot  = win_max*payers.length
            foreach winner as w:
                !!!cashout = sidepot/win_div;!!! 
            winners.each().pay cashout
            foreach payer
                    remove win_max
            remove players where payer.each().payment == 0
        */
        while(true){
            //console.log("payer", payers.map(v=>`${v.name}/${v.payment_in_round}`));     
            const winner_candidates = payers.filter(v=>!v.roundTurn.fold);
            const winners = this.solver.GetWinner(winner_candidates);


            //const losers = payers.filter(v=>!winners.includes(v));
            const win_max  = Math.min(...payers.map(v=>v.payment_in_round));
            const win_div  = winners.length;
            let cashout = 0;
            //let cashback = 0;
            let sidepot = win_max*payers.length;//payers.map(v=>v.payment_in_round).reduce((a,b)=>a+b);
            winners.forEach(v=>{
                //cashback = v.payment_in_round/losers.length;
                cashout = sidepot/win_div; 
                v.money += Math.floor(cashout); // TODO POT RECASH

            });
            //const s = new SidePot(winners, cashout, Array.from(payers));

            winners.forEach(v=>{
                const w = Math.floor(cashout); // TODO POT RECASH
                v.win += w;
            });
            payers.forEach(v=>{
                v.payment_in_round -= win_max;
            });
            payers = payers.filter(v=>v.payment_in_round > 0);
            /*
            console.log("winner_candidates", winner_candidates.map(v=>`${v.name}`));
            console.log("winners", winners.map(v=>`${v.name}`));
            console.log("losers", losers.map(v=>`${v.name}`));
            console.log("win_max", win_max);
            console.log("win_mult", win_mult);
            console.log("win_div", win_mult);
            //console.log("cashback", cashback);
            
            console.log("sidepot", sidepot);
            console.log("cashout", cashout);
            console.log("payer", payers.map(v=>`${v.name}/${v.payment_in_round}`));
            console.log("----------------\n");
            */


            if (payers.length == 0){
                break;
            }
        }

        
        return;
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
    //sidepots.forEach(v=>console.log(v.toString()));
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
    //sidepots.forEach(v=>console.log(v.toString()));


}

function  testcomplexpot(){
    const inthegame: Seat[] = [];
    

    {
        const p = new Seat(new Player("","A"));
        p.payment_in_round = 50;
        p.name = "A";
        p.cards =  [
            new Card(Color.Clubs,Value.v_A),
            new Card(Color.Spades,Value.v_A),
        ];
        inthegame.push(p);

        
    }
    {
        const p = new Seat(new Player("","B"));
        p.payment_in_round = 75;
        p.name = "B";
        p.cards =  [
            new Card(Color.Clubs,Value.v_K),
            new Card(Color.Spades,Value.v_K),
        ];
        inthegame.push(p);

        
    }
    {
        const p = new Seat(new Player("","C"));
        p.payment_in_round = 100;
        p.name = "C";
        p.cards =  [
            new Card(Color.Clubs,Value.v_K),
            new Card(Color.Spades,Value.v_K),
        ];
        inthegame.push(p);

        
    }

    {
        const p = new Seat(new Player("","D"));
        p.payment_in_round = 60;
        p.name = "D";
        p.cards =  [
            new Card(Color.Clubs,Value.v_5),
            new Card(Color.Spades,Value.v_6),
        ];
        inthegame.push(p);
        p.roundTurn.fold = true;

        
    }
    {
        const p = new Seat(new Player("","E"));
        p.payment_in_round = 25;
        p.name = "E";
        p.cards =  [
            new Card(Color.Clubs,Value.v_7),
            new Card(Color.Spades,Value.v_7),
        ];
        inthegame.push(p);

    }
    const center = [
        new Card(Color.Spades,Value.v_J),
        new Card(Color.Hearts,Value.v_J),
        new Card(Color.Spades,Value.v_5),
        new Card(Color.Clubs,Value.v_5),
        new Card(Color.Clubs,Value.v_5),
    ];
    
    
    const sum0 = inthegame.map(v=>v.payment_in_round).reduce((a,b)=>a+b);

    console.log("testing case: complex money");
    const sidepots = SidePotCalculator.CalculateSidePots(inthegame,center);

    const sum1 = inthegame.map(v=>v.win).reduce((a,b)=>a+b);
    console.log("sum",sum0,sum1);

    inthegame.forEach(v=>{
        console.log(v.name,v.win);
    });
    //sidepots.forEach(v=>console.log(v.toString()));
}
//testcomplexpot();
//CasinoRoyaleTestCase();
//SingleWinnerTestCase();
