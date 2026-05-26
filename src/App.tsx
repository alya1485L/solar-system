import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Globe, 
  Orbit, 
  Rocket, 
  Info, 
  Compass, 
  Wrench, 
  Volume2, 
  VolumeX, 
  Gauge, 
  ChevronRight, 
  CornerDownRight, 
  Sparkles, 
  Play, 
  RotateCcw, 
  ArrowLeft, 
  ShieldAlert,
  Flame,
  Milestone
} from 'lucide-react';
import { SolarSystem, CelestialBody, RocketPart, CustomRocket, ExploreMode } from './types';
import { SOLAR_SYSTEMS, ROCKET_PARTS } from './data/spaceData';
import { sound } from './audio';
import FreeFlightSimulator from './components/FreeFlightSimulator';

export default function App() {
  // Navigation & Core States
  const [currentSystemIdx, setCurrentSystemIdx] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<ExploreMode>('ORBIT_VIEW');
  const [selectedBody, setSelectedBody] = useState<CelestialBody>(SOLAR_SYSTEMS[0].star);
  const [isMuted, setIsMuted] = useState<boolean>(sound.getMutedState());
  
  // Rocket Assembly State
  const [customRocket, setCustomRocket] = useState<CustomRocket>({
    capsule: ROCKET_PARTS.find(p => p.id === 'cap_explorer') || null,
    fuelTank: ROCKET_PARTS.find(p => p.id === 'fuel_plasma') || null,
    engine: ROCKET_PARTS.find(p => p.id === 'eng_merlin') || null,
    booster: ROCKET_PARTS.find(p => p.id === 'bst_srb') || null,
    accessory: ROCKET_PARTS.find(p => p.id === 'acc_wings') || null,
  });
  
  // Custom rocket specs
  const [rocketStats, setRocketStats] = useState({
    totalWeight: 0,
    totalThrust: 0,
    rangeLightYears: 0,
    isSafe: true,
    speedMPS: 0
  });

  // Launch Simulator States
  const [launchTarget, setLaunchTarget] = useState<CelestialBody>(SOLAR_SYSTEMS[0].planets[2]); // Earth default
  const [launchState, setLaunchState] = useState<'IDLE' | 'COUNTDOWN' | 'TAKEOFF' | 'DEEP_SPACE' | 'LANDED'>('IDLE');
  const [countdown, setCountdown] = useState<number>(3);
  const [spaceProgress, setSpaceProgress] = useState<number>(0);
  const [isEngineBurning, setIsEngineBurning] = useState<boolean>(false);
  const [freeFlightActive, setFreeFlightActive] = useState<boolean>(false);

  // Orbit rotation timer for canvas
  const requestRef = useRef<number | null>(null);
  const anglesRef = useRef<Record<string, number>>({});
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const activeSystem = SOLAR_SYSTEMS[currentSystemIdx];

  // Recalculate rocket specs when parts change
  useEffect(() => {
    let weight = 0;
    let thrust = 0;
    let efficiencySum = 0;
    let componentsCount = 0;

    const parts = [
      customRocket.capsule,
      customRocket.fuelTank,
      customRocket.engine,
      customRocket.booster,
      customRocket.accessory
    ];

    parts.forEach((part) => {
      if (part) {
        weight += part.weight;
        componentsCount++;
        if (part.category === 'engine' || part.category === 'booster') {
          thrust += part.power || 0;
        }
        efficiencySum += part.efficiency || 0;
      }
    });

    const avgEfficiency = componentsCount > 0 ? efficiencySum / componentsCount : 0;
    // Range formula: (Thrust / Weight) * efficiency multiplier
    const speedRatio = weight > 0 ? (thrust / weight) * 450 : 0;
    const range = (thrust * avgEfficiency) / (weight > 0 ? weight : 1) * 0.15;
    
    // Safety check: Needs capsule, fuel, and engine to be secure. Thrust must overcome weight.
    const hasCoreComponents = !!(customRocket.capsule && customRocket.fuelTank && customRocket.engine);
    const thrustSufficient = thrust > (weight * 0.5);

    setRocketStats({
      totalWeight: weight,
      totalThrust: thrust,
      rangeLightYears: parseFloat(range.toFixed(2)),
      isSafe: hasCoreComponents && thrustSufficient,
      speedMPS: Math.round(speedRatio)
    });
  }, [customRocket]);

  // Audio mute helper
  const handleToggleMute = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  // Canvas render logic for Orbit Visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || activeTab !== 'ORBIT_VIEW') return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width;
    let height = canvas.height;

    // Handle canvas sizing
    const handleResize = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      width = canvas.width;
      height = canvas.height;
    };
    handleResize();

    // Setup initial angles if missing
    if (!anglesRef.current[activeSystem.star.id]) {
      anglesRef.current[activeSystem.star.id] = 0;
    }
    activeSystem.planets.forEach(p => {
      if (!anglesRef.current[p.id]) {
        anglesRef.current[p.id] = Math.random() * Math.PI * 2;
      }
      p.moons?.forEach(m => {
        if (!anglesRef.current[m.id]) {
          anglesRef.current[m.id] = Math.random() * Math.PI * 2;
        }
      });
    });

    // Pulse effects
    let pulseTime = 0;

    const getDarkerColor = (hex: string, factor = 0.55): string => {
      if (!hex || !hex.startsWith('#')) return 'rgba(0,0,0,0.85)';
      const r = parseInt(hex.substring(1, 3), 16);
      const g = parseInt(hex.substring(3, 5), 16);
      const b = parseInt(hex.substring(5, 7), 16);
      return `rgb(${Math.floor(r * factor)}, ${Math.floor(g * factor)}, ${Math.floor(b * factor)})`;
    };

    const render = () => {
      pulseTime += 0.05;
      ctx.save();
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      
      const lWidth = width / window.devicePixelRatio;
      const lHeight = height / window.devicePixelRatio;
      const centerX = lWidth / 2;
      const centerY = lHeight / 2;

      // Clear layout
      ctx.fillStyle = '#010411';
      ctx.fillRect(0, 0, lWidth, lHeight);

      // 1. NEBULA SPACE DUST DRAW (Parallax clouds)
      const nebulaGlow1 = ctx.createRadialGradient(lWidth * 0.25, lHeight * 0.3, 10, lWidth * 0.25, lHeight * 0.3, 220);
      nebulaGlow1.addColorStop(0, 'rgba(99, 102, 241, 0.07)'); // Indigo nebula
      nebulaGlow1.addColorStop(0.5, 'rgba(168, 85, 247, 0.03)'); // Purple dust
      nebulaGlow1.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = nebulaGlow1;
      ctx.fillRect(0, 0, lWidth, lHeight);

      const nebulaGlow2 = ctx.createRadialGradient(lWidth * 0.75, lHeight * 0.7, 20, lWidth * 0.75, lHeight * 0.7, 300);
      nebulaGlow2.addColorStop(0, 'rgba(6, 182, 212, 0.07)'); // Cyan interstellar gas
      nebulaGlow2.addColorStop(0.4, 'rgba(236, 72, 153, 0.02)'); // Pink highlights
      nebulaGlow2.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = nebulaGlow2;
      ctx.fillRect(0, 0, lWidth, lHeight);

      // 2. STARS BACKDROP
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      for (let i = 0; i < 75; i++) {
        // slightly fluctuate star shine
        const pulse = 0.5 + Math.sin(pulseTime + i) * 0.25;
        const x = (Math.sin(i * 123) * 0.5 + 0.5) * lWidth;
        const y = (Math.cos(i * 456) * 0.5 + 0.5) * lHeight;
        ctx.fillRect(x, y, 1.2 * pulse, 1.2 * pulse);
      }

      // 3. DRAW ORBIT PATHWAYS (Elegant dotted lines)
      activeSystem.planets.forEach((planet) => {
        ctx.beginPath();
        ctx.arc(centerX, centerY, planet.distanceFromStar, 0, Math.PI * 2);
        ctx.strokeStyle = selectedBody.id === planet.id 
          ? 'rgba(34, 211, 238, 0.45)' 
          : 'rgba(51, 65, 85, 0.18)';
        ctx.lineWidth = selectedBody.id === planet.id ? 1.5 : 1;
        ctx.setLineDash([3, 7]); // sophisticated dash
        ctx.stroke();
        ctx.setLineDash([]); // reset template
      });

      // 4. ASTEROID BELT (Orbeting small asteroids between Mars-like at ~195 and Jupiter-like at ~260 index)
      if (activeSystem.id === 'sol') {
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(pulseTime * 0.005);
        for (let i = 0; i < 480; i++) {
          const angle = (i * 115.5) % (Math.PI * 2) + Math.sin(pulseTime * 0.0001 + i) * 0.02;
          const radius = 221 + Math.sin(i * 77) * 13;
          const ax = Math.cos(angle) * radius;
          const ay = Math.sin(angle) * radius;
          const size = 0.8 + (i % 4) * 0.4;
          
          ctx.beginPath();
          ctx.arc(ax, ay, size, 0, Math.PI * 2);
          ctx.fillStyle = i % 3 === 0 ? 'rgba(115, 115, 115, 0.45)' : i % 3 === 1 ? 'rgba(78, 71, 65, 0.35)' : 'rgba(168, 162, 158, 0.25)';
          ctx.fill();
        }
        ctx.restore();

        // Elegant textual identifier centered in context with orbit ring
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(-0.35); // slightly skewed
        ctx.fillStyle = 'rgba(148, 163, 184, 0.35)';
        ctx.font = '700 8.5px "JetBrains Mono"';
        ctx.textAlign = 'center';
        ctx.fillText('SABUK ASTEROID (CERES)', 0, -222 - 7);
        ctx.restore();
      }

      // Draw Central Star (Sun) with rotating waves
      const star = activeSystem.star;
      const starRadius = star.radius;
      
      // Star core corona glow
      const coronaScale = 1.8 + Math.sin(pulseTime * 1.5) * 0.08;
      const starGlow = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, starRadius * coronaScale);
      starGlow.addColorStop(0, '#ffffff');
      starGlow.addColorStop(0.3, star.color);
      starGlow.addColorStop(0.7, `${star.color}22`);
      starGlow.addColorStop(1, 'transparent');
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, starRadius * coronaScale, 0, Math.PI * 2);
      ctx.fillStyle = starGlow;
      ctx.fill();

      // Solid central star
      ctx.beginPath();
      ctx.arc(centerX, centerY, starRadius, 0, Math.PI * 2);
      ctx.fillStyle = star.color;
      ctx.fill();

      // Sun flares rotating
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(pulseTime * 0.015);
      ctx.fillStyle = 'rgba(239, 68, 68, 0.25)'; // flame splotch
      ctx.beginPath();
      ctx.arc(-starRadius * 0.4, -starRadius * 0.2, starRadius * 0.12, 0, Math.PI*2);
      ctx.arc(starRadius * 0.3, starRadius * 0.3, starRadius * 0.15, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();

      // Draw Planets with Orbits & Procedural Shadows
      activeSystem.planets.forEach((planet) => {
        // Increment orbit position
        anglesRef.current[planet.id] += planet.orbitSpeed * 0.55;
        const angle = anglesRef.current[planet.id];

        const px = centerX + Math.cos(angle) * planet.distanceFromStar;
        const py = centerY + Math.sin(angle) * planet.distanceFromStar;

        // Sunlight orientation angle pointing outward from (centerX, centerY)
        const angleToSun = Math.atan2(py - centerY, px - centerX);

        // Planet selection target pulse neon ring
        if (selectedBody.id === planet.id) {
          ctx.beginPath();
          ctx.arc(px, py, planet.radius + 7, 0, Math.PI * 2);
          ctx.shadowBlur = 10;
          ctx.shadowColor = planet.glowColor || planet.color;
          ctx.strokeStyle = planet.glowColor ? `${planet.glowColor}aa` : '#22d3eeaa';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.shadowBlur = 0; // reset shadow
        }

        // 1. Atmospheric scatters glowing halo
        const haloGlow = ctx.createRadialGradient(px, py, planet.radius * 0.82, px, py, planet.radius * 1.5);
        haloGlow.addColorStop(0, planet.glowColor ? `${planet.glowColor}60` : `${planet.color}45`);
        haloGlow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.beginPath();
        ctx.arc(px, py, planet.radius * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = haloGlow;
        ctx.fill();

        // 2. Base sphere textured gradient relative to sun position
        const pGrad = ctx.createRadialGradient(
          px - Math.cos(angleToSun) * planet.radius * 0.35,
          py - Math.sin(angleToSun) * planet.radius * 0.35,
          planet.radius * 0.05,
          px,
          py,
          planet.radius
        );
        pGrad.addColorStop(0, '#ffffff'); // bright surface glare facing Sun
        pGrad.addColorStop(0.25, planet.color); // standard base color
        pGrad.addColorStop(0.88, getDarkerColor(planet.color, 0.45)); // smooth limb shading
        pGrad.addColorStop(1.0, '#010309'); // shadow night side facing away

        ctx.beginPath();
        ctx.arc(px, py, planet.radius, 0, Math.PI * 2);
        ctx.fillStyle = pGrad;
        ctx.fill();

        // 3. Clip custom continent and gas giant bands textures inside the sphere
        ctx.save();
        ctx.beginPath();
        ctx.arc(px, py, planet.radius, 0, Math.PI * 2);
        ctx.clip(); // clip next canvas calls strictly inside the planet ball

        // Slower rotating features inside planet space
        const intrinsicRot = (pulseTime * 0.08) * (planet.orbitSpeed * 1.8);
        ctx.translate(px, py);
        ctx.rotate(intrinsicRot);

        if (planet.id.includes('earth')) {
          // Draw green continents
          ctx.fillStyle = 'rgba(34, 197, 94, 0.45)';
          ctx.beginPath();
          ctx.arc(-planet.radius * 0.3, -planet.radius * 0.1, planet.radius * 0.45, 0, Math.PI * 2);
          ctx.arc(planet.radius * 0.4, planet.radius * 0.25, planet.radius * 0.35, 0, Math.PI * 2);
          ctx.arc(-planet.radius * 0.1, planet.radius * 0.5, planet.radius * 0.2, 0, Math.PI * 2);
          ctx.fill();
          
          // White spiraling weather cloud streams
          ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.beginPath();
          ctx.arc(-planet.radius * 0.4, -planet.radius * 0.3, planet.radius * 0.3, 0, Math.PI * 2);
          ctx.arc(planet.radius * 0.2, -planet.radius * 0.1, planet.radius * 0.28, 0, Math.PI * 2);
          ctx.fill();
        } else if (planet.id.includes('jupiter')) {
          // Horizontal stripes
          for (let ofs = -planet.radius; ofs < planet.radius; ofs += 4) {
            ctx.fillStyle = ofs % 8 === 0 ? 'rgba(120, 53, 4, 0.35)' : 'rgba(254, 215, 170, 0.15)';
            ctx.fillRect(-planet.radius, ofs, planet.radius * 2, 2.5);
          }
          // Crimson Great Red Spot
          ctx.fillStyle = 'rgba(185, 28, 28, 0.78)';
          ctx.beginPath();
          ctx.ellipse(planet.radius * 0.2, planet.radius * 0.15, planet.radius * 0.24, planet.radius * 0.14, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (planet.id.includes('saturn')) {
          // Fine gas stripes
          for (let ofs = -planet.radius; ofs < planet.radius; ofs += 3.5) {
            ctx.fillStyle = ofs % 7 === 0 ? 'rgba(161, 98, 7, 0.28)' : 'rgba(254, 240, 138, 0.1)';
            ctx.fillRect(-planet.radius, ofs, planet.radius * 2, 2);
          }
        } else if (planet.id.includes('mars')) {
          // Rusty splotches
          ctx.fillStyle = 'rgba(153, 27, 27, 0.5)';
          ctx.beginPath();
          ctx.arc(-planet.radius * 0.3, -planet.radius * 0.2, planet.radius * 0.28, 0, Math.PI * 2);
          ctx.arc(planet.radius * 0.3, planet.radius * 0.3, planet.radius * 0.22, 0, Math.PI * 2);
          ctx.fill();
          // Arctic polar cap at the top
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(0, -planet.radius * 0.9, planet.radius * 0.25, 0, Math.PI);
          ctx.fill();
        } else if (planet.id.includes('mercury')) {
          // Crater impacts
          ctx.fillStyle = 'rgba(75, 85, 99, 0.45)';
          ctx.beginPath();
          ctx.arc(-planet.radius * 0.45, planet.radius * 0.1, planet.radius * 0.16, 0, Math.PI*2);
          ctx.arc(planet.radius * 0.3, -planet.radius * 0.3, planet.radius * 0.2, 0, Math.PI*2);
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
          // Cold methane storm spots
          ctx.fillStyle = 'rgba(30, 58, 138, 0.32)';
          ctx.beginPath();
          ctx.arc(-planet.radius * 0.28, planet.radius * 0.2, planet.radius * 0.35, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore(); // remove texture clip translations

        // 4. Overlaid dynamic day-and-night terminator shadow
        const shadowGrad = ctx.createLinearGradient(
          px - Math.cos(angleToSun) * planet.radius,
          py - Math.sin(angleToSun) * planet.radius,
          px + Math.cos(angleToSun) * planet.radius,
          py + Math.sin(angleToSun) * planet.radius
        );
        shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        shadowGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.2)');
        shadowGrad.addColorStop(0.85, 'rgba(0, 0, 0, 0.88)');
        shadowGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0.98)');
        
        ctx.beginPath();
        ctx.arc(px, py, planet.radius + 0.3, 0, Math.PI * 2);
        ctx.fillStyle = shadowGrad;
        ctx.fill();

        // 5. Beautiful Saturn rings (under & pre-rendered depth)
        if (planet.hasRings) {
          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(0.28); // Tilted rings
          
          ctx.beginPath();
          ctx.ellipse(0, 0, planet.radius * 1.9, planet.radius * 0.55, 0, 0, Math.PI * 2);
          ctx.strokeStyle = planet.ringsColor || 'rgba(234, 179, 8, 0.35)';
          ctx.lineWidth = 4.5;
          ctx.stroke();

          ctx.restore();
        }

        // Draw label text
        ctx.fillStyle = selectedBody.id === planet.id ? '#67e8f9' : '#94a3b8';
        ctx.font = selectedBody.id === planet.id ? 'bold 11px "Space Grotesk"' : '10px "Space Grotesk"';
        ctx.fillText(planet.name, px + planet.radius + 5, py + 3.5);

        // Draw Moons orbiting around parent
        if (planet.moons && planet.moons.length > 0) {
          planet.moons.forEach((moon) => {
            anglesRef.current[moon.id] += moon.orbitSpeed * 0.8;
            const mAngle = anglesRef.current[moon.id];
            
            const mx = px + Math.cos(mAngle) * moon.distanceFromStar;
            const my = py + Math.sin(mAngle) * moon.distanceFromStar;

            // Moon orbit path line
            ctx.beginPath();
            ctx.arc(px, py, moon.distanceFromStar, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.05)';
            ctx.lineWidth = 0.5;
            ctx.stroke();

            // Moon base body
            ctx.beginPath();
            ctx.arc(mx, my, moon.radius, 0, Math.PI * 2);
            ctx.fillStyle = moon.color;
            ctx.fill();

            // Draw micro crater shadow on moon
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.beginPath();
            ctx.arc(mx - moon.radius*0.2, my - moon.radius*0.1, moon.radius*0.45, 0, Math.PI * 2);
            ctx.fill();
          });
        }
      });

      ctx.restore(); // restore window scales
      requestRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [currentSystemIdx, activeTab, selectedBody]);

  // Click on Canvas to Select closest body
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * (canvas.width / window.devicePixelRatio);
    const clickY = ((e.clientY - rect.top) / rect.height) * (canvas.height / window.devicePixelRatio);

    const centerX = (canvas.width / window.devicePixelRatio) / 2;
    const centerY = (canvas.height / window.devicePixelRatio) / 2;

    // First check distance to star
    const distToStar = Math.sqrt(Math.pow(clickX - centerX, 2) + Math.pow(clickY - centerY, 2));
    if (distToStar < activeSystem.star.radius * 1.5) {
      sound.playLaser('OVERCHARGE');
      setSelectedBody(activeSystem.star);
      return;
    }

    // Check planets and their real-time estimated orbits placement
    let foundBody: CelestialBody | null = null;
    let closestDist = 99999;

    activeSystem.planets.forEach((planet) => {
      const angle = anglesRef.current[planet.id] || 0;
      const px = centerX + Math.cos(angle) * planet.distanceFromStar;
      const py = centerY + Math.sin(angle) * planet.distanceFromStar;

      const clickDist = Math.sqrt(Math.pow(clickX - px, 2) + Math.pow(clickY - py, 2));
      
      // If within click boundary
      if (clickDist < Math.max(24, planet.radius * 2.2) && clickDist < closestDist) {
        foundBody = planet;
        closestDist = clickDist;
      }
    });

    if (foundBody) {
      sound.playPowerUp();
      setSelectedBody(foundBody);
    }
  };

  // Rocket part helper trigger
  const handlePartAssign = (part: RocketPart) => {
    sound.playPowerUp();
    setCustomRocket(prev => ({
      ...prev,
      [part.category === 'capsule' ? 'capsule' :
       part.category === 'fuel_tank' ? 'fuelTank' :
       part.category === 'engine' ? 'engine' :
       part.category === 'booster' ? 'booster' : 'accessory']: part
    }));
  };

  // Rocket Launcher countdown sequence
  const startLaunchSequence = () => {
    if (!rocketStats.isSafe) {
      sound.playHit();
      alert("⚠️ Roket belum aman atau komponen tidak lengkap!");
      return;
    }

    sound.playPowerUp();
    setLaunchState('COUNTDOWN');
    setCountdown(3);
    setSpaceProgress(0);
    setIsEngineBurning(true);
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (launchState === 'COUNTDOWN') {
      if (countdown > 0) {
        timer = setTimeout(() => {
          sound.playLaser('NORMAL');
          setCountdown(prev => prev - 1);
        }, 1000);
      } else {
        sound.playExplosion('BOSS'); // Massive ignition sound!
        setLaunchState('TAKEOFF');
        timer = setTimeout(() => {
          setLaunchState('DEEP_SPACE');
        }, 3000);
      }
    }
    return () => clearTimeout(timer);
  }, [launchState, countdown]);

  // Deep space flight simulation ticker
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (launchState === 'DEEP_SPACE') {
      interval = setInterval(() => {
        setSpaceProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            sound.playPowerUp();
            setLaunchState('LANDED');
            return 100;
          }
          // travel speed proportional to rocket engine speed
          const speedMultiplier = rocketStats.speedMPS > 0 ? (rocketStats.speedMPS / 400) : 1;
          return prev + 1.8 * speedMultiplier;
        });
      }, 50);
    }
    return () => clearInterval(interval);
  }, [launchState, rocketStats.speedMPS]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-white font-sans overflow-x-hidden antialiased">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-950/20 via-slate-950 to-slate-950 pointer-events-none" />

      {/* Main Top Header */}
      <header className="relative z-10 w-full bg-slate-900/40 border-b border-slate-800 backdrop-blur-md px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 border border-indigo-500/30 bg-indigo-950/40 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.2)]">
            <Orbit className="w-6 h-6 text-indigo-400 animate-spin-slow" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-sans tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-500">
              Solar System Explorer & Rocket Assembler
            </h1>
            <p className="text-[11px] text-gray-400 uppercase tracking-widest font-mono">Simulasi Fisika & Desain Kedirgantaraan</p>
          </div>
        </div>

        {/* Outer control panel */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 bg-slate-950/60 p-1 border border-slate-800 rounded-lg text-xs font-mono">
            <span className="text-gray-500 px-2 py-1">Sistem Aktif:</span>
            <select 
              value={currentSystemIdx}
              onChange={(e) => {
                sound.playPowerUp();
                const idx = parseInt(e.target.value);
                setCurrentSystemIdx(idx);
                setSelectedBody(SOLAR_SYSTEMS[idx].star);
              }}
              className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-cyan-400 font-bold focus:outline-none focus:border-cyan-400 cursor-pointer"
            >
              {SOLAR_SYSTEMS.map((sys, index) => (
                <option key={sys.id} value={index}>{sys.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleToggleMute}
            className={`p-2 rounded-lg border transition-all active:scale-95 cursor-pointer ${
              isMuted 
                ? 'bg-rose-950/20 border-rose-800 text-rose-400 hover:bg-rose-950/40' 
                : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title={isMuted ? "Aktifkan audio" : "Bisukan audio"}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Tab Controls Layout */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6 flex-1">
        
        {/* Nav tabs bar */}
        <div className="flex border-b border-slate-800/80 p-1 gap-2 bg-slate-900/20 rounded-xl self-start">
          <button
            onClick={() => { sound.playPowerUp(); setActiveTab('ORBIT_VIEW'); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold font-sans tracking-wide transition-all cursor-pointer ${
              activeTab === 'ORBIT_VIEW'
                ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <Compass className="w-4 h-4" />
            Peta Tata Surya Kita & Exoplanet
          </button>
          
          <button
            onClick={() => { sound.playPowerUp(); setActiveTab('ROCKET_LAB'); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold font-sans tracking-wide transition-all cursor-pointer ${
              activeTab === 'ROCKET_LAB'
                ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <Wrench className="w-4 h-4" />
            Hangar Perakit Roket Kustom
          </button>

          <button
            onClick={() => { sound.playPowerUp(); setActiveTab('LAUNCH_SIMULATION'); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold font-sans tracking-wide transition-all cursor-pointer ${
              activeTab === 'LAUNCH_SIMULATION'
                ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <Rocket className="w-4 h-4" />
            Uji Peluncuran & Misi Terbang
          </button>
        </div>

        {/* Dynamic Canvas / Tab Render views */}
        <AnimatePresence mode="wait">
          
          {/* TAB 1: INTERACTIVE SOLAR SYSTEM VIEW */}
          {activeTab === 'ORBIT_VIEW' && (
            <motion.div
              key="orbit-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6"
            >
              {/* Left Column: Orbital Interactive Canvas */}
              <div className="lg:col-span-7 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 flex flex-col gap-4 relative overflow-hidden backdrop-blur-sm min-h-[480px]">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="font-bold text-gray-200 flex items-center gap-2">
                      <Globe className="w-4 h-4 text-cyan-400" />
                      Visualisasi Orbit Interaktif
                    </h3>
                    <p className="text-[11px] text-gray-400 font-mono">Klik bintang atau planet di canvas untuk membedah orbitnya.</p>
                  </div>
                  
                  {/* Informative Indicator */}
                  <div className="text-[10px] bg-slate-950/80 text-cyan-400 font-bold border border-cyan-500/20 px-2.5 py-1 rounded font-mono animate-pulse">
                    Orbit Berjalan Riil-Skala
                  </div>
                </div>

                {/* Interactive Canvas container */}
                <div className="relative flex-1 bg-slate-950 rounded-xl overflow-hidden cursor-crosshair">
                  <canvas
                    ref={canvasRef}
                    onClick={handleCanvasClick}
                    className="absolute inset-0 w-full h-full block"
                  />
                  
                  {/* Mini Overlay Guide */}
                  <div className="absolute bottom-3 left-3 bg-slate-900/80 border border-slate-800 p-2.5 rounded-lg text-[10px] text-slate-400 font-mono space-y-1 backdrop-blur pointer-events-none">
                    <p className="text-white font-bold mb-1">Panduan Warna Orbit:</p>
                    <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block"></span> Bintang Utama</div>
                    <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span> Planet Terestrial</div>
                    <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-cyan-400 inline-block"></span> Planet Saturnus/Uranus</div>
                  </div>
                </div>

                {/* Sub Quick Navigator list */}
                <div className="flex flex-wrap items-center gap-2 border-t border-slate-800/60 pt-3">
                  <span className="text-[11px] text-slate-500 font-mono uppercase font-bold pr-1">Pintasan Kapal:</span>
                  
                  <button
                    onClick={() => { sound.playPowerUp(); setSelectedBody(activeSystem.star); }}
                    className={`px-3 py-1 text-xs rounded border transition-all ${
                      selectedBody.id === activeSystem.star.id
                        ? 'bg-yellow-900/30 border-yellow-500 text-yellow-200'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    ★ {activeSystem.star.name}
                  </button>

                  {activeSystem.planets.map((planet) => (
                    <button
                      key={planet.id}
                      onClick={() => { sound.playPowerUp(); setSelectedBody(planet); }}
                      className={`px-2.5 py-1 text-xs rounded border transition-all flex items-center gap-1.5 ${
                        selectedBody.id === planet.id
                          ? 'bg-cyan-950/50 border-cyan-500 text-cyan-300 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: planet.color }} />
                      {planet.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Column: High Fidelity Information Card */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                
                {/* System Background Description */}
                <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm">
                  <h3 className="text-xs font-mono font-bold tracking-widest text-indigo-400 uppercase mb-2">GALAKSI & SISTEM</h3>
                  <h4 className="text-lg font-bold text-white font-sans">{activeSystem.name}</h4>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{activeSystem.description}</p>
                  
                  <div className="flex items-center gap-3 mt-3.5 pt-3.5 border-t border-slate-800/80 text-xs font-mono">
                    <span className="text-slate-500">Tingkat Kesulitan Orbit:</span>
                    <span className="text-emerald-400 font-bold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/10">{activeSystem.difficulty}</span>
                  </div>
                </div>

                {/* Selected Celestial Body detailed profile */}
                <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 flex flex-col gap-5 relative overflow-hidden backdrop-blur-sm shadow-xl">
                  {/* Subtle Glowing Orbit Badge */}
                  <div className="absolute -right-3 -top-3 w-16 h-16 rounded-full border border-indigo-500/10 pointer-events-none" />

                  {/* Body Banner Info */}
                  <div className="flex items-start gap-4">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white relative flex-shrink-0"
                      style={{ 
                        backgroundColor: selectedBody.color,
                        boxShadow: `0 0 16px ${selectedBody.glowColor || selectedBody.color}90`
                      }}
                    >
                      {/* Reflection shine */}
                      <span className="absolute top-1 left-1.5 w-4 h-4 rounded-full bg-white/25 filter blur-[0.5px]" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono uppercase bg-indigo-950/40 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/20">
                          {selectedBody.details.typeIndonesian}
                        </span>
                        {selectedBody.details.moonsCount > 0 && (
                          <span className="text-xs font-mono bg-cyan-950/40 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-500/10">
                            🌔 {selectedBody.details.moonsCount} Bulan
                          </span>
                        )}
                      </div>
                      <h4 className="text-2xl font-bold text-gray-100 font-sans tracking-tight mt-1">{selectedBody.name}</h4>
                      <p className="text-[11px] text-gray-500 font-mono italic">Scientific Name: {selectedBody.details.scientificName}</p>
                    </div>
                  </div>

                  {/* Body short narrative */}
                  <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 text-xs leading-relaxed text-slate-300">
                    {selectedBody.details.description}
                  </div>

                  {/* Fun fact highlight */}
                  <div className="bg-cyan-950/10 p-3.5 rounded-xl border border-cyan-500/15 text-xs text-cyan-300 flex items-start gap-2">
                    <Sparkles className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-cyan-200 font-sans tracking-wide">Fakta Unik:</strong>
                      <p className="mt-0.5 leading-relaxed">{selectedBody.details.funFact}</p>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3.5 border-t border-slate-800/80 pt-4 font-mono text-xs">
                    <div className="bg-slate-950/20 p-2.5 rounded border border-slate-800/60">
                      <span className="text-slate-500 text-[10px] uppercase block">Diameter Khatulistiwa:</span>
                      <strong className="text-white text-sm mt-0.5 block">{selectedBody.details.diameter}</strong>
                    </div>

                    <div className="bg-slate-950/20 p-2.5 rounded border border-slate-800/60">
                      <span className="text-slate-500 text-[10px] uppercase block">Massa Objek:</span>
                      <strong className="text-white text-sm mt-0.5 block">{selectedBody.details.mass}</strong>
                    </div>

                    <div className="bg-slate-950/20 p-2.5 rounded border border-slate-800/60">
                      <span className="text-slate-500 text-[10px] uppercase block">Gaya Gravitasi:</span>
                      <strong className="text-white text-sm mt-0.5 block">{selectedBody.details.gravity}</strong>
                    </div>

                    <div className="bg-slate-950/20 p-2.5 rounded border border-slate-800/60">
                      <span className="text-slate-500 text-[10px] uppercase block">Suhu Rata-rata:</span>
                      <strong className="text-rose-300 text-sm mt-0.5 block">{selectedBody.details.temperature}</strong>
                    </div>

                    <div className="bg-slate-950/20 p-2.5 rounded border border-slate-800/60 col-span-2">
                      <span className="text-slate-500 text-[10px] uppercase block">Periode Revolusi (Orbit):</span>
                      <strong className="text-cyan-300 text-sm mt-0.5 block">{selectedBody.details.orbitPeriod}</strong>
                    </div>
                  </div>

                  {/* Render moon buttons inside if moons array is present */}
                  {selectedBody.moons && selectedBody.moons.length > 0 && (
                    <div className="flex flex-col gap-2.5 border-t border-slate-800/80 pt-4">
                      <span className="text-[11px] font-bold text-slate-500 font-mono uppercase">Eksplorasi Bulan/Satelitnya:</span>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedBody.moons.map((moon) => (
                          <button
                            key={moon.id}
                            onClick={() => {
                              sound.playPowerUp();
                              setSelectedBody(moon);
                            }}
                            className="p-2 bg-slate-950/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-lg text-left text-xs text-gray-300 transition-all flex items-center gap-2 cursor-pointer"
                          >
                            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: moon.color }} />
                            <div>
                              <strong className="block text-white">{moon.name}</strong>
                              <span className="text-[9px] text-gray-500 font-mono">Satelit Alami</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Link to assembler targeting this body */}
                  <button
                    onClick={() => {
                      sound.playPowerUp();
                      setLaunchTarget(selectedBody);
                      setActiveTab('ROCKET_LAB');
                    }}
                    className="w-full mt-2 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white font-bold text-xs rounded-xl tracking-wider active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
                  >
                    <Rocket className="w-4 h-4" />
                    BUAT MISI ROKET KE {selectedBody.name.toUpperCase()}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: ROCKET ASSEMBLY BAY (HANGAR) */}
          {activeTab === 'ROCKET_LAB' && (
            <motion.div
              key="rocket-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6"
            >
              {/* Left Side: Modular Schematic/Blueprints Visual */}
              <div className="lg:col-span-5 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 flex flex-col items-center justify-center relative backdrop-blur-sm min-h-[500px]">
                {/* Blueprint grid paper visual background */}
                <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px] rounded-2xl pointer-events-none" />
                <div className="absolute top-4 left-4 text-xs font-mono text-cyan-400/80">SCHEMATIC ASSEMBLY BAY</div>

                {/* Target Mission Alert */}
                <div className="mb-8 w-full bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <Milestone className="w-4 h-4 text-indigo-400" />
                    <div>
                      <span className="text-slate-500 block text-[9px]">TARGET DESTINASI:</span>
                      <strong className="text-white">{launchTarget.name} ({launchTarget.details.scientificName})</strong>
                    </div>
                  </div>
                  <button 
                    onClick={() => { sound.playPowerUp(); setActiveTab('ORBIT_VIEW'); }}
                    className="text-cyan-400 hover:text-cyan-300 font-bold text-[10px]"
                  >
                    Ubah Target
                  </button>
                </div>

                {/* 3D-like rocket assembly blueprint parts renderer */}
                <div className="flex flex-col items-center justify-center w-64 h-96 relative md:scale-105">
                  <AnimatePresence mode="popLayout">
                    
                    {/* Part 1: Accessory/Wings in background */}
                    {customRocket.accessory && (
                      <motion.div 
                        key={customRocket.accessory.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute bottom-16 h-20 w-48 border border-dashed border-sky-500/30 rounded-full flex justify-between px-1 pointer-events-none"
                      >
                        {/* Left Wing */}
                        <div 
                          className="w-8 h-full rounded-l-3xl shadow-lg flex items-center justify-center border border-sky-400/30 font-mono text-[9px] text-white/50"
                          style={{ backgroundColor: customRocket.accessory.color }}
                        />
                        {/* Right Wing */}
                        <div 
                          className="w-8 h-full rounded-r-3xl shadow-lg flex items-center justify-center border border-sky-400/30 font-mono text-[9px] text-white/50"
                          style={{ backgroundColor: customRocket.accessory.color }}
                        />
                      </motion.div>
                    )}

                    {/* Part 2: Main Cabin Capsule */}
                    <div className="z-10 w-full flex flex-col items-center absolute top-12">
                      <div className="text-[9px] font-mono text-slate-500 mb-1">D01: KAPSUL KOMANDO</div>
                      {customRocket.capsule ? (
                        <motion.div
                          key={customRocket.capsule.id}
                          initial={{ y: -20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          className="w-24 h-18 rounded-t-[50%] flex items-center justify-center text-center text-xs font-mono font-bold text-white relative shadow-lg cursor-pointer border-t border-x border-white/25"
                          style={{ backgroundColor: customRocket.capsule.color }}
                          onClick={() => sound.playHit()}
                        >
                          <span className="absolute bottom-1 text-[9px] opacity-70">Pilot Cabin</span>
                          {/* Inner glowing pilot capsule glass window */}
                          <div className="w-10 h-7 rounded-t-full bg-cyan-900/60 border border-cyan-400 absolute top-3 flex items-center justify-center">
                            <span className="w-2 h-2 rounded-full bg-white/40 filter blur-[0.5px]" />
                          </div>
                        </motion.div>
                      ) : (
                        <div className="w-24 h-18 border-2 border-dashed border-slate-700 rounded-t-[50%] flex items-center justify-center text-[10px] text-slate-500 font-mono">
                          Mata Kosong
                        </div>
                      )}
                    </div>

                    {/* Part 3: Fuel Tank Connector */}
                    <div className="z-10 w-full flex flex-col items-center absolute top-28">
                      <div className="text-[9px] font-mono text-slate-500 mb-1">D02: TANGKI PROPULSI</div>
                      {customRocket.fuelTank ? (
                        <motion.div
                          key={customRocket.fuelTank.id}
                          initial={{ scaleY: 0.5, opacity: 0 }}
                          animate={{ scaleY: 1, opacity: 1 }}
                          className="w-28 h-28 rounded-lg flex items-center justify-center text-center text-xs font-mono font-bold text-white relative shadow-lg border border-white/10"
                          style={{ backgroundColor: customRocket.fuelTank.color }}
                        >
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-[10px] tracking-wide uppercase px-2 py-0.5 bg-slate-950/40 rounded border border-white/5">{customRocket.fuelTank.name}</span>
                            <span className="text-[9px] text-white/60">KAPASITAS BAHAN BAKAR</span>
                          </div>
                          {/* Indicator light */}
                          <div className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                        </motion.div>
                      ) : (
                        <div className="w-28 h-28 border-2 border-dashed border-slate-700 rounded-lg flex items-center justify-center text-[10px] text-slate-500 font-mono">
                          Isi Bahan Bakar
                        </div>
                      )}
                    </div>

                    {/* Part 4: Thrust Engine attachment */}
                    <div className="z-10 w-full flex flex-col items-center absolute bottom-12">
                      <div className="text-[9px] font-mono text-slate-500 mb-1">D03: MESIN PENDORONG</div>
                      {customRocket.engine ? (
                        <motion.div
                          key={customRocket.engine.id}
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          className="w-22 h-16 rounded-b-2xl flex items-center justify-center text-center text-xs font-mono font-bold text-white relative shadow-xl border-b border-x border-white/15"
                          style={{ backgroundColor: customRocket.engine.color }}
                        >
                          <span className="text-[9px] text-white/80 uppercase">{customRocket.engine.name}</span>
                          <div className="h-4 w-12 bg-gray-400 absolute -bottom-4 border-b border-x border-gray-600 rounded-b" />
                        </motion.div>
                      ) : (
                        <div className="w-22 h-16 border-2 border-dashed border-slate-700 rounded-b-lg flex items-center justify-center text-[10px] text-slate-500 font-mono">
                          Motor Utama
                        </div>
                      )}
                    </div>

                    {/* Part 5: Solid boosters on bottom left and right */}
                    {customRocket.booster && (
                      <div className="z-0 absolute bottom-10 flex w-44 justify-between pointer-events-none">
                        <motion.div 
                          key={`b-left-${customRocket.booster.id}`}
                          initial={{ x: -25, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          className="w-6 h-28 rounded-md flex items-center justify-center shadow-md relative"
                          style={{ backgroundColor: customRocket.booster.color }}
                        >
                          <div className="w-4 h-3 bg-red-800 rounded-t absolute -top-3" />
                        </motion.div>
                        <motion.div 
                          key={`b-right-${customRocket.booster.id}`}
                          initial={{ x: 25, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          className="w-6 h-28 rounded-md flex items-center justify-center shadow-md relative"
                          style={{ backgroundColor: customRocket.booster.color }}
                        >
                          <div className="w-4 h-3 bg-red-800 rounded-t absolute -top-3" />
                        </motion.div>
                      </div>
                    )}

                  </AnimatePresence>
                </div>
              </div>

              {/* Right Side: Parts Catalogue & Swappers */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                
                {/* Dynamically update flight metrics */}
                <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm shadow-md grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/60 font-mono text-center">
                    <span className="text-slate-500 text-[10px] uppercase block mb-1">Berat Total:</span>
                    <strong className="text-white text-base block">{rocketStats.totalWeight.toLocaleString()} kg</strong>
                  </div>

                  <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/60 font-mono text-center">
                    <span className="text-slate-500 text-[10px] uppercase block mb-1">Daya Dorong:</span>
                    <strong className="text-cyan-400 text-base block">{rocketStats.totalThrust.toLocaleString()} N</strong>
                  </div>

                  <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/60 font-mono text-center">
                    <span className="text-slate-500 text-[10px] uppercase block mb-1">Kecepatan Relatif:</span>
                    <strong className="text-rose-400 text-base block">{rocketStats.speedMPS.toLocaleString()} m/s</strong>
                  </div>

                  <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/60 font-mono text-center">
                    <span className="text-slate-500 text-[10px] uppercase block mb-1">Indeks Jangkauan:</span>
                    <strong className="text-yellow-400 text-base block">{rocketStats.rangeLightYears} L.Y.</strong>
                  </div>

                  {/* Safetcheck banner line */}
                  <div className="col-span-2 sm:col-span-4 flex items-center justify-between border-t border-slate-800/80 pt-3.5 mt-1 font-sans text-xs">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${rocketStats.isSafe ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      <span className="font-mono text-slate-400 text-[11px]">
                        Status Rakitan: {rocketStats.isSafe ? (
                          <span className="text-emerald-400 font-bold">AMAN & SIAP TERBANG</span>
                        ) : (
                          <span className="text-rose-400 font-bold">STRUKTUR TIDAK SEIMBANG ATAU BAHAN BAKAR MELEBIHI PROPULSI</span>
                        )}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        sound.playPowerUp();
                        setActiveTab('LAUNCH_SIMULATION');
                      }}
                      disabled={!rocketStats.isSafe}
                      className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 rounded text-center text-[11px] font-mono font-bold text-white transition-all active:scale-95 cursor-pointer flex items-center gap-1 shadow-md"
                    >
                      Bawa Ke Landasan <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Catalogue Selection Swapper */}
                <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 flex flex-col gap-4 backdrop-blur-sm">
                  <h4 className="font-bold text-gray-200 border-b border-slate-800 pb-2.5 text-sm flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-indigo-400" />
                    Katalog Suku Cadang & Komponen Kedirgantaraan
                  </h4>

                  {/* Filter swapper categories */}
                  <div className="space-y-4">
                    {/* Capsules */}
                    <div>
                      <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block mb-2">KAPSUL UTAMA (Pilih satu):</span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {ROCKET_PARTS.filter(p => p.category === 'capsule').map((part) => (
                          <div
                            key={part.id}
                            onClick={() => handlePartAssign(part)}
                            className={`p-3 bg-slate-950/60 rounded-xl border transition-all cursor-pointer flex flex-col gap-1 text-left ${
                              customRocket.capsule?.id === part.id
                                ? 'border-cyan-400 bg-cyan-950/20 shadow-sm'
                                : 'border-slate-800 hover:border-slate-700/80'
                            }`}
                          >
                            <span className="text-xs font-bold text-white block">{part.name}</span>
                            <span className="text-[10px] text-gray-400 leading-tight block">{part.description}</span>
                            <span className="text-[9px] text-cyan-400 font-mono mt-1">Beban: {part.weight} kg</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Fuel Tanks */}
                    <div>
                      <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block mb-2">TANGKI PROPULSI (Pilih satu):</span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {ROCKET_PARTS.filter(p => p.category === 'fuel_tank').map((part) => (
                          <div
                            key={part.id}
                            onClick={() => handlePartAssign(part)}
                            className={`p-3 bg-slate-950/60 rounded-xl border transition-all cursor-pointer flex flex-col gap-1 text-left ${
                              customRocket.fuelTank?.id === part.id
                                ? 'border-indigo-400 bg-indigo-950/20 shadow-sm'
                                : 'border-slate-800 hover:border-slate-700/80'
                            }`}
                          >
                            <span className="text-xs font-bold text-white block">{part.name}</span>
                            <span className="text-[10px] text-gray-400 leading-tight block">{part.description}</span>
                            <span className="text-[9px] text-indigo-400 font-mono mt-1">Kapasitas: {part.power} liter</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Engines */}
                    <div>
                      <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block mb-2">MOTOR / MESIN PENDORONG (Pilih satu):</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {ROCKET_PARTS.filter(p => p.category === 'engine').map((part) => (
                          <div
                            key={part.id}
                            onClick={() => handlePartAssign(part)}
                            className={`p-3 bg-slate-950/60 rounded-xl border transition-all cursor-pointer flex flex-col gap-1 text-left ${
                              customRocket.engine?.id === part.id
                                ? 'border-purple-400 bg-purple-950/20 shadow-sm'
                                : 'border-slate-800 hover:border-slate-700/80'
                            }`}
                          >
                            <span className="text-xs font-bold text-white block">{part.name}</span>
                            <span className="text-[10px] text-gray-400 leading-tight block">{part.description}</span>
                            <span className="text-[9px] text-purple-400 font-mono mt-1">Semburan Daya: + {part.power} Newton</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Boosters */}
                    <div>
                      <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block mb-2">BOOSTER TAMBAHAN (Sisi Kapal):</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {ROCKET_PARTS.filter(p => p.category === 'booster').map((part) => (
                          <div
                            key={part.id}
                            onClick={() => handlePartAssign(part)}
                            className={`p-3 bg-slate-950/60 rounded-xl border transition-all cursor-pointer flex flex-col gap-1 text-left ${
                              customRocket.booster?.id === part.id
                                ? 'border-amber-400 bg-amber-950/20 shadow-sm'
                                : 'border-slate-800 hover:border-slate-700/80'
                            }`}
                          >
                            <span className="text-xs font-bold text-white block">{part.name}</span>
                            <span className="text-[10px] text-gray-400 leading-tight block">{part.description}</span>
                            <span className="text-[9px] text-amber-400 font-mono mt-1">Daya Puncak: {part.power} N</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 3: FLIGHT OR LAUNCH SIMULATOR */}
          {activeTab === 'LAUNCH_SIMULATION' && (
            <motion.div
              key="launch-tab"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="flex flex-col items-center justify-center p-6 bg-slate-900/40 border border-slate-800 rounded-2xl max-w-4xl mx-auto w-full backdrop-blur-sm relative overflow-hidden min-h-[500px]"
            >
              {/* Stars layer */}
              <div className="absolute inset-0 bg-slate-950 -z-10" />

              {/* Simulation Screen */}
              {launchState === 'IDLE' && (
                <div className="text-center py-8 space-y-6 max-w-lg">
                  <div className="p-4 bg-indigo-950/30 border border-indigo-500/20 rounded-full w-20 h-20 flex items-center justify-center mx-auto">
                    <Rocket className="w-10 h-10 text-indigo-400 animate-bounce" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-100 font-sans tracking-tight">Landasan Peluncuran Utama</h3>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                      Roket kustom Anda siap meluncur menembus atmosfer gumpalan awan. Pilih opsi penerbangan Anda menuju destinasi: <span className="text-cyan-400 font-bold font-mono">{launchTarget.name}</span>.
                    </p>
                  </div>

                  {/* Part configurations checklist inside panel */}
                  <div className="bg-slate-950/60 p-4 border border-slate-800 rounded-xl text-left space-y-2.5 text-xs font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Pilot Cabin:</span>
                      <strong className="text-white">{customRocket.capsule?.name || 'Belum Terpasang (X)'}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Fuel Tank:</span>
                      <strong className="text-white">{customRocket.fuelTank?.name || 'Belum Terpasang (X)'}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Engine Core:</span>
                      <strong className="text-white">{customRocket.engine?.name || 'Belum Terpasang (X)'}</strong>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-800/80 pt-2 text-[10px] text-gray-400">
                      <span>Perkiraan Kecepatan Antariksa:</span>
                      <strong className="text-rose-400 text-xs">{rocketStats.speedMPS.toLocaleString()} m/s</strong>
                    </div>
                  </div>

                  {/* Dual Flight Modes grid split */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                    {/* OPTION 1: CLASSIC AUTOMATED */}
                    <button
                      onClick={startLaunchSequence}
                      className="py-3.5 px-4 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-white rounded-xl transition-all cursor-pointer text-center font-sans active:scale-95 space-y-1 block"
                    >
                      <strong className="text-xs font-bold text-gray-200 block uppercase tracking-wide">① MISI OTOMATIS (KLASIK)</strong>
                      <span className="text-[10px] text-slate-500 leading-tight block">Simulasi peluncuran transisi sinematik otomatis.</span>
                    </button>

                    {/* OPTION 2: FLIGHT SIMULATION SANDBOX (PHYSICS INTERACTIVE) */}
                    <button
                      onClick={() => {
                        if (!rocketStats.isSafe) {
                          sound.playHit();
                          alert("⚠️ Roket belum aman atau komponen tidak lengkap!");
                          return;
                        }
                        sound.playPowerUp();
                        setFreeFlightActive(true);
                      }}
                      className="py-3.5 px-4 bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl transition-all cursor-pointer text-center font-sans active:scale-95 shadow-md flex flex-col justify-center items-center gap-1.5"
                    >
                      <strong className="text-xs font-black text-white block uppercase tracking-wide flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
                        ② KEMUDI PILOT BEBAS
                      </strong>
                      <span className="text-[10px] text-indigo-200 leading-tight block">Kendalikan kemudi fisik di orbit luar angkasa rill!</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Launch states animation views */}
              {launchState === 'COUNTDOWN' && (
                <div className="text-center py-20">
                  <span className="text-[12px] font-mono tracking-widest text-orange-400 block mb-3 uppercase">PENGISIAN DAYA REAKTOR</span>
                  <motion.div
                    key={countdown}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-8xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-yellow-400"
                  >
                    {countdown > 0 ? countdown : 'T-0 / BLAST OFF!'}
                  </motion.div>
                  <p className="text-xs text-gray-400 font-mono mt-4">Klem penyeimbang dilepas. Semua sistem penerbangan siap.</p>
                </div>
              )}

              {launchState === 'TAKEOFF' && (
                <div className="text-center py-12 flex flex-col items-center gap-6 overflow-hidden w-full relative h-[400px]">
                  {/* Blasting rocket rise layout */}
                  <motion.div
                    initial={{ y: 200 }}
                    animate={{ y: -300 }}
                    transition={{ duration: 3, ease: "easeIn" }}
                    className="z-10 flex flex-col items-center gap-2"
                  >
                    {/* Rocket image structure using parts colors */}
                    <div className="w-14 h-12 rounded-t-full" style={{ backgroundColor: customRocket.capsule?.color || '#cbd5e1' }} />
                    <div className="w-18 h-20 rounded-lg flex items-center justify-center border border-white/10" style={{ backgroundColor: customRocket.fuelTank?.color || '#475569' }} />
                    <div className="w-12 h-10 rounded-b-xl" style={{ backgroundColor: customRocket.engine?.color || '#374151' }} />
                    
                    {/* Propulsion fire flare animated */}
                    <motion.div
                      animate={{ scale: [1, 1.4, 0.9, 1.25, 1] }}
                      transition={{ repeat: Infinity, duration: 0.15 }}
                      className="w-10 h-36 bg-gradient-to-t from-transparent via-yellow-500 to-red-600 rounded-b-full filter blur-[1px]"
                    />
                  </motion.div>

                  {/* Particle smoke in backdrop */}
                  <div className="absolute inset-x-0 bottom-0 h-48 bg-slate-900 filter blur-lg opacity-40 animate-pulse" />
                  
                  <div className="absolute bottom-4 text-xs font-mono text-cyan-400">TERBANG MENINGGALKAN LANDASAN LANJUT ATMOSFER BUMI...</div>
                </div>
              )}

              {launchState === 'DEEP_SPACE' && (
                <div className="w-full flex flex-col items-center justify-center py-8 px-4 gap-6">
                  <div className="text-center space-y-1">
                    <span className="text-xs text-indigo-400 font-mono tracking-widest uppercase block">MEMASUKI ZONA PENJELAJAH GALAKSI</span>
                    <h4 className="text-lg font-bold text-white font-sans">Penerbangan Menuju {launchTarget.name}</h4>
                  </div>

                  {/* Flight simulator track lane */}
                  <div className="w-full max-w-xl bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-between relative overflow-hidden backdrop-blur-md">
                    <span className="text-[10px] text-gray-500 font-mono">Bumi (Sol-3)</span>
                    
                    <div className="flex-1 mx-4 h-2 bg-slate-900 border border-slate-800 rounded-full relative">
                      {/* Flying Custom Rocket position indicator indicator */}
                      <div 
                        className="absolute -top-3.5 transition-all duration-300 transform -translate-x-1/2 flex flex-col items-center gap-0.5"
                        style={{ left: `${spaceProgress}%` }}
                      >
                        <Rocket className="w-7 h-7 text-indigo-400 rotate-90" />
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping inline-block" />
                      </div>
                    </div>

                    <span className="text-[10px] text-cyan-400 font-bold font-mono">{launchTarget.name}</span>
                  </div>

                  {/* Flying visual scenery */}
                  <div className="w-full max-w-xl h-44 bg-slate-950/80 border border-slate-800/60 rounded-xl relative overflow-hidden flex items-center justify-center">
                    {/* Stars streak passing through left side to right */}
                    <div className="absolute inset-0 overflow-hidden flex items-center justify-between opacity-30 pointer-events-none">
                      <span className="w-24 h-0.5 bg-white/20 filter blur-[0.5px] animate-pulse inline-block" />
                      <span className="w-12 h-0.5 bg-white/10 filter blur-[0.5px] animate-pulse inline-block" />
                      <span className="w-32 h-0.5 bg-white/30 filter blur-[0.5px] animate-pulse inline-block" />
                    </div>

                    {/* Target planet growing in scale */}
                    <div 
                      className="w-16 h-16 rounded-full transition-all duration-1000 animate-pulse relative"
                      style={{ 
                        backgroundColor: launchTarget.color,
                        boxShadow: `0 0 25px ${launchTarget.color}75`,
                        transform: `scale(${0.3 + (spaceProgress / 100) * 0.9})`
                      }}
                    >
                      <span className="absolute top-1 left-2 w-4 h-4 rounded-full bg-white/20 filter blur-[0.5px]" />
                    </div>

                    {/* Instrument readout panel overlay */}
                    <div className="absolute top-2.5 left-2.5 bg-slate-950/80 border border-slate-800/80 p-2 rounded text-[9px] text-gray-400 font-mono text-left">
                      <p>KAPAL: RAPID_X_NAV</p>
                      <p>JARAK: {(spaceProgress * 0.15).toFixed(2)} Juta km</p>
                      <p>SUHU PROP.: OK</p>
                    </div>
                  </div>

                  <div className="text-xs font-mono text-indigo-300">Progress Penerbangan: {Math.round(spaceProgress)}%</div>
                </div>
              )}

              {launchState === 'LANDED' && (
                <div className="text-center py-8 space-y-6 max-w-lg">
                  <div className="p-4 bg-indigo-950/30 border border-indigo-500/20 rounded-full w-20 h-20 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(99,102,241,0.3)] animate-pulse">
                    <Globe className="w-10 h-10 text-indigo-400" />
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs text-cyan-400 font-mono font-bold tracking-widest block uppercase">MISI INTERSTELLAR SELESAI</span>
                    <h3 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500 font-sans tracking-tight">
                      Sukses Mengorbit {launchTarget.name}!
                    </h3>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                      Roket kustom Anda berhasil mempertahankan stabilitas eksentrisitas dan memasuki orbit stasioner yang aman di atas atmosfer {launchTarget.name}. Selamat pilot! Sistem pendorong booster stage, sasis tangki, dan kabin capsule berkualifikasi prima untuk menerbangi sistem {activeSystem.name}.
                    </p>
                  </div>

                  {/* Interactive Mission Review stats box */}
                  <div className="bg-slate-950/70 p-4 border border-slate-800 rounded-xl text-left space-y-3 font-mono text-xs">
                    <span className="text-slate-500 block border-b border-slate-800/80 pb-1.5 text-[10px] uppercase font-bold text-center">STATISTIK ORBIT OBSERVASI</span>
                    <div className="flex justify-between items-center text-gray-300">
                      <span>Nama Planet:</span>
                      <strong className="text-white">{launchTarget.name}</strong>
                    </div>
                    <div className="flex justify-between items-center text-gray-300">
                      <span>Gravitasi Lokal:</span>
                      <strong className="text-cyan-300">{launchTarget.details.gravity}</strong>
                    </div>
                    <div className="flex justify-between items-center text-gray-300">
                      <span>Status Wahana:</span>
                      <strong className="text-cyan-400 text-xs uppercase font-bold">Orbit Stasioner / Pemetaan</strong>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded border border-slate-800 text-[11px] leading-relaxed text-indigo-300">
                      💡 <strong>Fakta Eksplorasi:</strong> {launchTarget.details.funFact}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3">
                    <button
                      onClick={() => {
                        sound.playPowerUp();
                        setLaunchState('IDLE');
                      }}
                      className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs font-mono transition-all active:scale-95 cursor-pointer"
                    >
                      KEMBALI KE HANGAR
                    </button>
                    
                    <button
                      onClick={() => {
                        sound.playPowerUp();
                        setActiveTab('ORBIT_VIEW');
                      }}
                      className="py-3 px-4 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white font-bold rounded-xl text-xs font-mono transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Globe className="w-4 h-4" />
                      EKSPLORASI PLANET LAIN
                    </button>
                  </div>
                </div>
              )}

            </motion.div>
          )}

        </AnimatePresence>

      </div>

      {/* Footer Info credit */}
      <footer className="relative z-10 w-full bg-slate-950/80 border-t border-slate-900 mt-auto py-5 px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
        <div className="font-mono">
          © 2026 Solar System Explorer • Alyayeolse Lab
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span> Web Audio API Synth</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block"></span> 3D Orbits Simulator</span>
        </div>
      </footer>

      {freeFlightActive && (
        <FreeFlightSimulator
          activeSystem={activeSystem}
          customRocket={customRocket}
          rocketStats={rocketStats}
          onClose={() => setFreeFlightActive(false)}
        />
      )}
    </div>
  );
}
