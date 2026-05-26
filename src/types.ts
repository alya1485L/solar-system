/**
 * Types and Interfaces for Solar System Explorer & Rocket Assembler.
 */

export interface CelestialBody {
  id: string;
  name: string;
  type: 'star' | 'planet' | 'moon' | 'asteroid' | 'dwarf';
  distanceFromStar: number; // For visualization spacing
  radius: number;           // Visual scale size
  orbitSpeed: number;       // Rate of rotation
  color: string;            // hex or CSS color
  glowColor?: string;
  hasRings?: boolean;
  ringsColor?: string;
  details: {
    scientificName: string;
    typeIndonesian: string;
    diameter: string;       // e.g. "12,742 km"
    mass: string;           // e.g. "5.97 x 10^24 kg"
    gravity: string;        // e.g. "9.81 m/s²"
    temperature: string;    // e.g. "-88°C hingga 58°C"
    orbitPeriod: string;    // e.g. "365 Hari Bumi"
    moonsCount: number;
    funFact: string;        // Fascinating description in Indonesian/Melayu
    description: string;
  };
  moons?: CelestialBody[];  // Moons orbiting this planet
}

export interface SolarSystem {
  id: string;
  name: string;
  difficulty: string;
  description: string;
  star: CelestialBody;
  planets: CelestialBody[];
}

export interface RocketPart {
  id: string;
  name: string;
  category: 'capsule' | 'fuel_tank' | 'engine' | 'booster' | 'accessory';
  weight: number;      // kg
  power?: number;      // thrust or utility index
  efficiency?: number; // fuel efficiency
  color: string;
  description: string;
  iconType: string;    // representation string
}

export interface CustomRocket {
  capsule: RocketPart | null;
  fuelTank: RocketPart | null;
  engine: RocketPart | null;
  booster: RocketPart | null;
  accessory: RocketPart | null;
}

export type ExploreMode = 'ORBIT_VIEW' | 'ROCKET_LAB' | 'LAUNCH_SIMULATION';
