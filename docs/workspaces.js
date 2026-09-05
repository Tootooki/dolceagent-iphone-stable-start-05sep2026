import {TABS, CONFIG, createWorkspaceState, selectWorkspace, setOption, viewFor} from './workspace-model.mjs?v=70';
import {MOCK_ACTIONS, setMockActionStatus} from './actions-model.mjs?v=70';
import {createActionsUI} from './actions-ui.mjs?v=70';
import {addAccountingActions,syncAccountingActionStatuses} from './accounting-actions.mjs?v=71';

const state = createWorkspaceState();
const backdrop = document.getElementById('menu-backdrop');
const dialog = backdrop.querySelector('.period-menu');
const menuBody = backdrop.querySelector('.period-menu-body');
const title = document.getElementById('period-menu-title');
const apply = document.getElementById('apply-view');
const sheet = document.getElementById('sheet');
const shell = sheet.closest('.workbook-shell');
const scrollPositions = new Map(), menuPositions = new Map();
let paintedWorkspace = 'accounting', nativePanel = null;
const node = (tag, className, text) => {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
};
const button = (text, handler, className = 'workspace-choice') => {
  const el = node('button', className, text); el.type = 'button'; el.addEventListener('click', handler); return el;
};
const menuApi = () => window.dolceMenu;

const rail = node('div', 'workspace-menu-rail'); rail.hidden = true;
const previous = button('‹', () => slide(-1), 'workspace-rail-arrow');
previous.setAttribute('aria-label', 'Scroll menu tabs left');
const next = button('›', () => slide(1), 'workspace-rail-arrow');
next.setAttribute('aria-label', 'Scroll menu tabs right');
const tabs = node('div', 'workspace-tabs');
tabs.setAttribute('role', 'tablist'); tabs.setAttribute('aria-label', 'Workspace menu');
tabs.setAttribute('aria-orientation', 'horizontal');
const tabButtons = TABS.map(label => {
  const id = label.toLowerCase();
  const el = button(label, () => chooseTab(id), 'workspace-tab');
  el.id = `workspace-tab-${id}`; el.dataset.workspaceTab = id;
  el.setAttribute('role', 'tab'); el.setAttribute('aria-controls', 'workspace-tab-panel');
  tabs.append(el); return el;
});
rail.append(previous, tabs, next); dialog.prepend(rail);
menuBody.id = 'workspace-tab-panel';
const rootControls = node('section', 'workspace-controls');
rootControls.dataset.menuSection = 'workspace'; rootControls.hidden = true; menuBody.append(rootControls);
const densityControls = node('section', 'workspace-density');
densityControls.dataset.menuSection = 'settings'; densityControls.hidden = true; menuBody.prepend(densityControls);

const workspace = node('section', 'module-workspace');
workspace.id = 'module-workspace'; workspace.hidden = true; workspace.tabIndex = -1;
workspace.setAttribute('aria-label', 'Selected workspace'); shell.insertBefore(workspace, backdrop);
document.body.classList.add('has-workspace-menu');
document.body.dataset.activeWorkspace = 'accounting';
sheet.tabIndex=-1;
const getAction=id=>{const action=MOCK_ACTIONS.find(item=>item.id===id);return action?{...action,status:state.actionStatuses[id]}:null;};
const actionUI=createActionsUI({
  getAction,
  onStatus:(id,status)=>{
    if(!setMockActionStatus(state,id,status))return false;
    const restore=!actionUI.dialog.open;
    if(state.active!=='accounting')paintWorkspace();
    syncAccountingActionStatuses(sheet,getAction);
    if(restore){const surface=state.active==='accounting'?sheet:workspace;
      (surface.querySelector(`.action-status[data-action-id="${id}"]`)||surface).focus({preventScroll:true});}
    return true;
  },returnTarget:()=>state.active==='accounting'?sheet:workspace,
});
document.addEventListener('dolce:sheet-render',event=>addAccountingActions(event.detail,actionUI,getAction));
if(window.dolceSheetView)addAccountingActions(window.dolceSheetView,actionUI,getAction);

