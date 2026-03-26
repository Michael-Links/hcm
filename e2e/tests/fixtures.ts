import { expect, test as base } from '@playwright/test';
import type { Page } from '@playwright/test';

const isVisualMode = process.env.PLAYWRIGHT_VISUAL === '1';

async function enableVisualCursor(page: Page): Promise<void> {
  if (!isVisualMode) {
    return;
  }

  await page.addInitScript(() => {
    const browserWindow = window as Window & {
      __playwrightVisualCursorInstalled?: boolean;
    };

    if (browserWindow.__playwrightVisualCursorInstalled) {
      return;
    }

    browserWindow.__playwrightVisualCursorInstalled = true;

    const styleId = '__playwright-visual-cursor-style__';
    const cursorId = '__playwright-visual-cursor__';

    const installCursor = () => {
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
          *, *::before, *::after {
            cursor: none !important;
          }

          #${cursorId} {
            position: fixed;
            left: 0;
            top: 0;
            width: 30px;
            height: 30px;
            border: 3px solid #ff4d6d;
            border-radius: 999px;
            background: rgba(255, 77, 109, 0.18);
            box-shadow: 0 0 0 10px rgba(255, 77, 109, 0.16);
            transform: translate(-50%, -50%);
            pointer-events: none;
            z-index: 2147483647;
            opacity: 0;
            transition: transform 60ms linear, background 120ms ease, box-shadow 120ms ease;
          }

          #${cursorId}[data-clicking="true"] {
            transform: translate(-50%, -50%) scale(0.82);
            background: rgba(255, 77, 109, 0.3);
            box-shadow: 0 0 0 14px rgba(255, 77, 109, 0.22);
          }
        `;
        document.documentElement.appendChild(style);
      }

      let cursor = document.getElementById(cursorId) as HTMLDivElement | null;
      if (!cursor) {
        cursor = document.createElement('div');
        cursor.id = cursorId;
        document.documentElement.appendChild(cursor);
      }

      const updatePosition = (event: MouseEvent) => {
        cursor!.style.left = `${event.clientX}px`;
        cursor!.style.top = `${event.clientY}px`;
        cursor!.style.opacity = '1';
      };

      document.addEventListener('mousemove', updatePosition, true);
      document.addEventListener(
        'mousedown',
        () => {
          cursor!.dataset.clicking = 'true';
          cursor!.style.opacity = '1';
        },
        true,
      );
      document.addEventListener(
        'mouseup',
        () => {
          delete cursor!.dataset.clicking;
        },
        true,
      );
      document.addEventListener(
        'mouseleave',
        () => {
          cursor!.style.opacity = '0';
        },
        true,
      );
      window.addEventListener('blur', () => {
        cursor!.style.opacity = '0';
      });
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', installCursor, { once: true });
      return;
    }

    installCursor();
  });
}

export const test = base.extend({
  page: async ({ page }, use) => {
    await enableVisualCursor(page);
    await use(page);
  },
});

export { expect };
