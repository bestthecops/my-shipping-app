/*
================================================================================
| Shopify Carrier Service Backend                                            |
|------------------------------------------------------------------------------|
| นี่คือตัวอย่างโค้dสำหรับเซิร์ฟเวอร์หลังบ้าน (Backend) ที่จะทำงานร่วมกับ Shopify |
| เพื่อคำนวณค่าจัดส่งแบบ Real-time ในหน้า Checkout                             |
|                                                                              |
| ภาษาที่ใช้: JavaScript (Node.js)                                              |
| Framework: Express.js (เป็นที่นิยมและง่ายต่อการใช้งาน)                        |
================================================================================
*/

// --- 1. Import Libraries ---
// Express คือ library หลักที่เราใช้สร้างเซิร์ฟเวอร์
const express = require('express');
const bodyParser = require('body-parser');

// --- 2. Initialize Express App ---
const app = express();
const PORT = process.env.PORT || 3000; // กำหนด Port ที่จะรันเซิร์ฟเวอร์

// Middleware สำหรับให้ Express อ่านข้อมูล JSON ที่ Shopify ส่งมาได้
app.use(bodyParser.json());

// --- 3. Shipping Rates Database ---
// นำข้อมูลค่าส่งทั้งหมดที่เราเตรียมไว้มาใส่ในนี้
// ในอนาคตสามารถย้ายข้อมูลส่วนนี้ไปเก็บในฐานข้อมูลจริงๆ ได้
const shippingRates = {
    // Samut Prakan (Based on distance from Mega Bangna)
    '10540': { district: 'อ.บางพลี (เมกาบางนา)', grabexpress: 45, keywords: ['เมกาบางนา', 'mega bangna', 'อิเกีย', 'ikea', 'บางพลีใหญ่', 'บางแก้ว'] },
    '10541': { district: 'อ.บางพลี (สุวรรณภูมิ)', grabexpress: 185, keywords: ['สนามบินสุวรรณภูมิ', 'suvarnabhumi airport', 'ราชาเทวะ', 'หนองปรือ'] }, // Custom entry for Airport
    '10270': { district: 'อ.เมืองสมุทรปราการ (ปากน้ำ)', grabexpress: 120, keywords: ['ปากน้ำ', 'ฟาร์มจระเข้', 'โรบินสันสมุทรปราการ', 'ท้ายบ้าน', 'บางปู', 'สายลวด'] },
    '10280': { district: 'อ.เมืองสมุทรปราการ (สำโรง)', grabexpress: 95, keywords: ['สำโรง', 'อิมพีเรียลสำโรง', 'samrong', 'เทพารักษ์', 'สำโรงเหนือ', 'ปู่เจ้าสมิงพราย'] },
    '10130': { district: 'อ.พระประแดง', grabexpress: 155, keywords: ['ตลาดพระประแดง', 'บางกระเจ้า', 'บางพึ่ง', 'บางกะสอบ', 'บางยอ', 'สุขสวัสดิ์'] },
    '10290': { district: 'อ.พระสมุทรเจดีย์', grabexpress: 245, keywords: ['ในคลองบางปลากด', 'แหลมฟ้าผ่า', 'ป้อมพระจุล'] },
    '10560': { district: 'อ.บางบ่อ', grabexpress: 200, keywords: ['เอแบคบางนา', 'abac', 'บางบ่อ'] },
    '10550': { district: 'อ.บางบ่อ (คลองด่าน)', grabexpress: 280, keywords: ['คลองด่าน'] },
    '10570': { district: 'อ.บางเสาธง', grabexpress: 160, keywords: ['บางเสาธง', 'ศีรษะจรเข้ใหญ่', 'เคหะบางพลี'] },

    // Bangkok (Based on distance from Mega Bangna)
    '10260': { district: 'เขตบางนา', grabexpress: 80, keywords: ['ไบเทค', 'เซ็นทรัลบางนา', 'bangna', 'bitec', 'อุดมสุข', 'ลาซาล', 'แบริ่ง'] },
    '10250': { district: 'เขตประเวศ', grabexpress: 90, keywords: ['อ่อนนุช', 'onnut', 'ซีคอนสแควร์', 'พาราไดซ์พาร์ค', 'สวนหลวง ร.9', 'หนองบอน', 'ศรีนครินทร์', 'รพ.วิภาราม', 'รพ.สมิติเวช ศรีนครินทร์'] },
    '10110': { district: 'เขตคลองเตย / วัฒนา', grabexpress: 175, keywords: ['ทองหล่อ', 'เอกมัย', 'thonglo', 'ekamai', 'เอ็มควอเทียร์', 'เอ็มโพเรียม', 'เทอร์มินอล 21', 'อโศก', 'พร้อมพงษ์', 'นานา', 'asoke', 'nana', 'emporium', 'emquartier', 'terminal 21', 'สุขุมวิท', 'พระโขนง', 'รพ.บำรุงราษฎร์', 'รพ.สมิติเวช สุขุมวิท'] },
    '10330': { district: 'เขตปทุมวัน', grabexpress: 215, keywords: ['สยาม', 'พารากอน', 'มาบุญครอง', 'mbk', 'siam', 'paragon', 'centralworld', 'ctw', 'เซ็นทรัลเวิลด์', 'จุฬา', 'ราชประสงค์', 'เพลินจิต', 'ชิดลม', 'ประตูน้ำ', 'สามย่าน', 'รองเมือง', 'วังใหม่'] },
    '10400': { district: 'เขตดินแดง/พญาไท', grabexpress: 240, keywords: ['อนุสาวรีย์ชัย', 'อารีย์', 'ari', 'รัชดา', 'ฟอร์จูน', 'เซ็นทรัลพระราม 9', 'central rama 9', 'ตลาดหลักทรัพย์', 'เอสพลานาด', 'ศูนย์วัฒนธรรม', 'สามเสนใน', 'รพ.รามาธิบดี', 'รพ.เปาโล พหลโยธิน'] },
    '10900': { district: 'เขตจตุจักร', grabexpress: 260, keywords: ['ตลาดนัดจตุจักร', 'jj market', 'เซ็นทรัลลาดพร้าว', 'ยูเนี่ยนมอลล์', 'สวนรถไฟ', 'แดนเนรมิต', 'หมอชิต', 'วิภาวดี', 'เกษตร', 'ลาดยาว', 'เสนานิคม', 'บางเขน'] },
    '10210': { district: 'เขตดอนเมือง/หลักสี่', grabexpress: 345, keywords: ['สนามบินดอนเมือง', 'don mueang airport', 'อิมแพ็ค', 'เมืองทองธานี', 'impact', 'หลักสี่', 'ศูนย์ราชการ'] },
    '10800': { district: 'เขตบางซื่อ', grabexpress: 285, keywords: ['สถานีกลางบางซื่อ', 'เตาปูน', 'เกตเวย์บางซื่อ', 'วงศ์สว่าง', 'รพ.เกษมราษฎร์ ประชาชื่น'] },
    '10530': { district: 'เขตหนองจอก', grabexpress: 350, keywords: [] },
    '10100': { district: 'เขตป้อมปราบศัตรูพ่าย', grabexpress: 230, keywords: ['เยาวราช', 'ภูเขาทอง', 'yaowarat', 'คลองถม', 'เสือป่า', 'วัดโสมนัส', 'หลานหลวง'] },
    '10120': { district: 'เขตยานนาวา/สาทร', grabexpress: 185, keywords: ['สาทร', 'ช่องนนทรี', 'sathorn', 'เอเชียทีค', 'asiatique', 'เซ็นทรัลพระราม 3', 'ถนนจันทน์', 'บางโพงพาง', 'นางลิ้นจี่'] },
    '10140': { district: 'เขตราษฎร์บูรณะ', grabexpress: 210, keywords: ['กสิกรสำนักงานใหญ่', 'บางปะกอก', 'สุขสวัสดิ์'] },
    '10150': { district: 'เขตบางขุนเทียน', grabexpress: 240, keywords: ['เซ็นทรัลพระราม 2', 'central rama 2', 'ท่าข้าม', 'แสมดำ'] },
    '10160': { district: 'เขตบางแค', grabexpress: 300, keywords: ['เดอะมอลล์บางแค', 'the mall bangkae', 'ซีคอนบางแค', 'หลักสอง', 'เพชรเกษม'] },
    '10170': { district: 'เขตตลิ่งชัน', grabexpress: 320, keywords: ['สายใต้ใหม่', 'ตลาดน้ำตลิ่งชัน', 'ฉิมพลี', 'บรมราชชนนี'] },
    '10200': { district: 'เขตพระนคร', grabexpress: 250, keywords: ['ถนนข้าวสาร', 'วัดพระแก้ว', 'สนามหลวง', 'ท่าพระจันทร์', 'ศิริราช', 'วังหลัง', 'บางลำพู', 'เสาชิงช้า'] },
    '10220': { district: 'เขตสายไหม', grabexpress: 330, keywords: ['สะพานใหม่', 'ตลาดยิ่งเจริญ', 'คลองถนน', 'เพิ่มสิน'] },
    '10230': { district: 'เขตคันนายาว', grabexpress: 220, keywords: ['แฟชั่นไอส์แลนด์', 'fashion island', 'สวนสยาม', 'รามอินทรา'] },
    '10240': { district: 'เขตบึงกุ่ม/บางกะปิ', grabexpress: 195, keywords: ['นวมินทร์', 'เดอะมอลล์บางกะปิ', 'the mall bangkapi', 'นิด้า', 'nida', 'รามคำแหง', 'คลองจั่น', 'แฮปปี้แลนด์', 'รพ.เวชธานี'] },
    '10300': { district: 'เขตดุสิต', grabexpress: 265, keywords: ['สวนสัตว์ดุสิต', 'พระที่นั่งอนันตสมาคม', 'เขาดิน', 'ศรีย่าน', 'วชิระ', 'ราชวัตร'] },
    '10310': { district: 'เขตห้วยขวาง', grabexpress: 225, keywords: ['mrt ห้วยขวาง', 'ตลาดห้วยขวาง', 'เหม่งจ๋าย', 'บางกะปิ', 'รพ.กรุงเทพ'] },
    '10500': { district: 'เขตบางรัก', grabexpress: 205, keywords: ['สีลม', 'silom', 'ไอคอนสยาม', 'iconsiam', 'state tower', 'พัฒน์พงษ์', 'ศาลาแดง', 'สุรวงศ์', 'รพ.บีเอ็นเอช', 'BNH'] },
    '10510': { district: 'เขตมีนบุรี', grabexpress: 240, keywords: ['ตลาดมีนบุรี', 'ตลาดจตุจักร 2'] },
    '10600': { district: 'เขตธนบุรี', grabexpress: 255, keywords: ['วงเวียนใหญ่', 'เดอะมอลล์ท่าพระ', 'ตลาดพลู', 'วัดอรุณ'] },
    '10700': { district: 'เขตบางกอกน้อย', grabexpress: 295, keywords: ['เซ็นทรัลปิ่นเกล้า', 'central pinklao', 'พาต้า', 'อรุณอมรินทร์', 'รพ.ศิริราช ปิยมหาราชการุณย์', 'รพ.ธนบุรี'] },
    '10520': { district: 'เขตลาดกระบัง', grabexpress: 200, keywords: ['หัวตะเข้', 'เจ้าคุณทหารลาดกระบัง', 'kmitl', 'ร่มเกล้า'] },

    // Nonthaburi
    '11000': { district: 'อ.เมืองนนทบุรี', grabexpress: 310, keywords: ['นนทบุรี', 'ท่าน้ำนนท์', 'เซ็นทรัลรัตนาธิเบศร์', 'กระทรวงสาธารณสุข', 'เดอะมอลล์งามวงศ์วาน', 'งามวงศ์วาน', 'สวนใหญ่', 'ตลาดขวัญ', 'บางเขน', 'บางกระสอ', 'ไทรม้า', 'รพ.นนทเวช'] },
    '11110': { district: 'อ.บางใหญ่', grabexpress: 425, keywords: ['เซ็นทรัลเวสต์เกต', 'central westgate', 'ตลาดบางใหญ่', 'อิเกียบางใหญ่', 'ikea bangyai', 'เสาธงหิน', 'บางแม่นาง'] },
    '11120': { district: 'อ.ปากเกร็ด', grabexpress: 360, keywords: ['แจ้งวัฒนะ', 'เซ็นทรัลแจ้งวัฒนะ', 'เกาะเกร็ด', 'บางตลาด', 'คลองเกลือ', 'บ้านใหม่', 'รพ.เวิลด์เมดิคอล'] },
    '11130': { district: 'อ.บางกรวย', grabexpress: 340, keywords: ['การไฟฟ้าฝ่ายผลิต', 'พระราม 7', 'วัดชลอ', 'บางสีทอง', 'ปลายบาง'] },
    '11140': { district: 'อ.บางบัวทอง', grabexpress: 450, keywords: ['โสนลอย', 'บางรักพัฒนา', 'พิมลราช'] }
};

