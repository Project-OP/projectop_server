import { CardSolver, PlayerHand } from "./CardSolver";
import { Card, Color, Value } from "./data/Card";
import { Player } from "./data/Player";
import { Seat } from "./data/Seat";

export class SidePot {
  player: Seat[];
  winner: Seat[];
  amount: number;
  constructor(winner: Seat[], amount: number, player: Seat[]) {
    this.player = player;
    this.amount = amount;
    this.winner = winner;
  }
  toString() {
    return `${this.winner.map((v) => v.name).join(", ")} wins ${
      this.amount
    } with ${this.winner[0].hand.HandType.info}`;
  }
}

export class SidePotCalculator {
  static solver = new CardSolver();

  static CalculateSidePots(allPlayer: Seat[], center: Card[]) {
    let payers = allPlayer.filter((v) => {
      v.win = 0;
      return v && !v.roundTurn.sitout;
    });

    // Sort players by their contribution in ascending order
    payers.sort((a, b) => a.payment_in_round - b.payment_in_round);

    const nonFolders = payers.filter((v) => !v.roundTurn.fold);
    nonFolders.forEach((v) => v.cards.forEach((c) => (c.visible = true)));

    const solverArray = nonFolders.map((v) => new PlayerHand(v, v.cards));
    const hands = this.solver.SolveTable(solverArray, center);

    hands.forEach((v) => {
      v.owner.hand = v;
      v.owner = null;
    });

    let previousContribution = 0;

    while (payers.length > 0) {
      // Find the current contribution level
      const currentContribution = payers[0].payment_in_round;

      // Calculate the side pot for this contribution level
      const sidepot = (currentContribution - previousContribution) * payers.length;

      // Determine the winners for this side pot
      const winnerCandidates = payers.filter((v) => !v.roundTurn.fold);
      const winners = this.solver.GetWinner(winnerCandidates);

      // Distribute the side pot among the winners
      const baseShare = Math.floor(sidepot / winners.length);
      let remainder = sidepot % winners.length;

      winners.forEach((v) => {
        const extra = remainder > 0 ? 1 : 0;
        if (remainder > 0) remainder--;
        const totalWin = baseShare + extra;

        v.money += totalWin;
        v.win += totalWin;
      });

      // Update the previous contribution level
      previousContribution = currentContribution;

      // Remove players who have fully contributed
      payers = payers.filter((v) => v.payment_in_round > currentContribution);
    }
  }
}

// Test cases

function SingleWinnerTestCase() {
  const player = [
    Object.assign(new Seat(new Player("", "B Dude")), {
      name: "B Dude",
      payment_in_round: 100,
      cards: [
        new Card(Color.Spades, Value.v_K),
        new Card(Color.Spades, Value.v_Q),
      ],
    }),
  ];
  const center = [
    new Card(Color.Hearts, Value.v_A),
    new Card(Color.Hearts, Value.v_8),
    new Card(Color.Hearts, Value.v_6),
    new Card(Color.Spades, Value.v_4),
    new Card(Color.Spades, Value.v_A),
  ];
  SidePotCalculator.CalculateSidePots(player, center);
  console.log(player);
}

function CasinoRoyaleTestCase() {
  const playerData: [string, number, [Color, Value, Color, Value]][] = [
    ["B Dude", 100, [Color.Spades, Value.v_K, Color.Spades, Value.v_Q]],
    ["A Dude", 100, [Color.Clubs, Value.v_8, Color.Diamonds, Value.v_8]],
    ["Le Chiffre", 100, [Color.Clubs, Value.v_A, Color.Hearts, Value.v_6]],
    ["James Bond", 50, [Color.Spades, Value.v_7, Color.Spades, Value.v_5]],
    ["Dr Evil", 100, [Color.Spades, Value.v_7, Color.Spades, Value.v_5]],
  ];

  const player = playerData.map(([name, payment, [c1, v1, c2, v2]]) => {
    const seat = new Seat(new Player("", name));
    seat.name = name;
    seat.payment_in_round = payment;
    seat.cards = [new Card(c1, v1), new Card(c2, v2)];
    return seat;
  });

  const center = [
    new Card(Color.Hearts, Value.v_A),
    new Card(Color.Spades, Value.v_8),
    new Card(Color.Spades, Value.v_6),
    new Card(Color.Spades, Value.v_4),
    new Card(Color.Spades, Value.v_A),
  ];

  console.log("testing case: casino royale");
  SidePotCalculator.CalculateSidePots(player, center);

  player.forEach((p) => console.log(`${p.name} wins: ${p.win}`));
}

function testcomplexpot() {
  const data: [string, number, [Color, Value, Color, Value], boolean?][] = [
    ["A", 50, [Color.Clubs, Value.v_A, Color.Spades, Value.v_A]],
    ["B", 75, [Color.Clubs, Value.v_K, Color.Spades, Value.v_K]],
    ["C", 100, [Color.Clubs, Value.v_K, Color.Spades, Value.v_K]],
    ["D", 60, [Color.Clubs, Value.v_5, Color.Spades, Value.v_6], true],
    ["E", 25, [Color.Clubs, Value.v_7, Color.Spades, Value.v_7]],
  ];

  const inthegame = data.map(
    ([name, pay, [c1, v1, c2, v2], folded = false]) => {
      const seat = new Seat(new Player("", name));
      seat.name = name;
      seat.payment_in_round = pay;
      seat.cards = [new Card(c1, v1), new Card(c2, v2)];
      if (folded) seat.roundTurn.fold = true;
      return seat;
    }
  );

  const center = [
    new Card(Color.Spades, Value.v_J),
    new Card(Color.Hearts, Value.v_J),
    new Card(Color.Spades, Value.v_5),
    new Card(Color.Clubs, Value.v_5),
    new Card(Color.Clubs, Value.v_5),
  ];

  const sum0 = inthegame.reduce((a, b) => a + b.payment_in_round, 0);

  console.log("testing case: complex money");
  SidePotCalculator.CalculateSidePots(inthegame, center);

  const sum1 = inthegame.reduce((a, b) => a + b.win, 0);
  console.log("sum", sum0, sum1);
  inthegame.forEach((v) => console.log(v.name, v.win));
}

// Run the test case
testcomplexpot();
//CasinoRoyaleTestCase();
//SingleWinnerTestCase();
