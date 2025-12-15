import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeMode } from '../types';

interface TreeSpiralProps {
  mode: TreeMode;
}

export const TreeSpiral: React.FC<TreeSpiralProps> = ({ mode }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  // 创建螺旋线几何体路径
  const curve = useMemo(() => {
    const points = [];
    const turns = 2.5; // 圈数：2-3圈
    const height = 12; // 高度覆盖树体
    const radiusBase = 6.0; // 底部半径（比树稍大）
    const pointCount = 100;
    
    for (let i = 0; i <= pointCount; i++) {
      const t = i / pointCount;
      // 螺旋角度
      const angle = t * Math.PI * 2 * turns;
      // Y轴高度
      const y = t * height;
      // 半径随高度收缩
      const r = (1 - t) * radiusBase + 0.5;
      
      points.push(new THREE.Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r));
    }
    return new THREE.CatmullRomCurve3(points);
  }, []);

  useFrame((state, delta) => {
    if (!materialRef.current || !meshRef.current) return;

    // 动画逻辑：聚拢时显示，散开时消失
    // 我们控制材质的 opacity (透明度)
    const targetOpacity = mode === TreeMode.FORMED ? 1 : 0;
    
    // 平滑过渡透明度
    materialRef.current.opacity = THREE.MathUtils.lerp(
      materialRef.current.opacity, 
      targetOpacity, 
      delta * 2.0
    );

    // 只有当透明度大于0时才可见，节省性能
    meshRef.current.visible = materialRef.current.opacity > 0.01;

    // 让螺旋线缓缓旋转
    if (mode === TreeMode.FORMED) {
      meshRef.current.rotation.y += delta * 0.1;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, -0.5, 0]}>
      {/* 管道几何体: 路径, 分段数, 粗细(极细), 截面面数 */}
      <tubeGeometry args={[curve, 128, 0.04, 8, false]} />
      <meshStandardMaterial 
        ref={materialRef}
        color="#FFFACD"       // 亮金色
        emissive="#FFD700"    // 发光色
        emissiveIntensity={2} // 发光强度
        transparent           // 开启透明，以便渐隐
        opacity={0}           // 初始透明度
        depthWrite={false}    // 防止遮挡渲染问题
        toneMapped={false}    // 保持高亮
      />
    </mesh>
  );
};