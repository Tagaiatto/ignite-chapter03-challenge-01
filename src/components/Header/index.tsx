import Link from 'next/link';
import styles from './header.module.scss';

export default function Header(): JSX.Element {
  return (
    <header className={styles.container}>
      <Link href="/">
        <button type="button">
          <img src="/images/logo.png" alt="logo" />
        </button>
      </Link>
    </header>
  );
}
