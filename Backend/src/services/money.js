export function money(value){const s=String(value);if(!/^\d+(\.\d{1,2})?$/.test(s))throw Error('INVALID_AMOUNT');const [a,b='']=s.split('.');const n=Number(a)*100+Number(b.padEnd(2,'0'));if(!Number.isSafeInteger(n)||n>10000000000)throw Error('INVALID_AMOUNT');return n;}
export function interest(principal,bps){return Number((BigInt(principal)*BigInt(bps)+5000n)/10000n);}
export function allocate(principal,owedInterest,p,i){if(p<0||i<0||p>principal||i>owedInterest)throw Error('INVALID_ALLOCATION');return {principal:principal-p,interest:owedInterest-i};}
