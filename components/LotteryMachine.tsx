import React, { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';
import { Player } from '../types';
import { BALL_RADIUS, BALL_COLORS } from '../constants';

interface LotteryMachineProps {
  players: Player[];
  drawnNumber: number | null; // Changing this prop triggers ejection
  isDrawing: boolean;
  width: number;
  height: number;
}

const LotteryMachine: React.FC<LotteryMachineProps> = ({ players, drawnNumber, isDrawing, width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  const bodiesRef = useRef<Map<number, Matter.Body>>(new Map());
  const requestRef = useRef<number | null>(null);
  const isDrawingRef = useRef(isDrawing);

  // Sync ref with prop for access inside Matter events & Handle Gravity Toggle
  useEffect(() => {
    isDrawingRef.current = isDrawing;
    if (engineRef.current) {
        // Disable gravity while drawing to allow central vortex to work better
        // Enable gravity when stopped so they fall to floor
        engineRef.current.world.gravity.y = isDrawing ? 0 : 1;
    }
  }, [isDrawing]);

  // --- Initialization ---
  useEffect(() => {
    if (!canvasRef.current) return;

    // Setup Matter JS
    const Engine = Matter.Engine;
    const World = Matter.World;
    const Bodies = Matter.Bodies;
    const Runner = Matter.Runner;
    const Mouse = Matter.Mouse;
    const MouseConstraint = Matter.MouseConstraint;

    const engine = Engine.create();
    engine.world.gravity.y = 1; // Start with normal gravity
    engineRef.current = engine;

    // Create Walls
    const wallOptions = { isStatic: true, render: { visible: false }, friction: 0, restitution: 1 };
    const ground = Bodies.rectangle(width / 2, height + 30, width, 60, wallOptions);
    const leftWall = Bodies.rectangle(-30, height / 2, 60, height, wallOptions);
    const rightWall = Bodies.rectangle(width + 30, height / 2, 60, height, wallOptions);
    // Ceiling: Place it just above the viewport so they bounce off the "glass"
    // Center at y = -30, height 60 means bottom edge is at 0.
    const ceiling = Bodies.rectangle(width / 2, -30, width, 60, wallOptions); 

    World.add(engine.world, [ground, leftWall, rightWall, ceiling]);

    // Create Balls
    const balls: Matter.Body[] = [];
    players.forEach((p, index) => {
      const x = Math.random() * (width - 100) + 50;
      const y = Math.random() * (height / 2) + 50;
      const ball = Bodies.circle(x, y, BALL_RADIUS, {
        restitution: 0.9, // High bounciness
        friction: 0.005,
        frictionAir: 0.02, // Higher air friction to prevent velocity explosion in zero-g
        density: 0.04,
        label: p.number.toString(), // Store number in label
        render: {
          fillStyle: BALL_COLORS[index % BALL_COLORS.length],
        }
      });
      balls.push(ball);
      bodiesRef.current.set(p.number, ball);
    });

    World.add(engine.world, balls);

    // Register "Attractor" Event
    Matter.Events.on(engine, 'beforeUpdate', () => {
      if (!isDrawingRef.current) return;
      
      const bodies = Array.from(bodiesRef.current.values());
      const centerX = width / 2;
      const centerY = height / 2;

      bodies.forEach(body => {
        // Calculate vector to center
        const dx = centerX - body.position.x;
        const dy = centerY - body.position.y;
        
        // Attraction force (Spring-like)
        const distanceSq = dx * dx + dy * dy;
        const distance = Math.sqrt(distanceSq);
        
        // Avoid singularity at center
        if (distance < 1) return;

        // Force magnitude: Proportional to distance to keep them gathered, 
        // but not too strong to crush them.
        const strength = 0.00002 * body.mass; 
        
        // Random turbulence to keep them moving
        const turbulence = 0.015 * body.mass;

        Matter.Body.applyForce(body, body.position, {
            x: (dx * strength) + (Math.random() - 0.5) * turbulence,
            y: (dy * strength) + (Math.random() - 0.5) * turbulence
        });

        // Add random spin occasionally
        if (Math.random() > 0.9) {
             Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.1);
        }
      });
    });

    // Mouse Control (Optional but fun)
    const mouse = Mouse.create(canvasRef.current);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: {
        stiffness: 0.2,
        render: { visible: false }
      }
    });
    World.add(engine.world, mouseConstraint);

    // Runner
    const runner = Runner.create();
    runnerRef.current = runner;
    Runner.run(runner, engine);

    // Custom Rendering Loop
    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear
      ctx.clearRect(0, 0, width, height);

      // Draw Balls
      const bodies = Matter.Composite.allBodies(engine.world);
      
      bodies.forEach((body) => {
        if (body.isStatic) return; // Don't draw walls

        ctx.beginPath();
        ctx.arc(body.position.x, body.position.y, BALL_RADIUS, 0, 2 * Math.PI);
        
        // Fill
        ctx.fillStyle = body.render.fillStyle || '#fff';
        ctx.fill();

        // Stroke
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.stroke();

        // Text (Number) - Rotate with body
        ctx.save();
        ctx.translate(body.position.x, body.position.y);
        ctx.rotate(body.angle);
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(body.label, 0, 0); 
        
        // Shine/Gloss (Static relative to light source)
        ctx.rotate(-body.angle); 
        ctx.beginPath();
        ctx.arc(-8, -8, 6, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fill();
        
        ctx.restore();
      });

      requestRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      Runner.stop(runner);
      Matter.Engine.clear(engine);
      if (engineRef.current) Matter.World.clear(engineRef.current.world, false);
      bodiesRef.current.clear();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // --- Handle Ejection ---
  useEffect(() => {
    if (drawnNumber !== null && engineRef.current) {
      const body = bodiesRef.current.get(drawnNumber);
      if (body) {
        Matter.World.remove(engineRef.current.world, body);
        bodiesRef.current.delete(drawnNumber);
      }
    }
  }, [drawnNumber]);

  return (
    <div className="relative rounded-xl overflow-hidden border-4 border-slate-700 bg-slate-900 shadow-2xl">
      {/* Glass overlay effect */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-white/5 to-transparent z-10 rounded-lg"></div>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="block bg-slate-800"
      />
    </div>
  );
};

export default LotteryMachine;