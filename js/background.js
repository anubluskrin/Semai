/* ==========================================================
   BACKGROUND (image / video / custom URL + dim)
   ========================================================== */
import { Storage } from './core.js';

export const Background = (function () {
  const bgDefault = document.getElementById('bgDefault');
  const bgImage = document.getElementById('bgImage');
  const bgVideo = document.getElementById('bgVideo');
  const bgDimLayer = document.getElementById('bgDimLayer');
  const dimRange = document.getElementById('bgDimRange');
  const dimVal = document.getElementById('bgDimVal');

  function showNone() {
    bgDefault.style.display = 'block';
    bgImage.style.display = 'none'; bgImage.removeAttribute('src');
    bgVideo.style.display = 'none'; bgVideo.removeAttribute('src');
  }
  function showImage(src) {
    bgDefault.style.display = 'none';
    bgVideo.style.display = 'none'; bgVideo.removeAttribute('src');
    bgImage.src = src; bgImage.style.display = 'block';
  }
  function showVideo(src) {
    bgDefault.style.display = 'none';
    bgImage.style.display = 'none'; bgImage.removeAttribute('src');
    bgVideo.src = src; bgVideo.style.display = 'block';
  }

  function applyDim() {
    const v = dimRange.value / 100;
    bgDimLayer.style.background = `rgba(0,0,0,${v})`;
    dimVal.textContent = Math.round(v * 100) + '%';
  }

  function saveDim() { Storage.set(Storage.keys.bg + '-dim', dimRange.value); }

  function saveMode(mode, src) { Storage.set(Storage.keys.bg, { mode, src }); }

  function reset() {
    showNone();
    Storage.remove(Storage.keys.bg);
  }

  function toDataUrl(file, cb) {
    const reader = new FileReader();
    reader.onload = () => cb(reader.result);
    reader.onerror = () => console.error('Gagal membaca file latar belakang.');
    reader.readAsDataURL(file);
  }

  document.getElementById('bgImageInput').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    toDataUrl(file, dataUrl => { showImage(dataUrl); saveMode('image', dataUrl); });
  });
  document.getElementById('bgVideoInput').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    toDataUrl(file, dataUrl => { showVideo(dataUrl); saveMode('video', dataUrl); });
  });
  document.getElementById('bgUrlApply').addEventListener('click', () => {
    const url = document.getElementById('bgUrlInput').value.trim();
    if (!url) return;
    const type = document.getElementById('bgUrlType').value;
    if (type === 'video') showVideo(url); else showImage(url);
    saveMode(type, url);
  });
  document.getElementById('bgReset').addEventListener('click', reset);
  dimRange.addEventListener('input', () => { applyDim(); saveDim(); });

  function load() {
    const saved = Storage.get(Storage.keys.bg, null);
    if (saved && saved.src) {
      if (saved.mode === 'video') showVideo(saved.src); else showImage(saved.src);
    } else {
      showNone();
    }
    const savedDim = Storage.get(Storage.keys.bg + '-dim', null);
    if (savedDim != null) dimRange.value = savedDim;
    applyDim();
  }

  function exportData() {
    return { bg: Storage.get(Storage.keys.bg, null), dim: Number(dimRange.value) };
  }
  function importData(data) {
    if (data && data.bg && data.bg.src) {
      if (data.bg.mode === 'video') showVideo(data.bg.src); else showImage(data.bg.src);
      saveMode(data.bg.mode, data.bg.src);
    } else {
      reset();
    }
    if (data && data.dim != null) {
      dimRange.value = data.dim;
      applyDim(); saveDim();
    }
  }

  return { load, exportData, importData };
})();
