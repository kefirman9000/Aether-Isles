# Gridlock City

An open-city crime game in the spirit of the original GTA games, for PC and mobile browsers, played from a pseudo-3D chase camera in a low-res pixel style. Steal cars, answer ringing payphones for jobs, cause chaos and try to lose the cops.

**Play:** open `index.html` in any modern browser, or play on GitHub Pages at https://kefirman9000.github.io/Aether-Isles/

**Top-down 2D version:** the original top-down game is kept as `2d.html` (https://kefirman9000.github.io/Aether-Isles/2d.html).

> This repo used to hold *Aether Isles: Swarm of the Warden*. It's been replaced for now; the old game is still in the git history (commit `85a66b8`).

## Controls
| PC | Phone | Action |
|---|---|---|
| W / S | Left-thumb joystick | Walk forward and back · gas and brake/reverse. In a car, the phone joystick is point-to-drive: push where you want to go |
| A / D | Left-thumb joystick | Turn on foot · steer in a car |
| Right-drag | | Turn on foot |
| Mouse + left click | Drag the right side of the screen (or FIRE to auto-aim) | Aim and shoot. Works as a drive-by from inside a car, and fires the cannon in a tank |
| F / E / Enter | CAR | Get in, get out, or jack a car |
| Space | DRIFT / JUMP | Jump on foot · handbrake in a car |
| C | | Hold to look behind |
| V | | Rear-view mirror on/off |
| Q / mouse wheel | GUN | Switch weapon |
| R | RADIO | Change radio station |
| P / Esc | II (top middle) | Pause |
| M | | Mute |

## Features
- **Chase camera:** a pseudo-3D view from behind your car or character, drawn at low resolution with hard pixels (in the style of Rust Belt Rally). Buildings, cars and props are 3D blocks; people are pixel billboards. The ground is ray-marched over a height map, so the city has rolling hills and cars roll downhill.
- **City and countryside:** Old Town brick and warehouses, Uptown glass towers, Lotus Quarter shophouses with awnings and neon, stepped downtown skyscrapers and plazas, suburbs with gable-roofed houses, and parks with ponds and winding paths. Past the city limits there are forested mountains to the north and west, ocean to the south and farmland to the east.
- **Three gangs, three turfs:** the Red Sabres, Chrome Saints and Jade Lotus each run a corner of the city, with their own colors, members and cars. Downtown belongs to the cops.
- **Respect:** every gang has a respect meter. Do jobs for a gang and it likes you more while its rival likes you less. Kill a gang's members and they'll shoot on sight, and at very low respect their cars do drive-bys.
- **Gang payphones:** phones are colored by the gang that owns them. Gangs that hate you stop calling. Jobs: Special Delivery, Hit the Golden Viper, Briefcase Run, Hot Potato (lose 3 stars), and Turf War (wipe out a rival crew).
- **Kill Frenzies:** grab a ☠ pickup for a timed rampage, either wrecking cars with rockets or taking out a gang with an SMG.
- **Gunplay:** pistol, dual pistols, SMG, shotgun (a fixed 5-pellet fan), flamethrower, Molotovs (hold to charge a throw on phone/keyboard) and rockets. Fire rates follow GTA2. Bullets carry your movement speed, enemies flinch when hit, and you get recoil, shell casings, a crosshair and hit markers. Cops and gangs miss the way GTA2's do: often while moving, sometimes even when standing still.
- **Driving:** the car you drive runs on a port of GTA2's car physics (from the community decompilation). The gas pedal and brake pressure ramp up, each axle's tires cancel their own sliding, and steering scales with speed, with the rear wheels counter-steering at low speed. A per-tick stabilizer keeps 90% of sideways speed, 97% of forward speed and 88% of spin. Top speed is capped by gear, a lane assist snaps you straight onto the road when you're within 25° and not steering, and scraping a wall turns you parallel to it. Every car uses real handling values from GTA2's nyc.gci: Pipsqueak = Bug, Cruiser = Aniston BD4, Cabbie = Taxi, Viper = Z-Type, Hauler = Box Truck, Squad Car = Cop Car, Fed Cruiser = Special Agent Car, plus the SWAT Van and Tank. GTA2's rules for turbo, damage slowing you down, and each car's armor (anti strength) are in too. Rain cuts grip.
- **Landmarks:** an 18×18-block city with the East River cutting Westside Island off from the rest, crossed by two road bridges and the Gridlock Bridge, a Brooklyn-style suspension bridge with stone towers, swooping main cables and a deck that arches high over the water. There's also a Central Park with lakes, a Times Square with tall towers and animated screens, South Beach with sand, palms and a boardwalk, and fenced construction sites.
- **Stunt ramps:** dirt, wood and sand ramps sit off the road, in construction sites, parking lots, the park and on the beach. Hit one fast for a jump and a cash bonus. Slow motion on jumps is off by default (turn it on in Options).
- **Story:** three gang bosses wait at their hideouts (marked on the map): Vince "Razor" Moreno of the Red Sabres, Dex "The Chairman" Calloway of the Chrome Saints and Mother Lin of the Jade Lotus. Walk up to one for a job. Each has six story missions with dialogue (a car theft, a chase over the Gridlock Bridge, a Times Square handoff, a shootout in Central Park, a speedboat run, a SWAT van heist, a ghost taxi run, a stunt jump and more), and finishing all eighteen unlocks the finale.
- **Safehouses:** three to buy around town. Walk in to save and heal, park a car in the garage to keep it (it's still there after a reload), and after getting wasted you wake up at the nearest one.
- **Boats:** speedboats wait at docks on both banks of the East River and can pass under the bridges. Police boats come after you on the water.
- **The El and the subway:** an elevated train loops above the east side on steel pillars and stops at four stations; press F at a station when the train is in to ride to the next stop. Green SUBWAY entrances around town take you to any other entrance for $5, and riding one while wanted throws the cops off your trail.
- **Horn and duty jobs:** hold H (or HORN) to honk, which moves people and traffic out of your way. Tap it in a taxi, ambulance, squad car or fire truck to start or stop that job.
- **Fire truck:** a water cannon instead of guns. Fire calls send you to put out blazes; it also douses burning cars and knocks people over.
- **Spray shop upgrades:** stop at a spray shop with no wanted level to buy armor plating, bulletproofing, nitro (SHIFT / NOS) or a respray.
- **Street races:** three races (Gridlock Sprint, River Loop, Beach Dash) against three rival drivers, with a countdown, finishing places, and gold, silver and bronze times. Stop on the R marker in any car to start.
- **Phone:** press G (or CALL) to have a getaway car, taxi, pickup or fire truck dropped off nearby.
- **Auto showroom:** buy a Viper, Cruiser, Hauler, ambulance or an army surplus tank.
- **Stats:** pause → Stats shows your completion percentage, story progress, packages, race golds, stunt jumps, cars stolen and more.
- **Street layout:** two diagonal avenues cut across the grid (a Broadway through Times Square, and one across Westside Island) with their own traffic, little triangle parks where they slice through blocks, narrow alleys through some blocks (with dumpsters and the odd ramp), and about a quarter of the grid closed off into pedestrian plazas and park lawns, so the city has superblocks, T-junctions and bends. Traffic lights are only at real junctions.
- **Street life:** people wait at corners for the light before crossing, buskers play in Times Square, joggers run through the parks, and South Beach fills up on sunny days.
- **Smarter cops:** they see less far at night and in the rain, and half as far while you sit still in a parking lot, a park or under a bridge. The minimap rings show the reduced range.
- **No see-through ground:** things behind hills are hidden by the ground in front of them, and bridge decks are open slabs over the water, so you can see under them.
- **On phones:** a city map (tap the minimap), a wheel-and-pedals driving option, adjustable button size, a fullscreen option, vibration, automatic resolution scaling when the frame rate drops, pause and autosave when you switch apps, and the screen kept awake. It plays upright or sideways.
- **Standing on things:** on foot you can jump onto car roofs and ramps, walk across them and ride on top of a moving car.
- **Police helicopter:** at 4+ stars a chopper circles you with a searchlight and can see you over buildings, which makes you harder to lose. At 5+ stars it shoots. Bring it down with gunfire or rockets.
- **Taxi fares:** drive a taxi and passengers hail you. Stop beside them, then get them to the marker before the timer runs out. Fares in a row pay more.
- **Seeing behind you:** a rear-view mirror at the top of the screen while you drive (V toggles it), hold C to look back, and red arrows at the screen edge when cops or attackers come up behind you.
- **Ambulance and vigilante jobs:** in an ambulance, patients need picking up and rushing to the hospital. In a squad car, wreck fleeing suspects. Each completed job raises the level and the pay.
- **Hidden packages:** 30 green packages are tucked into parks, yards, lots and plazas. Each pays $500, with a $5,000 bonus every 10.
- **Traffic lights:** every intersection has working lights and stop lines, and traffic stops on red.
- **Losing the cops:** stay out of sight and your wanted level drops one star at a time. While you're wanted, the minimap shows how far each cop, foot cop and the chopper can see: red when they've spotted you, blue once you've slipped away, with an X where they last saw you.
- **Wanted level (6 stars):** wanted points work like GTA2. A civilian kill is worth a little, a cop kill a lot, and anything a cop sees you do gets you at least 1 star. One star fades if you stay out of sight for about 30 seconds. Anything higher sticks until you hit a spray shop ($500) or grab a cop bribe (-1 star).
- **Who comes after you:** police at 1–3 stars, SWAT joining at 4, FBI only at 5, and army trucks plus a tank at 6. Roadblocks start at 3 stars. Cops head to where they last saw you, so breaking line of sight matters. You can steal the tank.
- **Car crusher:** drive a car onto the crusher pad to sell it for scrap. Sports cars and police cars pay the most.
- **Car radio:** three stations of generated music (punk, synthwave and street beats) that come on when you get in a car.
- **Day and night:** a full day cycle with headlights, streetlights, police light glow, and rain storms with thunder that make the roads slippery.
- **Heavier action:** ragdolling bodies, crash debris, tire smoke, screen shake, slow-motion explosions and a CHAOS combo that multiplies cash for chained destruction.
- **Procedural city:** an 18×18-block grid of streets, so traffic, cops and missions work everywhere. Each browser gets its own city layout and keeps it, so saves line up (Options → New city layout makes a fresh one).
- **Title menu and saves:** a GTA-style title screen over a live flyover of the city, with Continue, New Game, Load Game, Options and Controls. The pause menu adds Save Game and Quit to Title. Three save slots plus an autosave every 90 seconds while you're not wanted (you can't save with cops on you). Options: jump slow motion, rear-view mirror, camera distance, autosave and sound.
- **Updater:** Menu or pause → Check for updates. It only contacts GitHub when you press it.

Your cash, saves and options are kept in your browser (localStorage).

Gameplay systems are modeled on how GTA2 works (studied from the community GTA2 decompilation). All code here is original.

## 💜 Support
Gridlock City is free, with no ads or purchases. If you enjoy it, you can support development through [GitHub Sponsors](https://github.com/sponsors/kefirman9000).
