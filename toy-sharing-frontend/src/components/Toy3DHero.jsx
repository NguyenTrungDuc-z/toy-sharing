import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function Toy3DHero({ onExploreClick }) {
  const mountRef = useRef(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const [activeToyName, setActiveToyName] = useState(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let animationFrameId;
    const width = container.clientWidth;
    const height = container.clientHeight || 420;

    // 1. SCENE & CAMERA (FOV 55 for rich depth according to Three.js guidelines)
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(52, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.5);

    // 2. RENDERER (sRGB & ACESFilmic tone mapping for ultra-vibrant colors)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.domElement.setAttribute('role', 'img');
    renderer.domElement.setAttribute('aria-label', 'Mô hình 3D tương tác thế giới đồ chơi ToyShare. Di chuột hoặc kéo để xoay.');
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.cursor = 'grab';
    container.appendChild(renderer.domElement);

    // 3. LIGHTING (Studio lighting setup)
    const ambientLight = new THREE.AmbientLight(0xfff6ea, 1.6);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffedd5, 2.4);
    dirLight1.position.set(5, 8, 6);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xbae6fd, 1.4);
    dirLight2.position.set(-6, -3, 4);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0xfb923c, 2.0, 15);
    pointLight.position.set(0, 2, 4);
    scene.add(pointLight);

    // 4. MATERIALS (Tactile Clay / Soft Plastic finish)
    const createClayMaterial = (color, roughness = 0.28, clearcoat = 0.25) =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(color),
        roughness,
        metalness: 0.04,
        clearcoat,
        clearcoatRoughness: 0.15,
      });

    const matOrange = createClayMaterial(0xea580c, 0.2, 0.35); // Brand warm orange
    const matAmber = createClayMaterial(0xf59e0b, 0.25, 0.3);  // Joyful yellow
    const matCyan = createClayMaterial(0x06b6d4, 0.2, 0.3);    // Vibrant cyan
    const matGreen = createClayMaterial(0x10b981, 0.22, 0.3);  // Fresh mint
    const matPurple = createClayMaterial(0x8b5cf6, 0.25, 0.3); // Playful lilac
    const matWhite = createClayMaterial(0xffffff, 0.18, 0.4);  // Glossy white
    const matDark = createClayMaterial(0x1c1917, 0.3, 0.1);    // Eyes

    // ROOT GROUP
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // --- TOY OBJECT 1: BÉ ROBOT ĐỒ CHƠI CHÍNH TÂM (CENTER MASCOT) ---
    const robotGroup = new THREE.Group();
    robotGroup.userData = { name: 'Robot Thông Minh' };

    // Body
    const bodyGeo = new THREE.BoxGeometry(1.4, 1.5, 1.2);
    const body = new THREE.Mesh(bodyGeo, matOrange);
    body.position.y = 0;
    robotGroup.add(body);

    // Chest Screen / Badge
    const screenGeo = new THREE.BoxGeometry(0.9, 0.8, 0.15);
    const screen = new THREE.Mesh(screenGeo, matWhite);
    screen.position.set(0, 0, 0.6);
    robotGroup.add(screen);

    // Chest Heart/Icon (Red/Pink small sphere)
    const heartGeo = new THREE.SphereGeometry(0.18, 16, 16);
    const heart = new THREE.Mesh(heartGeo, createClayMaterial(0xec4899, 0.15, 0.4));
    heart.position.set(0, 0, 0.7);
    robotGroup.add(heart);

    // Head
    const headGeo = new THREE.BoxGeometry(1.1, 0.9, 0.9);
    const head = new THREE.Mesh(headGeo, matAmber);
    head.position.y = 1.35;
    robotGroup.add(head);

    // Eyes
    const eyeGeo = new THREE.SphereGeometry(0.11, 16, 16);
    const leftEye = new THREE.Mesh(eyeGeo, matDark);
    leftEye.position.set(-0.28, 1.4, 0.45);
    const rightEye = new THREE.Mesh(eyeGeo, matDark);
    rightEye.position.set(0.28, 1.4, 0.45);
    robotGroup.add(leftEye, rightEye);

    // Antenna
    const antPoleGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.45, 12);
    const antPole = new THREE.Mesh(antPoleGeo, matWhite);
    antPole.position.set(0, 1.95, 0);
    const antBallGeo = new THREE.SphereGeometry(0.16, 16, 16);
    const antBall = new THREE.Mesh(antBallGeo, matCyan);
    antBall.position.set(0, 2.2, 0);
    robotGroup.add(antPole, antBall);

    // Arms
    const armGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.8, 12);
    const leftArm = new THREE.Mesh(armGeo, matCyan);
    leftArm.position.set(-0.95, 0.2, 0);
    leftArm.rotation.z = Math.PI / 6;

    const rightArm = new THREE.Mesh(armGeo, matCyan);
    rightArm.position.set(0.95, 0.2, 0);
    rightArm.rotation.z = -Math.PI / 4;
    robotGroup.add(leftArm, rightArm);

    rootGroup.add(robotGroup);

    // --- TOY OBJECT 2: KHỐI LEGO / BUILDING BLOCKS ---
    const blockGroup = new THREE.Group();
    blockGroup.userData = { name: 'Khối Xếp Hình STEM' };
    blockGroup.position.set(-2.5, 0.8, 0.5);

    const blockBaseGeo = new THREE.BoxGeometry(1.0, 1.0, 1.0);
    const blockBase = new THREE.Mesh(blockBaseGeo, matPurple);
    blockGroup.add(blockBase);

    // Studs on top of Lego block
    for (let x = -0.25; x <= 0.25; x += 0.5) {
      for (let z = -0.25; z <= 0.25; z += 0.5) {
        const studGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.2, 16);
        const stud = new THREE.Mesh(studGeo, matPurple);
        stud.position.set(x, 0.55, z);
        blockGroup.add(stud);
      }
    }
    rootGroup.add(blockGroup);

    // --- TOY OBJECT 3: TÀU VŨ TRỤ MINI (SPACE ROCKET) ---
    const rocketGroup = new THREE.Group();
    rocketGroup.userData = { name: 'Tàu Vũ Trụ Thám Hiểm' };
    rocketGroup.position.set(2.6, 0.6, -0.4);

    const rocketBodyGeo = new THREE.CylinderGeometry(0.35, 0.45, 1.3, 24);
    const rocketBody = new THREE.Mesh(rocketBodyGeo, matWhite);
    const rocketNoseGeo = new THREE.ConeGeometry(0.42, 0.7, 24);
    const rocketNose = new THREE.Mesh(rocketNoseGeo, matOrange);
    rocketNose.position.y = 0.95;

    const windowGeo = new THREE.TorusGeometry(0.14, 0.04, 12, 24);
    const rocketWindow = new THREE.Mesh(windowGeo, matCyan);
    rocketWindow.position.set(0, 0.2, 0.38);

    rocketGroup.add(rocketBody, rocketNose, rocketWindow);
    rocketGroup.rotation.z = -Math.PI / 6;
    rocketGroup.rotation.x = Math.PI / 10;
    rootGroup.add(rocketGroup);

    // --- TOY OBJECT 4: VÒNG TRÒN DOUGHNUT TORUS (XẾP CHỒNG MONTESSORI) ---
    const ringGeo = new THREE.TorusGeometry(0.65, 0.22, 16, 32);
    const ringMesh = new THREE.Mesh(ringGeo, matGreen);
    ringMesh.userData = { name: 'Vòng Gỗ Montessori' };
    ringMesh.position.set(-2.0, -1.3, 0.2);
    ringMesh.rotation.x = Math.PI / 3;
    rootGroup.add(ringMesh);

    // --- TOY OBJECT 5: NGÔI SAO VÀNG HYPERREAL 3D (GOLD STAR) ---
    const starGeo = new THREE.IcosahedronGeometry(0.55, 0);
    const starMesh = new THREE.Mesh(starGeo, matAmber);
    starMesh.userData = { name: 'Ngôi Sao Sáng Tạo' };
    starMesh.position.set(2.2, -1.2, 0.8);
    rootGroup.add(starMesh);

    // --- FLOATING SPHERES (CÁC VIÊN BI BONG BÓNG 3D VUI NHỘN) ---
    const particles = [];
    const sphereColors = [matOrange, matCyan, matAmber, matGreen, matPurple, matWhite];
    for (let i = 0; i < 14; i++) {
      const radius = 0.12 + Math.random() * 0.18;
      const sphereMat = sphereColors[i % sphereColors.length];
      const sphere = new THREE.Mesh(new THREE.SphereGeometry(radius, 16, 16), sphereMat);
      sphere.position.set(
        (Math.random() - 0.5) * 8.5,
        (Math.random() - 0.5) * 4.5,
        (Math.random() - 0.5) * 3 - 0.5
      );
      sphere.userData = {
        speed: 0.008 + Math.random() * 0.012,
        yBase: sphere.position.y,
        offset: Math.random() * Math.PI * 2,
      };
      particles.push(sphere);
      rootGroup.add(sphere);
    }

    // 5. INTERACTION & ANIMATION LOGIC
    let targetRotationX = 0;
    let targetRotationY = 0;
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    const mouseNDC = new THREE.Vector2(-10, -10);
    const raycaster = new THREE.Raycaster();

    const onPointerMove = (e) => {
      const rect = container.getBoundingClientRect();
      const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX);
      const clientY = e.clientY ?? (e.touches && e.touches[0]?.clientY);
      if (clientX === undefined) return;

      const x = ((clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((clientY - rect.top) / rect.height) * 2 + 1;
      mouseNDC.set(x, y);

      if (isDragging) {
        const deltaX = clientX - previousMousePosition.x;
        const deltaY = clientY - previousMousePosition.y;
        targetRotationY += deltaX * 0.01;
        targetRotationX += deltaY * 0.01;
        previousMousePosition = { x: clientX, y: clientY };
      } else {
        targetRotationY = x * 0.35;
        targetRotationX = -y * 0.25;
      }
    };

    const onPointerDown = (e) => {
      isDragging = true;
      setIsInteracting(true);
      renderer.domElement.style.cursor = 'grabbing';
      const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX);
      const clientY = e.clientY ?? (e.touches && e.touches[0]?.clientY);
      previousMousePosition = { x: clientX, y: clientY };
    };

    const onPointerUp = () => {
      isDragging = false;
      setIsInteracting(false);
      renderer.domElement.style.cursor = 'grab';
    };

    container.addEventListener('mousemove', onPointerMove);
    container.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mouseup', onPointerUp);
    container.addEventListener('touchmove', onPointerMove, { passive: true });
    container.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchend', onPointerUp);

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight || 420;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener('resize', handleResize);

    // Clock
    let clock = new THREE.Clock();

    // 6. MAIN RENDER LOOP
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth camera/root damping (Lerp)
      rootGroup.rotation.y += (targetRotationY - rootGroup.rotation.y) * 0.06;
      rootGroup.rotation.x += (targetRotationX - rootGroup.rotation.x) * 0.06;

      // Robot gentle hover & breathing
      robotGroup.position.y = Math.sin(elapsedTime * 1.8) * 0.12;
      robotGroup.rotation.y = Math.sin(elapsedTime * 0.8) * 0.1;
      head.rotation.y = Math.sin(elapsedTime * 1.4) * 0.15;
      leftArm.rotation.z = Math.PI / 6 + Math.sin(elapsedTime * 2.5) * 0.15;
      rightArm.rotation.z = -Math.PI / 4 + Math.cos(elapsedTime * 2.5) * 0.15;

      // Lego block wobble
      blockGroup.rotation.y += 0.008;
      blockGroup.position.y = 0.8 + Math.cos(elapsedTime * 1.5) * 0.15;

      // Rocket slow spin & gentle fly
      rocketGroup.position.y = 0.6 + Math.sin(elapsedTime * 2.0 + 1.0) * 0.2;
      rocketGroup.rotation.y += 0.012;

      // Ring & Star spins
      ringMesh.rotation.z += 0.01;
      ringMesh.rotation.y += 0.008;
      starMesh.rotation.x += 0.012;
      starMesh.rotation.y += 0.015;

      // Floating spheres gentle drift
      particles.forEach((p) => {
        p.position.y = p.userData.yBase + Math.sin(elapsedTime * 2.0 + p.userData.offset) * 0.25;
      });

      // Raycasting for interactive hover highlight
      raycaster.setFromCamera(mouseNDC, camera);
      const interactiveTargets = [robotGroup, blockGroup, rocketGroup, ringMesh, starMesh];
      const intersects = raycaster.intersectObjects(interactiveTargets, true);

      if (intersects.length > 0 && !isDragging) {
        let topObj = intersects[0].object;
        while (topObj.parent && !topObj.userData?.name && topObj.parent !== rootGroup) {
          topObj = topObj.parent;
        }
        if (topObj.userData?.name) {
          setActiveToyName(topObj.userData.name);
          renderer.domElement.style.cursor = 'pointer';
        }
      } else if (!isDragging) {
        setActiveToyName(null);
        renderer.domElement.style.cursor = 'grab';
      }

      renderer.render(scene, camera);
    };

    animate();

    // CLEANUP
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousemove', onPointerMove);
      container.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('mouseup', onPointerUp);
      container.removeEventListener('touchmove', onPointerMove);
      container.removeEventListener('touchstart', onPointerDown);
      window.removeEventListener('touchend', onPointerUp);

      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      minHeight: '440px',
      borderRadius: '32px',
      overflow: 'hidden',
      background: 'radial-gradient(ellipse 90% 80% at 50% 15%, #ffffff 0%, #fff7ed 45%, #fed7aa 100%)',
      border: '2px solid rgba(254, 215, 170, 0.7)',
      boxShadow: '0 20px 45px rgba(234, 88, 12, 0.12), inset 0 2px 4px rgba(255, 255, 255, 0.8)',
      display: 'flex',
      alignItems: 'center',
      marginBottom: '32px'
    }}>
      {/* 1. THREE.JS 3D CANVAS VIEWPORT (NẰM Ở NỬA PHẢI MÀN HÌNH HOẶC NỀN TOÀN BỘ) */}
      <div
        ref={mountRef}
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '58%',
          height: '100%',
          zIndex: 2,
          pointerEvents: 'auto',
          touchAction: 'none'
        }}
      />

      {/* 2. NỘI DUNG HERO BÊN TRÁI (TYPOGRAPHY & 3D CTAS) */}
      <div style={{
        position: 'relative',
        zIndex: 5,
        width: '52%',
        padding: '48px 24px 48px 48px',
        pointerEvents: 'auto'
      }}>
        {/* VIP BADGE 3D */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(10px)',
          padding: '6px 16px',
          borderRadius: '30px',
          border: '1.5px solid #fed7aa',
          boxShadow: '0 4px 14px rgba(234, 88, 12, 0.1)',
          marginBottom: '16px'
        }}>
          <span style={{ fontSize: '16px', animation: 'pulse 1.5s infinite' }}>✨</span>
          <span style={{ fontSize: '13px', fontWeight: '800', color: '#c2410c', letterSpacing: '0.3px' }}>
            NỀN TẢNG CHIA SẺ ĐỒ CHƠI 3D THÔNG MINH
          </span>
        </div>

        {/* HERO TITLE BOLD */}
        <h1 style={{
          fontSize: '44px',
          fontWeight: '900',
          color: '#1c1917',
          lineHeight: '1.2',
          letterSpacing: '-1px',
          margin: '0 0 16px 0'
        }}>
          Chia sẻ đồ chơi, <br />
          <span style={{
            background: 'linear-gradient(135deg, #ea580c 0%, #f59e0b 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'inline-block'
          }}>
            Nhân đôi niềm vui!
          </span>
        </h1>

        <p style={{
          fontSize: '16px',
          color: '#57534e',
          lineHeight: '1.6',
          margin: '0 0 28px 0',
          maxWidth: '460px'
        }}>
          Trải nghiệm kho đồ chơi tương tác 3D đa chiều. Tiết kiệm 80% chi phí, bảo chứng khử khuẩn <strong>100% UV-C</strong> và ký quỹ an toàn tuyệt đối.
        </p>

        {/* CẶP NÚT BẤM 3D VIP (TACTILE CLAY DEPTH) */}
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={onExploreClick}
            style={{
              padding: '14px 32px',
              borderRadius: '9999px',
              background: 'linear-gradient(180deg, #f97316 0%, #ea580c 100%)',
              color: '#ffffff',
              border: 'none',
              fontWeight: '800',
              fontSize: '15px',
              cursor: 'pointer',
              boxShadow: '0 5px 0 #9a3412, 0 12px 24px rgba(234, 88, 12, 0.35), inset 0 2px 2px rgba(255, 255, 255, 0.4)',
              transition: 'all 0.15s ease',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseDown={e => {
              e.currentTarget.style.transform = 'translateY(4px)';
              e.currentTarget.style.boxShadow = '0 1px 0 #9a3412, 0 4px 10px rgba(234, 88, 12, 0.25)';
            }}
            onMouseUp={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 5px 0 #9a3412, 0 12px 24px rgba(234, 88, 12, 0.35), inset 0 2px 2px rgba(255, 255, 255, 0.4)';
            }}
          >
            <span>🚀 Khám phá kho đồ chơi</span>
          </button>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            color: '#78716c',
            fontWeight: '600',
            background: 'rgba(255, 255, 255, 0.75)',
            padding: '8px 14px',
            borderRadius: '20px',
            border: '1px solid #ede4dc'
          }}>
            <span>🕹️</span>
            <span>Kéo chuột để xoay 3D</span>
          </div>
        </div>

        {/* 3 PILL BADGES DƯỚI NÚT BẤM */}
        <div style={{
          display: 'flex',
          gap: '16px',
          marginTop: '32px',
          paddingTop: '20px',
          borderTop: '1px solid rgba(237, 228, 220, 0.8)'
        }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#1c1917' }}>2.400+</div>
            <div style={{ fontSize: '12px', color: '#78716c' }}>Món đồ chơi sẵn sàng</div>
          </div>
          <div style={{ width: '1px', background: '#ede4dc' }} />
          <div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#16a34a' }}>100%</div>
            <div style={{ fontSize: '12px', color: '#78716c' }}>Khử khuẩn UV-C</div>
          </div>
          <div style={{ width: '1px', background: '#ede4dc' }} />
          <div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#ea580c' }}>★ 4.9/5</div>
            <div style={{ fontSize: '12px', color: '#78716c' }}>Đánh giá hài lòng</div>
          </div>
        </div>
      </div>

      {/* 3. FLOATING INTERACTION TAG (KHI RÊ CHUỘT TRÚNG MÓN ĐỒ CHƠI 3D) */}
      {activeToyName && (
        <div style={{
          position: 'absolute',
          top: '24px',
          right: '28px',
          zIndex: 10,
          background: 'rgba(28, 25, 23, 0.85)',
          backdropFilter: 'blur(8px)',
          color: '#ffffff',
          padding: '8px 18px',
          borderRadius: '30px',
          fontSize: '13px',
          fontWeight: '700',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          animation: 'fadeIn 0.2s ease'
        }}>
          <span>🧸</span>
          <span>Đang chọn: {activeToyName}</span>
        </div>
      )}
    </div>
  );
}
