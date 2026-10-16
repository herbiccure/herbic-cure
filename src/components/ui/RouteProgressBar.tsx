'use client';

import React from 'react';
import NextTopLoader from 'nextjs-toploader';

export default function RouteProgressBar() {
  return (
    <NextTopLoader
      color="#8C3A4F"
      initialPosition={0.08}
      crawlSpeed={200}
      height={3}
      crawl={true}
      showSpinner={false}
      easing="ease"
      speed={200}
      shadow="0 0 12px #8C3A4F, 0 0 6px #e8b159"
    />
  );
}
