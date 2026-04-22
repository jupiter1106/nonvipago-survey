export const metadata = { title: "Sondaggio NonViPago" };
export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <body style={{ margin: 0, background: "#f7f7f5", minHeight: "100vh" }}>
        {children}
      </body>
    </html>
  );
}
