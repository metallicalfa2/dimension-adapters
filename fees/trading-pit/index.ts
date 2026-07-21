import { CHAIN } from "../../helpers/chains";
import { FetchOptions, SimpleAdapter } from "../../adapters/types";

// TRADING PIT — 60s on-chain grid lottery on Robinhood Chain (chainId 4663).
// Native wager token is ETH. Each settled round with a winning booth takes a 5%
// rake on the losing pool; rake is forwarded to PitTreasury and retained as
// protocol backing (no staker/jackpot ETH split like SLVR).
const PIT_GAME = "0xd7dfb50d8f3cd06641fb5b7b33a169562ba5ce77";

const ROUND_SETTLED =
  "event RoundSettled(uint256 indexed roundId, uint8 winningTile, bytes32 rand, uint256 totalPot, uint256 winPool, uint256 rake, bool rolledOver, bool jackpotHit, uint256 jackpotPaidPit)";

const fetch = async (options: FetchOptions) => {
  const logs = await options.getLogs({ target: PIT_GAME, eventAbi: ROUND_SETTLED });

  const dailyVolume = options.createBalances();
  const dailyFees = options.createBalances();

  logs.forEach((log: any) => {
    dailyVolume.addGasToken(log.totalPot);
    dailyFees.addGasToken(log.rake);
  });

  return {
    dailyVolume,
    dailyFees,
    dailyRevenue: dailyFees,
    dailyProtocolRevenue: dailyFees,
  };
};

const methodology = {
  Volume: "Total ETH wagered each round (totalPot on RoundSettled from PitGame).",
  Fees: "The 5% rake taken from each round's losing pool when the winning booth has bets (rake field on RoundSettled).",
  Revenue: "All rake ETH retained by PitTreasury for protocol backing and buyback — 100% of fees.",
  ProtocolRevenue: "All rake ETH retained by PitTreasury.",
};

const adapter: SimpleAdapter = {
  version: 2,
  pullHourly: true,
  fetch,
  chains: [CHAIN.ROBINHOOD],
  start: "2026-07-21",
  methodology,
};

export default adapter;
