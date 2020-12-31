import { Rooms } from "./data/Rooms";
import {Helper} from "./Helper";
import { MRoom } from "./MRoom";
import { IllegalOperationError } from "./IllegalOperationError";

export class MRooms{
    //max = 100; // max of 100 rooms allowed
    max = 400; // max of 100 rooms allowed
    purgeTime = 3600000; //3600000 = 1h // purge after 1h of no update
    rooms: Rooms;
    constructor(){
        this.rooms = new Rooms();
    }
    Create(sessid:string){
        //const size = Helper.size(this.roomsCreated);
        if (this.rooms.size >= this.max){
            this.Purge();
        }
     
    
        if (this.rooms.size >= this.max){
            throw new IllegalOperationError("Cannot create room",  "Maximum of "+this.max+ " rooms created.");
        }
        const roomId = Helper.generateUIDWithCollisionChecking(this.rooms.roomsActive);
        const ret = new MRoom(roomId, sessid);
        
        this.rooms.roomsActive[roomId] = ret;
        
        this.rooms.size++;
        return ret;
    }

    get Size(){
        return this.rooms.size;
    }

    /*
    Purge(){
        // delete elements based on their last update timestamp
        // purge parameters are set in constructor
        const d = Date.now();
        for (const [key, value] of Object.entries(this.rooms.roomsActive)) {
            const lastUpdate = d - value.lastUpdated;
            console.log(lastUpdate, value.lastUpdated);
            if (lastUpdate > this.purgeTime){
                console.log("purging "+key);
                delete this.rooms.roomsActive[key];
                this.rooms.size--;

            }


            
        }

    }
    */
   Purge(id: string = ""){
        if (id != ""){
            this.rooms.roomsActive[id].ClearAll();
            delete this.rooms.roomsActive[id];
            this.rooms.size--;
            return;
        }
        for (const [key, value] of Object.entries(this.rooms.roomsActive)) {
            if (value.IsEmpty && value.AgeCreated > 60000){
                this.rooms.roomsActive[key].ClearAll();
                delete this.rooms.roomsActive[key];
                this.rooms.size--;
                console.log("Empty room found: "+value.id+", purging...");
            }
            
        }
   }

    Get(id: string): MRoom | null{
        if (!this.rooms.roomsActive[id]){
            return null;
        }
        const elem = this.rooms.roomsActive[id];
        if (elem.IsEmpty && elem.AgeCreated > 60000){
            this.Purge(id);
            throw new IllegalOperationError("cannot get room", "room has been delete");
        }
        return elem;
        
    }

}
