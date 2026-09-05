// Entirely fictional UI examples. Never imported from an account or the report.
export const ACTION_BRAND = 'DOLCE AGENT';
export const ACTION_STATUSES = Object.freeze(['LIVE', 'NEW', 'DONE']);
export const ACTION_NOTICE = 'MOCK DATA · Fictional examples, not real findings or completed actions. Status changes are simulated and reset on refresh; nothing is executed.';
export const MOCK_ACTIONS = Object.freeze([
  {id:'MOCK-01',area:'PPC',kind:'Change',item:'BUTTER200',todo:'Lower the “pistachio butter” exact-match target bid in the BUTTER200 Exact campaign from $1.10 to $0.90 because it generated $40 in spend and $100 in attributed sales at 40% ACoS against a 30% ceiling during 19 August–1 September 2026.'},
  {id:'MOCK-02',area:'PPC',kind:'Change',item:'MINTDUB6',todo:'Increase the MINTDUB6 Exact campaign daily budget from $15 to $20 because it exhausted its budget on 8 of 14 days while achieving 20% ACoS against a 30% ceiling during 19 August–1 September 2026.'},
  {id:'MOCK-03',area:'SEO',kind:'Change',item:'CREAM200',todo:'Update the CREAM200 title from “Pistachio Cream 200g” to “Pistachio Cream Spread 200g” because the relevant query “pistachio spread” generated 500 impressions and 15 clicks at a 3% click-through rate during 19 August–1 September 2026.'},
  {id:'MOCK-04',area:'SEO',kind:'Change',item:'BLUE2',todo:'Change the BLUE2 first bullet from “Blueberry chocolate bars” to “Pack of 2 blueberry chocolate bars” because 9 of 30 customer questions asked how many bars were included during 3 August–1 September 2026.'},
  {id:'MOCK-05',area:'Pricing',kind:'Change',item:'DRIED400',todo:'Reduce the DRIED400 selling price from $12.99 to $11.99 because the lower price achieved 9% conversion and $2.60 contribution per unit versus 5% conversion at the current price in the price test during 19 August–1 September 2026.'},
  {id:'MOCK-06',area:'Stock',kind:'Change',item:'ROAST5KG',todo:'Increase the planned ROAST5KG warehouse transfer from 0 to 24 cases because the 1 September 2026 stock count showed 12 cases available, covering only 4 days at the average sales rate of 3 cases per day during 19 August–1 September 2026.'},
  {id:'MOCK-07',area:'Stock',kind:'Check',item:'STRAC6',todo:'Check the STRAC6 inventory discrepancy without changing stock records because the system recorded 48 units and the physical count recorded 60 units, leaving a 12-unit difference in the 1 September 2026 inventory audit.'},
  {id:'MOCK-08',area:'Reimbursement',kind:'Check',item:'MILK200',todo:'Check reimbursement eligibility for 12 damaged MILK200 units without submitting a claim because the inbound report recorded 120 units received, 108 sellable units and 12 damaged units with no reimbursement during 19 August–1 September 2026.'},
  {id:'MOCK-09',area:'Pricing',kind:'Approval',item:'SAUCE700',todo:'Approve the proposed SAUCE700 selling price increase from $9.99 to $10.49 without applying it because the product sold 200 units at $2.00 contribution per unit against a $2.50 target during 19 August–1 September 2026.'},
  {id:'MOCK-10',area:'Reimbursement',kind:'Approval',item:'DRIED180',todo:'Approve submission of a $96 reimbursement claim for 12 missing DRIED180 units valued at $8 each without submitting it because shipment records showed 120 units delivered and 108 units checked in during 19 August–1 September 2026.'},
].map(action=>Object.freeze({...action,mock:true})));

export const createActionStatuses = () => Object.fromEntries(MOCK_ACTIONS.map(action=>[action.id,'NEW']));
export function setMockActionStatus(state,id,status) {
  if(!MOCK_ACTIONS.some(action=>action.id===id)||!ACTION_STATUSES.includes(status))return false;
  state.actionStatuses[id]=status;return true;
}
export function mockActionsFor(state) {
  const options=state.options.actions;
  return MOCK_ACTIONS.map(action=>({...action,status:state.actionStatuses[action.id]}))
    .filter(action=>(options.area==='All'||action.area===options.area)&&(options.status==='All'||action.status===options.status));
}