// --- 4. Shopify API Endpoint ---
// นี่คือ URL ที่ Shopify จะส่งคำขอมาถามค่าส่ง (เช่น your-server.com/shipping_rates)
// เราจะใช้ method POST เพราะ Shopify จะส่งข้อมูลที่อยู่ของลูกค้ามาใน Body ของคำขอ
app.post('/shipping_rates', (req, res) => {
    
    // ดึงข้อมูลที่อยู่จากคำขอของ Shopify
    const { rate } = req.body;

    // ตรวจสอบว่ามีข้อมูลที่จำเป็นส่งมาหรือไม่
    if (!rate || !rate.destination || !rate.destination.postal_code) {
        // ถ้าข้อมูลไม่ครบ ให้ส่ง error กลับไป
        return res.status(400).json({ errors: "Invalid request. Postal code is missing." });
    }

    // ดึงรหัสไปรษณีย์ของลูกค้าออกมา
    const postalCode = rate.destination.postal_code;

    // ค้นหาค่าส่งจากฐานข้อมูลของเรา
    const shippingInfo = shippingRates[postalCode];
    
    let calculatedRates = [];

    if (shippingInfo) {
        // --- ถ้าเจอค่าส่งในระบบ ---
        // เราจะสร้างรูปแบบข้อมูลตามที่ Shopify กำหนด
        calculatedRates.push({
            service_name: "จัดส่งด่วน GrabExpress (Bike)", // ชื่อบริการที่จะแสดงให้ลูกค้าเห็น
            description: `ส่งด่วนถึงที่สำหรับ ${shippingInfo.district}`, // คำอธิบายเพิ่มเติม
            service_code: `GRAB-${postalCode}`, // รหัสบริการ (ตั้งให้ไม่ซ้ำกัน)
            currency: "THB", // สกุลเงิน
            total_price: (shippingInfo.grabexpress * 100).toString(), // **สำคัญ:** ราคาต้องเป็นหน่วยสตางค์ (คูณ 100) และเป็น String
        });
    } else {
        // --- ถ้าไม่เจอค่าส่งในระบบ ---
        // อาจจะส่งค่าส่งมาตรฐาน หรือไม่ส่งอะไรเลยเพื่อให้ Shopify ใช้ค่าส่งอื่นแทน
        // ในที่นี้ เราจะยังไม่ส่งอะไรกลับไป
    }

    // --- 5. Send Response to Shopify ---
    // ส่งข้อมูลค่าส่งทั้งหมดกลับไปให้ Shopify ในรูปแบบ JSON
    res.json({
        rates: calculatedRates
    });
});

// --- 6. Start the Server ---
// สั่งให้เซิร์ฟเวอร์เริ่มทำงานและรอรับคำขอที่ Port ที่เรากำหนด
app.listen(PORT, () => {
    console.log(`Shopify Carrier Service is running on port ${PORT}`);
});
