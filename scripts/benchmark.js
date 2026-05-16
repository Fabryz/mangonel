#!/usr/bin/env node

/**
 * Simple tick-loop + broadcast benchmark helper.
 *
 * Usage:
 *   node scripts/benchmark.js --players=1000 --ticks=1200 --tickRate=30
 */

const DEFAULTS = {
  players: 500,
  ticks: 600,
  tickRate: 30,
  width: 2500,
  height: 1000,
};

function parseArgs(argv) {
  return argv.reduce((acc, arg) => {
    if (!arg.startsWith('--')) return acc;

    const [key, rawValue] = arg.slice(2).split('=');
    if (!Object.prototype.hasOwnProperty.call(DEFAULTS, key)) return acc;

    const value = Number(rawValue);
    if (Number.isFinite(value) && value > 0) acc[key] = Math.floor(value);

    return acc;
  }, { ...DEFAULTS });
}

function buildPlayers(count, width, height) {
  const players = [];
  for (let i = 0; i < count; i += 1) {
    players.push({
      id: `p${i}`,
      x: (i * 13) % width,
      y: (i * 7) % height,
      velocity: (i % 4) + 1,
    });
  }

  return players;
}

function tickPlayers(players, width, height) {
  for (let i = 0; i < players.length; i += 1) {
    const player = players[i];
    player.x = (player.x + player.velocity) % width;
    player.y = (player.y + player.velocity) % height;
  }
}

function buildSnapshot(players) {
  const snapshot = new Array(players.length);
  for (let i = 0; i < players.length; i += 1) {
    const p = players[i];
    snapshot[i] = { id: p.id, x: p.x, y: p.y };
  }

  return JSON.stringify(snapshot);
}

function percentile(values, pct) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor((pct / 100) * sorted.length));
  return sorted[idx];
}

function msFromHrtimeNs(ns) {
  return Number(ns) / 1e6;
}

function runBenchmark(config) {
  const players = buildPlayers(config.players, config.width, config.height);
  const tickDurationsMs = [];
  const payloadBytes = [];

  const start = process.hrtime.bigint();

  for (let i = 0; i < config.ticks; i += 1) {
    const tickStart = process.hrtime.bigint();
    tickPlayers(players, config.width, config.height);
    const payload = buildSnapshot(players);
    const tickEnd = process.hrtime.bigint();

    tickDurationsMs.push(msFromHrtimeNs(tickEnd - tickStart));
    payloadBytes.push(Buffer.byteLength(payload));
  }

  const end = process.hrtime.bigint();
  const elapsedMs = msFromHrtimeNs(end - start);

  return {
    config,
    elapsedMs,
    ticksPerSecond: (config.ticks / elapsedMs) * 1000,
    tickMs: {
      avg: tickDurationsMs.reduce((sum, n) => sum + n, 0) / tickDurationsMs.length,
      p95: percentile(tickDurationsMs, 95),
      p99: percentile(tickDurationsMs, 99),
    },
    payloadBytes: {
      avg: payloadBytes.reduce((sum, n) => sum + n, 0) / payloadBytes.length,
      max: Math.max(...payloadBytes),
    },
  };
}

const config = parseArgs(process.argv.slice(2));
const result = runBenchmark(config);

console.log('Mangonel tick/broadcast benchmark');
console.log(JSON.stringify(result, null, 2));
