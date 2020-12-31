import {SimpleEventDispatcher} from "strongly-typed-events";
export class Events{
    private _onMessage = new SimpleEventDispatcher<[string,number,string]>();
    private _msgnum = 0;
    public static Instance: Events = new Events();
    private constructor(){
        
        
    }

    public invokeMessage(s: string,sessid = ""){
        
        this._onMessage.dispatch([s,this._msgnum++,sessid]);

    }
    public get onMessage() {
        return this._onMessage.asEvent();
    }
}