const { ipcRenderer } = require('electron');

function serializeArgs(args) {
  return args.map(arg => {
    if (typeof arg === 'object') {
      try {
        return JSON.stringify(arg);
      } catch {
        return '[Unserializable Object]';
      }
    }
    return String(arg);
  }).join(' ');
}

// Override console methods
console.log = (...args) => {
  ipcRenderer.send('log-message', serializeArgs(args));
};
console.error = (...args) => {
  ipcRenderer.send('log-error', serializeArgs(args));
};

window.addEventListener('DOMContentLoaded', () => {
  const buttonElements = {};
  for (let i = 0; i <= 16; i++) {
    const el = document.getElementById(`button-${i}`);
    if (el) buttonElements[i] = el;
  }

  // Map button index to XInput button name (strings from wButtons array)
  const BUTTON_NAMES = {
    0: 'XINPUT_GAMEPAD_A',
    1: 'XINPUT_GAMEPAD_B',
    2: 'XINPUT_GAMEPAD_X',
    3: 'XINPUT_GAMEPAD_Y',
    4: 'XINPUT_GAMEPAD_LEFT_SHOULDER',
    5: 'XINPUT_GAMEPAD_RIGHT_SHOULDER',
    6: 'LT', // custom trigger logic
    7: 'RT',
    8: 'XINPUT_GAMEPAD_GUIDE',
    9: 'XINPUT_GAMEPAD_LEFT_THUMB',
    10: 'XINPUT_GAMEPAD_RIGHT_THUMB',
    12: 'XINPUT_GAMEPAD_DPAD_UP',
    13: 'XINPUT_GAMEPAD_DPAD_DOWN',
    14: 'XINPUT_GAMEPAD_DPAD_LEFT',
    15: 'XINPUT_GAMEPAD_DPAD_RIGHT',
  };

  const activeGlowing = new Set();

  ipcRenderer.on('controller-state', (event, gamepad) => {
    console.log(gamepad);

    Object.entries(BUTTON_NAMES).forEach(([idx, name]) => {
      const el = buttonElements[idx];
      if (!el) return;

      const index = Number(idx);
      let pressed = false;

      if (index === 6) {
        pressed = gamepad.bLeftTrigger > 30;
      } else if (index === 7) {
        pressed = gamepad.bRightTrigger > 30;
      } else {
        pressed = Array.isArray(gamepad.wButtons) && gamepad.wButtons.includes(name);
      }

      if (pressed && !activeGlowing.has(idx)) {
        el.classList.add('glow');
        activeGlowing.add(idx);
      } else if (!pressed && activeGlowing.has(idx)) {
        el.classList.remove('glow');
        activeGlowing.delete(idx);
      }
    });
  });

  ipcRenderer.on('controller-disconnected', () => {
    activeGlowing.forEach(idx => {
      if (buttonElements[idx]) buttonElements[idx].classList.remove('glow');
    });
    activeGlowing.clear();
  });

  console.log('Renderer initialized and ready.');
});
