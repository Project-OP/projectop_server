import { Card_Client } from "../client_data/Card_Client";
import { Winner_Client } from "../client_data/Winner_Client";
import { Card } from "../data/Card";
import { Player } from "../data/Player";
import { Seat } from "../data/Seat";
import { Table } from "../data/Table";
import { Action } from "../data/Turn";
import { Helper } from "../Helper";
import { IllegalOperationError } from "../IllegalOperationError";
import { ITable } from "../interfaces/ITable";
import { MDeck } from "../MDeck";
import { SidePot, SidePotCalculator } from "../SidePotCalculator";
import { TableBase } from "./TableBase";

export class TableImpl extends TableBase implements ITable{
    
    deck: MDeck = new MDeck();
    setMessage: (msg: string, sessid: string) => void;
    cards_center: Card[] = [];

    constructor(seats: Seat[], deck: MDeck, setMessage: (msg: string, sessid: string)=>void) {
        super(seats);
        this.deck = deck;
        this.setMessage = setMessage;
    }


    async UpdatePlayerList(): Promise<void> {
        const [activeSeatPoss, inverseActiveSeatPoss] = this.ValidSeatPoss(); // all players that are not not sit out 
        
        this.Data.active_seats_pos = activeSeatPoss;
        this.Data.inverse_active_seats_pos = inverseActiveSeatPoss;
        
    }

    async Turn(sessid: string, action: Action, amount: number = 0): Promise<void> {
    
        const [seat, pos] = this.getSeat(sessid);
        
        if (!this.isPlayerTurn(sessid)){
            throw new IllegalOperationError("Cannot perform "+action,"Not your turn!");
        }

        
        if (action == Action.set){
            console.log("Player "+seat.name+" "+action+"s "+ amount);
        }else{
            console.log("Player "+seat.name+" "+action+"s");
        }

        switch(action){


            case Action.set:
                if (amount < 0){
                    throw new IllegalOperationError("Cannot place bet", "no negative bets allowed");
                }
                if (amount == seat.money){
                    // all in
                    console.log(seat.name, "goes all in");
                    seat.roundTurn.allin = true;
                }
                
                if (amount + seat.roundTurn.amount < this.Data.current_min_bet && !seat.roundTurn.allin){
                    
                    throw new IllegalOperationError("Cannot place bet", "you must at least pay "+this.Data.current_min_bet);
                    
                }
                if (!Number.isInteger(amount)){
                    throw new IllegalOperationError("Cannot place bet", "you can only bet whole numbers");
                }
                this.SetMoney(seat,amount);
            break;

            case Action.fold:
                seat.roundTurn.fold = true;
                
            break;
        }
        
        seat.roundTurn.done = true;
        seat.roundTurn.bets_placed++;

        // next player's turn
        

        // gets the next player in the round,
        // check if all done and all amounts are the same (or all in)
        // if so, no turns left in this round, showdown() 
        // if all player done but not even, get the next player that is not even, he must be the next player if all rules are correct
        // if not all player done, get the next player not done
        // next is always from current this.Data.player_turn
        

        // all players of  the current round, including folds in  this round
        const vs = Array.from(this.ValidSeats(true, false));

        
        

        // all players of  the current round, without folds => all players that still play in this round
        const nonfolds =  vs.filter((v,i)=>{
            return !v.roundTurn.fold;
        });
        const allFold = nonfolds.length < 2;

        if (allFold){
            const winner = [this.getSeat(nonfolds[0].player)];
            this.Showdown(sessid);

            return 
        }

        
        await this.UpdatePlayerList();
        
        if (!this.IsBetRoundDone(vs)){
            // all playes even, show next card
            //console.log("still in betting round");
            /// get next player, this is complex because some can fold, even the current player, thus the valid pos index + 1 with mod does not work
            //console.log("player turn before is ",this.Data.player_turn);
            

            const next = this.getNextPlayerTurn();

            //console.log("next", next);
            this.Data.current_min_bet = this.GetMinBetAmount();



            //console.log("player turn after is ",next);
            //next in same round
            this.Data.player_turn = next;
            this.Data.turn_in_round++;
            
            
            return;
        }
        this.Data.turn_in_round = 0;

        //new betting round
        
        

        const all_allin = vs.filter(v=>!v.roundTurn.allin).length < 2;
        //const all_allin = 

        
        // eval turn
 

        console.log("NEXT ROUND");
        if (all_allin){
            const reveal = 5 - this.cards_center.length;
            const allin_cards = this.deck.Take(reveal);
            this.cards_center=this.cards_center.concat(allin_cards);
            allin_cards.forEach(v=>v.visible=true);
            this.Showdown(sessid);            

            return;
            
        }
        this.seats.forEach((s,i)=>{
            if (s != null && !all_allin){

                
                s.roundTurn.bets_placed = 0;
                s.roundTurn.done = false;
                s.roundTurn.amount = 0;
                
            
            }
        });
        this.Data.current_min_bet = this.GetMinBetAmount();

        this.Data.round++;
        
        if (this.Data.is_headsup){
            this.Data.player_turn = this.Data.bbpos;
        }else{
            // mind that this is wrong!

            const next = this.getNextPlayerTurn(this.Data.dealerpos);

            this.Data.player_turn = next;
        }
        
        const center = this.cards_center.length;
        if (center == 0){
            const flop = this.deck.Take(3);
            this.cards_center=this.cards_center.concat(flop);
            flop[0].visible = true;
            flop[1].visible = true;
            flop[2].visible = true;

        }
        if (center == 3){
            const turn = this.deck.Take(1);
            this.cards_center=this.cards_center.concat(turn);
            turn[0].visible = true;            
        }
        if (center == 4){
            const river = this.deck.Take(1);
            this.cards_center=this.cards_center.concat(river);
            river[0].visible = true;            
        }
        if (center == 5){
            this.Showdown(sessid);            
        }

    }

