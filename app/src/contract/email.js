// Builds one message to the client with every change the freelancer wants.
export function buildEmail(clauses) {
  const asks = clauses.filter((c) => c.result && c.result.level !== 'green' && c.result.pushback)
  if (!asks.length) return ''
  const items = asks.map((c, i) => `${i + 1}. ${c.title}\n${c.result.pushback}`).join('\n\n')
  return `Hi,

Thanks for sending the agreement over. I've read it through and I'm keen to get started. Before I sign, I'd like to suggest a few changes:

${items}

Happy to talk any of these through on a call.

Best,
`
}
