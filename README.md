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
| SHIFT (on foot) | Push the stick all the way | Sprint |
| 1-9 / arrows + Enter | Tap | Pick a dialog answer |

**Controller:** left stick move/steer · RT gas · LT brake · A jump/handbrake · Y enter/exit car · RB fire · right stick aim · LB switch weapon · X horn · B look behind · L3 sprint (nitro in a car) · D-pad up radio, down phone, right mirror · Back map · Start pause.

## Features
- **Climb the city (v4.8):** brick walk-ups have fire escapes you can climb from the sidewalk, zigzagging up floor by floor to a ladder onto the roof, and every flat roof can be walked on, so you can run and jump across the rooftops (watch the drop: long falls hurt). The El stairs are proper steps now, a ladder at each station leads up onto the platform canopy, and you can jump down onto the tracks or onto the train's roof and ride it around the loop. The subway exit stairs are climbable too.
- **Curbside parking:** cars sit parked along the curbs mid-block, half up on the sidewalk, filling in as you move around town. They're all stealable.
- **Garbage routes and taco service:** tap the horn in a Trash Hauler to run a garbage route (stop next to each bin to empty it), or in a Taco Truck to serve hungry crowds at the parks, plazas, Times Square and the beach. Both level up like the other duty jobs.
- **Visible damage:** beaten-up cars get dents and scrapes on their flanks, sag lower, lose a headlight, then steam and smoke.
- **Busier sidewalks:** more people downtown and in Times Square (fewer late at night), and people line up at hot dog carts and parked food trucks.
- **Night life:** some neon signs flicker, open shops glow with an OPEN sign, and late at night some shops pull their shutters down.
- **Radio that suits the car:** muscle cars and pickups tune to punk, sports cars and SUVs to synth, everyday cars to street beats; each car remembers its station. Emergency vehicles and buses start with the radio off.
- **Better controls:** controller support (left stick, triggers for gas and brake, right stick to aim, rumble on crashes), sprint on foot (SHIFT, L3, or push the touch stick all the way), easier car entry, dialog choices you can pick with the arrow keys or 1-9, and new options for lane assist, mouse turn speed and controller vibration.
- **More vehicles (v4.7):** eight new rides, each with its own shape and handling: the Ranchhand pickup (sometimes with cargo in the bed), Ridgeback SUV with roof rails, Bruiser muscle car (rear-drive, hood scoop, wing, racing stripes), Homestead station wagon (some with wood panelling), Courier van (with company liveries), Trash Hauler garbage truck, Breeze open-top roadster and a Taco Truck. Paint varies too: two-tone roofs and stripes. Buses, limos, ice cream vans and fire trucks now have their own handling instead of borrowing the sedan's.
- **Traffic that fits the neighborhood:** SUVs and roadsters uptown, vans, pickups and garbage trucks in Old Town, wagons and pickups in the suburbs, taxis, limos and buses downtown. The gangs drive their own kinds of car: Red Sabres muscle cars, Chrome Saints SUVs, Jade Lotus tuned imports.
- **A more lived-in city:** suburban houses have driveways with the family car and a mailbox, wooden utility poles with sagging wires line the suburban streets, food trucks park in the plazas and hot dog carts sit on corners. Old brick walk-ups have iron fire escapes and cornices, flat roofs have stair bulkheads and vents, and at night windows glow warm, cool office-white or flickering TV-blue.
- **New at the showroom:** the Bruiser, the Breeze and the Ridgeback. The phone's pickup order now brings an actual pickup.
- **Living traffic:** AI drivers overtake wrecks and stalled cars, pull over for sirens, honk and shout when you block them, and city buses stop at shelters where people wait.
- **Chase camera:** a pseudo-3D view from behind your car or character, drawn at low resolution with hard pixels (in the style of Rust Belt Rally). Buildings, cars and props are 3D blocks; people are pixel billboards. The ground is ray-marched over a height map, so the city has rolling hills and cars roll downhill.
- **City and countryside:** Old Town brick and warehouses, Uptown glass towers, Lotus Quarter shophouses with awnings and neon, stepped downtown skyscrapers and plazas, suburbs with gable-roofed houses, and parks with ponds and winding paths. Past the city limits there are forested mountains to the north and west, ocean to the south and farmland to the east.
- **Three gangs, three turfs:** the Red Sabres, Chrome Saints and Jade Lotus each run a corner of the city, with their own colors, members and cars. Downtown belongs to the cops.
- **Respect:** every gang has a respect meter. Do jobs for a gang and it likes you more while its rival likes you less. Kill a gang's members and they'll shoot on sight, and at very low respect their cars do drive-bys.
- **Gang payphones:** phones are colored by the gang that owns them. A ringing phone shows on the HUD, but it's one way to find work among many, so the arrow no longer drags you to it. Gangs that hate you stop calling. Jobs: Special Delivery, Hit the Golden Viper, Briefcase Run, Hot Potato (lose 3 stars), and Turf War (wipe out a rival crew).
- **Kill Frenzies:** grab a ☠ pickup for a timed rampage, either wrecking cars with rockets or taking out a gang with an SMG.
- **Gunplay:** pistol, dual pistols, SMG, shotgun (a fixed 5-pellet fan), flamethrower, Molotovs (hold to charge a throw on phone/keyboard) and rockets. Fire rates follow GTA2. Bullets carry your movement speed, enemies flinch when hit, and you get recoil, shell casings, a crosshair and hit markers. Cops and gangs miss the way GTA2's do: often while moving, sometimes even when standing still.
- **Driving:** the car you drive runs on a port of GTA2's car physics (from the community decompilation). The gas pedal and brake pressure ramp up, each axle's tires cancel their own sliding, and steering scales with speed, with the rear wheels counter-steering at low speed. A per-tick stabilizer keeps 90% of sideways speed, 97% of forward speed and 88% of spin. Top speed is capped by gear, a lane assist snaps you straight onto the road when you're within 25° and not steering, and scraping a wall turns you parallel to it. Every car uses real handling values from GTA2's nyc.gci: Pipsqueak = Bug, Cruiser = Aniston BD4, Cabbie = Taxi, Viper = Z-Type, Hauler = Box Truck, Squad Car = Cop Car, Fed Cruiser = Special Agent Car, plus the SWAT Van and Tank. GTA2's rules for turbo, damage slowing you down, and each car's armor (anti strength) are in too. Rain cuts grip.
- **Landmarks:** an 18×18-block city with the East River cutting Westside Island off from the rest, crossed by two road bridges and the Gridlock Bridge, a Brooklyn-style suspension bridge with stone towers, swooping main cables and a deck that arches high over the water. There's also a Central Park with lakes, a Times Square with tall towers and animated screens, South Beach with sand, palms and a boardwalk, and fenced construction sites.
- **Stunt ramps:** dirt, wood and sand ramps sit off the road, in construction sites, parking lots, the park and on the beach. Hit one fast for a jump and a cash bonus. Slow motion on jumps is off by default (turn it on in Options).
- **Story:** three gang bosses wait at their hideouts (marked on the radar and map with their initial, GTA-style: **V**, **D** and **M**, big and blinking when they have work): Vince "Razor" Moreno of the Red Sabres, Dex "The Chairman" Calloway of the Chrome Saints and Mother Lin of the Jade Lotus. Walk up to one for a job. Each has six or seven story missions with dialogue (an El train chase, a car theft, a chase over the Gridlock Bridge, a Times Square handoff, a shootout in Central Park, a speedboat run, a SWAT van heist, a ghost taxi run, a stunt jump and more), and finishing all eighteen unlocks the finale.
- **Safehouses:** three to buy around town. Walk in to save and heal, park a car in the garage to keep it (it's still there after a reload), and after getting wasted you wake up at the nearest one.
- **Boats:** speedboats wait at docks on both banks of the East River and can pass under the bridges. Police boats come after you on the water.
- **The El and the subway:** an elevated train loops above the east side on steel pillars. Climb the stairs at one of its four stations, wait on the platform and press F when the train is in to ride to the next stop. Green SUBWAY entrances ($5) take you down to an underground platform; board the train there, pick a stop, and take the exit stairs up to the street. Riding while wanted throws the cops off your trail.
- **Horn and duty jobs:** hold H (or HORN) to honk, which moves people and traffic out of your way. Tap it in a taxi, ambulance, squad car or fire truck to start or stop that job.
- **Fire truck:** a water cannon instead of guns. Fire calls send you to put out blazes; it also douses burning cars and knocks people over.
- **Spray shop upgrades:** stop at a spray shop with no wanted level to buy armor plating, bulletproofing, nitro (SHIFT / NOS) or a respray.
- **Street races:** three races (Gridlock Sprint, River Loop, Beach Dash) against three rival drivers who find their way through the streets, with a countdown, finishing places, and gold, silver and bronze times. Stop on the R marker in any car to start.
- **Phone:** press G (or CALL) to have a getaway car, taxi, pickup or fire truck dropped off nearby.
- **Auto showroom:** buy a Viper, Cruiser, Hauler, ambulance or an army surplus tank.
- **Stats:** pause → Stats shows your completion percentage, story progress, packages, race golds, stunt jumps, cars stolen and more.
- **Street layout:** two diagonal avenues cut across the grid (a Broadway through Times Square, and one across Westside Island) with their own traffic, little triangle parks where they slice through blocks, narrow alleys through some blocks (with dumpsters and the odd ramp), and about a quarter of the grid closed off into pedestrian plazas and park lawns, so the city has superblocks, T-junctions and bends. Traffic lights are only at real junctions, and the lane assist lines your car up with the diagonal avenues as well as the grid.
- **Street life:** people wait at corners for the light, stop to chat or take phone calls, open umbrellas in the rain and get into parked cars and drive off. Buskers play in Times Square, joggers run through the parks and South Beach fills up on sunny days. Things happen around you too: police pursuits, muggings (stop the thief for a reward), gang stand-offs and broken-down cars.
- **Interiors:** walk into Ammu-Nation (buy at the counter), your safehouse (sleep in the bed to save and heal) and, at night, The Neon Lotus club near Times Square: a flashing dance floor, a crowd, the DJ, music, and a bar (a VIP round makes every gang like you a little more).
- **City responders:** ambulances drive to people who've been hurt and fire trucks drive to wrecks, and their crews get out to help.
- **Weather and seasons:** snow in winter (or pick Winter in Options) that settles on the ground, morning fog banks, storms that flood low streets, and lightning that knocks out the power, so traffic lights and street lights go dark for a while. Some nights (and on New Year's and the Fourth of July) there are fireworks over the East River.
- **GPS route:** the minimap and the city map draw the shortest route along the streets to whatever you're heading for, and the guidance arrow is bigger.
- **Cop search area:** once you break line of sight, a dashed yellow circle on the minimap shows where the cops are searching, growing the longer they've lost you.
- **Install it like an app:** on a phone, use Install as an app on the title screen (or Share → Add to Home Screen on an iPhone). It gets its own icon, opens full screen and works offline. On a computer, Chrome and Edge show an install icon in the address bar.
- **Turf wars:** take out five gang members in one of their blocks within a minute and the block becomes yours (purple on the maps). Every block pays you every two minutes, and gangs sometimes come back to take one: kill the attackers within 90 seconds or lose it.
- **Stunt trials:** pull up at the STUNT TRIAL sign by the construction site and land three jumps in a row, each needing more air; the trials get harder each level.
- **Cheats:** type a code while playing (or enter it under Pause → Cheats): GUNSGUNSGUNS, HEALME, LEAVEMEALONE, MOREPOLICE, CASHMONEY, GIVEMETANK, FLYBOY, RAINYDAY, SUNNYDAY, SNOWDAY, BIGBANG, NIGHTOWL, EARLYBIRD.
- **Retry:** fail a story mission or race and you're offered a retry as soon as you're back on your feet.
- **Baseball bat:** buy one at Ammu-Nation ($100) for close-up fights (Q to switch to it).
- **More traffic:** city buses, stretch limos and Mr. Whippy ice cream vans join the traffic, and drivers slow down and let sirens through.
- **Smarter traffic:** drivers pull out and go around wrecks, stalled cars and anything else stopped in their lane instead of waiting behind it forever (they still wait at red lights).
- **New landmarks:** Gridlock Stadium downtown, with floodlights at night, and the Statue of Gridlock on the Westside beach.
- **Tidier HUD:** the radio station name now shows small at the bottom of the screen, and area names wait until big messages have cleared.
- **People talk back:** speech bubbles when you bump into people, honk at them, nearly run them over or fire a gun nearby.
- **Car alarms:** some parked cars go off when you take them, and a cop nearby will notice.
- **Boss calls:** when a boss has new work, they phone you over the radio feed.
- **Minimap zoom:** the minimap zooms out as you speed up so you can see further ahead.
- **Helicopter:** two Sparrows sit on helipads. SPACE (or UP) climbs, SHIFT (or DOWN) descends, W/S and A/D fly. Tall buildings block you, so climb over them. The camera tilts down the higher you fly.
- **Motorcycles:** Shredder bikes show up in traffic. They're the fastest thing on the road, but crash hard and you'll be thrown off.
- **Clock:** the time of day (and rain or snow) shows above the minimap.
- **Robberies:** walk into a 24/7 store and rob the register (2 stars), or crack the vault at Gridlock Savings Bank: stand at the vault for nine seconds while the alarm brings 3, then 4 stars.
- **Police radio and news:** dispatch calls out your wanted level, where you are and what you're driving, and when they spot or lose you. News flashes report your robberies and the city's gossip.
- **Ammu-Nation:** two gun shops sell SMG, shotgun, flamethrower, Molotov and rocket ammo, plus body armor (a blue bar over your health that soaks up damage).
- **Export docks:** a crane by the river buys thirteen particular vehicles once each, from a Pipsqueak to a tank (now including a Bruiser, a Breeze and a Trash Hauler), with a bonus for the full list.
- **Pizza runs:** pull up at Pizza Paolo's for three timed deliveries to houses; the pay goes up each level.
- **Smarter cops:** they see less far at night and in the rain, and half as far while you sit still in a parking lot, a park or under a bridge. The minimap rings show the reduced range.
- **No see-through ground:** things behind hills are hidden by the ground in front of them, and bridge decks are open slabs over the water, so you can see under them.
- **On phones:** a city map (tap the minimap), a wheel-and-pedals driving option, adjustable button size, a fullscreen option, vibration, automatic resolution scaling when the frame rate drops (now actually lowers the render resolution), pause and autosave when you switch apps, and the screen kept awake. It plays upright or sideways.
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
