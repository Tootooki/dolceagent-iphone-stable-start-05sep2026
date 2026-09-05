import {ACTION_NOTICE} from './actions-model.mjs?v=70';

// Match the unmodified source SKU, never a filtered row index or display label.
export const ACTION_SKUS=Object.freeze({
  'Pistachio-Butter-200g-New2':'MOCK-01',
  'Cone-DubaiMint-6pack-450g':'MOCK-02',
  'Pistachio-Cream-200g-New2':'MOCK-03',
  'Choco-Blueberry-100g-Packof2-Fbm':'MOCK-04',
  'Dried-Kadayif-400gm':'MOCK-05',
  'Roasted-Kadayif-5KG':'MOCK-06',
  'Cone-StrawCookie-6pack-450g':'MOCK-07',
  'Choco-Milk-200g':'MOCK-08',
  'Pistachio-Sauce-700g-New2':'MOCK-09',
  'Dried-Kadayif-180gm':'MOCK-10',
});
export const ACCOUNTING_ACTION_HEADERS=Object.freeze(['TODO · MOCK DATA','STATUS','ACTION']);

export function addAccountingActions({grid,rows,desktop},ui,getAction){
  if(grid.dataset.actionColumns==='true')return;
  const count=Number(grid.getAttribute('aria-colcount'));
  const original=[...grid.querySelectorAll(':scope > .sheet-cell')];
  if(!count||original.length!==rows.length*count)return;
  const backing=[...grid.querySelectorAll(':scope > :not(.sheet-cell)')];
  const fontSize=desktop&&grid.classList.contains('compact-headers')?12:9;
  const canvas=document.createElement('canvas'),measure=canvas.getContext('2d');
  measure.font=`700 ${fontSize}px Arial`;
  const width=text=>Math.ceil(measure.measureText(text).width+12);
  const notice='MOCK DATA · NOT REAL FINDINGS OR COMPLETED ACTIONS';
  const actions=rows.map(row=>!row.isHeader&&!row.isTotal?getAction(ACTION_SKUS[row.sku]):null);
  const widths=[Math.max(width(ACCOUNTING_ACTION_HEADERS[0]),width(notice),...actions.filter(Boolean).map(action=>width(action.todo))),
    Math.max(66,width('STATUS')+20),Math.max(42,width('ACTION'))];
  grid.style.gridTemplateColumns+=' '+widths.map(value=>`calc(${value}px * var(--sheet-scale))`).join(' ');
  grid.dataset.baseWidth=String(Number(grid.dataset.baseWidth)+widths.reduce((a,b)=>a+b,0));
  grid.setAttribute('aria-colcount',String(count+3));grid.dataset.actionColumns='true';
  grid.style.setProperty('--action-font-size',`${fontSize}px`);
  rows.forEach((row,rowIndex)=>{
    const rowCells=original.slice(rowIndex*count,(rowIndex+1)*count),action=actions[rowIndex];
    const fragment=document.createDocumentFragment();
    ACCOUNTING_ACTION_HEADERS.forEach((heading,offset)=>{
      const cell=document.createElement('div'),dark=row.isHeader||row.isTotal;
      cell.className='sheet-cell sheet-action-cell'+(row.isHeader?' header-cell':row.isTotal?' total-cell':'')+(dark?' black-sheet-cell':'');
      cell.dataset.actionColumn=['todo','status','action'][offset];
      cell.setAttribute('role',row.isHeader?'columnheader':'cell');cell.setAttribute('aria-colindex',String(count+offset+1));
      Object.assign(cell.style,{gridRow:String(rowIndex+1),gridColumn:String(count+offset+1),
        width:`calc(${widths[offset]}px * var(--sheet-scale))`,height:rowCells[0].style.height,
        backgroundColor:dark?'#000000':'#ffffff',color:dark?'#ffffff':'#000000'});
      if(row.isHeader){cell.textContent=heading;cell.title=ACTION_NOTICE;}
      else if(row.isTotal&&offset===0){cell.textContent=notice;cell.title=ACTION_NOTICE;}
      else if(action){
        cell.dataset.actionId=action.id;
        if(offset===0){cell.textContent=action.todo;cell.title=ACTION_NOTICE+'\n'+action.todo;}
        else if(offset===1)cell.append(ui.statusControl(action,'accounting'));
        else cell.append(ui.actionButton(action));
      }
      fragment.append(cell);
    });
    // Insert only the new cells; keep thousands of report cells in place.
    grid.insertBefore(fragment,original[(rowIndex+1)*count]||backing[0]||null);
  });
}

export function syncAccountingActionStatuses(mount,getAction){
  mount.querySelectorAll('.action-status').forEach(control=>{
    const action=getAction(control.dataset.actionId);if(action)control.value=action.status;
  });
}
