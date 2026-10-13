'use client';

import React from 'react';

/**
 * AdminGlobalStyles
 * Injects global CSS overrides for the Admin Panel when in Light Theme.
 * Ensures all cards, sub-panels, list rows, badges, inputs, and typography across
 * EVERY admin page render with luxury Silk Pearl Blush and Velvet Rose styling,
 * completely eliminating dark muddy slate backgrounds in Light Mode.
 */
export function AdminGlobalStyles() {
  const css = `
    /* ============================================================
       GLOBAL ADMIN LIGHT THEME OVERRIDES (APPLIES TO ALL ADMIN PAGES)
       ============================================================ */

    [data-admin-theme="light"],
    .admin-theme-light {
      background-color: #FCF8F9 !important;
      color: #2D1B1B !important;
    }

    [data-admin-theme="light"] .admin-shell-container,
    .admin-theme-light .admin-shell-container {
      background-color: #FCF8F9 !important;
      color: #2D1B1B !important;
    }

    /* 1. Outer Panels, Main Containers, Card Wrappers & Tables */
    [data-admin-theme="light"] .bg-slate-900,
    .admin-theme-light .bg-slate-900,
    [data-admin-theme="light"] .bg-slate-950,
    .admin-theme-light .bg-slate-950,
    [data-admin-theme="light"] .bg-stone-900,
    .admin-theme-light .bg-stone-900,
    [data-admin-theme="light"] [class*="bg-slate-900"],
    .admin-theme-light [class*="bg-slate-900"],
    [data-admin-theme="light"] [class*="bg-slate-950"],
    .admin-theme-light [class*="bg-slate-950"] {
      background-color: #ffffff !important;
      color: #2D1B1B !important;
      border-color: #F1DFE5 !important;
    }

    /* 2. Inner Item Cards, List Rows, Active Stories, Sub-panels */
    [data-admin-theme="light"] .bg-slate-800,
    .admin-theme-light .bg-slate-800,
    [data-admin-theme="light"] .bg-slate-800\\/60,
    .admin-theme-light .bg-slate-800\\/60,
    [data-admin-theme="light"] .bg-slate-800\\/50,
    .admin-theme-light .bg-slate-800\\/50,
    [data-admin-theme="light"] .bg-slate-800\\/80,
    .admin-theme-light .bg-slate-800\\/80,
    [data-admin-theme="light"] .bg-slate-700,
    .admin-theme-light .bg-slate-700,
    [data-admin-theme="light"] .bg-slate-700\\/80,
    .admin-theme-light .bg-slate-700\\/80,
    [data-admin-theme="light"] .bg-stone-800,
    .admin-theme-light .bg-stone-800,
    [data-admin-theme="light"] [class*="bg-slate-800"],
    .admin-theme-light [class*="bg-slate-800"],
    [data-admin-theme="light"] [class*="bg-slate-700"],
    .admin-theme-light [class*="bg-slate-700"],
    [data-admin-theme="light"] [class*="bg-stone-800"],
    .admin-theme-light [class*="bg-stone-800"] {
      background-color: #FCF8F9 !important;
      border-color: #F1DFE5 !important;
      color: #2D1B1B !important;
    }

    /* Hover states on cards / rows */
    [data-admin-theme="light"] [class*="bg-slate-800"]:hover,
    .admin-theme-light [class*="bg-slate-800"]:hover {
      background-color: #FAF2F5 !important;
      border-color: #EAC9D1 !important;
    }

    /* 3. Thumbnail & Image Wrappers Inside Cards */
    [data-admin-theme="light"] div[class*="bg-slate-800"].relative,
    .admin-theme-light div[class*="bg-slate-800"].relative,
    [data-admin-theme="light"] div[class*="bg-slate-700"].relative,
    .admin-theme-light div[class*="bg-slate-700"].relative {
      background-color: #F6DFE7 !important;
      border-color: #EAC9D1 !important;
    }

    /* 4. Headings & Typography */
    [data-admin-theme="light"] h1,
    .admin-theme-light h1,
    [data-admin-theme="light"] h2,
    .admin-theme-light h2,
    [data-admin-theme="light"] h3,
    .admin-theme-light h3,
    [data-admin-theme="light"] h4,
    .admin-theme-light h4,
    [data-admin-theme="light"] h5,
    .admin-theme-light h5,
    [data-admin-theme="light"] h6,
    .admin-theme-light h6 {
      color: #2D1B1B !important;
    }

    /* Headings & Text Inside Cards and Rows */
    [data-admin-theme="light"] [class*="bg-slate-800"] h1,
    .admin-theme-light [class*="bg-slate-800"] h1,
    [data-admin-theme="light"] [class*="bg-slate-800"] h2,
    .admin-theme-light [class*="bg-slate-800"] h2,
    [data-admin-theme="light"] [class*="bg-slate-800"] h3,
    .admin-theme-light [class*="bg-slate-800"] h3,
    [data-admin-theme="light"] [class*="bg-slate-800"] h4,
    .admin-theme-light [class*="bg-slate-800"] h4,
    [data-admin-theme="light"] [class*="bg-slate-800"] .text-white,
    .admin-theme-light [class*="bg-slate-800"] .text-white,
    [data-admin-theme="light"] [class*="bg-slate-900"] .text-white,
    .admin-theme-light [class*="bg-slate-900"] .text-white,
    [data-admin-theme="light"] .text-slate-100,
    .admin-theme-light .text-slate-100,
    [data-admin-theme="light"] .text-slate-200,
    .admin-theme-light .text-slate-200 {
      color: #2D1B1B !important;
    }

    /* Subtext, Captions, Product Titles & Paragraphs */
    [data-admin-theme="light"] [class*="bg-slate-800"] p,
    .admin-theme-light [class*="bg-slate-800"] p,
    [data-admin-theme="light"] .text-slate-300,
    .admin-theme-light .text-slate-300,
    [data-admin-theme="light"] .text-slate-400,
    .admin-theme-light .text-slate-400,
    [data-admin-theme="light"] .text-stone-400,
    .admin-theme-light .text-stone-400 {
      color: #6E555C !important;
    }

    [data-admin-theme="light"] .text-slate-500,
    .admin-theme-light .text-slate-500,
    [data-admin-theme="light"] .text-stone-500,
    .admin-theme-light .text-stone-500 {
      color: #88727A !important;
    }

    /* 5. Borders Across All Panels & Cards */
    [data-admin-theme="light"] .border-slate-800,
    .admin-theme-light .border-slate-800,
    [data-admin-theme="light"] .border-slate-800\\/60,
    .admin-theme-light .border-slate-800\\/60,
    [data-admin-theme="light"] .border-slate-800\\/50,
    .admin-theme-light .border-slate-800\\/50,
    [data-admin-theme="light"] .border-slate-800\\/40,
    .admin-theme-light .border-slate-800\\/40,
    [data-admin-theme="light"] .border-slate-700,
    .admin-theme-light .border-slate-700,
    [data-admin-theme="light"] .border-slate-700\\/60,
    .admin-theme-light .border-slate-700\\/60,
    [data-admin-theme="light"] .border-slate-700\\/80,
    .admin-theme-light .border-slate-700\\/80,
    [data-admin-theme="light"] .border-stone-800,
    .admin-theme-light .border-stone-800,
    [data-admin-theme="light"] .border-stone-700,
    .admin-theme-light .border-stone-700,
    [data-admin-theme="light"] [class*="border-slate-800"],
    .admin-theme-light [class*="border-slate-800"],
    [data-admin-theme="light"] [class*="border-slate-700"],
    .admin-theme-light [class*="border-slate-700"] {
      border-color: #F1DFE5 !important;
    }

    [data-admin-theme="light"] .divide-slate-800\\/60 > * + *,
    .admin-theme-light .divide-slate-800\\/60 > * + *,
    [data-admin-theme="light"] [class*="divide-slate-800"] > * + *,
    .admin-theme-light [class*="divide-slate-800"] > * + * {
      border-color: #F1DFE5 !important;
    }

    /* 6. Primary Action Buttons (Add, Save, Submit) */
    [data-admin-theme="light"] button[class*="bg-emerald-600"],
    .admin-theme-light button[class*="bg-emerald-600"],
    [data-admin-theme="light"] button[class*="bg-emerald-700"],
    .admin-theme-light button[class*="bg-emerald-700"],
    [data-admin-theme="light"] button[class*="bg-emerald-800"],
    .admin-theme-light button[class*="bg-emerald-800"],
    [data-admin-theme="light"] a[class*="bg-emerald-600"],
    .admin-theme-light a[class*="bg-emerald-600"],
    [data-admin-theme="light"] a[class*="bg-emerald-700"],
    .admin-theme-light a[class*="bg-emerald-700"],
    [data-admin-theme="light"] button[class*="144e29"],
    .admin-theme-light button[class*="144e29"],
    [data-admin-theme="light"] a[class*="144e29"],
    .admin-theme-light a[class*="144e29"] {
      background-color: #A84358 !important;
      color: #ffffff !important;
      box-shadow: 0 2px 8px -1px rgba(168, 67, 88, 0.35) !important;
    }

    [data-admin-theme="light"] button[class*="bg-emerald-600"]:hover,
    .admin-theme-light button[class*="bg-emerald-600"]:hover,
    [data-admin-theme="light"] button[class*="bg-emerald-700"]:hover,
    .admin-theme-light button[class*="bg-emerald-700"]:hover,
    [data-admin-theme="light"] button[class*="bg-emerald-800"]:hover,
    .admin-theme-light button[class*="bg-emerald-800"]:hover,
    [data-admin-theme="light"] a[class*="bg-emerald-600"]:hover,
    .admin-theme-light a[class*="bg-emerald-600"]:hover,
    [data-admin-theme="light"] button[class*="144e29"]:hover,
    .admin-theme-light button[class*="144e29"]:hover {
      background-color: #8C374A !important;
      color: #ffffff !important;
      box-shadow: 0 4px 14px -2px rgba(168, 67, 88, 0.45) !important;
    }

    /* 7. Secondary Buttons & Item Buttons */
    [data-admin-theme="light"] button[class*="bg-slate-700"],
    .admin-theme-light button[class*="bg-slate-700"],
    [data-admin-theme="light"] button[class*="bg-slate-800"],
    .admin-theme-light button[class*="bg-slate-800"],
    [data-admin-theme="light"] a[class*="bg-slate-700"],
    .admin-theme-light a[class*="bg-slate-700"],
    [data-admin-theme="light"] a[class*="bg-slate-800"],
    .admin-theme-light a[class*="bg-slate-800"] {
      background-color: #F6DFE7 !important;
      color: #8C374A !important;
      border: 1px solid #EAC9D1 !important;
    }

    [data-admin-theme="light"] button[class*="bg-slate-700"]:hover,
    .admin-theme-light button[class*="bg-slate-700"]:hover,
    [data-admin-theme="light"] button[class*="bg-slate-800"]:hover,
    .admin-theme-light button[class*="bg-slate-800"]:hover,
    [data-admin-theme="light"] a[class*="bg-slate-700"]:hover,
    .admin-theme-light a[class*="bg-slate-700"]:hover,
    [data-admin-theme="light"] a[class*="bg-slate-800"]:hover,
    .admin-theme-light a[class*="bg-slate-800"]:hover {
      background-color: #A84358 !important;
      color: #ffffff !important;
      border-color: #A84358 !important;
    }

    /* 8. Item Action Icon Buttons (Edit, View) */
    [data-admin-theme="light"] a[class*="hover:bg-slate-700"],
    .admin-theme-light a[class*="hover:bg-slate-700"],
    [data-admin-theme="light"] button[class*="hover:bg-slate-700"],
    .admin-theme-light button[class*="hover:bg-slate-700"],
    [data-admin-theme="light"] [class*="hover:bg-slate-800"]:hover,
    .admin-theme-light [class*="hover:bg-slate-800"]:hover,
    [data-admin-theme="light"] [class*="hover:bg-slate-700"]:hover,
    .admin-theme-light [class*="hover:bg-slate-700"]:hover {
      background-color: #F6DFE7 !important;
      color: #8C374A !important;
    }

    /* 9. Trash & Delete Action Buttons */
    [data-admin-theme="light"] button[class*="hover:text-red-400"],
    .admin-theme-light button[class*="hover:text-red-400"],
    [data-admin-theme="light"] button[title*="Delete"],
    .admin-theme-light button[title*="Delete"],
    [data-admin-theme="light"] button[title*="delete"],
    .admin-theme-light button[title*="delete"] {
      color: #88727A !important;
    }

    [data-admin-theme="light"] button[class*="hover:text-red-400"]:hover,
    .admin-theme-light button[class*="hover:text-red-400"]:hover,
    [data-admin-theme="light"] button[title*="Delete"]:hover,
    .admin-theme-light button[title*="Delete"]:hover,
    [data-admin-theme="light"] button[title*="delete"]:hover,
    .admin-theme-light button[title*="delete"]:hover {
      background-color: #FEE2E2 !important;
      color: #DC2626 !important;
    }

    /* 10. Badges & Category Tags */
    [data-admin-theme="light"] [class*="bg-rose-950"],
    .admin-theme-light [class*="bg-rose-950"],
    [data-admin-theme="light"] [class*="bg-rose-900"],
    .admin-theme-light [class*="bg-rose-900"] {
      background-color: #FDF0F4 !important;
      color: #8C374A !important;
      border: 1px solid #EAC9D1 !important;
    }

    [data-admin-theme="light"] .text-rose-400,
    .admin-theme-light .text-rose-400,
    [data-admin-theme="light"] .text-rose-300,
    .admin-theme-light .text-rose-300 {
      color: #A84358 !important;
    }

    [data-admin-theme="light"] [class*="bg-emerald-950"],
    .admin-theme-light [class*="bg-emerald-950"] {
      background-color: #ECFDF5 !important;
      color: #047857 !important;
      border: 1px solid #A7F3D0 !important;
    }

    [data-admin-theme="light"] .text-emerald-400,
    .admin-theme-light .text-emerald-400,
    [data-admin-theme="light"] .text-emerald-300,
    .admin-theme-light .text-emerald-300 {
      color: #047857 !important;
    }

    [data-admin-theme="light"] [class*="bg-amber-950"],
    .admin-theme-light [class*="bg-amber-950"] {
      background-color: #FFFBEB !important;
      color: #B45309 !important;
      border: 1px solid #FDE68A !important;
    }

    [data-admin-theme="light"] .text-amber-400,
    .admin-theme-light .text-amber-400 {
      color: #B45309 !important;
    }

    /* Sky / Blue Badges */
    [data-admin-theme="light"] [class*="bg-blue-950"],
    .admin-theme-light [class*="bg-blue-950"],
    [data-admin-theme="light"] [class*="bg-sky-950"],
    .admin-theme-light [class*="bg-sky-950"] {
      background-color: #F0F9FF !important;
      color: #0369A1 !important;
      border: 1px solid #BAE6FD !important;
    }

    /* Purple / Violet Badges */
    [data-admin-theme="light"] [class*="bg-purple-950"],
    .admin-theme-light [class*="bg-purple-950"],
    [data-admin-theme="light"] [class*="bg-violet-950"],
    .admin-theme-light [class*="bg-violet-950"] {
      background-color: #FAF5FF !important;
      color: #7E22CE !important;
      border: 1px solid #E9D5FF !important;
    }

    /* 11. Form Inputs & Selects */
    [data-admin-theme="light"] input,
    .admin-theme-light input,
    [data-admin-theme="light"] select,
    .admin-theme-light select,
    [data-admin-theme="light"] textarea,
    .admin-theme-light textarea {
      background-color: #ffffff !important;
      border-color: #E8D3DC !important;
      color: #2D1B1B !important;
    }

    [data-admin-theme="light"] input::placeholder,
    .admin-theme-light input::placeholder,
    [data-admin-theme="light"] textarea::placeholder,
    .admin-theme-light textarea::placeholder {
      color: #A38D95 !important;
    }

    /* 12. Tables */
    [data-admin-theme="light"] table,
    .admin-theme-light table,
    [data-admin-theme="light"] tbody,
    .admin-theme-light tbody,
    [data-admin-theme="light"] tbody tr,
    .admin-theme-light tbody tr {
      background-color: #ffffff !important;
      color: #2D1B1B !important;
    }

    [data-admin-theme="light"] tbody tr:hover,
    .admin-theme-light tbody tr:hover {
      background-color: #FCF4F7 !important;
    }

    [data-admin-theme="light"] thead tr,
    .admin-theme-light thead tr {
      background-color: #FCF4F7 !important;
      border-color: #F1DFE5 !important;
    }

    [data-admin-theme="light"] thead th,
    .admin-theme-light thead th {
      color: #45363B !important;
    }

    [data-admin-theme="light"] td span.text-white,
    .admin-theme-light td span.text-white,
    [data-admin-theme="light"] td p.text-white,
    .admin-theme-light td p.text-white,
    [data-admin-theme="light"] td div.text-white,
    .admin-theme-light td div.text-white,
    [data-admin-theme="light"] table span.text-white,
    .admin-theme-light table span.text-white,
    [data-admin-theme="light"] table p.text-white,
    .admin-theme-light table p.text-white,
    [data-admin-theme="light"] table .text-white:not(button):not(button *):not(a):not(a *),
    .admin-theme-light table .text-white:not(button):not(button *):not(a):not(a *) {
      color: #2D1B1B !important;
    }

    /* 12. Protection for Admin Theme Toggle (Preserve dedicated pill styling) */
    [data-admin-theme="light"] .admin-theme-toggle-root button,
    .admin-theme-light .admin-theme-toggle-root button {
      background-color: transparent !important;
      border-color: transparent !important;
      color: inherit !important;
      box-shadow: none !important;
    }

    [data-admin-theme="light"] .admin-theme-toggle-root button:has(span),
    .admin-theme-light .admin-theme-toggle-root button:has(span) {
      background-color: transparent !important;
    }

    [data-admin-theme="light"] .admin-theme-toggle-root button.bg-white,
    .admin-theme-light .admin-theme-toggle-root button.bg-white {
      background-color: #ffffff !important;
      color: #2D1B1B !important;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08) !important;
      border: 1px solid #EAC9D1 !important;
    }
  `;

  return <style id="admin-global-theme-styles" dangerouslySetInnerHTML={{ __html: css }} />;
}
