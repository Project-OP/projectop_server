import { Card_Client } from "../client_data/Card_Client";
import { Winner_Client } from "../client_data/Winner_Client";
import { SidePot } from "../SidePotCalculator";
import { Card } from "./Card";
import { Seat } from "./Seat";
/**
 * NOTE THAT THIS GOES TO ALL CLIENTS UNFILTERED; DO NOT LEAVE ANY INFOS HERE THAT SHOULD NOT BE RECEIVED BY ALL PLAYERS!!!
 */
export class Table{

    active = false;
    player_turn = -1;
    cards_center: Array<Card_Client> = [];
    active_seats_pos: Array<number>= [];
    inverse_active_seats_pos: Array<number>=[];

    round_start_time = 0;
    pot = 0;
    center_count = 0;
    round = 0; 
    current_bb = 0;
    current_sb = 0;
    sbpos = 0;
    bbpos = 0;
    dealerpos = 0;
    games = 0; 
    nextSBlind = 0;
    nextBBlind = 0;
    egoPos = -1;
    current_min_bet = 0;

    startBalance = 100;
   
    turn_in_round = 0; 

    //bet_rounds = 0;

    // winner, amount
    winner_pots: number[];
    winner_pos: Array<{seat:number, amount: number}>;
    winner_cards: Array<Card_Client[]>;

    is_headsup = false; 

    
    
}