function smooth() { return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'; }
function slide(direction) { tabs.scrollBy({left: direction * Math.max(120, tabs.clientWidth * 0.7), behavior: smooth()}); }
function revealTab(el) {
  // Move only the tab strip. Never pan the document or the sheet beneath it.
  const left = el.offsetLeft, right = left + el.offsetWidth;
  if (left < tabs.scrollLeft) tabs.scrollTo({left: Math.max(0, left - 8), behavior: smooth()});
  else if (right > tabs.scrollLeft + tabs.clientWidth) tabs.scrollTo({left: right - tabs.clientWidth + 8, behavior: smooth()});
}
function syncTabs({reveal = false} = {}) {
  tabButtons.forEach(el => {
    const selected = el.dataset.workspaceTab === state.tab;
    el.setAttribute('aria-selected', String(selected)); el.tabIndex = selected ? 0 : -1;
  });
  menuBody.setAttribute('aria-labelledby', `workspace-tab-${state.tab}`);
  if (reveal) requestAnimationFrame(() => {if (!backdrop.hidden) revealTab(tabButtons.find(el => el.dataset.workspaceTab === state.tab));});
}
function choices(label, values, selected, change) {
  const group = node('fieldset', 'workspace-choice-group'); group.append(node('legend', '', label));
  const list = node('div', 'workspace-choice-list');
  values.forEach(value => {
    const el = button(value.toUpperCase(), () => {
      change(value);
      list.querySelectorAll('button').forEach(item => item.setAttribute('aria-pressed', String(item === el)));
    });
    el.setAttribute('aria-pressed', String(value === selected)); list.append(el);
  });
  group.append(list); return group;
}
function paintDensity() {
  densityControls.replaceChildren(node('h3', '', 'WORKSPACE DISPLAY'), choices('Demo row spacing',
    ['compact', 'comfortable'], state.density, value => {
      state.density = value; workspace.dataset.density = value;
    }), node('p', 'workspace-note', 'The sheet controls below open and adjust Accounting.'));
}
function paintControls() {
  rootControls.replaceChildren();
  if (state.tab === 'accounting') {
    const label = id => document.getElementById(id)?.textContent || '';
    const shortcuts = node('div', 'workspace-accounting-links');
    for (const [name, panel, current] of [
      ['PRODUCTS', 'products', label('selected-category-label')], ['PERIOD', 'periods', label('selected-period-label')],
    ]) {
      const el = button('', () => menuApi()?.openPanel(panel, true), 'workspace-shortcut');
      el.append(node('b', '', name), node('span', '', current), node('span', 'workspace-shortcut-arrow', '→')); shortcuts.append(el);
    }
    const settings = button('SHEET SETTINGS →', () => chooseTab('settings'), 'workspace-shortcut'); shortcuts.append(settings);
    rootControls.append(shortcuts);
    return;
  }
  const config = CONFIG[state.tab]; if (!config) return;
  rootControls.append(node('p', 'workspace-note', 'DEMO CONTROLS · No real account changes.'));
  config.fields.forEach(field => rootControls.append(choices(field.label, field.choices, state.options[state.tab][field.key], value => {
    if (setOption(state, state.tab, field.key, value)) paintWorkspace();
  })));
}
function paintWorkspace() {
  const changed = paintedWorkspace !== state.active;
  if (changed) {
    const old = paintedWorkspace === 'accounting' ? sheet : workspace;
    scrollPositions.set(paintedWorkspace, {left: old.scrollLeft, top: old.scrollTop,
      tableLeft: old.querySelector('.module-table-scroll')?.scrollLeft || 0});
  }
  const accounting = state.active === 'accounting';
  sheet.hidden = !accounting; workspace.hidden = accounting;
  workspace.inert = !backdrop.hidden || accounting;
  document.body.dataset.activeWorkspace = state.active;
  workspace.dataset.density = state.density;
  if (!accounting) {
    const tableLeft = changed ? scrollPositions.get(state.active)?.tableLeft || 0
      : workspace.querySelector('.module-table-scroll')?.scrollLeft || 0;
    const data = viewFor(state);
    const heading = node('div', 'module-heading');
    const name = node('h1', '', data.title); name.id = 'module-workspace-title';
    heading.append(name, node('span', 'module-demo-badge', data.id==='actions'?'MOCK DATA':'DEMO'));
    workspace.setAttribute('aria-labelledby', name.id);
    const tableWrap = node('div', 'module-table-scroll');
    const table = node('table', 'module-table');
    if(data.id==='actions')table.classList.add('actions-table');
    table.append(node('caption', 'workspace-sr-only', `${data.title} — fictional sample data`));
    const head = node('thead'), headerRow = node('tr');
    data.headers.forEach(text => {const cell = node('th', '', text.toUpperCase()); cell.scope = 'col'; headerRow.append(cell);});
    head.append(headerRow); table.append(head);
    const body = node('tbody');
    data.rows.forEach((row,index) => {
      const tr=node('tr');
      row.forEach((value,column)=>{
        const cell=node('td');
        if(data.id==='actions'&&column===4)cell.append(actionUI.statusControl(data.actions[index]));
        else if(data.id==='actions'&&column===5)cell.append(actionUI.actionButton(data.actions[index]));
        else {cell.textContent=value;if(data.id==='actions'&&column===3)cell.className='action-todo';}
        tr.append(cell);
      });body.append(tr);
    });
    table.append(body); tableWrap.append(table);
    workspace.replaceChildren(heading, node('p', 'module-summary', data.summary), node('p', 'module-notice', data.notice), tableWrap);
    tableWrap.scrollLeft = tableLeft;
    if (!data.rows.length) workspace.append(node('p', 'module-empty', 'No demo items match these filters. Change your selection in MENU.'));
  }
  paintedWorkspace = state.active;
  if (changed) {
    const target = accounting ? sheet : workspace, position = scrollPositions.get(state.active) || {left: 0, top: 0};
    target.scrollTo({left: position.left, top: position.top, behavior: 'auto'});
  }
  window.dispatchEvent(new CustomEvent('dolce:workspace-change'));
}
function chooseTab(id, {focus = true} = {}) {
  if (!menuApi() || !TABS.includes(id.toUpperCase())) return;
  if (nativePanel === 'workspace' || nativePanel === 'settings') menuPositions.set(state.tab, menuBody.scrollTop);
  const previousWorkspace = state.active;
  selectWorkspace(state, id);
  if (state.active !== previousWorkspace) paintWorkspace();
  // Reset native nested-page state, but keep MENU as the original opener.
  menuApi().openPanel(id === 'settings' ? 'settings' : 'workspace', false);
  syncTabs({reveal: true});
  if (focus) tabButtons.find(el => el.dataset.workspaceTab === id).focus({preventScroll: true});
}

tabs.addEventListener('keydown', event => {
  const index = tabButtons.indexOf(event.target); if (index < 0) return;
  const nextIndex = event.key === 'ArrowRight' ? (index + 1) % tabButtons.length
    : event.key === 'ArrowLeft' ? (index - 1 + tabButtons.length) % tabButtons.length
    : event.key === 'Home' ? 0 : event.key === 'End' ? tabButtons.length - 1 : null;
  if (nextIndex === null) return;
  event.preventDefault(); chooseTab(tabButtons[nextIndex].dataset.workspaceTab);
});

document.addEventListener('dolce:menu-state', event => {
  const detail = event.detail; nativePanel = detail.panel || null;
  workspace.inert = detail.open || workspace.hidden;
  if (!detail.open) {
    menuPositions.set(state.tab, menuBody.scrollTop); rail.hidden = true;
    menuBody.removeAttribute('role'); return;
  }
  const login = detail.panel === 'login'; rail.hidden = login;
  if (login) {menuBody.removeAttribute('role'); menuBody.removeAttribute('aria-labelledby'); return;}
  if (detail.opener === 'mobile-settings' && detail.panel === 'settings') state.tab = 'settings';
  menuBody.setAttribute('role', 'tabpanel'); syncTabs({reveal: !detail.wasOpen});
  if (detail.panel === 'settings' && state.tab !== 'settings') {
    menuApi()?.openPanel('workspace', false); return;
  }
  if (['products', 'periods', 'column-order'].includes(detail.panel)) {
    if (!['accounting', 'settings'].includes(state.tab)) {
      selectWorkspace(state, 'accounting'); paintWorkspace(); syncTabs();
    }
    return;
  }
  if (detail.panel === 'workspace') {
    title.textContent = state.tab.toUpperCase(); paintControls();
    apply.textContent = `OPEN ${state.active.toUpperCase()}`;
  } else if (detail.panel === 'settings') {
    title.textContent = 'SETTINGS'; paintDensity(); apply.textContent = 'APPLY SETTINGS';
  }
  menuBody.scrollTop = menuPositions.get(state.tab) || 0;
});

// Native accounting controls still own all real sheet changes. Selecting one
// from Settings reveals Accounting, rather than changing a hidden sheet only.
backdrop.addEventListener('click', event => {
  if (event.target.closest('[data-category],[data-period],[data-layout],[data-label-type],[data-name-freeze],[data-header-mode],[data-zoom],#zoom-in,#zoom-out')) {
    state.active = 'accounting'; paintWorkspace();
  }
});
document.getElementById('header-home').addEventListener('click', () => {
  selectWorkspace(state, 'accounting'); scrollPositions.set('accounting', {left: 0, top: 0}); paintWorkspace();
  sheet.scrollTo({left: 0, top: 0, behavior: 'auto'}); syncTabs();
});
document.getElementById('mobile-view-toggle').addEventListener('click', () => {
  selectWorkspace(state, 'accounting'); paintWorkspace(); syncTabs();
});
let initialWorkspaceApplied=false;
function ready() {
  if(!initialWorkspaceApplied){
    initialWorkspaceApplied=true;
    if(new URLSearchParams(location.search).get('workspace')==='actions'){selectWorkspace(state,'actions');paintWorkspace();}
  }
  syncTabs();paintDensity();
}
document.addEventListener('dolce:menu-ready', ready, {once: true});
if (menuApi()) ready();
