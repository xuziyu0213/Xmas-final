import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Loader } from '@react-three/drei';
import { Experience } from './components/Experience';
import { UIOverlay } from './components/UIOverlay';
import { GestureController } from './components/GestureController';
import { TreeMode } from './types';

// Simple Error Boundary
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Error loading 3D scene:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 text-[#D4AF37] font-serif p-8 text-center">
          <div>
            <h2 className="text-2xl mb-2">Something went wrong</h2>
            <p className="opacity-70">A resource failed to load (likely a missing image). Check the console for details.</p>
            <button 
              onClick={() => this.setState({ hasError: false })}
              className="mt-4 px-4 py-2 border border-[#D4AF37] hover:bg-[#D4AF37] hover:text-black transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [mode, setMode] = useState<TreeMode>(TreeMode.FORMED);
  const [handPosition, setHandPosition] = useState<{ x: number; y: number; detected: boolean }>({ x: 0.5, y: 0.5, detected: false });
  // --- CHANGE: Hardcoded photo paths instead of empty array ---
  // Ensure you create a "photos" folder inside "public" and name files 1.jpg, 2.jpg etc.
  const [uploadedPhotos] = useState<string[]>([
    '/photos/1.jpg',
    '/photos/2.jpg',
    '/photos/3.jpg',
    '/photos/4.jpg',
    '/photos/5.jpg',
    '/photos/6.jpg',
    '/photos/7.jpg',
    '/photos/8.jpg',
    '/photos/9.jpg',
    '/photos/10.jpg',
    '/photos/11.jpg',
  ]);

  const toggleMode = () => {
    setMode((prev) => (prev === TreeMode.FORMED ? TreeMode.CHAOS : TreeMode.FORMED));
  };

  const handleHandPosition = (x: number, y: number, detected: boolean) => {
    setHandPosition({ x, y, detected });
  };

  return (
    <div className="w-full h-screen relative bg-gradient-to-b from-black via-[#001a0d] to-[#0a2f1e]">
      <ErrorBoundary>
        <Canvas
          dpr={[1, 2]}
          camera={{ position: [0, 4, 20], fov: 45 }}
          gl={{ antialias: false, stencil: false, alpha: false }}
          shadows
        >
          <Suspense fallback={null}>
            <Experience mode={mode} handPosition={handPosition} uploadedPhotos={uploadedPhotos} />
          </Suspense>
        </Canvas>
      </ErrorBoundary>
      <Loader 
        containerStyles={{ background: '#000' }} 
        innerStyles={{ width: '300px', height: '10px', background: '#333' }}
        barStyles={{ background: '#D4AF37', height: '10px' }}
        dataStyles={{ color: '#D4AF37', fontFamily: 'Cinzel' }}
      />
      {/* Remove onPhotosUpload prop as it's no longer needed */}
      <UIOverlay mode={mode} onToggle={toggleMode} hasPhotos={uploadedPhotos.length > 0} />
      <GestureController currentMode={mode} onModeChange={setMode} onHandPosition={handleHandPosition} />
      
      {/* 新增部分：底部居中文字 */}
      <div className="absolute bottom-12 left-0 w-full flex justify-center z-20 pointer-events-none select-none">
        {/* 样式完全复刻 UIOverlay 中的 Merry Christmas，但字号(text-2xl/3xl)约为原版(4xl/6xl)的一半 */}
        <p className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#F5E6BF] to-[#D4AF37] font-serif tracking-wider text-center italic drop-shadow-[0_0_15px_rgba(212,175,55,0.8)]">
          The tree only for Daniel
        </p>
      </div>
    </div>
  );
}