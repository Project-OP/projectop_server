import { Card } from "./data/Card";
import { Player } from "./data/Player";

declare module "express-session" {
    interface Session {
      player: Player;
      sessionID: any;
      cards: Array<Card>;
    }
}

declare module "express-serve-static-core" {
    interface Request {
      sanitize?: any;
    }
  }