# Herbic Cure Engineering & Operations Documentation

This directory contains technical specifications, architecture plans, operational runbooks, security audits, and developer guides for the Herbic Cure e-commerce platform.

---

## Documentation Directory Structure

```
docs/
├── README.md                          # Master documentation index
├── AGENTS.md                          # Framework agent instructions
├── architecture/                      # Technical plans & core system design
│   ├── DELHIVERY_PENDING_PLAN.md      # Delhivery One Pending Flow & fulfillment mode
│   ├── FEATURE_PLAN.md                # Store features roadmap & checkout specs
│   ├── AUTH_PLAN.md                   # Better-Auth, RBAC matrix & session architecture
│   ├── SEO_PLAN.md                    # Technical SEO architecture & redirect engine
│   └── BUSINESS.md                    # Business models, pricing structure & margins
├── operations/                        # Operational runbooks & admin guides
│   ├── ADMIN_GUIDE.md                 # Store manager & staff order fulfillment guide
│   ├── RUNBOOK.md                     # Production recovery, sync retries & pickup triage
│   ├── CACHING_GUIDE.md               # Multi-layer caching & Cloudflare CDN page rules
│   └── CHECKOUT_PAYMENTS.md           # Razorpay callbacks, COD advance deduction & refunds
├── security/                          # Security, compliance & observability
│   ├── SECURITY_AUDIT.md              # Comprehensive security audit & vulnerability report
│   ├── THREAT_MODEL.md                # STRIDE threat modeling analysis
│   ├── SERVER_ONLY_FIX.md             # Client/server boundary isolation enforcement
│   ├── LOGGING.md                     # Structured logging taxonomy & zero-console rules
│   └── LOGGING_AUDIT.md               # Pre-refactor logging baseline & traffic impact
└── seo/                               # Market research & keyword strategy
    └── SEO_RESEARCH.md                # Intent-mapped keyword matrix & SERP standards
```

---

## Categorized Index

### 1. Architecture & System Design
| Document | Description |
| :--- | :--- |
| [DELHIVERY_PENDING_PLAN.md](file:///d:/Codes/Projects/herbicCure-main/docs/architecture/DELHIVERY_PENDING_PLAN.md) | Delhivery One Pending Flow (Order Management Mode) integration blueprint |
| [FEATURE_PLAN.md](file:///d:/Codes/Projects/herbicCure-main/docs/architecture/FEATURE_PLAN.md) | Store features roadmap, checkout flows, and catalog specs |
| [AUTH_PLAN.md](file:///d:/Codes/Projects/herbicCure-main/docs/architecture/AUTH_PLAN.md) | Better-Auth authentication, RBAC roles (OWNER, MANAGER, SUPPORT), and MFA |
| [SEO_PLAN.md](file:///d:/Codes/Projects/herbicCure-main/docs/architecture/SEO_PLAN.md) | Technical SEO architecture, URL redirect engine, and sitemap generation |
| [BUSINESS.md](file:///d:/Codes/Projects/herbicCure-main/docs/architecture/BUSINESS.md) | Business models, pricing structure, margins, and unit economics |

### 2. Operational Runbooks & Admin Guides
| Document | Description |
| :--- | :--- |
| [ADMIN_GUIDE.md](file:///d:/Codes/Projects/herbicCure-main/docs/operations/ADMIN_GUIDE.md) | Operational manual for store managers and order fulfillment staff |
| [RUNBOOK.md](file:///d:/Codes/Projects/herbicCure-main/docs/operations/RUNBOOK.md) | Production maintenance procedures, courier pickup triage, and recovery |
| [CACHING_GUIDE.md](file:///d:/Codes/Projects/herbicCure-main/docs/operations/CACHING_GUIDE.md) | Multi-layer caching architecture and Cloudflare CDN page rules |
| [CHECKOUT_PAYMENTS.md](file:///d:/Codes/Projects/herbicCure-main/docs/operations/CHECKOUT_PAYMENTS.md) | Razorpay payment callbacks, COD advance deduction, and refund handling |

### 3. Security, Auditing & Compliance
| Document | Description |
| :--- | :--- |
| [SECURITY_AUDIT.md](file:///d:/Codes/Projects/herbicCure-main/docs/security/SECURITY_AUDIT.md) | Comprehensive security assessment, penetration tests, and vulnerability fixes |
| [THREAT_MODEL.md](file:///d:/Codes/Projects/herbicCure-main/docs/security/THREAT_MODEL.md) | Threat modeling analysis (STRIDE) for checkout, payments, and admin access |
| [SERVER_ONLY_FIX.md](file:///d:/Codes/Projects/herbicCure-main/docs/security/SERVER_ONLY_FIX.md) | Client/server boundary isolation enforcement and import guard verification |
| [LOGGING.md](file:///d:/Codes/Projects/herbicCure-main/docs/security/LOGGING.md) | Structured logging taxonomy, level definitions, and sensitive data redaction |
| [LOGGING_AUDIT.md](file:///d:/Codes/Projects/herbicCure-main/docs/security/LOGGING_AUDIT.md) | Audit trail of zero-console migration and ESLint rule enforcement |

### 4. SEO & Growth
| Document | Description |
| :--- | :--- |
| [SEO_RESEARCH.md](file:///d:/Codes/Projects/herbicCure-main/docs/seo/SEO_RESEARCH.md) | Search intent research, regulatory compliance standards & intent keyword matrix |
