import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Calendar, User, ArrowLeft, ArrowRight, Share2 } from 'lucide-react';
import { sanitizeHtml } from '@/lib/sanitizeHtml';

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;

  const post = await prisma.blogPost.findUnique({
    where: { slug },
  });

  if (!post || !post.published) {
    notFound();
  }

  return (
    <div className="bg-[#FCF8F9] min-h-screen py-10 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/how-to-use"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#A84358] hover:underline uppercase tracking-wider mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to How to Use & Guides</span>
        </Link>

        <div className="bg-white rounded-3xl overflow-hidden border border-stone-200 shadow-sm p-6 sm:p-12 space-y-8">
          <div>
            <span className="bg-rose-100 text-[#A84358] text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              {post.category}
            </span>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold font-serif text-stone-900 mt-4 leading-tight">
              {post.title}
            </h1>

            <div className="flex items-center gap-4 text-xs text-stone-400 mt-4 pb-6 border-b border-stone-100">
              <span className="flex items-center gap-1 text-stone-700 font-semibold">
                <User className="w-4 h-4 text-rose-700" />
                {post.author}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(post.publishedAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>

          {post.featuredImage && (
            <div className="relative w-full aspect-16/9 sm:aspect-21/9 rounded-2xl overflow-hidden bg-stone-100 shadow-sm">
              <Image
                src={post.featuredImage}
                alt={post.title}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 896px"
                className="object-cover"
              />
            </div>
          )}

          <div
            className="prose prose-stone max-w-none text-stone-700 leading-relaxed text-sm sm:text-base space-y-4"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }}
          />

          {/* Bottom Banner */}
          <div className="mt-12 p-6 rounded-2xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-base font-bold text-[#A84358]">Experience 21 Herbs In Real Life</h4>
              <p className="text-xs text-stone-600 mt-1">Get our best selling hair growth combo delivered to your doorstep.</p>
            </div>
            <Link
              href="/collections/best-sellers"
              className="px-6 py-3 bg-[#A84358] hover:bg-[#45363B] text-white rounded-xl text-xs font-bold uppercase tracking-wider shrink-0"
            >
              Shop Best Sellers
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
