import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const file = path.join(root, 'Living_Hospital_v0.4.0.b.html');
let html = fs.readFileSync(file, 'utf8');

const replacement = `  <div id="topLeft">
    <div id="healthRow">
      <div id="heartHud" aria-label="체력 하트 3개"></div>
      <div id="specialHud" aria-label="장기와 유물"><div id="organHud" aria-label="메인 장기"></div><div id="relicHud" aria-label="획득 유물"></div></div>
    </div>
    <div id="weaponHud" aria-label="획득 무기"><span class="weaponHudSlot primary"><span id="primaryWeaponValue">·</span></span><span class="weaponHudSwap">⇄</span><span class="weaponHudSlot secondary"><span id="secondaryWeaponValue">—</span></span></div>
    <div id="specimenHud" aria-label="이번 플레이에서 회수한 검체"><span class="specimenVial" aria-hidden="true"></span><span id="specimenCount">0</span></div>
    <span id="hpDebtFill" hidden></span><span id="hpFill" hidden></span><span id="xpFill" hidden></span>
  </div>
  <div id="topCenter"><div id="timer">00:00</div></div>
  <button id="pause" aria-label="일시정지">Ⅱ</button>
  <canvas id="minimap" width="124" height="88" aria-label="미니맵"></canvas>
  <div id="debug">`;

const pattern = /  <div id="topLeft">[\s\S]*?  <div id="debug">/;
if (!pattern.test(html)) throw new Error('복원할 HUD 범위를 찾지 못했습니다.');
html = html.replace(pattern, replacement);

for (const id of ['heartHud','organHud','relicHud','primaryWeaponValue','secondaryWeaponValue','specimenHud','specimenCount','hpDebtFill','hpFill','xpFill','timer','pause','minimap','debug','actionButton']) {
  const count = (html.match(new RegExp(`id="${id}"`, 'g')) || []).length;
  if (count !== 1) throw new Error(`${id} 요소 개수 이상: ${count}`);
}

fs.writeFileSync(file, html, 'utf8');
console.log('v0.4.0.b HUD loader restored and verified');
