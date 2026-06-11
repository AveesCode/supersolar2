/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Match, Participant } from '../types';

export function generateFullSchedule(): Match[] {
  // Official host cities and stadiums for FIFA World Cup 2026
  const venues = {
    mexico_city: { city: "Mexico City", venue: "Estadio Azteca" },
    guadalajara: { city: "Guadalajara", venue: "Estadio Akron" },
    monterrey: { city: "Monterrey", venue: "Estadio BBVA" },
    toronto: { city: "Toronto", venue: "BMO Field" },
    vancouver: { city: "Vancouver", venue: "BC Place" },
    los_angeles: { city: "Los Angeles", venue: "SoFi Stadium" },
    san_francisco: { city: "San Francisco", venue: "Levi's Stadium" },
    seattle: { city: "Seattle", venue: "Lumen Field" },
    houston: { city: "Houston", venue: "NRG Stadium" },
    dallas: { city: "Dallas", venue: "AT&T Stadium" },
    kansas_city: { city: "Kansas City", venue: "Arrowhead Stadium" },
    atlanta: { city: "Atlanta", venue: "Mercedes-Benz Stadium" },
    miami: { city: "Miami", venue: "Hard Rock Stadium" },
    boston: { city: "Boston", venue: "Gillette Stadium" },
    philadelphia: { city: "Philadelphia", venue: "Lincoln Financial Field" },
    nynj: { city: "NY/NJ", venue: "MetLife Stadium" },
  };

  const schedule: Match[] = [];

  // Group Stage Matches: 1 to 72 (June 11 - June 27, 2026)
  const groupMatchSpecs: { [id: number]: { a: string; b: string; v: typeof venues[keyof typeof venues]; t: string } } = {
    1: { a: "Mexico", b: "Group A3", v: venues.mexico_city, t: "2026-06-11T16:00" },
    2: { a: "Group A1", b: "Group A2", v: venues.guadalajara, t: "2026-06-11T20:00" },
    3: { a: "Canada", b: "Group B3", v: venues.toronto, t: "2026-06-12T15:00" },
    4: { a: "USA", b: "Group D3", v: venues.los_angeles, t: "2026-06-12T20:00" },
    5: { a: "Group C1", b: "Group C2", v: venues.boston, t: "2026-06-13T12:00" },
    6: { a: "Group B1", b: "Group B2", v: venues.vancouver, t: "2026-06-13T15:00" },
    7: { a: "Group C3", b: "Group C4", v: venues.nynj, t: "2026-06-13T18:00" },
    8: { a: "Group D1", b: "Group D2", v: venues.san_francisco, t: "2026-06-13T21:00" },
    9: { a: "Group E1", b: "Group E2", v: venues.philadelphia, t: "2026-06-14T12:00" },
    10: { a: "Group F1", b: "Group F2", v: venues.houston, t: "2026-06-14T15:00" },
    11: { a: "Group G1", b: "Group G2", v: venues.dallas, t: "2026-06-14T18:00" },
    12: { a: "Group H1", b: "Group H2", v: venues.monterrey, t: "2026-06-14T21:00" },
    13: { a: "Group I1", b: "Group I2", v: venues.miami, t: "2026-06-15T12:00" },
    14: { a: "Group J1", b: "Group J2", v: venues.atlanta, t: "2026-06-15T15:00" },
    15: { a: "Group E3", b: "Group E4", v: venues.los_angeles, t: "2026-06-15T18:00" },
    16: { a: "Group F3", b: "Group F4", v: venues.seattle, t: "2026-06-15T21:00" },
    17: { a: "Group G3", b: "Group G4", v: venues.nynj, t: "2026-06-16T12:00" },
    18: { a: "Group H3", b: "Group H4", v: venues.boston, t: "2026-06-16T15:00" },
    19: { a: "Group I3", b: "Group I4", v: venues.kansas_city, t: "2026-06-16T18:00" },
    20: { a: "Group J3", b: "Group J4", v: venues.san_francisco, t: "2026-06-16T21:00" },
    21: { a: "Group K1", b: "Group K2", v: venues.toronto, t: "2026-06-17T12:00" },
    22: { a: "Group L1", b: "Group L2", v: venues.dallas, t: "2026-06-17T15:00" },
    23: { a: "Group K3", b: "Group K4", v: venues.houston, t: "2026-06-17T18:00" },
    24: { a: "Group L3", b: "Group L4", v: venues.monterrey, t: "2026-06-17T21:00" },
    25: { a: "Group J1", b: "Group J3", v: venues.atlanta, t: "2026-06-18T12:00" },
    26: { a: "Group D1", b: "Group D3", v: venues.los_angeles, t: "2026-06-18T15:00" },
    27: { a: "Mexico", b: "Group A4", v: venues.mexico_city, t: "2026-06-18T19:00" },
    28: { a: "Group G1", b: "Group G3", v: venues.houston, t: "2026-06-18T22:00" },
    29: { a: "Group H1", b: "Group H3", v: venues.philadelphia, t: "2026-06-19T12:00" },
    30: { a: "Group I1", b: "Group I3", v: venues.boston, t: "2026-06-19T15:00" },
    31: { a: "Group E1", b: "Group E3", v: venues.san_francisco, t: "2026-06-19T18:00" },
    32: { a: "Group F1", b: "Group F3", v: venues.seattle, t: "2026-06-19T21:00" },
    33: { a: "Canada", b: "Group B4", v: venues.vancouver, t: "2026-06-20T12:00" },
    34: { a: "Group B1", b: "Group B3", v: venues.toronto, t: "2026-06-20T15:00" },
    35: { a: "Group G2", b: "Group G4", v: venues.nynj, t: "2026-06-20T18:00" },
    36: { a: "Group H2", b: "Group H4", v: venues.boston, t: "2026-06-20T21:00" },
    37: { a: "Group I2", b: "Group I4", v: venues.miami, t: "2026-06-21T12:00" },
    38: { a: "Group J2", b: "Group J4", v: venues.atlanta, t: "2026-06-21T15:00" },
    39: { a: "Group E2", b: "Group E4", v: venues.los_angeles, t: "2026-06-21T18:00" },
    40: { a: "Group F2", b: "Group F4", v: venues.seattle, t: "2026-06-21T21:00" },
    41: { a: "Group K1", b: "Group K3", v: venues.toronto, t: "2026-06-22T12:00" },
    42: { a: "Group L1", b: "Group L3", v: venues.dallas, t: "2026-06-22T15:00" },
    43: { a: "Group K2", b: "Group K4", v: venues.houston, t: "2026-06-22T18:00" },
    44: { a: "Group L2", b: "Group L4", v: venues.monterrey, t: "2026-06-22T21:00" },
    45: { a: "Group C1", b: "Group C3", v: venues.boston, t: "2026-06-23T12:00" },
    46: { a: "USA", b: "Group D4", v: venues.los_angeles, t: "2026-06-23T15:00" },
    47: { a: "Group D1", b: "Group D4", v: venues.san_francisco, t: "2026-06-23T18:00" },
    48: { a: "Group C2", b: "Group C4", v: venues.philadelphia, t: "2026-06-23T21:00" },
    49: { a: "Group G3", b: "Group G2", v: venues.nynj, t: "2026-06-24T12:00" },
    50: { a: "Group G4", b: "Group G1", v: venues.atlanta, t: "2026-06-24T15:00" },
    51: { a: "Group H3", b: "Group H2", v: venues.miami, t: "2026-06-24T18:00" },
    52: { a: "Group H4", b: "Group H1", v: venues.kansas_city, t: "2026-06-24T21:00" },
    53: { a: "Mexico", b: "Group A2", v: venues.mexico_city, t: "2026-06-24T23:00" },
    54: { a: "Group A3", b: "Group A4", v: venues.guadalajara, t: "2026-06-24T23:00" },
    55: { a: "Group I3", b: "Group I2", v: venues.boston, t: "2026-06-25T12:00" },
    56: { a: "Group I4", b: "Group I1", v: venues.philadelphia, t: "2026-06-25T15:00" },
    57: { a: "Group J3", b: "Group J2", v: venues.nynj, t: "2026-06-25T18:00" },
    58: { a: "Group J4", b: "Group J1", v: venues.dallas, t: "2026-06-25T21:00" },
    59: { a: "Canada", b: "Group B2", v: venues.vancouver, t: "2026-06-25T23:00" },
    60: { a: "Group B3", b: "Group B4", v: venues.toronto, t: "2026-06-25T23:00" },
    61: { a: "Group K3", b: "Group K2", v: venues.atlanta, t: "2026-06-26T12:00" },
    62: { a: "Group K4", b: "Group K1", v: venues.miami, t: "2026-06-26T15:00" },
    63: { a: "Group L3", b: "Group L2", v: venues.los_angeles, t: "2026-06-26T18:00" },
    64: { a: "Group L4", b: "Group L1", v: venues.seattle, t: "2026-06-26T21:00" },
    65: { a: "Group E3", b: "Group E2", v: venues.houston, t: "2026-06-26T23:00" },
    66: { a: "Group E4", b: "Group E1", v: venues.san_francisco, t: "2026-06-26T23:00" },
    67: { a: "Group F3", b: "Group F2", v: venues.toronto, t: "2026-06-27T12:00" },
    68: { a: "Group F4", b: "Group F1", v: venues.boston, t: "2026-06-27T15:00" },
    69: { a: "Group C3", b: "Group C2", v: venues.nynj, t: "2026-06-27T18:00" },
    70: { a: "Group C4", b: "Group C1", v: venues.philadelphia, t: "2026-06-27T21:00" },
    71: { a: "Group D3", b: "Group D2", v: venues.vancouver, t: "2026-06-27T23:00" },
    72: { a: "Group D4", b: "Group D1", v: venues.seattle, t: "2026-06-27T23:00" }
  };

  // Populate Group Matches
  for (let i = 1; i <= 72; i++) {
    const spec = groupMatchSpecs[i];
    if (spec) {
      schedule.push({
        id: String(i),
        a: spec.a,
        b: spec.b,
        v: spec.v.venue,
        c: spec.v.city,
        t: spec.t,
        type: "Group"
      });
    } else {
      // Fallback generator for group matches should we miss any key index
      schedule.push({
        id: String(i),
        a: `Group Team ${i}A`,
        b: `Group Team ${i}B`,
        v: venues.dallas.venue,
        c: venues.dallas.city,
        t: "2026-06-20T15:00",
        type: "Group"
      });
    }
  }

  // Round of 32 Playoff Matches: 73 to 88 (June 28 - July 3, 2026)
  const roundOf32Specs: { [id: number]: { a: string; b: string; v: typeof venues[keyof typeof venues]; t: string } } = {
    73: { a: "Winner Group A", b: "3rd Group C/D/F", v: venues.mexico_city, t: "2026-06-28T16:00" },
    74: { a: "Runner-up Group A", b: "Runner-up Group B", v: venues.los_angeles, t: "2026-06-28T20:00" },
    75: { a: "Winner Group B", b: "3rd Group A/C/F", v: venues.boston, t: "2026-06-29T12:00" },
    76: { a: "Winner Group C", b: "3rd Group F/G/H", v: venues.nynj, t: "2026-06-29T16:00" },
    77: { a: "Runner-up Group C", b: "Runner-up Group D", v: venues.atlanta, t: "2026-06-29T20:00" },
    78: { a: "Winner Group D", b: "3rd Group B/E/I", v: venues.dallas, t: "2026-06-30T15:00" },
    79: { a: "Winner Group E", b: "Runner-up Group F", v: venues.seattle, t: "2026-06-30T19:00" },
    80: { a: "Runner-up Group E", b: "Runner-up Group H", v: venues.kansas_city, t: "2026-06-30T22:00" },
    81: { a: "Winner Group F", b: "3rd Group C/E/K", v: venues.philadelphia, t: "2026-07-01T12:00" },
    82: { a: "Winner Group G", b: "3rd Group A/B/I", v: venues.san_francisco, t: "2026-07-01T16:00" },
    83: { a: "Winner Group H", b: "Runner-up Group G", v: venues.toronto, t: "2026-07-01T20:00" },
    84: { a: "Winner Group I", b: "3rd Group E/J/L", v: venues.miami, t: "2026-07-02T12:00" },
    85: { a: "Winner Group J", b: "Runner-up Group K", v: venues.houston, t: "2026-07-02T16:00" },
    86: { a: "Winner Group K", b: "3rd Group D/H/J", v: venues.vancouver, t: "2026-07-02T20:00" },
    87: { a: "Winner Group L", b: "Runner-up Group I", v: venues.monterrey, t: "2026-07-03T15:00" },
    88: { a: "Runner-up Group L", b: "Runner-up Group J", v: venues.dallas, t: "2026-07-03T19:00" }
  };

  for (let i = 73; i <= 88; i++) {
    const spec = roundOf32Specs[i];
    schedule.push({
      id: String(i),
      a: spec.a,
      b: spec.b,
      v: spec.v.venue,
      c: spec.v.city,
      t: spec.t,
      type: "Playoff"
    });
  }

  // Round of 16 Playoff Matches: 89 to 96 (July 4 - July 7, 2026)
  const roundOf16Specs: { [id: number]: { a: string; b: string; v: typeof venues[keyof typeof venues]; t: string } } = {
    89: { a: "Winner Match 73", b: "Winner Match 74", v: venues.philadelphia, t: "2026-07-04T12:00" },
    90: { a: "Winner Match 75", b: "Winner Match 76", v: venues.houston, t: "2026-07-04T16:00" },
    91: { a: "Winner Match 77", b: "Winner Match 78", v: venues.nynj, t: "2026-07-05T12:00" },
    92: { a: "Winner Match 79", b: "Winner Match 80", v: venues.mexico_city, t: "2026-07-05T16:00" },
    93: { a: "Winner Match 81", b: "Winner Match 82", v: venues.boston, t: "2026-07-06T12:00" },
    94: { a: "Winner Match 83", b: "Winner Match 84", v: venues.seattle, t: "2026-07-06T16:00" },
    95: { a: "Winner Match 85", b: "Winner Match 86", v: venues.atlanta, t: "2026-07-07T12:00" },
    96: { a: "Winner Match 87", b: "Winner Match 88", v: venues.vancouver, t: "2026-07-07T16:00" }
  };

  for (let i = 89; i <= 96; i++) {
    const spec = roundOf16Specs[i];
    schedule.push({
      id: String(i),
      a: spec.a,
      b: spec.b,
      v: spec.v.venue,
      c: spec.v.city,
      t: spec.t,
      type: "Playoff"
    });
  }

  // Quarter-Finals: 97 to 100 (July 9 - July 11, 2026)
  const quarterFinalSpecs: { [id: number]: { a: string; b: string; v: typeof venues[keyof typeof venues]; t: string } } = {
    97: { a: "Winner Match 89", b: "Winner Match 90", v: venues.boston, t: "2026-07-09T15:00" },
    98: { a: "Winner Match 91", b: "Winner Match 92", v: venues.los_angeles, t: "2026-07-10T15:00" },
    99: { a: "Winner Match 93", b: "Winner Match 94", v: venues.miami, t: "2026-07-11T12:00" },
    100: { a: "Winner Match 95", b: "Winner Match 96", v: venues.kansas_city, t: "2026-07-11T16:00" }
  };

  for (let i = 97; i <= 100; i++) {
    const spec = quarterFinalSpecs[i];
    schedule.push({
      id: String(i),
      a: spec.a,
      b: spec.b,
      v: spec.v.venue,
      c: spec.v.city,
      t: spec.t,
      type: "Playoff"
    });
  }

  // Semi-Finals: 101 and 102 (July 14 & July 15, 2026)
  schedule.push({
    id: "101",
    a: "Winner Match 97",
    b: "Winner Match 98",
    v: venues.dallas.venue,
    c: venues.dallas.city,
    t: "2026-07-14T19:00",
    type: "Playoff"
  });

  schedule.push({
    id: "102",
    a: "Winner Match 99",
    b: "Winner Match 100",
    v: venues.atlanta.venue,
    c: venues.atlanta.city,
    t: "2026-07-15T19:00",
    type: "Playoff"
  });

  // Third Place Playoff: 103 (July 18, 2026)
  schedule.push({
    id: "103",
    a: "Loser Match 101",
    b: "Loser Match 102",
    v: venues.miami.venue,
    c: venues.miami.city,
    t: "2026-07-18T15:00",
    type: "Playoff"
  });

  // Grand Final: 104 (July 19, 2026)
  schedule.push({
    id: "104",
    a: "Winner Match 101",
    b: "Winner Match 102",
    v: venues.nynj.venue,
    c: venues.nynj.city,
    t: "2026-07-19T14:00",
    type: "Playoff"
  });

  return schedule;
}

