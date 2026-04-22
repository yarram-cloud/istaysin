export default async function TestPage({ params }: { params: { slug: string; locale: string } }) {
  return (
    <div style={{ padding: 40 }}>
      <h1>Test Page</h1>
      <p>Locale: {params.locale}</p>
      <p>Slug: {params.slug}</p>
    </div>
  );
}
