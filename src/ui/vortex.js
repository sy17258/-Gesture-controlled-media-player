import React, { useRef, useEffect } from "react";

export function Vortex({ 
  backgroundColor = "black", 
  className = "", 
  children 
}) {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animationFrameId;
    let particles = [];
    
    // Set canvas dimensions
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      initParticles();
    };
    
    // Initialize particles
    const initParticles = () => {
      particles = [];
      const particleCount = Math.floor(canvas.width * canvas.height / 8000);
      
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2 + 1,
          speedX: Math.random() * 1 - 0.5,
          speedY: Math.random() * 1 - 0.5,
          color: `rgba(255, 255, 255, ${Math.random() * 0.5 + 0.3})`
        });
      }
    };
    
    // Animation loop
    const animate = () => {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw vortex effect
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      particles.forEach(particle => {
        // Calculate direction to center
        const dx = centerX - particle.x;
        const dy = centerY - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Add vortex effect
        const angle = Math.atan2(dy, dx);
        const vortexForce = 0.2;
        
        particle.speedX += (Math.cos(angle) * 0.05) + Math.cos(angle + Math.PI/2) * vortexForce;
        particle.speedY += (Math.sin(angle) * 0.05) + Math.sin(angle + Math.PI/2) * vortexForce;
        
        // Apply friction
        particle.speedX *= 0.98;
        particle.speedY *= 0.98;
        
        // Update position
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        
        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;
        
        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.fill();
        
        // Draw connections
        particles.forEach(otherParticle => {
          const dx = particle.x - otherParticle.x;
          const dy = particle.y - otherParticle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 100) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.2 * (1 - distance/100)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            ctx.stroke();
          }
        });
      });
      
      animationFrameId = requestAnimationFrame(animate);
    };
    
    // Initialize
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    animate();
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [backgroundColor]);
  
  return (
    <div className={`relative ${className}`} style={{ position: 'relative' }}>
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full"
        style={{ zIndex: 0 }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}