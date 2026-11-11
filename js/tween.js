// Mini sistema de animação (tween) baseado em Promises.
// Cada tween chama onUpdate(k) com k entre 0 e 1 já suavizado pela curva "ease".

export const Ease = {
  linear: (t) => t,
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
  inCubic: (t) => t * t * t,
  inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outBack: (t) => {
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
};

const active = new Set();

export function tween({ duration = 1, delay = 0, ease = Ease.inOutCubic, onUpdate = () => {} } = {}) {
  return new Promise((resolve) => {
    active.add({ t: -delay, duration: Math.max(duration, 1e-4), ease, onUpdate, resolve });
  });
}

// Interpola um Vector3 até o destino.
export function tweenVec(vec, to, opts = {}) {
  const from = vec.clone();
  return tween({ ...opts, onUpdate: (k) => vec.lerpVectors(from, to, k) });
}

// Interpola um Quaternion até o destino.
export function tweenQuat(quat, to, opts = {}) {
  const from = quat.clone();
  return tween({ ...opts, onUpdate: (k) => quat.slerpQuaternions(from, to, k) });
}

export const wait = (seconds) => tween({ duration: seconds, ease: Ease.linear });

export function updateTweens(dt) {
  for (const tw of active) {
    tw.t += dt;
    if (tw.t < 0) continue;
    const p = Math.min(tw.t / tw.duration, 1);
    tw.onUpdate(tw.ease(p), p);
    if (p >= 1) {
      active.delete(tw);
      tw.resolve();
    }
  }
}
