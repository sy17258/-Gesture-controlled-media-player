import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'build', // Change output directory to 'build' for Vercel
    chunkSizeWarningLimit: 1500, // Increased chunk size warning limit
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Group React related packages
          if (id.includes('node_modules/react') || 
              id.includes('node_modules/react-dom') || 
              id.includes('node_modules/react-router-dom')) {
            return 'react-vendor';
          }
          
          // Group Three.js related packages
          if (id.includes('node_modules/three') || 
              id.includes('node_modules/@react-three')) {
            return 'three-vendor';
          }
          
          // Group UI related packages
          if (id.includes('node_modules/@radix-ui') || 
              id.includes('node_modules/lucide-react') || 
              id.includes('node_modules/class-variance-authority') || 
              id.includes('node_modules/clsx') || 
              id.includes('node_modules/tailwind-merge')) {
            return 'ui-vendor';
          }
          
          // Group MediaPipe related packages
          if (id.includes('node_modules/@mediapipe')) {
            return 'mediapipe-vendor';
          }
        }
      }
    }
  },
}));