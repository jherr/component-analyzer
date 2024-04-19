import Image from 'next/image';

interface FooterCreditsProps {
  href: string;
  logoSrc: string;
  logoAlt: string;
  logoWidth: number;
  logoHeight: number;
}

const FooterCredits: React.FC<FooterCreditsProps> = ({ href, logoSrc, logoAlt, logoWidth, logoHeight }) => (
  <div className='fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:h-auto lg:w-auto lg:bg-none'>
    <a
      className='pointer-events-none flex place-items-center gap-2 p-8 lg:pointer-events-auto lg:p-0'
      href={href}
      target='_blank'
      rel='noopener noreferrer'
    >
      {'By '}
      <Image
        src={logoSrc}
        alt={logoAlt}
        className='dark:invert'
        width={logoWidth}
        height={logoHeight}
        priority
      />
    </a>
  </div>
);

export default FooterCredits;
