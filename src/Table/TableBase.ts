import { Seat } from "../data/Seat";
import { Table } from "../data/Table";
import { Helper } from "../Helper";
import { IllegalOperationError } from "../IllegalOperationError";
import { InvalidOperationError } from "../InvalidOperationError";

export class TableBase{
    
    seats: Array<Seat> = [null,null,null,null,null,null,null,null];
    table: Table = new Table();

    constructor(seats: Seat[]){
        this.seats = seats;
    }

    SetMoney(s: Seat, amount: number, useMinOnError = false): number{
        //
        // if my current balance is not enough to bet this amount 
        //&& s.money != s.roundTurn.amount?
        if (s.money < amount ){

            if (useMinOnError){
                amount = s.money; // all in
                s.roundTurn.allin = true;
            }else{
                throw new IllegalOperationError("Cannot set money", "you have not enough money");
            }
        }
        
        this.table.pot += amount;
        s.money -= amount;
        s.payment_in_round += amount;
        s.roundTurn.amount += amount;
        return amount;
    }

    ValidSeatPoss(): [Array<number>, Array<number>]{
        const ret = this.GetFilteredSeatPosList(false);
         return ret;
    }

    private GetFilteredSeatPosList(includeBroke: boolean):[number[], number[]]{
        let findex = 0;
        const inverse = [null,null,null,null,null,null,null,null];

        const ret = this.seats.map((v,i)=>{
            if (v){
                if (includeBroke){
                    if (v.roundTurn.sitout || v.roundTurn.fold || v.roundTurn.amount <= 0 ){
                        return null
                    }    
                }
                if (v.roundTurn.sitout || v.roundTurn.fold ){
                    return null
                }
                return i;
            }else{
                return null;
            } 
         }).filter((v,i)=>{
             
             const ret = v !== null;
             inverse[i] = findex;

             if (ret){
                findex++;
             }else{
             inverse[i] = null;

             }
             return ret;
         });

         return [ret, inverse];

    }

 

    /**
     * calculates the seat and index of a seat index array, such as [0,1,2,5]
     * adds an offset from the start and goes around the index array
     * e.g. start =  2, offset = 5, indexArray = [0,1,2,5], seats = [s0,s1,s2,null,null,s5,null,null];
     * the function returns 5
     */
    GetSeatOfIndexArray(start: number, offset: number, indexArray: Array<number>, inverse: Array<number>)
    : [Seat, number]
    {
        function mod(n , m) {
            return ((n % m) + m) % m;
        }
        const i_x = inverse[start];

        const realoffset = i_x + offset;
        const a = mod(realoffset,indexArray.length);
        const i_seats = indexArray[a];
        const res = this.seats[i_seats];
        return [res, i_seats];


    }

    GetSeatOfActiveSeats(start: number = this.table.sbpos, offset = 0)
    : [Seat, number]
    {
        return this.GetSeatOfIndexArray(start, offset,this.table.active_seats_pos,this.table.inverse_active_seats_pos);
    }

    ///////////////////// HELPERS ////////////////////

 

    

    *IterateSeats(start: number,dataset: Array<number> = this.table.active_seats_pos, inverse: Array<number>=this.table.inverse_active_seats_pos): Generator<Seat>{
        if (!dataset.includes(start))
        {
            throw new InvalidOperationError("cannot perform action","index "+start+" not in dataset");
        }
        for (let i= 1; i <= dataset.length; i++){
            const [seat, seatpos] = this.GetSeatOfIndexArray(i,0,dataset,inverse);
            yield seat;
            
        }
        return;
    }
    

    

    GetMinBetAmount(): number{

        const vs = Array.from(this.ValidSeats(true));
        const allAmounts = vs.map((a)=>{
            return a.roundTurn.amount;
        });
        const max = Math.max(...allAmounts);
        return max;
        
    }

    

    
    /**
     * 
     * @param startoffset 
     * @returns [Seat: the current seat in the iteration beginning from offset; the iteration beginning from 0; the seat index beginning from offset]
     */
    *YieldOffset(startoffset: number): Generator<[Seat,number,number]>{
        //console.log("start generator with offset",startoffset);
        const mod = Helper.Modulo;
        const fromStart:Seat[] = [];
        
        for (let i = startoffset; i < startoffset + this.seats.length; i++){
            const ring = mod(i, this.seats.length);
            fromStart.push(this.seats[ring]);
        }
        //console.log("fromStart after",fromStart.map(v=>v?.name));
        // fromStart now has all seats, first index is seat[start]

        for(let i = 0; i < this.seats.length; i++){
            const s = fromStart[i]; // we are now in seat[start+i]
            //console.log("yields",i, s?.name);
            yield [s, i, mod(startoffset+i, this.seats.length)];
            
        }
        return;
        
    
    }
    getNextPlayerTurn(from: number = -1){
        let next = -1;
        if (from == -1){
            from = this.table.player_turn;
        }

        for(const [s, i, pos] of this.YieldOffset(from + 1)){
            if (s != null && !s.roundTurn.sitout && !s.roundTurn.fold && !s.roundTurn.allin){
                next = pos;
                break;
            }
        }
        return next
        
    }
    

    *ValidSeats(removeSitouts: boolean, andFolds = false): Generator<Seat>{
        
        for (const seat of this.seats){
            if (seat){
                if (removeSitouts && andFolds){
                    if (!seat.roundTurn.sitout && !seat.roundTurn.fold){
                        yield seat;
                    }

                }else if (removeSitouts){
                    
                    if (!seat.roundTurn.sitout){
                        yield seat;
                    }
                }else{
                    yield seat;    
                }
                
            }
        }
        return;
    } 

    IsBetRoundDone(vs: Array<Seat>): boolean{
        
        const playersInBetRound = vs.filter((v,i)=>{
            const d = !v.roundTurn.done && !v.roundTurn.fold && !v.roundTurn.sitout && !v.roundTurn.allin;
            return d;
        })
        const allDone = playersInBetRound.length == 0 ;
        

        if (!allDone){
            // not veryone has placed a bet

            return false;
        }

        
        const allAmounts = vs.map((a)=>{
            return a.roundTurn.amount;
        });
        const maxAmountInRound = Math.max(...allAmounts);
        
        // if everyone is done, and has the same amount set or is all in
        const alleven = vs.every((v,i)=>{

            return v.roundTurn.amount == maxAmountInRound ||v.roundTurn.allin || v.roundTurn.fold;   
        });

        // big blind has a turn in the first round even if he's even
        
        if (!alleven){
            //console.log("round open","not all even");
            return false;
        }
        const sbPos = this.table.sbpos;
        const bbPos = this.table.bbpos;
        const bb_turn = this.table.player_turn == sbPos && this.seats[this.table.bbpos].roundTurn.bets_placed == 0 && !this.seats[bbPos].roundTurn.fold;
        if (bb_turn){
            //console.log("round open","bb must check or raise");
            return false;
        }
        
        return true;
    }

    

    
}