    isPlayerTurn(sessid: string): boolean {
        const [_, seatpos] = this.getSeat(sessid);
        //console.log(`check player turn: ${seatpos} ${this.table.player_turn} `);
        return this.table.player_turn >= 0 && this.table.player_turn == seatpos;            
    
    
    }
    get Data(): Table{
        this.table.cards_center = Card_Client.From(this.cards_center); 
        return this.table;
    }
    async Sitout(p: Player): Promise<void> {

        if(this.isPlayerTurn(p.sessId)){
            await this.Turn(p.sessId, Action.fold);
        }
        const [s, n] = this.getSeat(p.sessId);
        s.roundTurn.sitout_next_turn = true;
    }
    async Sitin(p: Player): Promise<void> {
        const [s, n] = this.getSeat(p.sessId);
        s.roundTurn.join_next_round = true;

    }

    async Startover(sessid: string): Promise<void> {
        await this.NewGame(!this.Data.active, sessid);
    }
    async NewGame(initial: boolean, sessid: string): Promise<void> {
        
        if (initial){
            this.Data.current_bb = 2;
            this.Data.current_sb = 1;
            this.Data.active = true;
            this.Data.round = 0;
            this.Data.round_start_time = Date.now();

        }else{
            this.Data.round++;

        }
        

        this.seats.forEach(v=>{
            if (v != null){
                v.cards = [];
                v.hand = null;
                v.payment_in_round = 0;
                
                const t = v.roundTurn;
                t.allin = false;
                t.amount = 0;
                t.bets_placed = 0;
                
                if (t.sitout_next_turn){
                    t.sitout = true;
                    t.sitout_next_turn = false;
                }
                if (t.join_next_round){
                    t.sitout = false;
                    t.join_next_round = false;
                }
                

                if (initial){
                    v.money = this.Data.startBalance;    

                }

                // check who sits out due to money issues
                if (v.money <= 0){
                    t.sitout = true;
                }
                t.done = t.sitout;
                t.fold = t.sitout;

                
            }
        });

        this.Data.pot = 0;

        if (initial){
            this.Data.nextBBlind = this.Data.current_bb;
            this.Data.nextSBlind = this.Data.current_sb;

        }else{
            this.Data.current_sb = this.Data.nextSBlind;
            this.Data.current_bb = this.Data.nextBBlind;
        }



        
        await this.calcPositions(initial);
        if (this.Data.active_seats_pos.length < 2){
            console.log("active seats",this.Data.active_seats_pos.length);
            this.Data.active = false;
            throw new IllegalOperationError("cannot start game", "must be at least 2 players");
        }
        
        let [openingSeat, openingIndex] = this.GetSeatOfActiveSeats(this.Data.bbpos,1);
        if (this.Data.is_headsup){
            // pre flop heads up rules
            openingIndex = this.Data.dealerpos;
        }
        this.deck.New();
        this.deck.Shuffle();
        
        for (const ap of this.Data.active_seats_pos){
            const seat = this.seats[ap];

            // deal
            console.log("deal seat",ap,seat.name);
            const cards = this.deck.Take(2);
            seat.cards.length = 0;
            seat.cards = seat.cards.concat(cards);

            // set blinds

            if (ap == this.Data.bbpos){                    
                this.SetMoney(seat, this.Data.current_bb, true);
                //seat.roundTurn.done = true;

            }
            
            if (ap == this.Data.sbpos){                    
                this.SetMoney(seat, this.Data.current_sb, true);
                //seat.roundTurn.done = true;

            }
            
        }
            
        this.Data.player_turn = openingIndex;
        this.Data.current_min_bet = this.GetMinBetAmount();

        this.Data.cards_center = [];
        this.cards_center = [];
        
        this.Data.center_count = 0;
        this.Data.turn_in_round = 0; 
    
        this.Data.winner_pos = [];
        this.Data.winner_pots = [];
        this.setMessage("New round started",sessid);


    }

    
    getSeat(sessid: string): [Seat, number]{
        let index = 0;
        for(const s of this.seats){
            if (s?.player == sessid){
                return [s,index] ;
            }
            index++;
        }
        throw new Error("player seat not found: "+sessid);
        
    }
    

