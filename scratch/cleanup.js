const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const enPath = path.join(rootDir, 'src/app/shared/i18n/en.json');
const arPath = path.join(rootDir, 'src/app/shared/i18n/ar.json');
const unusedPath = path.join(rootDir, 'scratch/unused_keys3.json');

if (!fs.existsSync(unusedPath)) {
  console.error('unused_keys3.json not found. Run analyze3.js first.');
  process.exit(1);
}

const unusedKeys = JSON.parse(fs.readFileSync(unusedPath, 'utf8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));

const newEnKeys = {
  "AI.CHATBOT.ONLINE": "Online",
  "AI.CHATBOT.WELCOME_TITLE": "Hi! I'm FurniMind AI",
  "AI.CHATBOT.WELCOME_TEXT": "Your personal furniture assistant. Ask me anything about our products, styles, or design recommendations.",
  "AI.CHATBOT.HINT": "Type a message or use the mic to send a voice note",
  "AI.CHATBOT.VOICE_MESSAGE": "Voice message",
  "AI.CHATBOT.CANCEL": "Cancel",
  "AI.CHATBOT.SEND": "Send",
  "AI.CHATBOT.MIC_ERROR": "Microphone access denied or not available.",
  "AI.CHATBOT.PLACEHOLDER": "Ask about furniture, styles...",
  "AI.DESIGN_SUMMARY.TITLE": "Design Summary",
  "AI.DESIGN_SUMMARY.SUBTITLE": "Review your AI-generated interior space",
  "AI.DESIGN_SUMMARY.FINALIZED": "Finalized",
  "AI.DESIGN_SUMMARY.TOTAL_ESTIMATE": "Total Estimate",
  "AI.DESIGN_SUMMARY.ITEMS_SELECTED": "items selected",
  "AI.DESIGN_SUMMARY.FURNITURE_LIST": "Selected Furniture List",
  "AI.DESIGN_SUMMARY.CONTINUE_EDITING": "Continue Editing",
  "AI.DESIGN_SUMMARY.CREATE_ORDER": "Create Order",
  "AI.PRODUCT_SIDEBAR.TITLE": "Selected Product",
  "AI.PRODUCT_SIDEBAR.IN_STOCK": "In Stock",
  "AI.PRODUCT_SIDEBAR.SPECIFICATIONS": "Specifications",
  "AI.PRODUCT_SIDEBAR.MATERIAL": "Material",
  "AI.PRODUCT_SIDEBAR.WOOD_TYPE": "Wood Type",
  "AI.PRODUCT_SIDEBAR.COLOR": "Color",
  "AI.PRODUCT_SIDEBAR.DIMENSIONS": "Dimensions",
  "AI.PRODUCT_SIDEBAR.CUSTOMIZATION": "Customization",
  "AI.PRODUCT_SIDEBAR.CHANGE_WOOD_TYPE": "Change Wood Type",
  "AI.PRODUCT_SIDEBAR.CHANGE_COLOR": "Change Color",
  "AI.PRODUCT_SIDEBAR.CHANGE_MATERIAL": "Change Material",
  "AI.PRODUCT_SIDEBAR.ADD_TO_CART": "Add To Cart",
  "AI.PRODUCT_SIDEBAR.REPLACE": "Replace",
  "AI.PRODUCT_SIDEBAR.EDIT": "Edit",
  "AI.INSPIRATION.TITLE": "Inspiration Analysis",
  "AI.INSPIRATION.ANALYSIS_COMPLETE": "AI Analysis Complete",
  "AI.INSPIRATION.DETECTED_SPECS": "Detected Specifications",
  "AI.INSPIRATION.FURNITURE_TYPE": "Furniture Type",
  "AI.INSPIRATION.STYLE": "Style",
  "AI.INSPIRATION.MATERIAL": "Material",
  "AI.INSPIRATION.WOOD_TYPE": "Wood Type",
  "AI.INSPIRATION.COLOR": "Color",
  "AI.INSPIRATION.DIMENSIONS_EST": "Dimensions (Est.)",
  "AI.INSPIRATION.HOW_PROCEED": "How would you like to proceed?",
  "AI.INSPIRATION.HOW_PROCEED_SUBTITLE": "Our AI has extracted the design language from your image. Choose an option to continue.",
  "AI.INSPIRATION.CREATE_EXACT_ORDER": "Create Exact Order",
  "AI.INSPIRATION.CREATE_EXACT_ORDER_DESC": "Create a custom-made piece using the exact design, materials, and specification detected from your image.",
  "AI.INSPIRATION.FIND_SIMILAR": "Find Similar Products",
  "AI.INSPIRATION.FIND_SIMILAR_DESC": "Search our marketplace for existing items that closely match the style, color, and materials of your image.",
  "AI.INSPIRATION.RECOMMENDED_ALTERNATIVES": "Recommended Alternatives",
  "AI.INSPIRATION.MATCH": "Match",
  "MINI_CART_QTY": "Qty",
  "VENDOR.ORDER_DETAILS.ALL_ORDERS": "All Orders",
  "VENDOR.ORDER_DETAILS.PLACED_ON": "Placed on",
  "VENDOR.ORDER_DETAILS.PRINT": "Print",
  "VENDOR.ORDER_DETAILS.START_PROCESSING": "Start Processing",
  "VENDOR.ORDER_DETAILS.MARK_SHIPPED": "Mark as Shipped",
  "VENDOR.ORDER_DETAILS.MARK_DELIVERED": "Mark as Delivered",
  "VENDOR.ORDER_DETAILS.CANCEL_ORDER": "Cancel Order",
  "VENDOR.ORDER_DETAILS.ORDER_FINALIZED": "Order is finalized",
  "VENDOR.ORDER_DETAILS.OR_UPDATE_MANUALLY": "or update manually",
  "VENDOR.ORDER_DETAILS.ITEM": "item",
  "VENDOR.ORDER_DETAILS.ITEMS": "items",
  "VENDOR.ORDER_DETAILS.CARRIER": "Carrier",
  "VENDOR.ORDER_DETAILS.STATUS_UPDATED_TO": "Status updated to",
  "VENDOR.ORDER_DETAILS.STATUS_TRANSITIONED_FROM": "Status transitioned from",
  "VENDOR.ORDER_DETAILS.ORDER_CREATED_FULFILLMENT": "Order created and queued for fulfillment",
  "VENDOR.ORDER_DETAILS.CUSTOMER_DELIVERY": "Customer & Delivery",
  "VENDOR.ORDER_DETAILS.CONTACT": "Contact",
  "VENDOR.ORDER_DETAILS.PROPOSED_DELIVERY_DATE": "Proposed Delivery Date",
  "VENDOR.ORDER_DETAILS.CUSTOMER_NOTES": "Customer Notes",
  "VENDOR.ORDER_DETAILS.FULFILLMENT": "Fulfillment",
  "VENDOR.ORDER_DETAILS.PROPOSE_DATE_VALIDATION_ERROR": "You can select a date starting from today and any future date."
};

const newArKeys = {
  "AI.CHATBOT.ONLINE": "متصل",
  "AI.CHATBOT.WELCOME_TITLE": "مرحباً! أنا فورني مايند الذكي",
  "AI.CHATBOT.WELCOME_TEXT": "مساعدك الشخصي للأثاث. اسألني أي شيء عن منتجاتنا أو الأساليب أو توصيات التصميم.",
  "AI.CHATBOT.HINT": "اكتب رسالة أو استخدم الميكروفون لإرسال رسالة صوتية",
  "AI.CHATBOT.VOICE_MESSAGE": "رسالة صوتية",
  "AI.CHATBOT.CANCEL": "إلغاء",
  "AI.CHATBOT.SEND": "إرسال",
  "AI.CHATBOT.MIC_ERROR": "تعذر الوصول إلى الميكروفون أو غير متاح.",
  "AI.CHATBOT.PLACEHOLDER": "اسأل عن الأثاث، الأساليب...",
  "AI.DESIGN_SUMMARY.TITLE": "ملخص التصميم",
  "AI.DESIGN_SUMMARY.SUBTITLE": "استعرض مساحتك الداخلية المولدة بالذكاء الاصطناعي",
  "AI.DESIGN_SUMMARY.FINALIZED": "مكتمل",
  "AI.DESIGN_SUMMARY.TOTAL_ESTIMATE": "إجمالي التقدير",
  "AI.DESIGN_SUMMARY.ITEMS_SELECTED": "عناصر محددة",
  "AI.DESIGN_SUMMARY.FURNITURE_LIST": "قائمة الأثاث المحدد",
  "AI.DESIGN_SUMMARY.CONTINUE_EDITING": "متابعة التعديل",
  "AI.DESIGN_SUMMARY.CREATE_ORDER": "إنشاء طلب",
  "AI.PRODUCT_SIDEBAR.TITLE": "المنتج المحدد",
  "AI.PRODUCT_SIDEBAR.IN_STOCK": "متوفر في المخزن",
  "AI.PRODUCT_SIDEBAR.SPECIFICATIONS": "المواصفات",
  "AI.PRODUCT_SIDEBAR.MATERIAL": "المادة",
  "AI.PRODUCT_SIDEBAR.WOOD_TYPE": "نوع الخشب",
  "AI.PRODUCT_SIDEBAR.COLOR": "اللون",
  "AI.PRODUCT_SIDEBAR.DIMENSIONS": "الأبعاد",
  "AI.PRODUCT_SIDEBAR.CUSTOMIZATION": "التخصيص",
  "AI.PRODUCT_SIDEBAR.CHANGE_WOOD_TYPE": "تغيير نوع الخشب",
  "AI.PRODUCT_SIDEBAR.CHANGE_COLOR": "تغيير اللون",
  "AI.PRODUCT_SIDEBAR.CHANGE_MATERIAL": "تغيير المادة",
  "AI.PRODUCT_SIDEBAR.ADD_TO_CART": "أضف إلى السلة",
  "AI.PRODUCT_SIDEBAR.REPLACE": "استبدال",
  "AI.PRODUCT_SIDEBAR.EDIT": "تعديل",
  "AI.INSPIRATION.TITLE": "تحليل الإلهام",
  "AI.INSPIRATION.ANALYSIS_COMPLETE": "اكتمل تحليل الذكاء الاصطناعي",
  "AI.INSPIRATION.DETECTED_SPECS": "المواصفات المكتشفة",
  "AI.INSPIRATION.FURNITURE_TYPE": "نوع الأثاث",
  "AI.INSPIRATION.STYLE": "الأسلوب",
  "AI.INSPIRATION.MATERIAL": "المادة",
  "AI.INSPIRATION.WOOD_TYPE": "نوع الخشب",
  "AI.INSPIRATION.COLOR": "اللون",
  "AI.INSPIRATION.DIMENSIONS_EST": "الأبعاد (تقديري)",
  "AI.INSPIRATION.HOW_PROCEED": "كيف تريد المتابعة؟",
  "AI.INSPIRATION.HOW_PROCEED_SUBTITLE": "استخرج ذكاؤنا الاصطناعي لغة التصميم من صورتك. اختر خياراً للمتابعة.",
  "AI.INSPIRATION.CREATE_EXACT_ORDER": "إنشاء طلب مطابق",
  "AI.INSPIRATION.CREATE_EXACT_ORDER_DESC": "أنشئ قطعة مخصصة باستخدام التصميم والمواد والمواصفات المكتشفة من صورتك.",
  "AI.INSPIRATION.FIND_SIMILAR": "البحث عن منتجات مشابهة",
  "AI.INSPIRATION.FIND_SIMILAR_DESC": "ابحث في متجرنا عن عناصر موجودة تتطابق مع أسلوب صورتك ولونها ومواد تصنيعها.",
  "AI.INSPIRATION.RECOMMENDED_ALTERNATIVES": "البدائل الموصى بها",
  "AI.INSPIRATION.MATCH": "تطابق",
  "MINI_CART_QTY": "الكمية",
  "VENDOR.ORDER_DETAILS.ALL_ORDERS": "جميع الطلبات",
  "VENDOR.ORDER_DETAILS.PLACED_ON": "تم الطلب في",
  "VENDOR.ORDER_DETAILS.PRINT": "طباعة",
  "VENDOR.ORDER_DETAILS.START_PROCESSING": "بدء المعالجة",
  "VENDOR.ORDER_DETAILS.MARK_SHIPPED": "تحديد كمشحون",
  "VENDOR.ORDER_DETAILS.MARK_DELIVERED": "تحديد كمستلم",
  "VENDOR.ORDER_DETAILS.CANCEL_ORDER": "إلغاء الطلب",
  "VENDOR.ORDER_DETAILS.ORDER_FINALIZED": "تم اكتمال الطلب",
  "VENDOR.ORDER_DETAILS.OR_UPDATE_MANUALLY": "أو التحديث يدوياً",
  "VENDOR.ORDER_DETAILS.ITEM": "عنصر",
  "VENDOR.ORDER_DETAILS.ITEMS": "عناصر",
  "VENDOR.ORDER_DETAILS.CARRIER": "شركة الشحن",
  "VENDOR.ORDER_DETAILS.STATUS_UPDATED_TO": "تم تحديث الحالة إلى",
  "VENDOR.ORDER_DETAILS.STATUS_TRANSITIONED_FROM": "تغيرت الحالة من",
  "VENDOR.ORDER_DETAILS.ORDER_CREATED_FULFILLMENT": "تم إنشاء الطلب ووضعه في قائمة التنفيذ",
  "VENDOR.ORDER_DETAILS.CUSTOMER_DELIVERY": "العميل والتسليم",
  "VENDOR.ORDER_DETAILS.CONTACT": "الاتصال",
  "VENDOR.ORDER_DETAILS.PROPOSED_DELIVERY_DATE": "تاريخ التوصيل المقترح",
  "VENDOR.ORDER_DETAILS.CUSTOMER_NOTES": "ملاحظات العميل",
  "VENDOR.ORDER_DETAILS.FULFILLMENT": "تنفيذ الطلب",
  "VENDOR.ORDER_DETAILS.PROPOSE_DATE_VALIDATION_ERROR": "يمكنك تحديد تاريخ يبدأ من اليوم أو أي تاريخ في المستقبل."
};

// 1. Inject the new keys
Object.assign(en, newEnKeys);
Object.assign(ar, newArKeys);

// Delete nested or flat keys using dot notation
function deleteNestedKey(obj, keyPath) {
  // Try direct flat key deletion
  if (keyPath in obj) {
    delete obj[keyPath];
    return true;
  }
  // Try nested walk deletion
  const parts = keyPath.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!current || typeof current !== 'object') return false;
    current = current[parts[i]];
  }
  const lastKey = parts[parts.length - 1];
  if (current && typeof current === 'object' && lastKey in current) {
    delete current[lastKey];
    return true;
  }
  return false;
}

