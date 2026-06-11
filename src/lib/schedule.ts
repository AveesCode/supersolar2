/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Match } from '../types';

export function generateFullSchedule(): Match[] {
  const baseMatches = [
    { id: "1", a: "Mexico", b: "South Africa", v: "Estadio Azteca", c: "Mexico City", t: "2026-06-11T15:00", type: "Group" as const },
    { id: "2", a: "South Korea", b: "Czechia", v: "Estadio Akron", c: "Guadalajara", t: "2026-06-11T22:00", type: "Group" as const },
    { id: "3", a: "Canada", b: "Bosnia & Herz.", v: "BMO Field", c: "Toronto", t: "2026-06-12T15:00", type: "Group" as const },
    { id: "4", a: "USA", b: "Paraguay", v: "SoFi Stadium", c: "Los Angeles", t: "2026-06-12T21:00", type: "Group" as const },
    { id: "5", a: "Qatar", b: "Switzerland", v: "Levi's Stadium", c: "San Francisco", t: "2026-06-13T15:00", type: "Group" as const },
    { id: "6", a: "Brazil", b: "Morocco", v: "MetLife Stadium", c: "NY/NJ", t: "2026-06-13T18:00", type: "Group" as const },
    { id: "7", a: "Haiti", b: "Scotland", v: "Gillette Stadium", c: "Boston", t: "2026-06-13T21:00", type: "Group" as const },
    { id: "8", a: "Australia", b: "Türkiye", v: "BC Place", c: "Vancouver", t: "2026-06-14T00:00", type: "Group" as const },
    { id: "9", a: "Germany", b: "Curaçao", v: "NRG Stadium", c: "Houston", t: "2026-06-14T13:00", type: "Group" as const },
    { id: "10", a: "Netherlands", b: "Japan", v: "AT&T Stadium", c: "Dallas", t: "2026-06-14T16:00", type: "Group" as const },
    { id: "11", a: "Ivory Coast", b: "Ecuador", v: "Lincoln Financial", c: "Philadelphia", t: "2026-06-14T19:00", type: "Group" as const },
    { id: "12", a: "Sweden", b: "Tunisia", v: "Estadio BBVA", c: "Monterrey", t: "2026-06-14T22:00", type: "Group" as const },
    { id: "13", a: "Spain", b: "Cape Verde", v: "Mercedes-Benz", c: "Atlanta", t: "2026-06-15T12:00", type: "Group" as const },
    { id: "14", a: "Belgium", b: "Egypt", v: "Lumen Field", c: "Seattle", t: "2026-06-15T15:00", type: "Group" as const },
    { id: "15", a: "Saudi Arabia", b: "Uruguay", v: "Hard Rock", c: "Miami", t: "2026-06-15T18:00", type: "Group" as const },
    { id: "16", a: "Iran", b: "New Zealand", v: "SoFi Stadium", c: "Los Angeles", t: "2026-06-15T21:00", type: "Group" as const },
    { id: "17", a: "France", b: "Senegal", v: "MetLife Stadium", c: "NY/NJ", t: "2026-06-16T15:00", type: "Group" as const },
    { id: "18", a: "Iraq", b: "Norway", v: "Gillette Stadium", c: "Boston", t: "2026-06-16T18:00", type: "Group" as const },
    { id: "19", a: "Argentina", b: "Algeria", v: "Arrowhead", c: "Kansas City", t: "2026-06-16T21:00", type: "Group" as const },
    { id: "20", a: "Austria", b: "Jordan", v: "Levi's Stadium", c: "San Francisco", t: "2026-06-17T00:00", type: "Group" as const },
    { id: "21", a: "Portugal", b: "Congo DR", v: "NRG Stadium", c: "Houston", t: "2026-06-17T13:00", type: "Group" as const },
    { id: "22", a: "England", b: "Croatia", v: "AT&T Stadium", c: "Dallas", t: "2026-06-17T16:00", type: "Group" as const },
    { id: "23", a: "Ghana", b: "Panama", v: "BMO Field", c: "Toronto", t: "2026-06-17T19:00", type: "Group" as const },
    { id: "24", a: "Mexico", b: "A3", v: "Estadio BBVA", c: "Monterrey", t: "2026-06-18T22:00", type: "Group" as const }
  ];

  const schedule: Match[] = [];

  for (let i = 1; i <= 104; i++) {
    const idStr = String(i);
    const existing = baseMatches.find(m => m.id === idStr);
    if (existing) {
      schedule.push(existing);
    } else {
      // Lazy placeholders for matches greater than 24
      schedule.push({
        id: idStr,
        a: "TBD",
        b: "TBD",
        v: i > 72 ? "Knockout Venue" : "Group Venue",
        c: "TBD City",
        t: i > 72 ? "2026-06-28T12:00" : "2026-06-20T12:00",
        type: i > 72 ? "Playoff" : "Group"
      });
    }
  }

  return schedule;
}
