/* ==========================================================
   MAIN  -- application entry point.
   Loaded as <script type="module" src="js/main.js"> from
   index.html. Importing each module runs its top-level code
   once (wiring DOM listeners); the explicit .load() calls then
   restore each module's saved state and trigger the first render.
   ========================================================== */
import { renderAll } from './render.js';
import { ThemeManager } from './themes.js';
import { WinFx } from './winfx.js';
import { Background } from './background.js';
import { Rice } from './rice.js';

// side-effect imports: these wire up their own DOM event listeners
// (add-habit form, month nav, panel switcher, command palette, ...)
// the moment they're imported, so nothing further to call here.
import './navigation.js';
import './notify.js';
import './fastfetch.js';
import './commandPalette.js';

ThemeManager.load();
WinFx.load();
Background.load();
Rice.load();
renderAll();
