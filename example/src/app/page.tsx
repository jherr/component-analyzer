import React from 'react';
import Image from 'next/image';
import RootLayout from '@/components/layout/RootLayout';
import GradientBackground from '@/components/ui/GradientBackground';
import LinkCard from '@/components/ui/LinkCard';
import FooterCredits from '@/components/layout/FooterCredits';

export default function Home() {
  return (
    <RootLayout>
      <main className="flex min-h-screen flex-col items-center justify-between p-24">
        <GradientBackground>
          <Image
            className="relative dark:drop-shadow-[0_0_0.3rem_#ffffff70] dark:invert"
            src="/next.svg"
            alt="Next.js Logo"
            width={180}
            height={37}
            priority
          />
        </GradientBackground>

        <div className="mb-32 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-4 lg:text-left">
          <LinkCard
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
            title="Docs"
            description="Find in-depth information about Next.js features and API."
            linkText="-&gt;"
          />

          <LinkCard
            href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            title="Learn"
            description="Learn about Next.js in an interactive course with quizzes!"
            linkText="-&gt;"
          />

          <LinkCard
            href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
            title="Templates"
            description="Explore starter templates for Next.js."
            linkText="-&gt;"
          />

          <LinkCard
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
            title="Deploy"
            description="Instantly deploy your Next.js site to a shareable URL with Vercel."
            linkText="-&gt;"
          />
        </div>

        <FooterCredits
          href="https://vercel.com?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          logoSrc="/vercel.svg"
          logoAlt="Vercel Logo"
          logoWidth={100}
          logoHeight={24}
        />
      </main>
    </RootLayout>
  );
}
