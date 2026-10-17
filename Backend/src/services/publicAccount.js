// A deliberately limited view: never expose administrator notes, authentication,
// guarantors, audit details, or internal loan/member documents on public routes.
export function publicAccount(account) {
 const fields=['name','code','share','currentDue','paid','arrears','principal','interest','previousInterest','currentInterest','interestPaid'];
 return {...Object.fromEntries(fields.map(key=>[key,account[key]])),entries:account.entries.map(e=>({date:e.date,type:e.type,contribution:e.contribution,principal:e.principal,interest:e.interest,cash:e.cash}))};
}
