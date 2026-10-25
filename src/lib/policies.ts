// Dynamic server import prevents @prisma/client from bundling into client components
import { logger } from '@/lib/logger';

export interface PolicyData {
  slug: string;
  title: string;
  subtitle: string;
  badge: string;
  lastUpdated: string;
  content: string;
}

export const DEFAULT_POLICIES: Record<string, PolicyData> = {
  'terms': {
    slug: 'terms',
    title: 'Terms & Conditions of Sale & Service',
    subtitle: 'Official Master Terms of Sale, Product Efficacy, Medical Disclaimers, and Limitation of Liability for Herbic Cure.',
    badge: 'Official Legal Instrument',
    lastUpdated: 'October 11, 2026',
    content: `### 1. Legal Acceptance & Binding Agreement
By accessing, browsing, interacting with, creating an account on, or placing a purchase order through this platform (the "Platform"), you ("User", "Customer", "Purchaser", or "You") expressly, unconditionally, and irrevocably agree to be bound by all terms, provisions, covenants, and restrictions contained within this Agreement.

Your submission of an order or continuous use of the Platform constitutes valid electronic consent equivalent to a signed physical contract under the Information Technology Act, 2000, and equivalent global electronic commerce enactments. You affirm that you are at least 18 years of age and legally competent to contract.

### 2. Strict Ayurvedic Cosmetic Classification & Medical Disclaimer
All Herbic Cure products (including 21 Herbs Fusion Hair Oils, Ayurvedic Shampoos, Herbal Conditioners, and Handcrafted Neem Wood Combs) are **strictly proprietary Ayurvedic cosmetic and wellness formulations for topical, external grooming.**

> [!IMPORTANT]
> **STATUTORY & REGULATORY NOTICE:**
> Herbic Cure products are NOT prescription drugs or pharmaceutical medicines. They have NOT been formulated, evaluated, or intended to diagnose, treat, mitigate, prevent, or cure clinical diseases, pathology, alopecia areata, androgenetic alopecia, systemic endocrine disorders, or internal hormonal hair loss.

### 3. Biological Variance & Express Absence of Outcome Guarantees
Human scalp physiology, hair density, follicular vitality, sebum chemistry, and epidermal absorption rates vary substantially according to genetics, endocrine status, age, diet, environmental exposures, stress, and medical history.
- Herbic Cure makes **NO EXPRESS OR IMPLIED WARRANTIES, GUARANTEES, OR REPRESENTATIONS** regarding specific outcomes, rates of hair growth, follicular rejuvenation, or reduction in hair shedding.
- Any customer testimonials, before-and-after photographs, ratings, or user reviews published on this Platform represent subjective personal accounts and do NOT constitute statistical norms or guaranteed personal outcomes.

### 4. Mandatory 24-Hour Patch Test Protocol & Assumption of Risk
All botanical formulations derived via classical Kshirapak Vidhi contain concentrated natural phyto-compounds. In rare cases, individuals may possess latent sensitivities to natural botanical resins, herbs, or essential oils.
- **Mandatory 24-Hour Patch Test**: Prior to first full application, you MUST conduct a patch test by applying a single drop to your inner forearm or behind the ear for twenty-four (24) consecutive hours. If irritation, rash, erythema, or itching develops, discontinue use immediately.
- **Medical Consultation**: Individuals who are pregnant, nursing, undergoing specialized dermatological therapies, or suffering from active scalp lesions must obtain clearance from a licensed dermatologist prior to usage.
- **Assumption of Risk**: By purchasing and applying Herbic Cure products, you voluntarily assume all personal risks of idiosyncratic botanical allergies, releasing and discharging Herbic Cure from liability arising out of unanticipated adverse reactions.

### 5. Orders, Pricing, Promotional Timers & Technical Errors
- **Invitation to Offer**: The listing of products and prices represents an invitation to treat. A contract of sale is finalized strictly when Herbic Cure dispatches your order and issues a carrier airway bill (AWB) tracking number.
- **Cancellation for Errors**: Herbic Cure explicitly reserves the unrestricted right to decline or cancel any order in cases of genuine inventory exhaustion, pricing errors, or typographical errors.
- **Promotional Timers & Discounts**: Countdown timers denote limited promotional sessions. Coupon codes (such as HERBIC10) cannot be stacked, fraudulently exploited, or manipulated via automated scripts.

### 6. Limitation of Financial Liability & Exclusion of Damages
TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE JURISPRUDENCE:
- UNDER NO LEGAL THEORY SHALL HERBIC CURE, ITS OFFICERS, DIRECTORS, OR PARTNERS BE LIABLE FOR ANY CONSEQUENTIAL, INDIRECT, INCIDENTAL, SPECIAL, OR PUNITIVE DAMAGES ARISING FROM THE PURCHASE, USE, OR INABILITY TO USE THE PRODUCTS.
- **MAXIMUM MONETARY CAP**: IN ALL CIRCUMSTANCES, THE AGGREGATE MONETARY LIABILITY OF HERBIC CURE SHALL BE STRICTLY LIMITED TO AND SHALL NOT EXCEED THE EXACT MONETARY AMOUNT ACTUALLY PAID BY THE CUSTOMER FOR THE SPECIFIC INDIVIDUAL PRODUCT UNIT GIVING RISE TO THE DISPUTE.

### 7. Mandatory Arbitration, Governing Law & Class Action Waiver
This Agreement is governed by the substantive laws of **India**. In the event of any dispute:
- **Pre-Arbitration Conciliation**: The parties must first attempt good-faith informal resolution for thirty (30) calendar days following written notice to legal@herbiccure.com.
- **Binding Sole Arbitration**: Failing resolution, disputes shall be finally determined by sole binding arbitration under the Arbitration and Conciliation Act, 1996, seated in **Hyderabad, Telangana, India**.
- **Class Action Waiver**: All disputes must be arbitrated on an individual basis. You waive any right to commence or participate in class actions or representative lawsuits against Herbic Cure.

### 8. Official Grievance Officer & Contact
- **Grievance Officer**: Legal & Regulatory Affairs
- **Entity**: Herbic Cure Wellness
- **Email**: legal@herbiccure.com | support@herbiccure.com
- **Direct Helpline**: +91 8121961219
- **Address**: Herbic Cure Corporate Central Depot, Telangana / Hyderabad, India`,
  },

  'privacy-policy': {
    slug: 'privacy-policy',
    title: 'Privacy Policy & Personal Data Protocol',
    subtitle: 'Compliant with the Digital Personal Data Protection Act, 2023 (DPDPA) and Global Fair Information Standards.',
    badge: 'Data Governance & Compliance',
    lastUpdated: 'October 11, 2026',
    content: `### 1. Commitment to Privacy & Regulatory Compliance
Herbic Cure Wellness ("Herbic Cure", "Company", "We", or "Our") places the highest priority on preserving the confidentiality, integrity, and security of your personal data. We process data strictly in accordance with the Digital Personal Data Protection Act, 2023 (DPDPA) and international fair information practices.

### 2. Information We Collect
We collect personal information solely to fulfill your orders, provide logistical tracking, and furnish customer support:
- **Personal Identifiers**: Full legal name, billing and physical delivery address, email address, and active telephone/mobile number.
- **Commercial & Transaction Data**: Items ordered, transaction timestamps, payment reference numbers, order totals, and fulfillment tracking history.
- **Digital Telemetry & Log Data**: IP address, browser type, device identifiers, session cookies, and referrer headers for server security and fraud prevention.
- **Customer Correspondence**: Records and transcripts of support interactions through WhatsApp (+91 8121961219), SMS, or electronic mail.

### 3. Payment Security & Zero Payment Card Retention
> [!NOTE]
> **Zero Financial Credential Storage:**
> Herbic Cure **DOES NOT** store, view, or retain debit card numbers, credit card details, CVVs, or net banking passwords. All financial transactions are tokenized and processed exclusively through RBI-authorized, PCI-DSS Level 1 certified payment gateways (such as Razorpay).

### 4. Legal Grounds for Data Processing
We process your personal data under the following legitimate and statutory bases:
- **Contractual Performance**: Processing orders, packaging formulations, and shipping parcels to your destination.
- **Explicit User Consent**: Delivering order alerts, tracking links, and Ayurvedic consultations.
- **Statutory Obligations**: Complying with GST billing, auditing, and corporate accounting laws.

### 5. Absolute Prohibition on Third-Party Data Monetization
We operate on an unwavering policy: **Herbic Cure DOES NOT sell, rent, license, barter, or trade customer personal data or contact lists to any third-party marketing companies, advertisers, or data aggregators.**
Information is disclosed strictly to accredited third-party logistics partners (such as Shiprocket, Delhivery, Bluedart) solely to the minimal extent required to deliver your shipment.

### 6. WhatsApp & SMS Communication Consent
By submitting your mobile number during checkout or while initiating an Ayurvedic consultation, you grant express consent to receive transactional updates, shipment dispatch notifications, and consultation feedback via WhatsApp and SMS. You may opt out of promotional communications at any time by replying "STOP" to our official support desk.

### 7. Data Principal Rights & Contact Desk
Under applicable data privacy enactments, you have the right to review, update, or request erasure of your personal data (subject to statutory accounting retention mandates).
- **Data Protection Officer**: Compliance & Information Security Lead
- **Official Contact**: privacy@herbiccure.com | +91 8121961219
- **Physical Address**: Herbic Cure Central Office, Hyderabad, Telangana, India`,
  },

  'refund-policy': {
    slug: 'refund-policy',
    title: 'Cancellation, Return & Refund Policy',
    subtitle: 'Sanitary Hygiene Regulations, Seal Integrity Clauses, and Mandatory 360° Unboxing Video Requirements.',
    badge: 'Hygiene Protocol & Consumer Guidelines',
    lastUpdated: 'October 11, 2026',
    content: `### 1. Order Cancellation Policy
- **Pre-Dispatch Cancellations**: You may cancel an order free of charge at any time prior to packaging and dispatch by contacting our WhatsApp support desk at +91 8121961219. Full refunds for prepaid orders will be initiated immediately.
- **Post-Dispatch Ineligibility**: Once an order has been consigned to our logistics carrier and an Airway Bill (AWB) has been generated, cancellations are no longer possible. Refusing delivery at the doorstep without cause may incur transit handling fee deductions.

### 2. Sanitary Hygiene Classification & Strict Non-Returnable Rules
Herbic Cure formulations are biological, personal wellness items that interact directly with skin and hair. In accordance with health, safety, and sanitary consumer regulations:

> [!WARNING]
> **NON-RETURNABLE UPON BREAKING OF SAFETY SEAL:**
> Any bottle, jar, or packaging whose tamper-evident seal, cap shrink-wrap, or inner foil has been broken, unsealed, or sampled is **ABSOLUTELY INELIGIBLE FOR RETURN, EXCHANGE, OR REFUND**. We do not accept returns of opened personal care products under any circumstances due to hygiene and cross-contamination hazards.

Unopened bottles with complete, intact factory seals may be requested for return within **seven (7) calendar days** of carrier-confirmed delivery. Return shipping logistics costs are the responsibility of the purchaser unless the shipment resulted from a company error.

### 3. Mandatory 360-Degree Continuous Uncut Unboxing Video
To eliminate transit fraud, courier tampering, and false shortage claims, Herbic Cure enforces a strict, mandatory evidence requirement:

**Mandatory Video Protocol for Damaged, Leaking, or Missing Items:**
1. Record a **continuous, unedited, uncut, single-take video** starting before opening the outer courier polybag.
2. Display the shipping label and tracking AWB barcode clearly in the frame.
3. Open the parcel and inspect the inner contents, showing any broken bottle, leak, or missing SKU in real time.
4. Submit this unedited video to WhatsApp (+91 8121961219) or email (support@herbiccure.com) within **forty-eight (48) hours of delivery**.

*Note: Claims submitted without a continuous, unedited unboxing video cannot be validated and will be conclusively rejected.*

### 4. Free Instant Replacement Process
Upon receipt and verification of a valid unboxing video showing verified transit leakage or bottle breakage, Herbic Cure will dispatch a brand-new, fresh replacement bottle within 24 business hours at **100% zero additional cost**.

### 5. Refund Processing Timeline
- **Prepaid Orders**: Approved refunds are processed directly to the original payment source (Credit/Debit Card, UPI, or Net Banking) within 5 to 7 banking days.
- **Cash on Delivery (COD)**: For verified claims on COD orders where replacement is unavailable, refunds are transferred via direct NEFT/IMPS or UPI upon the customer providing verified bank details.

### 6. Customer Care & Claims Desk
- **Email**: support@herbiccure.com
- **WhatsApp Support**: +91 8121961219 (10:00 AM - 7:00 PM IST, Mon-Sat)`,
  },

  'shipping-policy': {
    slug: 'shipping-policy',
    title: 'Shipping & Pan-India Delivery Policy',
    subtitle: 'Transparent Dispatch Timelines, Courier Logistics, Tracking Notifications, and Delivery Terms.',
    badge: 'Logistics & Pan-India Delivery',
    lastUpdated: 'October 11, 2026',
    content: `### 1. Pan-India Delivery Network
We deliver authentic Herbic Cure formulations across 19,000+ pin codes throughout India through tier-1 logistics partners including Shiprocket, Delhivery, Bluedart, and DTDC.

### 2. Dispatch Timeline & Order Processing
- **Fresh Batch Packaging**: All orders are freshly checked and dispatched within **24 to 48 business hours** of order confirmation.
- **Operational Days**: Dispatches operate Monday through Saturday, excluding gazetted national holidays and regional bank holidays.

### 3. Estimated Transit Duration
- **Metro Cities (Delhi, Mumbai, Bengaluru, Hyderabad, Chennai, Kolkata)**: 2 to 4 working days from dispatch.
- **Tier-2 & Tier-3 Cities**: 3 to 6 working days from dispatch.
- **Remote / North-East / Island Regions**: 5 to 8 working days from dispatch.

### 4. Shipping Charges & Cash on Delivery (COD)
- **Prepaid Orders**: 100% FREE Shipping across India on all prepaid orders (UPI, Cards, Net Banking).
- **Cash on Delivery (COD)**: A nominal handling fee of ₹49 applies to COD shipments to cover courier cash collection and verification protocols.

### 5. Real-Time Tracking Notifications
Once your package is picked up by our logistics carrier, an automated SMS and WhatsApp notification containing your Airway Bill (AWB) number and live tracking link will be sent to your registered phone number. You can also track your shipment anytime via our [Track Order](/track-order) portal.

### 6. Address Accuracy & Unsuccessful Deliveries
Customers are responsible for providing an accurate delivery address, landmark, and accessible contact number. If a parcel is returned to origin (RTO) due to an incorrect address, non-responsiveness to courier calls, or repeated door locks, re-shipping charges of ₹80 may apply for secondary dispatch.`,
  },
};

