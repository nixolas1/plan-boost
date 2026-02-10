# plan-boost

**Collaborative planning interface for Claude** — turn large implementation tasks into reviewable plans with real-time feedback.

## What is this?

`plan-boost` is an MCP server that lets Claude create structured implementation plans and get your feedback before writing code. When Claude needs to tackle a complex task, it can:

1. **Create a plan** with sections (context, approach, file changes, verification steps)
2. **Open a browser UI** where you review the plan in real-time
3. **Get your feedback** — you can edit sections, add comments, or respond to provocations Claude adds
4. **Iterate** based on your input before implementing

Think of it as a **collaborative design doc** that lives in your terminal workflow. Instead of Claude making assumptions about complex changes, you approve the approach first.

## Why use this?

- **Prevent wasted work** — catch architectural misunderstandings before Claude writes hundreds of lines
- **Stay in control** — review and adjust the plan before execution, not after
- **Rich collaboration** — edit sections directly, comment on specific parts, answer "what if?" prompts
- **Real-time sync** — changes in the browser appear instantly via WebSocket
- **Diff tracking** — see what changed between revisions of each section

Great for: refactoring, new feature design, debugging strategy, architecture decisions.

## Install

**Option 1: Quick install** (requires Claude Code CLI)

```bash
claude mcp add plan-boost -- npx -y plan-boost  
```

**Option 2: Manual install**

Add to your MCP client config (e.g. `~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "boost": {
      "command": "npx",
      "args": ["-y", "plan-boost"]
    }
  }
}
```

Restart Claude Desktop.

## How to use

### 1. Ask Claude to create a plan

```
"I need to refactor the authentication system to support OAuth.
Can you create a plan for this?"
```

Claude will use the `create_plan` tool, which:
- Creates a plan in SQLite (`~/.boost/boost.db`)
- Starts a web server on `localhost:3456`
- Opens your browser to the plan UI
- Returns the plan URL

### 2. Review in the browser

The UI shows:
- **Sections** — each part of the plan (markdown with syntax highlighting)
- **Edit mode** — click any section to edit directly
- **Comments** — add questions or feedback inline
- **Provocations** — "what if?" challenges Claude added (optional)
- **History** — see diffs of section changes

### 3. Submit your review

Click **Submit Review** when done. Claude receives:
- All your edits
- All your comments
- Your responses to provocations

### 4. Claude iterates

Claude reads your feedback with `get_feedback` and:
- Answers your comments with `answer_comments`
- Updates sections based on edits with `update_section`
- Adds follow-up provocations if needed
- Waits for your next review with `wait_for_review`

### 5. Approve and implement

Once you're happy with the plan, tell Claude to proceed. The plan stays in the DB for reference.

## MCP Tools

| Tool | Description |
|------|-------------|
| `create_plan` | Create a new plan with sections for collaborative review |
| `update_section` | Update a section's title or content (saves previous content for diff view) |
| `answer_comments` | Answer user questions/comments on plan sections |
| `add_provocations` | Add thought-provoking challenges to a section |
| `get_feedback` | Get all user feedback (edits, comments, provocation replies) for a plan |
| `get_plan_status` | Quick check on plan status and pending feedback counts |
| `wait_for_review` | Set plan to in_review and wait for user to submit their review |

## Example workflow

**You:** "Add TypeScript to this JavaScript project"

**Claude:** Creates a plan with sections:
- Context (current build setup)
- Approach (incremental migration strategy)
- File changes (tsconfig, package.json, renamed files)
- Testing strategy
- Rollout plan

Browser opens. You review and:
- Edit "Approach" to prefer `allowJs: true` for gradual migration
- Comment on "Testing strategy": "Do we need to update CI?"
- Respond to provocation: "What if we hit type errors in dependencies?" → "Use @types packages first"

**Claude:** Reads feedback, answers your CI question, updates the approach section.

**You:** Approve, Claude implements.

## Troubleshooting

**Browser doesn't open automatically**

Manually visit `http://localhost:3456` — the plan URL is in Claude's response.

**Port 3456 already in use**

Another instance is running. Kill it or change the port in `src/mcp-server.ts` (rebuild required).

**Database location**

Plans are stored in `~/.boost/boost.db`. Delete this file to reset.

**WebSocket connection failed**

Check that the web server started (look for `[boost] Web server listening` in stderr). Refresh the browser.

## Development

```bash
npm install
npm run build
npm start          # run MCP server on stdio
npm run dev:ui     # Vite dev server for UI
npm run seed       # populate test data
```

## Architecture

- **MCP server** (stdio) — exposes tools to Claude
- **Express + WebSocket** (localhost:3456) — serves UI and pushes real-time updates
- **SQLite** (`~/.boost/boost.db`) — stores plans, sections, comments, provocations
- **Svelte 5 frontend** — reactive UI with markdown editing and diff view

## License

MIT
