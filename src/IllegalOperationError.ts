export class IllegalOperationError extends Error{
    error = "";
    cause = "";
    status = "error";
    isillegaloperationerror = true;
    constructor(error: string, cause: string){
        super(error+": "+cause);
        this.error = error;
        this.cause = cause;
    }
}