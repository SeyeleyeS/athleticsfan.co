export type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "note"; text: string };

export type Article = {
  slug: string;
  title: string;
  description: string;
  kicker: string;
  date: string;
  order: number;
  linkIds: string[];
  blocks: Block[];
};

export const articles: Article[] = [
  {
    slug: "winter-2026",
    title: "The winter between Sacramento and the Strip",
    description:
      "The 2026 Athletics season closed at 64-98 in West Sacramento. What fans can actually know about 2027, and what is still a target.",
    kicker: "Notebook",
    date: "2026-11-16",
    order: 1,
    linkIds: ["bref-2026", "mlb-news", "mlb-vegas-homestand", "rvj", "chronicle", "bee"],
    blocks: [
      {
        type: "p",
        text: "The 2026 Athletics season is over, and the clubhouse on this site is already arguing about the next one. That is the healthy version of fandom. The less healthy version is pretending a winter rumor is a schedule. This note is an attempt to keep the two apart.",
      },
      {
        type: "p",
        text: "Baseball-Reference's 2026 page lists the club at 64-98, fourth in the American League West, managed by Mark Kotsay, with David Forst as general manager and Sutter Health Park as the ballpark. Published attendance is 799,240, last among the 30 teams. Those are compiled figures, not a table this site keeps. If you want the game log, use [the 2026 season page](https://www.baseball-reference.com/teams/ATH/2026.shtml) or [MLB.com's Athletics news](https://www.mlb.com/athletics/news).",
      },
      {
        type: "p",
        text: "The shape of the home schedule mattered as much as the record. MLB.com, when it released the 2026 slate, said the club would play a six-game homestand from June 8 to 14 at Las Vegas Ballpark, the Triple-A park in Summerlin: three against the Brewers, three against the Rockies. The same story said the ballpark under construction on the Strip was aimed at the start of the 2028 season, and that potential home postseason games in 2026 would be in West Sacramento. Summerlin was a visit. It was not the new yard.",
      },
      {
        type: "h2",
        text: "What 2027 is, and is not",
      },
      {
        type: "p",
        text: "A 2028 Strip opening, if it holds, leaves 2027 as another year before that ballpark. It does not, by itself, publish a 2027 schedule, a spring-training site, or a promise that every date survives construction. Fans have trained their habits on Mesa and on the drive to West Sacramento. Both habits should be checked against [MLB.com](https://www.mlb.com/athletics) before anyone books a flight.",
      },
      {
        type: "note",
        text: "Open question: this page does not treat the 2027 schedule, the spring site, or a specific Las Vegas Opening Day as announced. Baseball-Reference's 2026 register lists Forst as general manager. Front offices change. Confirm the current staff on MLB.com before repeating it.",
      },
      {
        type: "p",
        text: "The point of a fan journal, if it is going to be any use, is narrower than a newspaper of record and wider than a group chat. We can say what the season was. We can point at the papers and the official site. We can host the argument about what next year should feel like. We cannot invent the calendar, and we are not trying to build a second club. The Athletics already have one. The work here is to stay with it: Oakland memory, Sacramento present, Las Vegas future, without pretending those are the same address.",
      },
    ],
  },
  {
    slug: "sacramento-years",
    title: "A temporary home that still counts",
    description:
      "Sutter Health Park, the River Cats' yard in West Sacramento, became a major-league address in 2025. The limits are real. So are the fans.",
    kicker: "Sacramento",
    date: "2026-11-16",
    order: 2,
    linkIds: ["bref-2026", "mlb-vegas-homestand", "bee", "chronicle", "mlb-home"],
    blocks: [
      {
        type: "p",
        text: "Temporary is a dangerous word in sports. It can mean a bridge, or it can mean a shrug. The Athletics' seasons at Sutter Health Park in West Sacramento are a bridge with a capacity problem, which is not the same thing as a season that did not happen.",
      },
      {
        type: "p",
        text: "The park belongs, in the ordinary calendar, to the Sacramento River Cats. Major-league baseball moved in for 2025 after the last Oakland season, and 2026 was the second year of that arrangement. Home games were mostly there. A slice of the 2026 home schedule was not: the June series at Las Vegas Ballpark in Summerlin, documented by [MLB.com](https://www.mlb.com/news/a-s-announce-2026-schedule-including-homestand-in-las-vegas). Keeping those two parks distinct is the whole assignment. One is a Triple-A yard pressed into big-league service. The other was a week of games closer to a ballpark that was still a construction site.",
      },
      {
        type: "p",
        text: "The attendance number Baseball-Reference publishes for 2026, 799,240, is last in the majors. That is what a smaller park does to a season total. It is not a moral scoreboard, and it is not an argument that the people in the seats were imaginary. A fan site that wants to help the club should be able to say both: the building was the constraint, and the season was still the season.",
      },
      {
        type: "h2",
        text: "Stomper, without the costume",
      },
      {
        type: "p",
        text: "Fans still talk about Stomper, the elephant mascot generations met in Oakland. This site does not draw him, and it does not use the team's marks. The elephant as a story is older than the costume. In Philadelphia, John McGraw's dismissal of the club as a white elephant was picked up by Connie Mack and worn on purpose. You can tell that story in sentences. You do not need the licensed drawing to do it.",
      },
      {
        type: "p",
        text: "Local coverage of the park, the traffic, and the practical complaints lives with the Sacramento press. The Bee's baseball section is the obvious desk. We could not get that section index to answer from the environment that built this page, so the link is marked unconfirmed. Bay Area readers still have [the Chronicle's Athletics section](https://www.sfchronicle.com/sports/athletics/). Official word, when it is official, is [MLB.com](https://www.mlb.com/athletics).",
      },
      {
        type: "note",
        text: "Open question: published plans have pointed at West Sacramento through the seasons before a 2028 Strip opening. A contingency year if construction slips has been discussed in local reporting. Until MLB publishes a schedule, that is a plan, not a fact on a ticket.",
      },
    ],
  },
  {
    slug: "las-vegas-ballpark",
    title: "The ballpark that is not the Summerlin series",
    description:
      "Las Vegas Ballpark hosted six Athletics games in June 2026. The Strip ballpark is a different project, with a 2028 target and no published Opening Day here.",
    kicker: "Las Vegas",
    date: "2026-11-16",
    order: 3,
    linkIds: ["mlb-vegas-homestand", "rvj", "bref-ath", "mlb-news"],
    blocks: [
      {
        type: "p",
        text: "Two Las Vegases got tangled in the 2026 conversation, and they should be pulled apart before anyone argues about a dream October.",
      },
      {
        type: "p",
        text: "The first is Las Vegas Ballpark in Summerlin, home of the Triple-A Aviators. MLB.com's schedule release put the Athletics there for six home games, June 8 through 14, 2026, against the Brewers and the Rockies. That series is in the books. It was a homestand in a minor-league park, on purpose, while the permanent building was still going up somewhere else.",
      },
      {
        type: "p",
        text: "The second is the ballpark on the Strip, on the ground of the former Tropicana. Club statements and Las Vegas reporting describe a roofed park, with Bjarke Ingels Group and HNTB attached to the design, aimed at a 2028 opening. MLB.com, in that same 2026 schedule story, said the Strip park was scheduled for the start of the 2028 season. The [Las Vegas Review-Journal's Athletics section](https://www.reviewjournal.com/sports/athletics/) is the local paper following the project week to week.",
      },
      {
        type: "note",
        text: "Open question: a construction target is not an Opening Day. Reporting has described completion around the end of February 2028. This site has not seen a published first-pitch date, a final capacity it is willing to treat as settled, or a 2028 opponent. Those belong on MLB.com when they exist. Capacity figures and dollar amounts floating around social feeds are not repeated here.",
      },
      {
        type: "p",
        text: "The Dream Season thread in the clubhouse is allowed to be silly. A first October on the Strip, Yankees or Dodgers, is a fan scenario. It is labeled that way so nobody has to pretend the site has inside information. The serious sentence is the boring one: help the club arrive, and do not confuse a June series in Summerlin with a ballpark that was not open yet.",
      },
      {
        type: "p",
        text: "Franchise registers, including the move from the Oakland code to the Athletics code on [Baseball-Reference](https://www.baseball-reference.com/teams/ATH/), are reference desks. They are not the front office. When the schedule exists, [MLB.com](https://www.mlb.com/athletics/news) will have it first.",
      },
    ],
  },
  {
    slug: "leaving-oakland",
    title: "The last seasons by the estuary",
    description:
      "Oakland was the Athletics' home from 1968 through 2024. The goodbye was public, unfinished, and not something a fan site needs to counterfeit.",
    kicker: "Oakland",
    date: "2026-11-16",
    order: 4,
    linkIds: ["bref-oak", "chronicle", "examiner", "mlb-home", "athletic"],
    blocks: [
      {
        type: "p",
        text: "The Athletics played in Oakland from 1968 through 2024. That sentence is the one to keep. Everything around it, the politics of the Coliseum, the ownership arguments, the last homestand, is real history and also a place where fan writing goes rotten if it starts inventing private motives.",
      },
      {
        type: "p",
        text: "Charlie Finley moved the club west for the 1968 season after the Kansas City years. The Oakland-Alameda County Coliseum became the address for three World Series in the early 1970s, another in 1989, and a long middle age of clever teams, thin payrolls, and a building that stopped being loved and never quite stopped being used. The [Oakland register at Baseball-Reference](https://www.baseball-reference.com/teams/OAK/) is the cleanest public index of those seasons.",
      },
      {
        type: "p",
        text: "The final Oakland season was 2024. The last homestand sat in late September. This page is not going to attach a score to it from memory and call that journalism. The game logs are on MLB.com and Baseball-Reference. What a fan journal can say without borrowing anyone's grief is simpler: a lot of people understood the building as theirs, the baseball was often bad at the end, the departure was contested in public, and the franchise did not dissolve when the last home game ended. It changed addresses.",
      },
      {
        type: "h2",
        text: "Staying with the club",
      },
      {
        type: "p",
        text: "The owner's instruction for this site, paraphrased because it is the brief and not a slogan sold to us by the team, is that we want to help the Athletics, not take them away. That rules out a few easy poses. It rules out pretending Oakland did not matter. It also rules out a site whose only product is resentment. The Chronicle still covers the club from the Bay. The Examiner’s sports desk publishes game items, though a dedicated team landing page was not something this build could confirm. [The Athletic](https://www.nytimes.com/athletic/mlb/team/athletics/) is behind a subscription and is often the deepest daily reporting.",
      },
      {
        type: "p",
        text: "John Fisher is the owner of record. That is a public fact, not a character study. Readers who want the relocation politics should read the newspapers, not a fan forum that has decided to fill the gaps with dialogue.",
      },
      {
        type: "note",
        text: "Open question: details of the final Oakland home date, attendance that day, and who spoke are easy to misremember. Use the 2024 game log rather than a retelling here.",
      },
    ],
  },
  {
    slug: "moneyball",
    title: "The front office that changed the conversation",
    description:
      "Billy Beane's Athletics, the 2002 club, and the book that followed. The movie is a dramatization. The seasons are in the register.",
    kicker: "Moneyball",
    date: "2026-11-16",
    order: 5,
    linkIds: ["bref-oak", "fangraphs", "athletic", "mlb-home"],
    blocks: [
      {
        type: "p",
        text: "Moneyball became a word people use for any team that tries to be clever. On this franchise it is a specific stretch of baseball, a book, and then a film that should not be asked to do the work of a season summary.",
      },
      {
        type: "p",
        text: "Billy Beane was the general manager. After the 2001 season the club lost, among others, Jason Giambi and Johnny Damon to richer rosters. The 2002 team won the American League West anyway, ran off a 20-game winning streak that is still the number people remember, and lost the Division Series to Minnesota. Miguel Tejada was the league's Most Valuable Player. Barry Zito won the Cy Young. Tim Hudson and Mark Mulder were the other poles of that rotation. Scott Hatteberg, a catcher asked to play first, became one of the public faces of the approach because Michael Lewis put him there.",
      },
      {
        type: "p",
        text: "Lewis's book arrived in 2003. It is a reported argument about how a poor club tried to buy wins, and it is also a story with characters and omissions. The film that followed years later compresses and invents. Treat it as a film. The standings live on the [Oakland register](https://www.baseball-reference.com/teams/OAK/). The methods, as people argue about them now, live in places like [FanGraphs](https://www.fangraphs.com/teams/athletics), which this site will not scrape into a second box score.",
      },
      {
        type: "h2",
        text: "What the era was for",
      },
      {
        type: "p",
        text: "The useful inheritance is not a slogan. It is the record of a club that reached October several times in that decade without pretending the payroll was something it was not, and then the later runs, division titles in 2012 and 2013 among them, that still did not produce a pennant. Fans can love that resourcefulness and also admit it became an excuse, in some years, for never spending. Both readings are allowed here. Inventing a quote from Beane is not.",
      },
      {
        type: "note",
        text: "This piece does not restate win totals beyond the streak and the series result. If a number matters to the argument you are having, open the season page and cite that, not a forum post.",
      },
    ],
  },
  {
    slug: "earthquake-series",
    title: "1989, when the Series stopped",
    description:
      "The Bash Brothers, a pennant lost in 1988, a sweep of the Giants, and the Loma Prieta earthquake before Game 3.",
    kicker: "Oakland",
    date: "2026-11-16",
    order: 6,
    linkIds: ["bref-oak", "mlb-home", "chronicle"],
    blocks: [
      {
        type: "p",
        text: "The late-1980s Athletics are easy to flatten into a poster: Canseco, McGwire, Eckersley, a lot of green. The October record is more precise than the poster, and it includes a loss that the poster usually skips.",
      },
      {
        type: "p",
        text: "In 1988 the club won the American League pennant and lost the World Series to the Dodgers in five games. Kirk Gibson's pinch-hit home run in Game 1 is the image that survived. Jose Canseco's 40-home-run, 40-steal season is the regular-season line people still cite. Tony La Russa managed. Those are the facts to keep before anyone calls 1988 a championship.",
      },
      {
        type: "p",
        text: "In 1989 the Athletics swept the San Francisco Giants. Dave Stewart, Dennis Eckersley, Rickey Henderson, Mark McGwire, Canseco, Carney Lansford, Terry Steinbach, Walt Weiss, Dave Parker: it was a deep roster, and it played like one in the first two games at the Coliseum. Game 3 was supposed to be at Candlestick Park on October 17. The Loma Prieta earthquake hit the Bay Area that evening, before the first pitch. It killed 63 people. The Series stopped.",
      },
      {
        type: "p",
        text: "Play resumed on October 27. The Athletics finished the sweep. Baseball was a small thing next to the freeway and the fire in the Marina, and the people who were there have said so for decades. A fan site does not improve the story by dressing it up. The Chronicle's archive is the local record of the week. The series line is on [Baseball-Reference](https://www.baseball-reference.com/teams/OAK/).",
      },
      {
        type: "p",
        text: "A year later the club won another pennant and was swept by Cincinnati. Eckersley's Series is the one fans still wince at. Dynasties are not a straight line of parades. This one had a championship, a loss on either side of it, and an earthquake in the middle. Remembering it that way is the respectful version.",
      },
    ],
  },
  {
    slug: "oakland-dynasty",
    title: "Three Octobers, and then the room split",
    description:
      "The 1972, 1973, and 1974 Athletics won three straight World Series. The names are famous. The sequels were not automatic.",
    kicker: "Oakland",
    date: "2026-11-16",
    order: 7,
    linkIds: ["bref-oak", "mlb-home", "chronicle"],
    blocks: [
      {
        type: "p",
        text: "From 1972 through 1974 the Oakland Athletics won the World Series three years running. No American League club has matched that streak since. The teams were talented, mustachioed, underpaid by Charlie Finley's lights, and constantly on the edge of a clubhouse argument. All of that can be true at once.",
      },
      {
        type: "p",
        text: "In 1972 they beat Cincinnati in seven. Dick Williams managed. Rollie Fingers, Catfish Hunter, Vida Blue, and Blue Moon Odom carried the pitching. Gene Tenace, a catcher, homered in his first two World Series at-bats and became the unlikely center of the series. Reggie Jackson had been the star of the American League Championship Series, including a steal of home against Detroit, and then a hamstring injury kept him out of the World Series entirely. Leaving him out of the 1972 parade photo is the accurate crop.",
      },
      {
        type: "p",
        text: "In 1973 they beat the Mets in seven, and Jackson was the Series MVP. The clubhouse story that still circulates, Finley's attempt to deactivate Mike Andrews after two errors in Game 2, is not a rumor. Andrews was pushed toward a false injury statement, the players revolted, and Commissioner Bowie Kuhn ordered him reinstated. It is a bad episode inside a championship season. Skipping it would make the dynasty cleaner than it was.",
      },
      {
        type: "p",
        text: "In 1974 they beat the Dodgers in five. Alvin Dark was the manager, Williams having left after 1973. Fingers was the Series MVP. Hunter's contract fight with Finley came due after the season. An arbitrator set him free, and he signed with the Yankees. The third title was also the last autumn of that particular group.",
      },
      {
        type: "p",
        text: "Campy Campaneris, Sal Bando, and Joe Rudi are the part of the team casual retellings forget, because the pitchers and Reggie take the light. The registers do not forget. Start with [Oakland's Baseball-Reference page](https://www.baseball-reference.com/teams/OAK/) if you want the seasons rather than the myth. Official histories live at [MLB.com](https://www.mlb.com/athletics).",
      },
      {
        type: "note",
        text: "Names and series results here are the standard historical record. Game-by-game lines are not reprinted. If a memory disagrees with the log, trust the log.",
      },
    ],
  },
  {
    slug: "philadelphia-roots",
    title: "The elephant was an insult, and then it was a franchise",
    description:
      "Philadelphia from 1901, Connie Mack, five World Series, then Kansas City, then Oakland. A short account of a long beginning.",
    kicker: "Philadelphia",
    date: "2026-11-16",
    order: 8,
    linkIds: ["bref-pha", "bref-oak", "mlb-home"],
    blocks: [
      {
        type: "p",
        text: "The Athletics began in 1901 as a charter club of the American League, in Philadelphia, with Connie Mack as manager. Mack stayed for half a century, through 1950. That tenure is so long it stops sounding like a fact and starts sounding like a legend. It is a fact. The [Philadelphia register](https://www.baseball-reference.com/teams/PHA/) is the index.",
      },
      {
        type: "p",
        text: "They won the World Series in 1910, 1911, 1913, 1929, and 1930. They also lost famous ones: to the Giants in 1905, to the Miracle Braves in 1914, to the Cardinals in 1931. Early home games were at Columbia Park. Shibe Park, later Connie Mack Stadium, opened in 1909 and became the picture people mean when they say the old Philadelphia Athletics.",
      },
      {
        type: "h2",
        text: "A white elephant",
      },
      {
        type: "p",
        text: "John McGraw, managing the Giants, wrote the Philadelphia club off as a white elephant. Mack adopted the insult. The elephant became the franchise mark, decades before a costumed mascot named Stomper walked a dugout in Oakland. This site tells that story and does not display the modern logo. The color green and gold that fans now treat as eternal is, in truth, a later choice, Finley's, layered on top of an older identity. Both can be honored without a trademark on the page.",
      },
      {
        type: "p",
        text: "The club left Philadelphia after the 1954 season and played in Kansas City from 1955 through 1967. Finley, who came to own the team during those Kansas City years, moved it to Oakland for 1968. From there the history is the Oakland history: the dynasty, 1989, Moneyball, the long argument about the Coliseum, and the departure after 2024. Philadelphia is not a footnote. It is the first sixty years. It is also not an invitation to pretend the Sacramento seasons are still Shibe Park. The line is continuous. The cities are not interchangeable.",
      },
      {
        type: "p",
        text: "Readers who want the nineteenth-century Philadelphia Athletics, a different club in a different league, should not mix that team into this register. The American League franchise dated 1901 is the one that reached Oakland and, later, West Sacramento. When in doubt, follow [MLB.com's Athletics site](https://www.mlb.com/athletics) for the living club and Baseball-Reference for the split city registers.",
      },
    ],
  },
];
