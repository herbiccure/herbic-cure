# Business Context & Brand Guide: Herbic Cure

**Last Verified:** October 13, 2026  
**Audience:** Developers, Technical SEO Specialists, Marketing, Legal, Store Operations  
**Status:** Living Document (Baseline for SEO & CMS Architecture)

---

## 1. Executive Summary & Brand Overview

**Herbic Cure** is an authentic direct-to-consumer (D2C) Ayurvedic hair wellness brand based in Hyderabad, Telangana, India. The brand combines classical Vedic botanical pharmacology with modern dermatological standards to provide non-toxic, root-to-tip hair restoration regimens.

* **Brand Tagline:** *Nature in Every Drop*
* **Core Value Proposition:** 100% natural, mineral-oil-free, and chemical-free hair care solutions centered around a proprietary **21 Herbs Fusion** formulation manufactured using the classical 72-hour **Kshirapak Vidhi** method.
* **Canonical Brand Name:** `Herbic Cure` (Note: Ensure all legacy code/content references to "Herbicas" are updated to "Herbic Cure").
* **Operating Entity:** Herbic Cure Ayurvedic Naturals, Plot 45, Jubilee Enclave, HITEC City, Hyderabad, Telangana 500081.

---

## 2. Product Catalog & Offerings

Herbic Cure operates a focused, highly synergistic catalog of 9 stock keeping units (SKUs) structured across 4 distinct product categories:

### A. 21 Herbs Fusion Hair Oils (Flagship)
Formulated with 21 pure Himalayan botanicals and roots slow-cooked in pure cow milk and cold-pressed base oils using **Kshirapak Vidhi**.

1. **Herbic Cure - 21 Herbs Fusion Hair Oil (Q1 - 190ml)**
   * **SKU:** `HC-OIL-Q1`
   * **Slug:** `/products/herbic-cure-21-herbs-fusion-hair-oil-q1`
   * **MRP (Regular Price):** ₹699
   * **Sale Price:** ₹469 (33% Introductory Discount)
   * **Role:** Flagship hero product; primary acquisition offer for first-time shoppers.
2. **Herbic Cure - 21 Herbs Fusion Hair Oil (Q2 - Twin Pack: 2 x 190ml = 380ml)**
   * **SKU:** `HC-OIL-Q2`
   * **Slug:** `/products/herbic-cure-21-herbs-fusion-hair-oil-q2`
   * **MRP (Regular Price):** ₹1,398
   * **Sale Price:** ₹1,118 (20% Bundle Discount)
   * **Role:** 60-day intensive anti-hair-fall regimen for persistent shedding.
3. **Herbic Cure - 21 Herbs Fusion Hair Oil (Q3 - Family Pack: 3 x 190ml = 570ml)**
   * **SKU:** `HC-OIL-Q3`
   * **Slug:** `/products/herbic-cure-21-herbs-fusion-hair-oil-q3`
   * **MRP (Regular Price):** ₹2,097
   * **Sale Price:** ₹1,677 (20% Bundle Discount)
   * **Role:** 90-day comprehensive therapy and multi-member household bundle.

