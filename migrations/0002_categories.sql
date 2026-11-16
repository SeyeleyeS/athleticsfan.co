-- Production seed: forum categories only. No users, threads, polls, or listings.
-- Fictional demo fans live in seeds/demo.sql and are not applied by `wrangler d1 migrations apply`.

INSERT INTO categories (id, slug, name, description, sort_order) VALUES
  (
    'spring-training-2027',
    'spring-training-2027',
    'Spring Training 2027',
    'Where fans are gathering once camp opens. The club has trained in Mesa for years. Confirm the 2027 site and schedule on MLB.com before you book a flight.',
    1
  ),
  (
    'predictions',
    'predictions',
    'Predictions',
    'Wins, roster guesses, and October arguments. Bring a reason. Numbers stay on MLB.com and Baseball-Reference.',
    2
  ),
  (
    'road-trips',
    'road-trips',
    'Road Trips',
    'Announcements and ride shares to games. Public meetups only. This board does not sell tickets.',
    3
  ),
  (
    'fan-gear',
    'fan-gear',
    'Fan Gear by Fans',
    'Talk about handmade work. Listings, with the no-logo rule and an external link, go on the Fan Gear page. The site never takes payment.',
    4
  ),
  (
    'prospects',
    'prospects',
    'Prospects Chatter',
    'Who you are watching this winter. Rankings and scouting reports live on MLB Pipeline. Link them instead of pasting a stat line.',
    5
  ),
  (
    'sacramento-vegas',
    'sacramento-vegas',
    'Sacramento to the Vegas Showcase',
    'Sutter Health Park, Stomper sightings, the Summerlin series, and the Strip ballpark. The Dream Season thread lives here. It is a fan scenario, not a report.',
    6
  );
