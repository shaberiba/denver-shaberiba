import { DiscordFilled, FacebookFilled } from "@ant-design/icons";
import { FacebookEventsCalendar } from "./Calendar";
import { useTheme } from "./App";

const Header = () => (
  <header className="site-header anim-0">
    <div className="header-inner">
      <div className="header-left">
        <p className="header-eyebrow">Denver, Colorado</p>
        <h1 className="header-name-jp">しゃべり場</h1>
        <p className="header-name-en">Shaberiba</p>
      </div>
    </div>
    <p className="header-tagline">
      Japanese Language Club &nbsp;·&nbsp; 1st &amp; 3rd Thursday of every month
    </p>
  </header>
);

const ThemeToggle = () => {
  const { isDark, toggle } = useTheme();
  return (
    <button
      className="theme-toggle"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? '☀' : '☾'}
    </button>
  );
};

const InfoPanel = () => (
  <div className="panel anim-1">
    <div className="panel-heading">
      <h2 className="panel-heading-en">About Us</h2>
      <span className="panel-heading-jp">私たちについて</span>
    </div>
    <hr className="panel-rule" />
    <div className="info-body">
      <p>
        We are a community of both native and learning Japanese speakers throughout the Denver metro region.
        All levels welcome — whether you just started or grew up speaking Japanese.
      </p>
      <p>
        We meet every <strong>1st and 3rd Thursday</strong> of each month at{' '}
        <a
          href="https://www.kokopellibrewing.com/"
          target="_blank"
          rel="noreferrer"
        >
          Kokopelli Beer Company
        </a>{' '}
        in Westminster.
      </p>
    </div>
    <div className="info-map">
      <iframe
        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d5240.095335863845!2d-105.0652049!3d39.858461199999994!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x876b89b091d055d9%3A0x83b00ba06cec466d!2sKokopelli%20Beer%20Company!5e1!3m2!1sen!2sus!4v1756104978484!5m2!1sen!2sus"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="Kokopelli Beer Company location"
      />
    </div>
  </div>
);

export const HomePage = () => (
  <div className="page">
    <Header />
    <main className="page-main">
      <InfoPanel />
      <FacebookEventsCalendar />
    </main>
    <footer className="site-footer">
      <div className="footer-links">
        <span className="footer-text">Follow us</span>
        <a
          className="footer-link"
          href="https://www.facebook.com/broomfieldshaberiba"
          target="_blank"
          rel="noreferrer"
          style={{ color: '#1877F2' }}
          aria-label="Facebook"
        >
          <FacebookFilled />
        </a>
        <a
          className="footer-link"
          href="https://discord.gg/NSyUXR586Y"
          target="_blank"
          rel="noreferrer"
          style={{ color: '#5865F2' }}
          aria-label="Discord"
        >
          <DiscordFilled />
        </a>
      </div>
      <ThemeToggle />
    </footer>
  </div>
);
