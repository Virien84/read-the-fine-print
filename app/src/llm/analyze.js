// Known freelance-contract traps, given to the model so a small model
// doesn't have to rely on its own judgement alone.
const TRAPS = `- Payment terms longer than 30 days (net 45/60/90), or payment only "upon client approval".
- Unlimited revisions, or revisions without a cap or extra fee.
- Intellectual property (category "ip") transferred on signing or on delivery, before full payment.
- Non-compete or non-solicit clauses that stop the freelancer working in their field.
- Unlimited liability or indemnification of the client for anything.
- Automatic renewal, especially with a long notice period (more than 30 days) to cancel it.
- Client can terminate at any time with no obligation to pay for work already done (no kill fee). "No further obligation to Contractor" after termination is this trap.
- Late payment with no interest or penalty for the client.
- Vague scope ("and any related tasks") that invites scope creep.`

export const SCHEMA = {
  type: 'object',
  properties: {
    category: {
      type: 'string',
      enum: ['payment', 'ip', 'revisions', 'termination', 'non_compete', 'liability', 'renewal', 'scope', 'other'],
    },
    explanation: { type: 'string' },
    level: { type: 'string', enum: ['red', 'yellow', 'green'] },
    pushback: { type: 'string' },
  },
  // Order matters: the model explains the clause before it commits to a level.
  required: ['category', 'explanation', 'level', 'pushback'],
}

const SYSTEM = `You review contract clauses for freelancers (developers, designers, writers).
For the clause you are given, answer in this order:
- category: what the clause is about.
- explanation: one or two plain-English sentences telling the freelancer what this means for them in practice, with a concrete example of what could go wrong.
- level: "red" if it matches a known trap or could cost the freelancer money or rights, and they should not sign without a change; "yellow" if it is common but worth negotiating; "green" only if it is clearly fair to the freelancer.
- pushback: a short, polite message the freelancer can send the client, written in first person ("Could we change ... to ..."), proposing a fairer wording. Empty string if level is green.
  The change must be better for the freelancer than the original, never worse: get paid sooner, a SHORTER notice period to cancel or not renew, fewer revisions, a lower liability cap, a shorter or narrower non-compete. If the clause says 60 days' notice, ask for fewer days (e.g. 30), not more.

Known traps to look for:
${TRAPS}

Answer only with JSON.`

export async function analyzeClause(engine, clause) {
  const started = performance.now()
  const reply = await engine.chat.completions.create({
    messages: [
      { role: 'system', content: SYSTEM },
      { role: 'user', content: `Clause:\n"""\n${clause}\n"""` },
    ],
    temperature: 0,
    response_format: { type: 'json_object', schema: JSON.stringify(SCHEMA) },
  })
  const raw = reply.choices[0].message.content
  return {
    result: JSON.parse(raw),
    raw,
    seconds: (performance.now() - started) / 1000,
    usage: reply.usage,
  }
}