    private Showdown(sessid: string): void{
        this.Data.player_turn=-1;
        const vs = Array.from(this.ValidSeats(true,true));

        console.log("SHOWDOWN");



        const showdownplayer =  vs.filter(v=>{
            return !v.roundTurn.fold && !v.roundTurn.sitout;
        });

        if (showdownplayer.length == 1){
            const [seat, pos]= this.getSeat(showdownplayer[0].player);

            this.Data.winner_pos = [pos];
            const sp  = new SidePot([seat],this.Data.pot,[seat]);
            this.Data.winner_pots = [new Winner_Client(sp,[pos])];
            this.setMessage(seat.name + "wins by fold", sessid);
            seat.money+=this.Data.pot;

            return;
        }
        for(const seat of vs){
            
            seat.cards.forEach( (v,i) => {
                v.visible = true;
            });
            
        }

        const sidePots = SidePotCalculator.CalculateSidePots(vs, this.cards_center);
        
        

        
        let msg = "";
        sidePots.forEach(v=>{
           msg += v.toString()+"\n";
        });
        const winner_c = sidePots.map(v=>{
            
            const pos = v.winner.map(vv=>{
                const [_, ret] = this.getSeat(vv.player);
                this.Data.winner_pos.push(ret);
                return ret;
            });

            const c = new Winner_Client(v,pos);
            return c;
        });
        console.log(sidePots);

        this.Data.winner_pots = winner_c;

        
        this.setMessage(msg, sessid);

    }

    private async calcPositions(initial: boolean): Promise<void>{
        // active_seats_pos contains also broke players at this point
        /*
        headsup rules

        general
            dealer is SB
            
        preflop
            dealer = sb = roundstart

        postflop
            bb = roundstart

        */

        await this.UpdatePlayerList();


        let dealer = 0;
        const [dealerSeat, dealerPos] = this.GetSeatOfActiveSeats(this.Data.dealerpos,1);
        const headsup = this.Data.active_seats_pos.length == 2;

        
        
        dealer = dealerPos;
        if (initial){
            
            dealer = this.Data.active_seats_pos[Helper.RandInt(0,this.Data.active_seats_pos.length-1)];
            console.log("init new game",dealer);
        }else{
            console.log("continue game", dealer);
        }
        
        this.Data.dealerpos = dealer;

        const [sbSeat, sbIndex] = this.GetSeatOfActiveSeats(this.Data.dealerpos,1);
        const [bbSeat, bbIndex] = this.GetSeatOfActiveSeats(this.Data.dealerpos,2);

        this.Data.bbpos = bbIndex;
        this.Data.sbpos = sbIndex;
        this.Data.is_headsup = false;
        if (headsup){
            // we override in hindsight, makes it easier
            this.Data.is_headsup = true;
            this.Data.bbpos = sbIndex;
            this.Data.sbpos = dealer;
            
        }
        //console.log("new sb",this.Data.sbpos);
        
    }
    
   

}