export default function History({ history }) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">📜 History</h2>
      <p className="mb-4">See all your past searched numbers here.</p>
      <ul className="list-disc pl-6">
        {history.length === 0 ? (
          <p>No searches yet.</p>
        ) : (
          history.map((num, index) => (
            <li key={index}>{num}</li>
          ))
        )}
      </ul>
    </div>
  );
}