> [!NOTE]
> **Catalog Bottle Size Clarification (Open Question #1):**  
> The PRD and initial brief reference bottle sizes of 100ml, 200ml, and 300ml, whereas the current production database seed defines 190ml (Q1), 380ml (Q2), and 570ml (Q3). This variance is flagged below for owner sign-off.

### B. Wooden Scalp Accessories
4. **Herbic Cure - Natural Neem Wood Comb**
   * **SKU:** `HC-COMB-01`
   * **Slug:** `/products/herbic-cure-natural-neem-wood-comb`
   * **MRP:** ₹149 | **Sale Price:** ₹128
   * **Role:** Handcrafted from 100% seasoned *Azadirachta indica* (Neem) wood. Non-static, wide-tooth detangling comb that massages acupressure points and inhibits microbial dandruff.

### C. Shampoos & Cleansers
5. **Herbic Cure - 2-in-1 Daily Cleansing Shampoo with Conditioner (Q1 - 200ml)**
   * **SKU:** `HC-SHMP-Q1`
   * **Slug:** `/products/herbic-cure-shampoo-with-conditioner-q1`
   * **MRP:** ₹599 | **Sale Price:** ₹489
   * **Role:** Sulfate-free (SLS/SLES free), paraben-free cleansing formula infused with Neem, Tulsi, Argan Oil, and Shea Butter.
6. **Herbic Cure - Shampoo with Conditioner (Q2 - Twin Pack: 2 x 200ml = 400ml)**
   * **SKU:** `HC-SHMP-Q2`
   * **Slug:** `/products/herbic-cure-shampoo-with-conditioner-q2`
   * **MRP:** ₹1,198 | **Sale Price:** ₹999
   * **Role:** Extended supply value bundle.

### D. Combos & Complete Therapy Ritual Kits
7. **21 Herbs Hair Oil (190ml) + Natural Neem Wood Comb**
   * **SKU:** `HC-OIL-COMB`
   * **Slug:** `/products/herbic-cure-21-herbs-fusion-hair-oil-neem-wood-comb`
   * **MRP:** ₹848 | **Sale Price:** ₹695
8. **21 Herbs Hair Oil (190ml) + Shampoo with Conditioner (200ml)**
   * **SKU:** `HC-COMBO-OIL-SHMP`
   * **Slug:** `/products/herbic-cure-21-herbs-hair-oil-shampoo-with-conditioner`
   * **MRP:** ₹1,298 | **Sale Price:** ₹1,038
9. **Complete Hair Therapy Kit (Oil 190ml + Shampoo 200ml + Neem Comb)**
   * **SKU:** `HC-KIT-COMPLETE`
   * **Slug:** `/products/herbic-cure-complete-hair-therapy-kit`
   * **MRP:** ₹1,448 | **Sale Price:** ₹1,158
   * **Role:** Full Ayurvedic routine kit (Highest AOV driver).

---

## 3. Customer Profile & Demographics

* **Target Audience:** Indian men and women aged 22–45 residing in urban and semi-urban India (Metros + Tier 2 cities: Hyderabad, Bengaluru, Pune, Delhi NCR, Mumbai, Ahmedabad, Jaipur, Chennai, Kolkata).
* **Primary Pain Points:**
  1. *Seasonal hair fall:* Severe shedding during Monsoon humidity (*Varsha Ritu*) and brittle dry breakage during Winter (*Shishira Ritu*).
  2. *Hard water damage:* Mineral build-up from borewell or municipal water weakening roots in urban apartments.
  3. *Chemical & heat damage:* Thinning caused by artificial smoothing, straighteners, and sulfate-laden cosmetic shampoos.
  4. *Scalp imbalances:* Itchy scalp, stubborn dandruff, and stress-related hair thinning.
* **Buying Triggers:**
  * Clean Ayurvedic ingredients with zero liquid paraffin / mineral oil.
  * Cash on Delivery (COD) availability across Pan-India pincodes.
  * Rapid customer support via WhatsApp.

---

## 4. Pricing & Discount Logic

* **Pricing Currency:** Indian Rupee (INR / ₹) with standard Indian numbering formatting (e.g., ₹1,499; ₹2,50,000).
* **Discount Display:** Transparent presentation of MRP (strikethrough `compareAtPrice`) versus actual `salePrice`.
* **Shipping Rules:**
  * Free Express Shipping across India on orders **above ₹499** (configured in `SiteSetting`).
  * Flat standard delivery charge of **₹49** for orders under ₹499.
* **Payment Methods:**
  * Razorpay Gateway: UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards, Net Banking.
  * Cash on Delivery (COD) enabled Pan-India.
* **Dark-Pattern Strict Policy (CCPA 2023 Compliance):**
  * No artificially generated countdown timers. Any timer displayed must link to a real database timestamp `offerEndsAt`.
  * No disguised fees or basket sneaking during checkout.

---

## 5. Regimens & Rituals: The Ayurvedic 3-Step Routine

The Herbic Cure experience is framed around the ancient Ayurvedic practice of *Shiroabhyanga* (head oiling):

1. **Step 1: Night Scalp Nourishment (Shiroabhyanga):**
   * Apply 5–10 ml of Herbic Cure 21 Herbs Fusion Hair Oil directly to dry scalp.
   * Gently massage in circular motions using fingertips for 5 to 10 minutes to stimulate blood micro-circulation.
   * Leave overnight, or for a minimum of 1 hour before bathing, to allow the milk-extracted herbal lipids to penetrate the hair cuticle.
2. **Step 2: Gentle Cleansing (Shodhana):**
   * Wash hair using lukewarm water and Herbic Cure 2-in-1 Daily Cleansing Shampoo with Conditioner.
   * Cleanses herbal oil and environmental impurities without stripping the scalp's natural sebum.
3. **Step 3: Acupressure Detangling (Prasadhana):**
   * Once hair is completely dry, detangle gently using the wide-toothed Handcrafted Neem Wood Comb.
   * Never comb wet hair. Neem wood neutralizes static electricity and evenly distributes natural oils along the hair shaft.

---

## 6. Trust Assets & Botanical Transparency

### The 21 Sacred Ayurvedic Herbs
Herbic Cure publishes its complete botanical formulation to foster transparency:

| # | Herb Common Name | Sanskrit / Botanical Name | Primary Role in Formulation |
|---|---|---|---|
| 1 | **Bhringraj** | *Keshraj / Eclipta prostrata* | Activates micro-circulation, revives dormant follicles |
| 2 | **Amla** | *Amalaki / Phyllanthus emblica* | Vitamin C powerhouse, strengthens root collagen |
| 3 | **Brahmi** | *Bacopa monnieri* | Calms nervous tension, nourishes scalp nerves |
| 4 | **Neem** | *Nimba / Azadirachta indica* | Antimicrobial, purifies dandruff and fungal itch |
| 5 | **Hibiscus** | *Japa / Hibiscus rosa-sinensis* | Rich in amino acids, conditions and adds shine |
| 6 | **Fenugreek** | *Methi / Trigonella foenum-graecum* | High protein and nicotinic acid against thinning |
| 7 | **Rosemary** | *Rosmarinus officinalis* | Cellular turnover stimulator |
| 8 | **Jatamansi** | *Nardostachys jatamansi* | Deep root sedative and premature greying defense |
| 9 | **Shankhpushpi** | *Convolvulus pluricaulis* | Scalp stress reliever |
| 10 | **Nagarmotha** | *Cyperus rotundus* | Absorbs excess sebum, cleanses hair roots |
| 11 | **Tulsi** | *Ocimum sanctum* | Antiseptic scalp shield |
| 12 | **Gunja** | *Abrus precatorius* | Classical Ayurvedic root stimulant |
| 13 | **Lodhra** | *Symplocos racemosa* | Astringent bark that tightens hair follicle grip |
| 14 | **Manjistha** | *Rubia cordifolia* | Blood-purifying botanical that detoxifies scalp |
| 15 | **Curry Leaves** | *Kadi Patta / Murraya koenigii* | Restores natural melanin and delays silvering |
| 16 | **Baheda** | *Bibhitaki / Terminalia bellirica* | Classical Triphala constituent for tensile strength |
| 17 | **Haritaki** | *Harad / Terminalia chebula* | Eliminates scalp toxins and oxidative stress |
| 18 | **Ratanjot** | *Alkanet / Alkanna tinctoria* | Natural cooling root and therapeutic tint |
| 19 | **Vacha** | *Acorus calamus* | Enhances nutrient absorption into dermal papilla |
| 20 | **Vetiver** | *Ushira / Chrysopogon zizanioides* | Cools Pitta heat, relieves scalp burning |
| 21 | **Castor** | *Eranda / Ricinus communis* | Ricinoleic acid fatty barrier that locks in moisture |

---

## 7. Tone of Voice & Editorial Principles

* **Empathetic & Honest:** Never shame or panic the customer about hair loss. Hair shedding is a natural biological cycle influenced by climate, diet, and stress.
* **Classical Authority with Modern Clarity:** Explain terms like *Kshirapak Vidhi* and *Shiroabhyanga* in accessible, contemporary language.
* **Strict Non-Medical Stance:** Herbic Cure products are cosmetic Ayurvedic formulations intended for scalp wellness and aesthetic hair maintenance. They are **not** pharmaceutical medicines or treatments for pathological medical conditions.

---

## 8. Medical & Regulatory Risk Inventory (ASCI & CCPA Compliance)

Per Rule 6, the following existing copy and claims identified across the codebase and database seed pose legal risks under the **Advertising Standards Council of India (ASCI)** code, the **Drugs and Magic Remedies (Objectionable Advertisements) Act, 1954**, and the **Consumer Protection Act, 2019**. 

They are compiled here for **owner and legal review** rather than silent alteration:

| Item # | Current Existing Copy / Asset | Location in Repo | Regulatory Risk / Law | Required Remediation / Legal Action |
|---|---|---|---|---|
| **R-1** | *"Controls hair fall within 14 days of regular use"* | `prisma/seed.ts` (Product benefits), Homepage hero | ASCI Code Ch. 1 (Substantiation): Time-bound efficacy claims are prohibited without clinical trial data. | **Flag for Owner:** Provide independent clinical trial report, or soften to *"Helps reduce hair fall due to breakage with consistent regular use"*. |
| **R-2** | *"Stimulates dormant roots to trigger new baby hair growth"* / *"Reverse Hair Fall"* | `prisma/seed.ts` (Product benefits), Blog titles, meta descriptions | Drugs and Magic Remedies Act, 1954 & ASCI guidelines on baldness cure claims. | **Flag for Owner:** Replace absolute regrowth claims with compliant cosmetic phrasing: *"Nourishes the scalp to support healthy, resilient hair follicles"*. |
| **R-3** | Customer Result Transformation Photos (`result-1.png` to `result-4.png`) claiming temple corner regrowth in 8–12 weeks | `prisma/seed.ts` (`CustomerResult`), `/results` page | ASCI Guidelines on Testimonials & CCPA Misleading Advertisements. | **Flag for Owner:** Confirm signed customer consent, unaltered raw photos, and authentic affidavits on file. |
| **R-4** | Hardcoded `rating: 4.9`, `reviewCount: 312` on Products while `Review` database table is empty | `prisma/seed.ts` (`Product` model) | Google Search Central Review Snippet Policy & CCPA Dark Pattern Rules. | **Strict Technical Action:** Suppress `AggregateRating` and `Review` structured data in JSON-LD until real approved reviews exist in the database. |
| **R-5** | *"Over 2,50,000+ happy customers"* | `src/app/reviews/page.tsx`, Header banners | ASCI Code Ch. 1: Verifiability of customer base metrics. | **Flag for Owner:** Verify sales volume records or adjust to verified historical figures. |

---

## 9. Open Questions for the Store Owner

1. **Bottle Volume Standardization:** Are current production bottles 190ml (matching database SKUs `HC-OIL-Q1`, `HC-OIL-Q2`, `HC-OIL-Q3`) or the 100ml / 200ml / 300ml mentioned in the original PRD?
2. **Clinical Trial Substantiation:** Does Herbic Cure hold an accredited third-party dermatological trial report supporting the "14-day hair fall control" claim?
3. **Review Ingestion:** When can authentic customer purchase reviews be imported into the PostgreSQL `Review` table so review schema can be legitimately activated?
4. **GSTIN & Business Registration:** What are the registered GST number, Corporate Identification Number (CIN), and Grievance Officer contact details to display in the legal footer?
5. **Physical Store / Local Presence:** Does Herbic Cure maintain an offline Ayurvedic clinic or retail dispensary for Google Business Profile verification, or is the operation 100% online D2C?
