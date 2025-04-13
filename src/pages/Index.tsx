
import { useEffect, useState, useRef } from 'react';
import NavBar from '@/components/ui/NavBar';
import SceneContainer from '@/components/canvas/SceneContainer';
import HandGesture from '@/components/canvas/HandGesture';
import MediaPlayer from '@/components/canvas/MediaPlayer';
import ParticleField from '@/components/canvas/ParticleField';
import TeamMember from '@/components/canvas/TeamMember';
import AnimatedSection from '@/components/ui/AnimatedSection';
import VideoDemo from '@/components/ui/VideoDemo';
import GlitchEffect from '@/components/ui/GlitchEffect';
import { cn } from "@/lib/utils"; // Import cn from utils instead of defining it here
import ColourfulText from "@/components/ui/colourful-text";
import { motion } from "motion/react"

// Remove the cn function export as it's causing HMR issues

const Index = () => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const demoRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = window.scrollY / totalHeight;
      setScrollProgress(progress);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const scrollToDemo = () => {
    demoRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  return (
    <div className="min-h-screen text-white">
      <NavBar />
      
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 h-1 bg-tech-purple z-50" style={{ width: `${scrollProgress * 100}%` }} />
      
      {/* Hero Section */}
      <section id="hero" className="h-screen pt-20 relative overflow-hidden">
        {/* <div className="container mx-auto px-4 h-full flex flex-col items-center justify-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            
            
            <div className="mt-10 flex flex-wrap gap-4 justify-center">
              <Button onClick={scrollToDemo} className="bg-tech-blue hover:bg-tech-blue/80 text-white">
                 Live Demo
              </Button>
              <Button variant="outline" className="border-tech-purple text-tech-purple hover:bg-tech-purple/10">
                <Github className="mr-2 h-4 w-4" /> Source Code
              </Button>
            </div>
          </motion.div>
        </div> */}

        <GlitchEffect />

        {/* 3D Scene for Hero */}
        <div className="absolute inset-0 z-0">
          <SceneContainer controls={false} cameraPosition={[0, 0, 8]}>
            <ParticleField count={800} color="#33C3F0" />
          </SceneContainer>
        </div>
      </section>

       {/* Team Section */}
       <section id="team" className="py-20 relative z-10">
        <div className="container mx-auto px-4">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-tech-blue to-tech-purple bg-clip-text text-transparent">
              Meet The Team
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              The talented individuals behind this innovative project.
            </p>
          </AnimatedSection>
          
          <div className="h-[500px] md:h-[900px] relative">
            <SceneContainer cameraPosition={[0, 0, 10]}>
              <group position={[0, 0, 0]}>
                <TeamMember 
                  position={[0, 1, 0]} 
                  name="Shivam Yadav" 
                  role="Project Lead" 
                  color="#33C3F0" 
                  imageSrc="/team/Shivam.jpg"
                />
                <TeamMember 
                  position={[-4, 0, 0]} 
                  name="Ankit Gola" 
                  role="Backend Developer" 
                  imageSrc="/team/Ankit.jpg"
                />
                <TeamMember 
                  position={[2, -1, 0]} 
                  name="Kushal Dhangar" 
                  role="Frontend Developer" 
                  imageSrc="/team/Kushal.jpg"
                />
                <TeamMember 
                  position={[-2, -1, 0]} 
                  name="Keshav Prajapati" 
                  role="Documentation" 
                  imageSrc="/team/Keshav.jpg"
                />
                
                <TeamMember 
                  position={[4, 0, 0]} 
                  name="Arvind Arya" 
                  role="Frontend Developer" 
                  imageSrc="/team/Arvind.jpg"
                />
              </group>
              <ParticleField count={200} color="#8B5CF6" size={0.03} />
            </SceneContainer>
          </div>
        </div>
      </section>
      
      {/* Demo Section */}
      <section id="demo" ref={demoRef} className="py-20 relative z-10">
        <div className="container mx-auto px-4">
          <AnimatedSection className="text-center ">
            <h2 className="text-4xl font-bold mb-4 text-gradient"><ColourfulText text="Interactive Demonstration" /> </h2>
          </AnimatedSection>
          
          <AnimatedSection delay={0.2}>
            <VideoDemo />
          </AnimatedSection>
          
          <AnimatedSection delay={0.3} className="mt-16 text-center">
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Webcam captures hand movements in real-time, 
              providing a natural and intuitive way to control media playback.
            </p>
          </AnimatedSection>
        </div>
      </section>
      
     
      
      {/* Contact Section
      <section id="contact" className="py-20 relative z-10">
        <div className="container mx-auto px-4">
          <AnimatedSection className="text-center mb-10">
            <h2 className="text-4xl font-bold mb-4 text-gradient">Get In Touch</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Interested in our project or want to collaborate? Reach out to us!
            </p>
          </AnimatedSection>
          
          <AnimatedSection delay={0.2}>
            <div className="glass-morphism rounded-lg p-8 max-w-2xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xl font-bold mb-4 text-tech-blue">Project Links</h3>
                  <ul className="space-y-3">
                    <li>
                      <a 
                        href="https://github.com" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center text-gray-300 hover:text-white transition-colors"
                      >
                        <Github className="h-5 w-5 mr-2" /> GitHub Repository
                      </a>
                    </li>
                    <li>
                      <a 
                        href="#" 
                        className="flex items-center text-gray-300 hover:text-white transition-colors"
                      >
                        <ExternalLink className="h-5 w-5 mr-2" /> Live Demo
                      </a>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-xl font-bold mb-4 text-tech-purple">Contact Info</h3>
                  <p className="text-gray-300 mb-2">
                    Shivam Yadav (Project Lead)
                  </p>
                  <p className="text-gray-300">
                    Email: shivam.yadav@example.com
                  </p>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>
       */}


      {/* Footer */}
      <footer className="py-8 glass-morphism relative z-10">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">
            &copy; {new Date().getFullYear()} Gesture Controlled Media Player | Final Year Project
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Built with React, Three.js, and ❤️
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
