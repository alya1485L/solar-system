import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Compass, 
  Rocket, 
  Globe, 
  Flame, 
  Database, 
  Sparkles, 
  X, 
  RotateCcw, 
  Navigation, 
  Radio, 
  Activity,
  ArrowBigUp,
  ArrowBigLeft,
  ArrowBigRight,
  ShieldCheck,
  Award
} from 'lucide-react';
import { SolarSystem, CelestialBody, CustomRocket } from '../types';
import { sound } from '../audio';

interface FreeFlightSimulatorProps {
  activeSystem: SolarSystem;
  customRocket: CustomRocket;
  rocketStats: {
    totalWeight: number;
    totalThrust: number;
    speedMPS: number;
    rangeLightYears: number;
    isSafe: boolean;
  };
  onClose: () => void;
}

interface StarParticle {
  x: number;
  y: number;
  size: number;
  alpha: number;
}

interface CosmicDataPod {
  id: string;
  x: number;
  y: number;
  value: number;
  collected: boolean;
  type: 'data' | 'mineral' | 'alien_beacon';
}

export default function FreeFlightSimulator({
  activeSystem,
  customRocket,
  rocketStats,
  onClose
}: FreeFlightSimulatorProps) {
  // Simulator state parameters
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Game states
  const [sciencePoints, setSciencePoints] = useState<number>(0);
  const [visitedPlanets, setVisitedPlanets] = useState<string[]>([]);
  const [thrustActive, setThrustActive] = useState<boolean>(false);
  const [closestPlanet, setClosestPlanet] = useState<CelestialBody | null>(null);
  const [closestDist, setClosestDist] = useState<number>(9999);
  const [landingReport, setLandingReport] = useState<CelestialBody | null>(null);
  const [isLanded, setIsLanded] = useState<boolean>(false);

  // Custom Space Challenge Obstacles & Multi-Stage Staging State
  const [shieldHealth, setShieldHealth] = useState<number>(100);
  const [boostersJettisoned, setBoostersJettisoned] = useState<boolean>(false);
  const [steeringDirection, setSteeringDirection] = useState<'left' | 'right' | null>(null);
  
  // HUD readouts
  const [hudSpeed, setHudSpeed] = useState<number>(0);
  const [hudFuel, setHudFuel] = useState<number>(100);
  const [hudGravity, setHudGravity] = useState<number>(0);

  // Position, rotation and velocity vectors
  const stateRef = useRef({
    x: 0,             // global coords relative to sun
    y: -150,          // standard starting offset
    vx: 1.8,          // target tangential speed
    vy: 0,
    angle: -Math.PI / 2, // looking up
    fuelLeft: 100,
    scienceScore: 0
  });

  const keysPressed = useRef<Record<string, boolean>>({});
  const animationRef = useRef<number | null>(null);
  const spacePodsRef = useRef<CosmicDataPod[]>([]);
  const starsRef = useRef<StarParticle[]>([]);
  const driftingMeteorsRef = useRef<Array<{ id: string; x: number; y: number; vx: number; vy: number; radius: number; rotation: number; rotSpeed: number; color: string }>>([]);
  const boosterRemnantsRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; angle: number; rotSpeed: number; opacity: number }>>([]);
  const steeringRef = useRef<'left' | 'right' | null>(null);
  const lastHitRef = useRef<number>(0);

  // Darken hex values for beautiful shader textures
  const getDarkerColor = (hex: string, factor = 0.55): string => {
    if (!hex || !hex.startsWith('#')) return 'rgba(0,0,0,0.85)';
    const r = parseInt(hex.substring(1, 3), 16);
    const g = parseInt(hex.substring(3, 5), 16);
    const b = parseInt(hex.substring(5, 7), 16);
    return `rgb(${Math.floor(r * factor)}, ${Math.floor(g * factor)}, ${Math.floor(b * factor)})`;
  };

  // Setup cosmic elements once
  useEffect(() => {
    // Generate background stars
    const stars: StarParticle[] = [];
    for (let i = 0; i < 150; i++) {
      stars.push({
        x: (Math.random() - 0.5) * 3000,
        y: (Math.random() - 0.5) * 3000,
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.7 + 0.3
      });
    }
    starsRef.current = stars;

    // Generate scientific floating canisters around planets orbit ranges
    const canisters: CosmicDataPod[] = [];
    activeSystem.planets.forEach((p, idx) => {
      // Spawn 3 pods near each planetary line
      for (let j = 0; j < 3; j++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = p.distanceFromStar + (Math.random() - 0.5) * 45;
        canisters.push({
          id: `${p.id}-pod-${j}`,
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
          value: 15 + Math.floor(Math.random() * 20),
          collected: false,
          type: j === 0 ? 'data' : j === 1 ? 'mineral' : 'alien_beacon'
        });
      }
    });

    // Add extra canisters near the asteroid belt
    if (activeSystem.id === 'sol') {
      for (let i = 0; i < 8; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 225 + (Math.random() - 0.5) * 15;
        canisters.push({
          id: `asteroid-can-${i}`,
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
          value: 25,
          collected: false,
          type: 'mineral'
        });
      }
    }
    spacePodsRef.current = canisters;

    // Generate drifting space obstacle rocks (highly interactive)
    const meteorsList = [];
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      // Spread across the active solar orbits
      const radius = 80 + Math.random() * 500;
      meteorsList.push({
        id: `meteor-${i}`,
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        vx: (Math.random() - 0.5) * 0.9,
        vy: (Math.random() - 0.5) * 0.9,
        radius: 5 + Math.random() * 6, // 5km - 11km diameters
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.05,
        color: i % 3 === 0 ? '#78716c' : i % 3 === 1 ? '#57534e' : '#44403c'
      });
    }
    driftingMeteorsRef.current = meteorsList;
    boosterRemnantsRef.current = [];
    setShieldHealth(100);
    setBoostersJettisoned(false);
    
    // Reset state vectors
    stateRef.current = {
      x: 0,
      y: -activeSystem.planets[0].distanceFromStar + 15, // Spawn right near first planet!
      vx: 1.6,
      vy: 0,
      angle: 0,
      fuelLeft: 100,
      scienceScore: 0
    };
  }, [activeSystem]);

  // Read keystrokes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = true;
      if (['arrowup', 'arrowleft', 'arrowright', 'w', 'a', 'd'].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Action buttons
  const applyThrust = () => {
    if (stateRef.current.fuelLeft <= 0) return;
    const statsThrust = rocketStats.totalThrust || 4000;
    const statsWeight = rocketStats.totalWeight || 2000;
    // Thrust coefficient
    const force = (statsThrust / statsWeight) * 0.05;
    
    stateRef.current.vx += Math.cos(stateRef.current.angle) * force;
    stateRef.current.vy += Math.sin(stateRef.current.angle) * force;
    stateRef.current.fuelLeft = Math.max(0, stateRef.current.fuelLeft - 0.25);
    setHudFuel(Math.round(stateRef.current.fuelLeft));
    
    setThrustActive(true);
    if (Math.random() < 0.15) {
      sound.playLaser('SPREAD');
    }
  };

  const rotateLeft = () => {
    stateRef.current.angle -= 0.05;
  };

  const rotateRight = () => {
    stateRef.current.angle += 0.05;
  };

  const engageBrakes = () => {
    stateRef.current.vx *= 0.95;
    stateRef.current.vy *= 0.95;
  };

  // Stage separate boosters - "roket beneran realistis!"
  const engageBoosterStaging = () => {
    if (boostersJettisoned || !customRocket.booster) return;
    sound.playExplosion('BOSS'); // play clean decouple clank noise
    
    // Add two physical detached remnants floating backwards behind ship
    const pState = stateRef.current;
    
    // Position of boosters on the sides rotated with ship angle
    const leftAngle = pState.angle - Math.PI / 2;
    const rightAngle = pState.angle + Math.PI / 2;
    
    // booster positions
    const lx = pState.x + Math.cos(leftAngle) * 12;
    const ly = pState.y + Math.sin(leftAngle) * 12;
    
    const rx = pState.x + Math.cos(rightAngle) * 12;
    const ry = pState.y + Math.sin(rightAngle) * 12;
    
    // Eject velocities
    const lvx = pState.vx - Math.cos(pState.angle) * 0.9 + Math.cos(leftAngle) * 0.4;
    const lvy = pState.vy - Math.sin(pState.angle) * 0.9 + Math.sin(leftAngle) * 0.4;
    
    const rvx = pState.vx - Math.cos(pState.angle) * 0.9 + Math.cos(rightAngle) * 0.4;
    const rvy = pState.vy - Math.sin(pState.angle) * 0.9 + Math.sin(rightAngle) * 0.4;
    
    boosterRemnantsRef.current.push(
      { x: lx, y: ly, vx: lvx, vy: lvy, angle: pState.angle, rotSpeed: -0.04, opacity: 1.0 },
      { x: rx, y: ry, vx: rvx, vy: rvy, angle: pState.angle, rotSpeed: 0.04, opacity: 1.0 }
    );
    
    setBoostersJettisoned(true);
  };

  // Main game logic loop on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width;
    let height = canvas.height;

    const handleResize = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      width = canvas.width;
      height = canvas.height;
    };
    handleResize();

    // Planet real-time orbital angles mapping
    const planetAngles: Record<string, number> = {};
    activeSystem.planets.forEach((p) => {
      planetAngles[p.id] = Math.random() * Math.PI * 2;
    });

    let frameCount = 0;

    const updateAndRender = () => {
      frameCount++;
      const lWidth = width / window.devicePixelRatio;
      const lHeight = height / window.devicePixelRatio;
      
      const pState = stateRef.current;

      // 1. INPUT PROCESSING
      setThrustActive(false);
      steeringRef.current = null;
      if (keysPressed.current['w'] || keysPressed.current['arrowup']) {
        applyThrust();
      }
      if (keysPressed.current['a'] || keysPressed.current['arrowleft']) {
        rotateLeft();
        steeringRef.current = 'left';
      }
      if (keysPressed.current['d'] || keysPressed.current['arrowright']) {
        rotateRight();
        steeringRef.current = 'right';
      }
      if (keysPressed.current['s'] || keysPressed.current['arrowdown']) {
        engageBrakes();
      }

      // 2. GRAVITATIONAL & KINETIC PHYSICS
      // Radius to sun is simply sqrt(x^2 + y^2)
      const distToSun = Math.sqrt(pState.x * pState.x + pState.y * pState.y);
      
      // Sun gravity constant pulling to (0,0)
      const G_const = 0.5;
      const starMass = 10000;
      let gravMultiplier = G_const * starMass / Math.max(2500, distToSun * distToSun);
      
      // Pull velocity vector to sun
      const angleToSun = Math.atan2(-pState.y, -pState.x);
      pState.vx += Math.cos(angleToSun) * gravMultiplier * 0.1;
      pState.vy += Math.sin(angleToSun) * gravMultiplier * 0.1;

      // Position integration
      pState.x += pState.vx;
      pState.y += pState.vy;

      // 2B. DRIFTING SPACE CHALLENGE METEORS PHYSICS & COLLISIONS
      driftingMeteorsRef.current.forEach((meteor) => {
        // move meteor
        meteor.x += meteor.vx;
        meteor.y += meteor.vy;
        meteor.rotation += meteor.rotSpeed;

        // wrap coordinates endlessly around the space pilot to create infinite asteroid challenge
        const dx = meteor.x - pState.x;
        const dy = meteor.y - pState.y;
        if (Math.abs(dx) > 1000) {
          meteor.x = pState.x - Math.sign(dx) * 980 + (Math.random() - 0.5) * 150;
        }
        if (Math.abs(dy) > 1000) {
          meteor.y = pState.y - Math.sign(dy) * 980 + (Math.random() - 0.5) * 150;
        }

        // Check physical ship hull collision
        const collDist = Math.sqrt(dx * dx + dy * dy);
        const hitRadius = meteor.radius + 12; // Ship layout size roughly 12px
        if (collDist < hitRadius) {
          const now = Date.now();
          if (now - lastHitRef.current > 1200) {
            lastHitRef.current = now;
            sound.playHit();
            
            // bounce physics momentum transfer
            pState.vx = -pState.vx * 0.45 + meteor.vx * 1.6;
            pState.vy = -pState.vy * 0.45 + meteor.vy * 1.6;

            // Health damage reducing
            setShieldHealth((prev) => {
              const damaged = Math.max(0, prev - 25);
              return damaged;
            });
          }
        }
      });

      // 2C. DRIFTING JETTISONED BOOSTER REMNANTS PHYSICS
      boosterRemnantsRef.current.forEach((rem) => {
        rem.x += rem.vx;
        rem.y += rem.vy;
        rem.angle += rem.rotSpeed;
        rem.opacity = Math.max(0, rem.opacity - 0.008);
      });

      // Calculate current speed
      const curSpeed = Math.sqrt(pState.vx * pState.vx + pState.vy * pState.vy);
      setHudSpeed(Math.round(curSpeed * 105)); // speed reading multiplier
      setHudGravity(parseFloat((gravMultiplier * 3.5).toFixed(2)));

      // Clear Screen with deep cosmic layout
      ctx.fillStyle = '#02050e';
      ctx.fillRect(0, 0, lWidth, lHeight);

      // Camera translations: Center on the player ship to explore freely!
      const cameraX = lWidth / 2 - pState.x;
      const cameraY = lHeight / 2 - pState.y;

      // Draw Star Backdrop relative to ship camera (parallax effect)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      starsRef.current.forEach((s) => {
        // dynamic offset
        const sx = s.x + cameraX * 0.3;
        const sy = s.y + cameraY * 0.3;
        // wrapping boundaries
        const rx = ((sx % 3000) + 3000) % 3000 - 1500;
        const ry = ((sy % 3000) + 3000) % 3000 - 1500;
        
        ctx.beginPath();
        ctx.arc(rx + lWidth / 2, ry + lHeight / 2, s.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3. DRAW NEBULA DUST IN BACKGROUND (Parallax)
      ctx.save();
      const nebulaGrad1 = ctx.createRadialGradient(cameraX * 0.2 + 200, cameraY * 0.2 + 300, 10, cameraX * 0.2 + 200, cameraY * 0.2 + 300, 400);
      nebulaGrad1.addColorStop(0, 'rgba(99, 102, 241, 0.05)');
      nebulaGrad1.addColorStop(0.5, 'rgba(168, 85, 247, 0.02)');
      nebulaGrad1.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = nebulaGrad1;
      ctx.fillRect(0, 0, lWidth, lHeight);
      ctx.restore();

      // Apply primary translations to draw solar bodies, orbits, canisters
      ctx.save();
      ctx.translate(cameraX, cameraY);

      // Draw Orbit Pathway lines
      activeSystem.planets.forEach((planet) => {
        ctx.beginPath();
        ctx.arc(0, 0, planet.distanceFromStar, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(51, 65, 85, 0.15)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 12]);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // Draw Asteroid Belt if Sol System (Multipled for realism & density)
      if (activeSystem.id === 'sol') {
        for (let i = 0; i < 450; i++) {
          const angle = (i * 123.45) % (Math.PI * 2) + Math.sin(frameCount * 0.0002 + i) * 0.05;
          const rad = 222 + Math.sin(i * 105) * 14;
          const ax = Math.cos(angle) * rad;
          const ay = Math.sin(angle) * rad;
          const size = 1 + (i % 4) * 0.5;
          
          ctx.beginPath();
          ctx.arc(ax, ay, size, 0, Math.PI * 2);
          // Alternating colors
          ctx.fillStyle = i % 3 === 0 ? 'rgba(120, 113, 108, 0.45)' : i % 3 === 1 ? 'rgba(87, 83, 78, 0.35)' : 'rgba(168, 162, 158, 0.25)';
          ctx.fill();
        }
      }

      // Draw central Star (Sun) with rotating heat beams
      const star = activeSystem.star;
      const sRadius = star.radius;

      // Glow atmosphere Sun
      const sunGlow = ctx.createRadialGradient(0, 0, 10, 0, 0, sRadius * 2);
      sunGlow.addColorStop(0, '#ffffff');
      sunGlow.addColorStop(0.2, star.color);
      sunGlow.addColorStop(0.6, `${star.color}33`);
      sunGlow.addColorStop(1, 'transparent');
      
      ctx.beginPath();
      ctx.arc(0, 0, sRadius * 2, 0, Math.PI * 2);
      ctx.fillStyle = sunGlow;
      ctx.fill();

      // Sun solid center
      ctx.beginPath();
      ctx.arc(0, 0, sRadius, 0, Math.PI * 2);
      ctx.fillStyle = star.color;
      ctx.fill();

      // Draw Sunspots manually
      ctx.fillStyle = 'rgba(180, 83, 9, 0.4)';
      ctx.beginPath();
      ctx.arc(-sRadius * 0.3, -sRadius * 0.2, sRadius * 0.12, 0, Math.PI*2);
      ctx.arc(sRadius * 0.4, sRadius * 0.2, sRadius * 0.08, 0, Math.PI*2);
      ctx.fill();

      // Proximity detection holders
      let currentClosest: CelestialBody | null = null;
      let minDistance = 999999;

      // Update positions of planets and draw them realistically
      activeSystem.planets.forEach((planet) => {
        // Planet physical rotation
        planetAngles[planet.id] += planet.orbitSpeed * 0.15;
        const angle = planetAngles[planet.id];

        const px = Math.cos(angle) * planet.distanceFromStar;
        const py = Math.sin(angle) * planet.distanceFromStar;

        // Calculate distance from ship to this planet
        const shipDist = Math.sqrt(Math.pow(pState.x - px, 2) + Math.pow(pState.y - py, 2));
        if (shipDist < minDistance) {
          minDistance = shipDist;
          currentClosest = planet;
        }

        // --- DRAW GLORIOUS REALISTIC TEXTURED PLANET ---
        // 1. Atmosfer halo
        const halo = ctx.createRadialGradient(px, py, planet.radius * 0.8, px, py, planet.radius * 1.5);
        halo.addColorStop(0, planet.glowColor ? `${planet.glowColor}50` : `${planet.color}40`);
        halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.beginPath();
        ctx.arc(px, py, planet.radius * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = halo;
        ctx.fill();

        // 3D Spherical gradients relative to the Sun's lighting angle!
        const angleToSun = Math.atan2(py, px); // angle originating from (0,0) Sun
        const sphereGrad = ctx.createRadialGradient(
          px - Math.cos(angleToSun) * planet.radius * 0.35,
          py - Math.sin(angleToSun) * planet.radius * 0.35,
          planet.radius * 0.05,
          px,
          py,
          planet.radius
        );
        sphereGrad.addColorStop(0, '#ffffff'); // bright surface highlight
        sphereGrad.addColorStop(0.3, planet.color); // base material tone
        sphereGrad.addColorStop(0.85, getDarkerColor(planet.color, 0.4)); // darker tone on transition
        sphereGrad.addColorStop(1.0, '#010309'); // shadow hemisphere

        ctx.beginPath();
        ctx.arc(px, py, planet.radius, 0, Math.PI * 2);
        ctx.fillStyle = sphereGrad;
        ctx.fill();

        // 2. Custom internal textures using clipped draws
        ctx.save();
        ctx.beginPath();
        ctx.arc(px, py, planet.radius, 0, Math.PI * 2);
        ctx.clip(); // clip next textures inside the planet bound

        // Rotating features
        const timeOffset = (frameCount * 0.005) % (Math.PI * 2);
        ctx.translate(px, py);
        ctx.rotate(timeOffset * planet.orbitSpeed * 2.5);

        if (planet.id.includes('earth')) {
          // Green blobs (Continents)
          ctx.fillStyle = 'rgba(22, 163, 74, 0.45)';
          ctx.beginPath();
          ctx.arc(-planet.radius * 0.3, -planet.radius * 0.1, planet.radius * 0.45, 0, Math.PI * 2);
          ctx.arc(planet.radius * 0.4, planet.radius * 0.2, planet.radius * 0.4, 0, Math.PI * 2);
          ctx.fill();
          
          // White stormy clouds swirling above
          ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
          ctx.beginPath();
          ctx.arc(-planet.radius * 0.5, -planet.radius * 0.4, planet.radius * 0.3, 0, Math.PI * 2);
          ctx.arc(planet.radius * 0.1, -planet.radius * 0.2, planet.radius * 0.35, 1, 3.5);
          ctx.fill();
        } else if (planet.id.includes('jupiter')) {
          // High fidelity horizontal stripes
          for (let o = -planet.radius; o < planet.radius; o += 4) {
            ctx.fillStyle = o % 8 === 0 ? 'rgba(120, 53, 4, 0.3)' : 'rgba(251, 146, 60, 0.12)';
            ctx.fillRect(-planet.radius, o, planet.radius * 2, 2.5);
          }
          // Crimson Great Red Spot
          ctx.fillStyle = 'rgba(185, 28, 28, 0.75)';
          ctx.beginPath();
          ctx.ellipse(planet.radius * 0.22, planet.radius * 0.12, planet.radius * 0.22, planet.radius * 0.12, 0, 0, Math.PI*2);
          ctx.fill();
        } else if (planet.id.includes('saturn')) {
          // Subtle horizontal gaseous bands
          for (let o = -planet.radius; o < planet.radius; o += 3) {
            ctx.fillStyle = o % 6 === 0 ? 'rgba(161, 98, 7, 0.25)' : 'rgba(254, 240, 138, 0.07)';
            ctx.fillRect(-planet.radius, o, planet.radius * 2, 2);
          }
        } else if (planet.id.includes('mars')) {
          // Rust splotches
          ctx.fillStyle = 'rgba(153, 27, 27, 0.5)';
          ctx.beginPath();
          ctx.arc(-planet.radius * 0.35, -planet.radius * 0.2, planet.radius * 0.3, 0, Math.PI * 2);
          ctx.arc(planet.radius * 0.25, planet.radius * 0.3, planet.radius * 0.2, 0, Math.PI * 2);
          ctx.fill();
          // Polar ice cap
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(0, -planet.radius * 0.9, planet.radius * 0.22, 0, Math.PI);
          ctx.fill();
        } else if (planet.id.includes('mercury')) {
          // Dark grey craters
          ctx.fillStyle = 'rgba(75, 85, 99, 0.45)';
          ctx.beginPath();
          ctx.arc(-planet.radius * 0.3, planet.radius * 0.1, planet.radius * 0.18, 0, Math.PI * 2);
          ctx.arc(planet.radius * 0.4, -planet.radius * 0.2, planet.radius * 0.14, 0, Math.PI * 2);
          ctx.fill();
        } else if (planet.id.includes('asteroid-belt')) {
          // Ceres crater spots
          ctx.fillStyle = 'rgba(55, 65, 81, 0.6)';
          ctx.beginPath();
          ctx.arc(-planet.radius * 0.3, planet.radius * 0.2, planet.radius * 0.2, 0, Math.PI * 2);
          ctx.arc(planet.radius * 0.2, -planet.radius * 0.35, planet.radius * 0.25, 0, Math.PI * 2);
          ctx.arc(-planet.radius * 0.1, -planet.radius * 0.2, planet.radius * 0.15, 0, Math.PI * 2);
          ctx.fill();

          // Highlight bright spots on Ceres (famous Occator Crater salt spots)
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(planet.radius * 0.05, planet.radius * 0.1, planet.radius * 0.08, 0, Math.PI * 2);
          ctx.arc(planet.radius * 0.15, planet.radius * 0.12, planet.radius * 0.05, 0, Math.PI * 2);
          ctx.fill();
        } else if (planet.id.includes('neptune') || planet.id.includes('uranus') || planet.id.includes('trappist') || planet.id.includes('kepler')) {
          // Ice clouds/cyan splotches
          ctx.fillStyle = 'rgba(29, 78, 216, 0.25)';
          ctx.beginPath();
          ctx.arc(-planet.radius * 0.2, planet.radius * 0.2, planet.radius * 0.32, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();

        // 3D Slanted Shadows overlay across texture!
        const shadowOverlay = ctx.createLinearGradient(
          px - Math.cos(angleToSun) * planet.radius,
          py - Math.sin(angleToSun) * planet.radius,
          px + Math.cos(angleToSun) * planet.radius,
          py + Math.sin(angleToSun) * planet.radius
        );
        shadowOverlay.addColorStop(0, 'rgba(0, 0, 0, 0)');
        shadowOverlay.addColorStop(0.5, 'rgba(0, 0, 0, 0.25)');
        shadowOverlay.addColorStop(0.85, 'rgba(0, 0, 0, 0.88)');
        shadowOverlay.addColorStop(1.0, 'rgba(0, 0, 0, 0.98)');
        ctx.beginPath();
        ctx.arc(px, py, planet.radius + 0.3, 0, Math.PI * 2);
        ctx.fillStyle = shadowOverlay;
        ctx.fill();

        // 3. Saturn multi-ring system with depth orientation
        if (planet.hasRings) {
          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(0.28); // tilted ring system
          
          // back ring segments
          ctx.beginPath();
          ctx.ellipse(0, 0, planet.radius * 1.9, planet.radius * 0.55, 0, Math.PI, Math.PI * 2);
          ctx.strokeStyle = planet.ringsColor || 'rgba(234, 179, 8, 0.38)';
          ctx.lineWidth = 4.5;
          ctx.stroke();

          // front ring segments over the planet
          ctx.beginPath();
          ctx.ellipse(0, 0, planet.radius * 1.9, planet.radius * 0.55, 0, 0, Math.PI);
          ctx.strokeStyle = planet.ringsColor || 'rgba(234, 179, 8, 0.38)';
          ctx.lineWidth = 4.5;
          ctx.stroke();

          ctx.restore();
        }

        // Planet text label indicator
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px "Space Grotesk"';
        ctx.textAlign = 'center';
        ctx.fillText(planet.name, px, py - planet.radius - 8);

        // Draw smaller moons orbiting this planet
        if (planet.moons && planet.moons.length > 0) {
          planet.moons.forEach((m, mIdx) => {
            const mAngle = (frameCount * 0.02 * m.orbitSpeed * 3) + mIdx * Math.PI;
            const mx = px + Math.cos(mAngle) * m.distanceFromStar;
            const my = py + Math.sin(mAngle) * m.distanceFromStar;

            // Moon body
            ctx.beginPath();
            ctx.arc(mx, my, m.radius, 0, Math.PI * 2);
            ctx.fillStyle = m.color;
            ctx.fill();
          });
        }
      });

      // Update state sensors
      setClosestPlanet(currentClosest);
      setClosestDist(Math.round(minDistance));

      // 4. DRAW GATHERABLE COSMIC CANISTERS
      spacePodsRef.current.forEach((pod) => {
        if (pod.collected) return;

        // Check magnet collision distance
        const distToPod = Math.sqrt(Math.pow(pState.x - pod.x, 2) + Math.pow(pState.y - pod.y, 2));
        if (distToPod < 18) {
          pod.collected = true;
          sound.playPowerUp();
          
          // Reward science points!
          setSciencePoints(prev => {
            const newVal = prev + pod.value;
            pState.scienceScore = newVal;
            return newVal;
          });
        }

        // Draw glowing canister indicator
        ctx.save();
        ctx.translate(pod.x, pod.y);
        
        // pulse animation scale
        const pulse = 1 + Math.sin(frameCount * 0.1) * 0.15;
        
        ctx.beginPath();
        ctx.arc(0, 0, 6 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = pod.type === 'mineral' ? '#f59e0b' : pod.type === 'alien_beacon' ? '#d946ef' : '#22d3ee';
        ctx.shadowBlur = 10;
        ctx.shadowColor = ctx.fillStyle;
        ctx.fill();

        // draw orbiting halo outer ring
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.restore();
      });

      // 4B. DRAW DRIFTING SPACE OBSTACLES (Craggy, textured meteorites)
      driftingMeteorsRef.current.forEach((meteor) => {
        ctx.save();
        ctx.translate(meteor.x, meteor.y);
        ctx.rotate(meteor.rotation);

        // Render irregular craggy polygon shape for hyper-realistic asteroids
        ctx.beginPath();
        const vertices = 8;
        for (let i = 0; i < vertices; i++) {
          const vAngle = (i / vertices) * Math.PI * 2;
          const cragRadius = meteor.radius * (0.8 + Math.sin(i * 1.9) * 0.18);
          const vx = Math.cos(vAngle) * cragRadius;
          const vy = Math.sin(vAngle) * cragRadius;
          if (i === 0) ctx.moveTo(vx, vy);
          else ctx.lineTo(vx, vy);
        }
        ctx.closePath();
        ctx.fillStyle = meteor.color;
        ctx.fill();
        ctx.strokeStyle = '#1c1917';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Draw craters on asteroids for added procedural textures!
        ctx.fillStyle = '#292524';
        ctx.beginPath();
        ctx.arc(-meteor.radius * 0.3, -meteor.radius * 0.1, meteor.radius * 0.22, 0, Math.PI * 2);
        ctx.arc(meteor.radius * 0.2, meteor.radius * 0.3, meteor.radius * 0.18, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      });

      // 4C. DRAW JETTI_SONED BOOSTER REMNANTS
      boosterRemnantsRef.current.forEach((rem) => {
        if (rem.opacity <= 0) return;
        ctx.save();
        ctx.translate(rem.x, rem.y);
        ctx.rotate(rem.angle);
        ctx.globalAlpha = rem.opacity;

        // Draw metallic container cylinder
        ctx.fillStyle = customRocket.booster?.color || '#ca8a04';
        ctx.fillRect(-6, -3, 12, 6);
        ctx.fillStyle = '#475569';
        ctx.fillRect(-6, -3, 2, 6); // grey mechanical cap separator

        ctx.restore();
      });
      ctx.globalAlpha = 1.0; // Reset alpha template

      // 5. DRAW THE PILOT ROCKET UNIT CONFIGURED BY HANGAR
      ctx.save();
      ctx.translate(pState.x, pState.y);
      ctx.rotate(pState.angle);

      // Draw custom-styled dynamic ship assembly based on parts colors
      const capCol = customRocket.capsule?.color || '#38bdf8';
      const fTankCol = customRocket.fuelTank?.color || '#06b6d4';
      const engCol = customRocket.engine?.color || '#f97316';
      const bstCol = customRocket.booster?.color || '#ca8a04';
      const accCol = customRocket.accessory?.color || '#d946ef';

      // Accessory fins behind
      if (customRocket.accessory) {
        ctx.fillStyle = accCol;
        ctx.beginPath();
        ctx.moveTo(-10, -5);
        ctx.lineTo(-24, -18);
        ctx.lineTo(-24, 18);
        ctx.lineTo(-10, 5);
        ctx.closePath();
        ctx.fill();
      }

      // Side boosters if attached & NOT staged separate yet
      if (customRocket.booster && !boostersJettisoned) {
        ctx.fillStyle = bstCol;
        // left booster cylinder
        ctx.fillRect(-12, -14, 14, 6);
        ctx.beginPath();
        ctx.moveTo(-12, -14);
        ctx.lineTo(-16, -11);
        ctx.lineTo(-12, -8);
        ctx.fill();
        
        // right booster cylinder
        ctx.fillRect(-12, 8, 14, 6);
        ctx.beginPath();
        ctx.moveTo(-12, 14);
        ctx.lineTo(-16, 11);
        ctx.lineTo(-12, 8);
        ctx.fill();
      }

      // RCS Reaction Control System cold-gas gas plumes
      if (steeringRef.current === 'left') {
        ctx.fillStyle = 'rgba(103, 232, 249, 0.85)';
        ctx.beginPath();
        ctx.arc(6, 9 + Math.random() * 3, 2, 0, Math.PI * 2);
        ctx.arc(4, 7 + Math.random() * 3, 1.3, 0, Math.PI * 2);
        ctx.fill();
      } else if (steeringRef.current === 'right') {
        ctx.fillStyle = 'rgba(103, 232, 249, 0.85)';
        ctx.beginPath();
        ctx.arc(6, -9 - Math.random() * 3, 2, 0, Math.PI * 2);
        ctx.arc(4, -7 - Math.random() * 3, 1.3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Propulsion fuel center tank
      ctx.fillStyle = fTankCol;
      ctx.fillRect(-12, -7, 16, 14);

      // Rocket Cabin cockpit capsule
      ctx.fillStyle = capCol;
      ctx.beginPath();
      ctx.moveTo(4, -7);
      ctx.lineTo(16, 0); // nose cone facing right direction
      ctx.lineTo(4, 7);
      ctx.closePath();
      ctx.fill();

      // Capsule glass windshield
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(7, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Thrust flame exhaust visual
      if (thrustActive && pState.fuelLeft > 0) {
        ctx.save();
        const flicker = 1 + Math.sin(frameCount / 2) * 0.25;
        const fireGrad = ctx.createLinearGradient(-12, 0, -32, 0);
        fireGrad.addColorStop(0, '#ffffff');
        fireGrad.addColorStop(0.3, '#fb923c');
        fireGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
        
        ctx.fillStyle = fireGrad;
        ctx.beginPath();
        ctx.moveTo(-12, -5);
        ctx.lineTo(-12 - 20 * flicker, 0);
        ctx.lineTo(-12, 5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // Draw beautiful active electromagnetic forcefield shield bubble around spacecraft
      if (shieldHealth > 0) {
        ctx.save();
        const shieldPulse = 1 + Math.sin(frameCount * 0.12) * 0.04;
        const recentHit = Date.now() - lastHitRef.current < 250;
        const shieldAlpha = recentHit ? 0.6 : (0.15 + (shieldHealth / 100) * 0.15);
        
        ctx.beginPath();
        ctx.arc(0, 0, 22 * shieldPulse, 0, Math.PI * 2);
        ctx.strokeStyle = recentHit ? '#ef4444' : 'rgba(56, 189, 248, 0.9)';
        ctx.lineWidth = recentHit ? 2 : 1.3;
        ctx.stroke();

        ctx.fillStyle = recentHit ? 'rgba(239, 68, 68, 0.15)' : 'rgba(56, 189, 248, 0.05)';
        ctx.fill();
        ctx.restore();
      }

      ctx.restore(); // end draw ship

      // Draw radar arrow pointers leading to all planet vectors on screen edge
      activeSystem.planets.forEach((planet) => {
        // Find screen coordinates
        const px = planet.distanceFromStar * Math.cos(planetAngles[planet.id] || 0);
        const py = planet.distanceFromStar * Math.sin(planetAngles[planet.id] || 0);

        const dx = px - pState.x;
        const dy = py - pState.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // If beyond screen drawing, render edge radar arrow pointer!
        if (dist > 280) {
          const radarAngle = Math.atan2(dy, dx);
          const radarRad = 110; // offset circle ring
          const rx = lWidth / 2 + Math.cos(radarAngle) * radarRad;
          const ry = lHeight / 2 + Math.sin(radarAngle) * radarRad;

          ctx.save();
          ctx.translate(rx, ry);
          ctx.rotate(radarAngle);
          
          // small triangle arrow pointer
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(-6, -4);
          ctx.lineTo(-6, 4);
          ctx.closePath();
          ctx.fillStyle = planet.color;
          ctx.fill();

          // small label
          ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
          ctx.font = '7px "JetBrains Mono"';
          ctx.fillText(planet.name.substring(0, 6), -12, -6);
          ctx.restore();
        }
      });

      ctx.restore(); // remove root translations

      // 6. DRAW PILOT SCREEN FIXED INSTRUMENTS HUD OVERLAY
      // Crosshair center indicator
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.05)';
      ctx.beginPath();
      ctx.arc(lWidth / 2, lHeight / 2, 35, 0, Math.PI * 2);
      ctx.stroke();

      animationRef.current = requestAnimationFrame(updateAndRender);
    };

    updateAndRender();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [activeSystem, customRocket]);

  // Land trigger sequence
  const handlePerformLanding = () => {
    if (!closestPlanet) return;
    
    // Play sweet landing arpeggios
    sound.playPowerUp();
    
    // Add to visited planets mapping
    if (!visitedPlanets.includes(closestPlanet.id)) {
      setVisitedPlanets(prev => [...prev, closestPlanet.id]);
      setSciencePoints(prev => prev + 100); // 100 research points for first land!
    }

    setLandingReport(closestPlanet);
    setIsLanded(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col md:flex-row h-screen antialiased">
      {/* Side HUD cockpit instrumentation column */}
      <div className="w-full md:w-80 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 p-5 flex flex-col gap-4 relative overflow-y-auto">
        <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 rounded-full pointer-events-none filter blur-xl" />
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-cyan-400">TELEMETRI KOKPIT</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
            title="Tutup Kokpit"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Orbit radar display */}
        <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl space-y-3.5 relative">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest flex items-center justify-between">
            <span>Sistem Komputasi:</span>
            <span className="text-emerald-400 animate-pulse">● SISTEM AKTIF</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2 bg-slate-900/60 rounded border border-slate-800/80">
              <span className="text-[9px] text-slate-500 block">KECEPATAN</span>
              <strong className="text-white text-sm block mt-0.5">{hudSpeed} km/j</strong>
            </div>

            <div className="p-2 bg-slate-900/60 rounded border border-slate-800/80">
              <span className="text-[9px] text-slate-500 block">MINYAK REAKTOR</span>
              <strong className={`${hudFuel > 20 ? 'text-cyan-400' : 'text-rose-400 animate-pulse'} text-sm block mt-0.5`}>
                {hudFuel}%
              </strong>
            </div>

            <div className="p-2 bg-slate-900/60 rounded border border-slate-800/80 col-span-2 flex items-center justify-between">
              <div>
                <span className="text-[9px] text-slate-500 block">TARIKAN GRAVITASI STAR</span>
                <strong className="text-yellow-400 text-xs mt-0.5 block">{hudGravity} G</strong>
              </div>
              <Activity className="w-5 h-5 text-indigo-500/40 animate-pulse" />
            </div>

            {/* Shield health status dashboard indicators */}
            <div className="p-2 bg-slate-900/60 rounded border border-slate-800/80 col-span-2 space-y-1.5">
              <div className="flex justify-between items-center text-[9px]">
                <span className="text-slate-500">KONDISI PERISAI (SHIELD)</span>
                <strong className={shieldHealth < 40 ? 'text-red-400 animate-pulse font-bold' : 'text-cyan-400'}>
                  {shieldHealth}%
                </strong>
              </div>
              <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800/70">
                <div 
                  className={`h-full transition-all duration-300 ${
                    shieldHealth < 40 
                      ? 'bg-rose-500 animate-pulse' 
                      : 'bg-gradient-to-r from-cyan-500 via-sky-400 to-indigo-500'
                  }`}
                  style={{ width: `${shieldHealth}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Canisters scientific tracker */}
        <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 uppercase tracking-widest">
            <Database className="w-4 h-4 text-purple-400" />
            <span>AKRESI RISET SAINS</span>
          </div>
          <div className="flex items-center justify-between">
            <strong className="text-2xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400 font-mono">
              {sciencePoints}
            </strong>
            <span className="text-[9px] text-slate-500 font-mono">Poin Riset Gained</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-snug">
            Kumpulkan kapsul data warna-warni yang mengambang di orbit untuk mendapatkan bonus riset sains!
          </p>
        </div>

        {/* Closest celestial collision detector logic */}
        <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl space-y-3">
          <span className="text-[9px] font-mono text-slate-500 uppercase block">SENSOR DEKAT RELEVAN</span>
          
          {closestPlanet ? (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white font-bold">{closestPlanet.name}</span>
                <span className="text-[10px] font-mono text-slate-400">Jarak: {closestDist} km</span>
              </div>
              
              {/* Progress dynamic closeness gauge slider */}
              <div className="h-1 text-[9px] bg-slate-900 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${closestDist < 70 ? 'bg-rose-500 animate-pulse' : 'bg-indigo-500'}`}
                  style={{ width: `${Math.min(100, Math.max(0, (300 - closestDist) / 3))}%` }}
                />
              </div>

              {/* Informative advice */}
              {closestDist < 100 ? (
                <div className="text-[10px] text-cyan-300 leading-relaxed font-mono bg-cyan-950/20 p-2 rounded border border-cyan-500/10">
                  {closestDist < 70 ? (
                    <span className="text-rose-400 font-bold block mb-1">⚠️ AWAS: DAYA TARIK ATMOSFER TINGGI!</span>
                  ) : (
                    <span className="text-cyan-300 font-bold block mb-1">🛰️ ORBIT AMAN TERDETEKSI</span>
                  )}
                  Lakukan rem pengereman (Brake) dan tekan <strong>Landing</strong> untuk merapat pendaratan rover!
                </div>
              ) : (
                <span className="text-[10px] text-slate-500 block font-mono">Gunakan thruster pendorong untuk mendekati target.</span>
              )}
            </div>
          ) : (
            <span className="text-xs text-slate-500 block font-mono">Mendeteksi kekosongan ruang hampa...</span>
          )}
        </div>

        {/* Real Rocket Action modules: Jettison Stage & Emergency Shield Repair */}
        <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl space-y-2">
          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">OPERASI DETASMEN HULL</span>
          <div className="flex flex-col gap-1.5">
            {customRocket.booster && (
              <button
                type="button"
                onClick={engageBoosterStaging}
                disabled={boostersJettisoned}
                className={`py-1.5 px-2 text-center font-mono text-[9px] uppercase font-black rounded-lg transition-all ${
                  boostersJettisoned
                    ? 'bg-slate-850 text-slate-600 border border-slate-800 cursor-not-allowed'
                    : 'bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-500 hover:to-red-500 text-white border border-amber-500/20 active:scale-95 shadow-md cursor-pointer'
                }`}
              >
                {boostersJettisoned ? '✓ BOOSTER TELAH DILEPAS' : '🚀 LEPAS BOOSTER (STAGE 1)'}
              </button>
            )}

            {shieldHealth < 100 && (
              <button
                type="button"
                onClick={() => {
                  sound.playPowerUp();
                  if (sciencePoints >= 25) {
                    setSciencePoints(prev => prev - 25);
                    setShieldHealth(100);
                  } else {
                    setShieldHealth(100);
                  }
                }}
                className="py-1.5 px-2 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-mono text-[9px] uppercase font-bold rounded-lg shadow-md transition-all active:scale-95 cursor-pointer text-center border border-emerald-500/20"
              >
                🔧 PERBAIKAN PERISAI {sciencePoints >= 25 ? '(-25 SAINS)' : '(FREE DARURAT)'}
              </button>
            )}
          </div>
        </div>

        {/* Visited log sheet */}
        <div className="flex-1 min-h-[100px] bg-slate-950/40 p-3 rounded-xl border border-slate-800/80 space-y-2">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">LOG MAPA JELAJAH</span>
          {visitedPlanets.length === 0 ? (
            <span className="text-[10px] text-slate-600 block italic leading-snug">
              Belum mendarat di planet mana pun. Bersiap untuk mendarat pertama kalimu!
            </span>
          ) : (
            <div className="space-y-1.5 max-h-[110px] overflow-y-auto">
              {visitedPlanets.map((id) => (
                <div key={id} className="text-[10px] text-emerald-400 font-mono flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Sukses Eksplor: {id.split('-').pop()?.toUpperCase()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Flight keys cheat guide */}
        <div className="mt-auto pt-3 border-t border-slate-800 text-[9px] text-slate-500 font-mono space-y-1">
          <span className="text-slate-400 font-sans font-bold uppercase block text-[8px] tracking-wide mb-1">KONTROL KEYBOARD:</span>
          <p>• MAJU / THRUST: W / Tombol Atas</p>
          <p>• PUTAR HALUAN: A & D / Tombol Kiri-Kanan</p>
          <p>• REM REPROS: S / Tombol Bawah</p>
        </div>
      </div>

      {/* Simulator view port and cockpit */}
      <div className="flex-1 flex flex-col relative h-full">
        {/* Sky canopy canvas rendering container */}
        <div className="flex-1 bg-slate-950 relative overflow-hidden">
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full block"
          />

          {/* Canvas overlays hud */}
          <div className="absolute top-4 left-4 pointer-events-none bg-slate-950/70 border border-slate-800/80 backdrop-blur px-3 py-2 rounded-lg text-[10px] font-mono text-slate-300 space-y-1 shadow-lg text-left">
            <div className="text-white font-bold flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
              <Navigation className="w-3.5 h-3.5 text-indigo-400 animate-spin-slow" />
              <span>SISTEM {activeSystem.name.toUpperCase()}</span>
            </div>
            <p className="text-cyan-400">STATUS: TERBANG ANGKASA BEBAS</p>
            <p className="text-slate-500 font-serif italic text-[10px]">{activeSystem.description.substring(0, 110)}...</p>
          </div>

          <div className="absolute top-4 right-4 bg-slate-950/70 border border-slate-800/80 backdrop-blur p-2 rounded-lg pointer-events-none text-right">
            <span className="text-[8px] text-slate-500 font-mono uppercase block">KOORDINAT SEKTOR</span>
            <strong className="text-white font-mono text-[11px] animate-pulse">
              {Math.round(stateRef.current.x)}, {Math.round(stateRef.current.y)}
            </strong>
          </div>

          {/* Landing Banner overlays prompt if planet is very close */}
          {closestPlanet && closestDist < 80 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/90 border border-cyan-500/30 p-4 rounded-2xl flex flex-col sm:flex-row items-center gap-4 shadow-2xl backdrop-blur-md max-w-sm w-full mx-auto">
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-md flex-shrink-0" style={{ backgroundColor: closestPlanet.color }}>
                🚀
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h4 className="text-xs text-slate-400 uppercase font-mono">Daya Tarik Orbit Dekat</h4>
                <p className="text-sm text-gray-100 font-bold font-sans">Mengorbit {closestPlanet.name}?</p>
                <span className="text-[10px] text-cyan-400 font-mono leading-none">Kecepatan manuver orbit aman</span>
              </div>
              <button
                onClick={handlePerformLanding}
                className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl transition-all active:scale-95 cursor-pointer shadow-lg tracking-wider"
              >
                MENGORBIT
              </button>
            </div>
          )}
        </div>

        {/* Lower row cockpit control box for Mobile/Touch interactivity */}
        <div className="h-28 bg-slate-900/95 border-t border-slate-800/80 px-4 py-3 flex items-center justify-between gap-4 z-10">
          {/* Virtual Steering dpad */}
          <div className="flex items-center gap-2">
            <button
              onMouseDown={rotateLeft}
              onTouchStart={rotateLeft}
              className="w-14 h-14 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl flex items-center justify-center text-slate-300 transition-all cursor-pointer active:scale-90"
              title="Steer Left"
            >
              <ArrowBigLeft className="w-7 h-7" />
            </button>

            <div className="flex flex-col gap-1.5 items-center">
              <span className="text-[9px] text-slate-500 font-mono uppercase font-bold">PUTAR KEMUDI</span>
              <div className="w-1 h-1.5 rounded bg-slate-600" />
            </div>

            <button
              onMouseDown={rotateRight}
              onTouchStart={rotateRight}
              className="w-14 h-14 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl flex items-center justify-center text-slate-300 transition-all cursor-pointer active:scale-90"
              title="Steer Right"
            >
              <ArrowBigRight className="w-7 h-7" />
            </button>
          </div>

          {/* Virtual Brake utility */}
          <button
            onClick={engageBrakes}
            className="px-5 py-3.5 bg-slate-950 hover:bg-rose-950/20 hover:border-rose-800 text-rose-400 font-mono text-xs border border-slate-800 rounded-xl transition-all cursor-pointer active:scale-95 text-center font-bold"
          >
            PENGEREMAN (RETRO)
          </button>

          {/* Virtual Throttle booster ignition button */}
          <div className="flex flex-col items-end gap-1.5">
            <span className="text-[9px] text-slate-500 font-mono uppercase font-bold tracking-wider">IGNITRON THROTTLE</span>
            <button
              onMouseDown={applyThrust}
              onTouchStart={applyThrust}
              className="w-32 h-14 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white rounded-xl shadow-[0_0_15px_rgba(239,68,68,0.25)] flex items-center justify-center gap-1.5 font-bold tracking-wider text-xs active:scale-95 transition-all cursor-pointer"
            >
              <Flame className="w-4 h-4 text-orange-200 animate-pulse" />
              THRUST CORE
            </button>
          </div>
        </div>
      </div>

      {/* LANDING SUCCESS FULLSCREEN ILLUSTRATIVE DIALOG */}
      <AnimatePresence>
        {isLanded && landingReport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/95 flex items-center justify-center p-4 backdrop-blur"
          >
            <motion.div
              initial={{ scale: 0.92, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: -15 }}
              className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-2xl relative overflow-hidden"
            >
              {/* Stars backdrop backdrop */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-950/20 via-slate-900 to-slate-900 -z-10" />
              
              {/* Simulated Planetary landscape mockup */}
              <div 
                className="h-44 w-full rounded-xl relative overflow-hidden flex items-end justify-center border border-slate-800 shadow-inner"
                style={{ 
                  background: `linear-gradient(to top, ${getDarkerColor(landingReport.color, 0.45)}, #020617)` 
                }}
              >
                {/* Craters / Hills background */}
                <div 
                  className="absolute bottom-[-15px] left-[-30px] right-[-30px] h-20 rounded-[50%] filter blur-[0.5px] opacity-40"
                  style={{ backgroundColor: landingReport.color }}
                />
                <div 
                  className="absolute bottom-[-25px] left-10 w-64 h-24 rounded-[50%] filter blur-[1px] opacity-25"
                  style={{ backgroundColor: getDarkerColor(landingReport.color, 0.3) }}
                />

                {/* Sparkling background details */}
                <div className="absolute inset-x-0 top-0 h-32 opacity-20 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:10px_10px]" />

                {/* Custom Rocket lander mock parked on planetary terrain vertical alignment */}
                <div className="z-10 flex flex-col items-center gap-0.5 absolute bottom-4">
                  <div className="w-7 h-5 rounded-t-full border-t border-white/20" style={{ backgroundColor: customRocket.capsule?.color || '#38bdf8' }} />
                  <div className="w-9 h-10 rounded-sm border border-white/10" style={{ backgroundColor: customRocket.fuelTank?.color || '#06b6d4' }} />
                  
                  {/* Landing gear support struts */}
                  <div className="w-12 h-2.5 bg-slate-800 border-b border-white/15 rounded-full flex justify-between px-1">
                    <span className="w-2.5 h-3 bg-gray-500 rounded" />
                    <span className="w-2.5 h-3 bg-gray-500 rounded" />
                  </div>
                </div>

                {/* Landing flag */}
                <div className="absolute bottom-4 left-1/3 z-10 flex flex-col items-start font-mono">
                  <div className="h-5 w-8 bg-indigo-600 border border-white flex items-center justify-center text-[7px] font-bold text-white">
                    RISET
                  </div>
                  <div className="h-8 w-0.5 bg-gray-400" />
                </div>

                {/* Planet big circular backdrop */}
                <div className="absolute top-2.5 right-6 text-right font-mono text-[9px] text-slate-500">
                  <span className="block text-[11px] font-bold text-white uppercase">{landingReport.name}</span>
                  <span>Grav : {landingReport.details.gravity}</span>
                </div>
              </div>

              {/* Text content details report */}
              <div className="space-y-3.5 text-center">
                <div className="p-3 bg-indigo-950/30 border border-indigo-500/20 rounded-full w-14 h-14 flex items-center justify-center mx-auto shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                  <Award className="w-7 h-7 text-indigo-400" />
                </div>
                
                <div>
                  <span className="text-[10px] text-cyan-400 font-mono tracking-widest uppercase font-bold block mb-1">SERTIFIKASI PENJELAJAH GALAKSI</span>
                  <h3 className="text-2xl font-black font-sans tracking-tight text-white mb-1.5">
                    Sukses Mengorbit {landingReport.name}!
                  </h3>
                  <p className="text-xs text-slate-400 px-3 leading-relaxed">
                    Wahana kustom Anda telah stabil mempresisikan kecepatan orbit kosmik di atas batas atmosfer {landingReport.name}. Seluruh instrumen tangki bahan bakar, booster pendorong, dan kabin kapsul beroperasi dalam efisiensi puncak.
                  </p>
                </div>

                {/* local planet facts info sheet */}
                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 text-left text-xs font-mono space-y-2 relative">
                  <div className="flex items-start gap-2 text-indigo-300">
                    <Sparkles className="w-4.5 h-4.5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-indigo-200">Arsip Sains Eksplorasi:</strong>
                      <p className="mt-0.5 text-slate-300 leading-normal">{landingReport.details.funFact}</p>
                    </div>
                  </div>

                  {/* Rewards indicator */}
                  <div className="flex items-center justify-between border-t border-slate-800/80 pt-2 text-[10px] text-cyan-400">
                    <span>Reward Eksplorasi Pertama:</span>
                    <strong className="font-bold">+100 Poin Riset Sains!</strong>
                  </div>
                </div>
              </div>

              {/* Dialog buttons list */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setIsLanded(false)}
                  className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all font-mono active:scale-95 cursor-pointer text-center"
                >
                  TERBANGKAN KEMBALI ROKET
                </button>

                <button
                  onClick={() => {
                    setIsLanded(false);
                    onClose();
                  }}
                  className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white font-bold text-xs rounded-xl transition-all font-mono active:scale-95 cursor-pointer text-center shadow-lg"
                >
                  KEMBALI KE HANGAR UTAMA
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
