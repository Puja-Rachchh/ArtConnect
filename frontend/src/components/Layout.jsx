import Header from './Header.jsx';

export default function Layout({ children }) {
  return (
    <>
      <Header />
      <main style={{ paddingTop: '4.5rem' }}>{children}</main>
      <footer style={{ textAlign:'center', padding:'3rem 1rem', opacity:.6, fontSize:'.75rem' }}>
        © {new Date().getFullYear()} ArtConnect • Crafted for demo
      </footer>
    </>
  );
}
