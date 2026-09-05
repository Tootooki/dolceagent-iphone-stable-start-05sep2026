import {ACTION_STATUSES, ACTION_NOTICE} from './actions-model.mjs?v=70';

const el=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node;};
export function createActionsUI({getAction,onStatus,returnTarget}) {
  const dialog=el('dialog','action-detail');dialog.id='action-detail';dialog.setAttribute('aria-labelledby','action-detail-title');
  dialog.setAttribute('aria-describedby','action-detail-notice');dialog.setAttribute('aria-modal','true');
  const header=el('div','action-detail-header'),title=el('h2','','ACTION');title.id='action-detail-title';
  const close=el('button','action-detail-close','CLOSE');close.type='button';header.append(title,close);
  const content=el('div','action-detail-body');dialog.append(header,content);document.body.append(dialog);
  let opener=null;
  const finish=()=>{const target=opener?.isConnected?opener:returnTarget();target?.focus({preventScroll:true});opener=null;};
  const dismiss=()=>{if(typeof dialog.close==='function')dialog.close();else{dialog.removeAttribute('open');finish();}};
  close.addEventListener('click',dismiss);dialog.addEventListener('close',finish);
  dialog.addEventListener('cancel',event=>{event.preventDefault();dismiss();});
  dialog.addEventListener('keydown',event=>{
    if(event.key==='Escape'){event.preventDefault();dismiss();return;}
    if(event.key!=='Tab')return;
    const controls=[...dialog.querySelectorAll('button,select')].filter(node=>!node.disabled);
    const first=controls[0],last=controls.at(-1);
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  });
  function statusControl(action,location='row') {
    const select=el('select','action-status');select.dataset.actionId=action.id;
    select.setAttribute('aria-label',`Mock status for ${action.id} ${action.item} (${location})`);
    for(const value of ACTION_STATUSES){const option=el('option','',value);option.value=value;select.append(option);}
    select.value=action.status;
    select.addEventListener('change',()=>{
      if(!onStatus(action.id,select.value)){select.value=getAction(action.id).status;return;}
      dialog.querySelectorAll('.action-status').forEach(node=>{node.value=getAction(node.dataset.actionId).status;});
    });
    return select;
  }
  function open(action,button) {
    opener=button;title.textContent=`${action.id} · ${action.item}`;
    const notice=el('p','action-detail-notice',ACTION_NOTICE);notice.id='action-detail-notice';
    const type=el('p','action-detail-type',`${action.area.toUpperCase()} · ${action.kind.toUpperCase()} ONLY`);
    const todo=el('p','action-detail-todo',action.todo);
    const label=el('label','action-detail-status-label','STATUS ');label.append(statusControl(action,'details'));
    content.replaceChildren(notice,type,todo,label);
    if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');
    close.focus({preventScroll:true});
  }
  function actionButton(action) {
    const button=el('button','action-launch-button');button.type='button';button.dataset.actionId=action.id;
    button.title=`Open ${action.id} mock action`;
    button.setAttribute('aria-label',`Open mock action ${action.id} for ${action.item}`);
    button.setAttribute('aria-haspopup','dialog');
    button.setAttribute('aria-controls','action-detail');
    const mark=el('span','action-monogram');mark.setAttribute('aria-hidden','true');
    const image=el('img');image.src='dolce-agent-logo.png';image.alt='';image.width=1774;image.height=887;mark.append(image);button.append(mark);
    button.addEventListener('click',()=>open(getAction(action.id),button));return button;
  }
  return {statusControl,actionButton,dialog};
}