const policyCache = new Map<string, PolicyData>();

export async function getPolicyData(slug: string): Promise<PolicyData> {
  if (policyCache.has(slug)) {
    return policyCache.get(slug)!;
  }
  const fallback = DEFAULT_POLICIES[slug] || {
    slug,
    title: 'Store Policy',
    subtitle: 'Official terms and guidelines of Herbic Cure.',
    badge: 'Policy Document',
    lastUpdated: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    content: 'Policy content is currently being updated.',
  };

  try {
    const { prisma } = await import('@/lib/prisma');
    const record = await prisma.siteSetting.findUnique({
      where: { key: `policy_${slug}` },
    });

    if (record?.value) {
      const parsed = JSON.parse(record.value);
      const result: PolicyData = {
        slug,
        title: parsed.title || fallback.title,
        subtitle: parsed.subtitle || fallback.subtitle,
        badge: parsed.badge || fallback.badge,
        lastUpdated: parsed.lastUpdated || fallback.lastUpdated,
        content: parsed.content || fallback.content,
      };
      policyCache.set(slug, result);
      return result;
    }
  } catch (error: any) {
    logger.debug('policies.fallback_used', { slug, error: error?.message });
  }

  return fallback;
}

export async function savePolicyData(slug: string, data: Partial<PolicyData>): Promise<PolicyData> {
  const current = await getPolicyData(slug);
  const updated: PolicyData = {
    slug,
    title: data.title ?? current.title,
    subtitle: data.subtitle ?? current.subtitle,
    badge: data.badge ?? current.badge,
    lastUpdated: data.lastUpdated ?? new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    content: data.content ?? current.content,
  };

  const { prisma } = await import('@/lib/prisma');
  policyCache.set(slug, updated);
  await prisma.siteSetting.upsert({
    where: { key: `policy_${slug}` },
    update: { value: JSON.stringify(updated) },
    create: { key: `policy_${slug}`, value: JSON.stringify(updated) },
  });

  return updated;
}
