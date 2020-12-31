import { IllegalOperationError } from "../IllegalOperationError";

export enum Action{
    fold = "fold",
    set = "set"
}

export function GetTurn(action: string): Action{
    const ret = map[action];
    if (!ret){
        throw new IllegalOperationError("action not accepted", "use one of "+Object.keys(map));
    }
    return ret; 
}

const map = {
    "fold": Action.fold,
    "set": Action.set

}
    