// Clean up empty parent structures recursively
function cleanEmptyObjects(obj) {
  let changed = false;
  for (const key in obj) {
    if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
      cleanEmptyObjects(obj[key]);
      if (Object.keys(obj[key]).length === 0) {
        delete obj[key];
        changed = true;
      }
    }
  }
  return changed;
}

let enDeletedCount = 0;
let arDeletedCount = 0;

unusedKeys.forEach(key => {
  if (deleteNestedKey(en, key)) enDeletedCount++;
  if (deleteNestedKey(ar, key)) arDeletedCount++;
});

// Run empty object clean up a few times
for (let i = 0; i < 3; i++) {
  cleanEmptyObjects(en);
  cleanEmptyObjects(ar);
}

// Helper to sort keys alphabetically but keep nested object structures neat
function sortObject(obj) {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    return obj;
  }
  const sorted = {};
  Object.keys(obj).sort().forEach(key => {
    sorted[key] = sortObject(obj[key]);
  });
  return sorted;
}

fs.writeFileSync(enPath, JSON.stringify(sortObject(en), null, 2), 'utf8');
fs.writeFileSync(arPath, JSON.stringify(sortObject(ar), null, 2), 'utf8');

console.log(`Cleaned up!`);
console.log(`Deleted from en.json: ${enDeletedCount} keys`);
console.log(`Deleted from ar.json: ${arDeletedCount} keys`);
