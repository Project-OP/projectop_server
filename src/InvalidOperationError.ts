import { IllegalOperationError } from "./IllegalOperationError";

export class InvalidOperationError extends IllegalOperationError{
    isillegaloperationerror = false;
    isinvalidoperationerror = true;
}