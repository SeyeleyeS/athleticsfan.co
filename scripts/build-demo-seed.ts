import { writeFileSync } from "node:fs";
import { hashPassword } from "../src/server/password";

function q(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

const fans = [
  ["user_kid_demo", "coliseum_kid", "Demo-Kid-2026!"],
  ["user_ana_demo", "rivercity_ana", "Demo-Ana-2026!"],
  ["user_strip_demo", "strip_bound", "Demo-Strip-2026!"],
  ["user_mesa_demo", "mesa_notebook", "Demo-Mesa-2026!"],
] as const;

const hashes = new Map<string, { hash: string; salt: string }>();
for (const [id, , password] of fans) {
  hashes.set(id, await hashPassword(password));
}

const userRows = fans
  .map(([id, username]) => {
    const hashed = hashes.get(id)!;
    return `  (${q(id)}, ${q(username)}, ${q(hashed.hash)}, ${q(hashed.salt)}, 'fan', 1, '2026-11-01T18:00:00.000Z')`;
  })
  .join(",\n");

const sql = `-- DEMO SEED. Local preview only.
-- Do not move this file into migrations/ and do not run it against production.
-- Fictional accounts, all labeled is_demo = 1:
--   coliseum_kid / Demo-Kid-2026!
--   rivercity_ana / Demo-Ana-2026!
--   strip_bound / Demo-Strip-2026!
--   mesa_notebook / Demo-Mesa-2026!
-- Apply after migrations: npm run db:demo
-- Reset a local database by deleting .wrangler before migrating again.

INSERT INTO users (id, username, password_hash, salt, role, is_demo, created_at) VALUES
${userRows};

INSERT INTO threads (id, category_id, user_id, title, body, is_announcement, hidden, created_at, updated_at) VALUES
  ('thread_mesa_2027', 'spring-training-2027', 'user_mesa_demo', 'Where are we gathering for Spring Training 2027?',
   'Demo account. The club has spent a lot of springs in Mesa, and I do not want to book a flight off a rumor. If camp is still at Hohokam, I can do the first weekend. If it moves, say so with a link to MLB.com, not a screenshot from a group chat.',
   0, 0, '2026-11-10T16:00:00.000Z', '2026-11-12T16:00:00.000Z'),
  ('thread_win_guess', 'predictions', 'user_kid_demo', '2027 wins: I will take the over on 75 and defend it',
   'Demo account. This is a guess, not a projection I stole from a pay site. After 64 wins in 2026 I want a louder summer, and I think the young bats are the reason. Bring your own number. Leave the spreadsheet on FanGraphs.',
   0, 0, '2026-11-11T16:00:00.000Z', '2026-11-13T16:00:00.000Z'),
  ('thread_rides_2027', 'road-trips', 'user_ana_demo', 'Opening week 2027: ride shares to Sutter Health Park',
   'Demo account. Announcement, not a ticket sale. If you want a seat from Sacramento or Davis for the first homestand, say which day and how many people. Meet in a public place. Nobody on this board is a broker, and nobody should be collecting money in a thread.',
   1, 0, '2026-11-12T16:00:00.000Z', '2026-11-14T16:00:00.000Z'),
  ('thread_gear_talk', 'fan-gear', 'user_ana_demo', 'Post the listing on Fan Gear, not a photo of a licensed cap',
   'Demo account. If you made it, use the Fan Gear form and check the box. If it has a team mark on it, it does not belong in that form. Official stuff goes out through the Fanatics links, once those URLs are real.',
   0, 0, '2026-11-12T18:00:00.000Z', '2026-11-12T19:00:00.000Z'),
  ('thread_watchlist', 'prospects', 'user_strip_demo', 'Who are you actually watching this winter?',
   'Demo account. I keep opening MLB Pipeline and then arguing with myself. Say a name and why the at-bats or the arsenal are interesting. Do not paste a stat line. Link the official page and let people read it there.',
   0, 0, '2026-11-13T16:00:00.000Z', '2026-11-15T16:00:00.000Z'),
  ('thread_sutter_notes', 'sacramento-vegas', 'user_kid_demo', 'Stomper stories and Sutter Health Park notes',
   'Demo account. The elephant mascot is a memory from Oakland, and this site is not going to draw him. What I want here is practical: gates, sun, the river breeze, and whether the June games in Summerlin felt like a preview or like a field trip. The Strip park is a different building.',
   0, 0, '2026-11-13T18:00:00.000Z', '2026-11-15T18:00:00.000Z'),
  ('thread_dream_ws', 'sacramento-vegas', 'user_strip_demo', 'Dream Season: a first Las Vegas October, Yankees or Dodgers',
   'Demo account. This is a fan scenario, not a report and not a prediction with a source. First full season on the Strip, a pennant that arrives early, and a World Series that makes the building feel small in a good way. Yankees if you want the pinstripes and the history. Dodgers if you want the freeway argument. I will take either. I will not pretend the front office has scheduled it.',
   0, 0, '2026-11-14T16:00:00.000Z', '2026-11-16T15:00:00.000Z');

INSERT INTO replies (id, thread_id, user_id, body, hidden, created_at) VALUES
  ('reply_mesa_ana', 'thread_mesa_2027', 'user_ana_demo', 'I can do Mesa if that is still the site. I will not put a deposit down until the club posts the camp schedule.', 0, '2026-11-11T16:00:00.000Z'),
  ('reply_mesa_kid', 'thread_mesa_2027', 'user_kid_demo', 'Same. Last time I guessed a workout day I watched a closed gate for an hour.', 0, '2026-11-12T16:00:00.000Z'),
  ('reply_wins_strip', 'thread_win_guess', 'user_strip_demo', 'I am on the under. I would love to be wrong in September.', 0, '2026-11-12T16:00:00.000Z'),
  ('reply_wins_ana', 'thread_win_guess', 'user_ana_demo', 'Over, but only if the rotation stays boring and healthy. Boring is a compliment.', 0, '2026-11-13T16:00:00.000Z'),
  ('reply_ride_mesa', 'thread_rides_2027', 'user_mesa_demo', 'I can drive Saturday of opening week, two extra seats, leaving from midtown. Public meetup only.', 0, '2026-11-13T16:00:00.000Z'),
  ('reply_ride_kid', 'thread_rides_2027', 'user_kid_demo', 'I will take one of those seats. Paying you for gas at the car, not in the thread.', 0, '2026-11-14T16:00:00.000Z'),
  ('reply_watch_kid', 'thread_watchlist', 'user_kid_demo', 'Gage Jump and Henry Bolte are the names I keep typing into MLB.com. The Pipeline list can tell me if I am late.', 0, '2026-11-14T16:00:00.000Z'),
  ('reply_watch_ana', 'thread_watchlist', 'user_ana_demo', 'Luis Morales, and I am reading the scouting blurb there instead of arguing about a number I half remember.', 0, '2026-11-15T16:00:00.000Z'),
  ('reply_park_ana', 'thread_sutter_notes', 'user_ana_demo', 'The sun in right field in July is the whole story. Bring a hat you made yourself.', 0, '2026-11-14T18:00:00.000Z'),
  ('reply_park_strip', 'thread_sutter_notes', 'user_strip_demo', 'Summerlin felt like a road trip that happened to count. The Strip yard is still a crane shot.', 0, '2026-11-15T18:00:00.000Z'),
  ('reply_dream_kid', 'thread_dream_ws', 'user_kid_demo', 'Dodgers. I want the argument, and I want it in a building that is actually finished.', 0, '2026-11-15T16:00:00.000Z'),
  ('reply_dream_mesa', 'thread_dream_ws', 'user_mesa_demo', 'Yankees, only because my uncle would have to fly in and be insufferable. Fan fiction. I know.', 0, '2026-11-16T15:00:00.000Z');

INSERT INTO polls (id, user_id, question, hidden, created_at) VALUES
  ('poll_dream_opponent', 'user_strip_demo', 'Dream Season: who is the World Series opponent?', 0, '2026-11-14T17:00:00.000Z'),
  ('poll_where_2027', 'user_ana_demo', 'Where will you watch the most Athletics baseball in 2027?', 0, '2026-11-14T18:00:00.000Z');

INSERT INTO poll_options (id, poll_id, label, sort_order) VALUES
  ('opt_yankees_01', 'poll_dream_opponent', 'Yankees', 0),
  ('opt_dodgers_01', 'poll_dream_opponent', 'Dodgers', 1),
  ('opt_either_penn', 'poll_dream_opponent', 'Whoever wins the pennant', 2),
  ('opt_sutter_park', 'poll_where_2027', 'Sutter Health Park', 0),
  ('opt_vegas_trip', 'poll_where_2027', 'A Las Vegas trip', 1),
  ('opt_road_city', 'poll_where_2027', 'A road city', 2),
  ('opt_broadcast_1', 'poll_where_2027', 'Mostly on the broadcast', 3);

INSERT INTO poll_votes (poll_id, user_id, option_id, created_at) VALUES
  ('poll_dream_opponent', 'user_kid_demo', 'opt_dodgers_01', '2026-11-14T19:00:00.000Z'),
  ('poll_dream_opponent', 'user_ana_demo', 'opt_yankees_01', '2026-11-14T20:00:00.000Z'),
  ('poll_dream_opponent', 'user_strip_demo', 'opt_either_penn', '2026-11-15T16:00:00.000Z'),
  ('poll_dream_opponent', 'user_mesa_demo', 'opt_dodgers_01', '2026-11-15T17:00:00.000Z'),
  ('poll_where_2027', 'user_kid_demo', 'opt_sutter_park', '2026-11-14T21:00:00.000Z'),
  ('poll_where_2027', 'user_ana_demo', 'opt_broadcast_1', '2026-11-15T15:00:00.000Z'),
  ('poll_where_2027', 'user_strip_demo', 'opt_vegas_trip', '2026-11-15T18:00:00.000Z'),
  ('poll_where_2027', 'user_mesa_demo', 'opt_road_city', '2026-11-15T19:00:00.000Z');

INSERT INTO shoutouts (id, user_id, kind, subject, body, hidden, created_at) VALUES
  ('shout_ushers_01', 'user_ana_demo', 'praise', 'Sutter Health Park staff',
   'Demo account. The ushers in a small park have a harder job than the job description. Thank you for treating a big-league crowd like neighbors.',
   0, '2026-11-15T16:00:00.000Z'),
  ('shout_gear_rule1', 'user_kid_demo', 'callout', 'Fan Gear rules',
   'Demo account. If the photo has a team mark in it, do not post it here. Green and gold clay is a color story. A licensed cap is a different store.',
   0, '2026-11-15T18:00:00.000Z'),
  ('shout_site_note1', 'user_mesa_demo', 'praise', 'athleticsfan.co',
   'Demo account. A place that links out for the stats and does not pretend to be the front office is the version of a fan site I will actually use.',
   0, '2026-11-16T15:00:00.000Z'),
  ('shout_wilson_bat', 'user_strip_demo', 'praise', 'Jacob Wilson',
   'Demo account. The at-bats are a pleasure to watch. The real page, with the numbers, is on MLB.com. This is just the thank-you note.',
   0, '2026-11-16T16:00:00.000Z');

INSERT INTO gear_listings (id, user_id, title, price, external_url, photo_url, description, no_licensed_marks, hidden, created_at) VALUES
  ('gear_coasters', 'user_ana_demo', 'Green-and-gold clay coasters, set of four', '$36',
   'https://example.com/demo/green-gold-coasters', '/artwork/coaster.svg',
   'Demo listing. Hand-thrown coasters glazed forest green and antique gold. No team marks, no wordmarks, no licensed art. The link is a placeholder for this preview.',
   1, 0, '2026-11-15T17:00:00.000Z'),
  ('gear_notebook', 'user_mesa_demo', 'Letterpress notebook with a gold rule', '$18',
   'https://example.com/demo/gold-rule-notebook', '/artwork/notebook.svg',
   'Demo listing. Cream stock, a single gold rule, stitched by hand. Colors only. No logos. Payment happens on the external link, not on this site.',
   1, 0, '2026-11-15T19:00:00.000Z');
`;

writeFileSync(new URL("../seeds/demo.sql", import.meta.url), sql);
console.log("Wrote seeds/demo.sql");
