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
- **Stunt ramps:** yellow-striped ramps sit in lanes around the city. Hit one fast for a slow-motion jump and a cash bonus.
- **Police helicopter:** at 4+ stars a chopper circles you with a searchlight and can see you over buildings, which makes you harder to lose. At 5+ stars it shoots. Bring it down with gunfire or rockets.
- **Taxi fares:** drive a taxi and passengers hail you. Stop beside them, then get them to the marker before the timer runs out. Fares in a row pay more.
- **Seeing behind you:** a rear-view mirror at the top of the screen while you drive (V toggles it), hold C to look back, and red arrows at the screen edge when cops or attackers come up behind you.
- **Ambulance and vigilante jobs:** in an ambulance, patients need picking up and rushing to the hospital. In a squad car, wreck fleeing suspects. Each completed job raises the level and the pay.
- **Hidden packages:** 30 green packages are tucked into parks, yards, lots and plazas. Each pays $500, with a $5,000 bonus every 10.
- **Traffic lights:** every intersection has working lights and stop lines, and traffic stops on red.
- **Losing the cops:** stay out of sight and your wanted level drops one star at a time.
- **Wanted level (6 stars):** wanted points work like GTA2. A civilian kill is worth a little, a cop kill a lot, and anything a cop sees you do gets you at least 1 star. One star fades if you stay out of sight for about 30 seconds. Anything higher sticks until you hit a spray shop ($500) or grab a cop bribe (-1 star).
- **Who comes after you:** police at 1–3 stars, SWAT joining at 4, FBI only at 5, and army trucks plus a tank at 6. Roadblocks start at 3 stars. Cops head to where they last saw you, so breaking line of sight matters. You can steal the tank.
- **Car crusher:** drive a car onto the crusher pad to sell it for scrap. Sports cars and police cars pay the most.
- **Car radio:** three stations of generated music (punk, synthwave and street beats) that come on when you get in a car.
- **Day and night:** a full day cycle with headlights, streetlights, police light glow, and rain storms with thunder that make the roads slippery.
- **Heavier action:** ragdolling bodies, crash debris, tire smoke, screen shake, slow-motion explosions and a CHAOS combo that multiplies cash for chained destruction.
- **Procedural city:** a 12×12-block grid of streets, so traffic, cops and missions work everywhere.
- **Updater:** Menu or pause → Check for updates. It only contacts GitHub when you press it.

Your cash is saved in your browser (localStorage).

Gameplay systems are modeled on how GTA2 works (studied from the community GTA2 decompilation). All code here is original.

## 💜 Support
Gridlock City is free, with no ads or purchases. If you enjoy it, you can support development through [GitHub Sponsors](https://github.com/sponsors/kefirman9000).