export function getDefaultParticipants(): Participant[] {
  const list = [
    { first: "Avinash", last: "Kumar", code: "AVIKUM" },
    { first: "Alex", last: "Shults", code: "ASHULT" },
    { first: "Dean", last: "Linenberg", code: "DLINEN" },
    { first: "Fadi", last: "Alrabadi", code: "FADIAL" },
    { first: "Jack", last: "Upton", code: "JUPTON" },
    { first: "Jacob", last: "Duncan", code: "JDUNC" },
    { first: "Kartik", last: "Emani", code: "KEMANI" },
    { first: "Marco Jordan", last: "Cavallini", code: "MJCAVA" },
    { first: "Mridhul", last: "Dhar", code: "MDHAR" },
    { first: "Priyanka", last: "Bhoothpur", code: "PBHOOT" },
    { first: "Sakthivel", last: "Shanmugam", code: "SSHANC" },
    { first: "Shria", last: "Siramshetty", code: "SHRIA6" },
    { first: "Claude", last: "Mura", code: "CMURA6" },
    { first: "Marco", last: "Lang", code: "MLANG6" }
  ];

  return list.map((item, idx) => ({
    id: `p_init_${idx}_${item.first.toLowerCase().replace(/\s/g, '')}`,
    firstName: item.first,
    lastName: item.last,
    code: item.code.toUpperCase(),
    picks: {},
    isActive: true,
    createdAt: "2026-06-11T12:00:00.000Z",
    updatedAt: "2026-06-11T12:00:00.000Z"
  }));
}
