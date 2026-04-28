'use client';

import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';

/* --- Page Transition Wrapper (SSR-safe) --- */
export function PageTransition({ children, className = '' }) {
  const [hasMounted, setHasMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- SSR hydration guard
  useEffect(() => { setHasMounted(true); }, []);

  if (!hasMounted) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  );
}

/* --- Magnetic Button --- */
export function MagneticButton({ children, className = '', as = 'button', onClick, ...props }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 300, damping: 20 });
  const springY = useSpring(y, { stiffness: 300, damping: 20 });

  function handleMouse(e) {
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left - rect.width / 2) * 0.3);
    y.set((e.clientY - rect.top - rect.height / 2) * 0.3);
  }

  const MotionTag = as === 'button' ? motion.button : motion[as] || motion.button;

  return (
    <MotionTag
      ref={ref}
      type={as === 'button' ? 'button' : undefined}
      className={className}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouse}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      {...props}
    >
      {children}
    </MotionTag>
  );
}
