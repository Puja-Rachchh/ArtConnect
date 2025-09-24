import Header from './Header.jsx';

export default function Layout({ children }) {
  return (
    <>
      <Header />
      <main style={{ paddingTop: '4.5rem' }}>{children}</main>
    </>
  );
}
