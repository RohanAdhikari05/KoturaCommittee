const messages={
 MONTH_REQUIRED:['Open the payment month first.','पहले भुगतान का महीना शुरू करें।'],
 MONTH_EXISTS:['This month is already open. Choose a future unopened month for member or share changes.','यह महीना शुरू हो चुका है। सदस्य या अंशदान में बदलाव के लिए अगला बंद महीना चुनें।'],
 MONTH_SEQUENCE:['Open each month in order, without skipping a month.','हर महीना क्रम से शुरू करें। बीच का महीना न छोड़ें।'],
 INVALID_ALLOCATION:['Check the allocation. It cannot exceed unpaid shares, principal or interest.','राशि का बँटवारा जाँचें। यह बकाया अंशदान, मूलधन या ब्याज से अधिक नहीं हो सकता।'],
 INVALID_AMOUNT:['Enter a valid positive rupee amount with at most two decimal places.','सही रुपये की राशि भरें। दशमलव के बाद अधिकतम दो अंक रखें।'],
 DUPLICATE:['This record already exists or this payment was already saved.','यह रिकॉर्ड मौजूद है या यह भुगतान पहले ही सहेजा जा चुका है।'],
 CHRONOLOGY:['Enter transactions in date order. Later records already exist.','लेन-देन तारीख के क्रम में दर्ज करें। आगे की तारीख के रिकॉर्ड मौजूद हैं।'],
 CLOSED_HISTORY:['A later month is open. Historical records cannot be changed with this action.','अगला महीना शुरू है। इस प्रक्रिया से पुराने महीने का हिसाब नहीं बदल सकता।'],
 INSUFFICIENT_CASH:['Available cash is lower than this loan amount.','उपलब्ध नकद इस ऋण राशि से कम है।'],
 GUARANTEE_REQUIRED:['Loans above ₹1,00,000 require guarantee details and explicit administrator approval.','₹१,००,००० से अधिक के ऋण के लिए गारंटी का विवरण और संचालक की स्पष्ट मंज़ूरी चाहिए।'],
 EXISTING_LOAN:['This member already has a loan account.','इस सदस्य का ऋण खाता पहले से है।'],
 OPENING_EXISTS:['Opening cash must be recorded before any other financial transaction.','शुरुआती नकद किसी भी दूसरे वित्तीय लेन-देन से पहले दर्ज करें।'],
 INVALID_INPUT:['Check all fields, the unique member ID, and the password length.','सारी जानकारी, सदस्य की अनोखी पहचान संख्या और पासवर्ड की लंबाई जाँचें।'],
 INVALID_DATE:['Enter a valid date.','सही तारीख दर्ज करें।'],
 LOGIN_REQUIRED:['Please sign in to continue.','आगे बढ़ने के लिए प्रवेश करें।']};
export function errorMessage(code,lang,fallback){return messages[code]?.[lang==='hi'?1:0]||fallback;}
