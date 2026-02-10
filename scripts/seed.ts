import { createPlan, addProvocations, addComment } from '../src/server/db.js';

const { plan_id, section_ids } = createPlan('Authentication System Redesign', [
  {
    title: 'Overview',
    content: `## Goals\n\nRedesign the authentication system to support:\n\n- OAuth 2.0 providers (Google, GitHub)\n- Magic link email login\n- Session-based auth with secure cookies\n- Rate limiting on all auth endpoints\n\n## Non-Goals\n\n- Biometric authentication\n- Hardware key support (phase 2)`,
  },
  {
    title: 'Architecture',
    content: `## Components\n\n### Auth Service\nStandalone microservice handling all authentication concerns.\n\n### Token Store\nRedis-backed store for refresh tokens and session data.\n\n### Middleware\nExpress middleware for route protection:\n\n\`\`\`typescript\napp.use('/api/protected', authMiddleware);\n\`\`\`\n\n## Data Flow\n\n1. User initiates login\n2. Auth service validates credentials\n3. JWT access token + refresh token issued\n4. Access token stored in memory, refresh in httpOnly cookie`,
  },
  {
    title: 'Database Changes',
    content: `## New Tables\n\n- \`auth_providers\` — OAuth provider configurations\n- \`user_sessions\` — Active sessions with device info\n- \`login_attempts\` — Rate limiting and audit trail\n\n## Migration Strategy\n\n1. Add new tables (non-breaking)\n2. Dual-write to old and new auth tables\n3. Migrate existing sessions\n4. Remove old auth tables`,
  },
  {
    title: 'Security Considerations',
    content: `## Token Security\n\n- Access tokens: 15 min expiry, RS256 signed\n- Refresh tokens: 7 day expiry, rotated on use\n- CSRF protection via double-submit cookie pattern\n\n## Rate Limiting\n\n- 5 failed attempts → 15 min lockout per IP\n- 10 failed attempts → account-level lockout (email verification required)\n\n## Audit Logging\n\nAll auth events logged with:\n- IP address, user agent, timestamp\n- Success/failure status\n- Geographic location (via IP lookup)`,
  },
]);

// Add some provocations
addProvocations(section_ids[1], [
  { type: 'what_if', text: 'What if Redis goes down? Do users lose their sessions immediately, or is there a fallback?' },
  { type: 'devils_advocate', text: 'JWTs are stateless but you\'re storing them in Redis — are you getting the worst of both worlds?' },
  { type: 'consider', text: 'Have you considered using signed cookies instead of JWTs to avoid token size issues in headers?' },
]);

addProvocations(section_ids[3], [
  { type: 'opportunity', text: 'Could you use WebAuthn as a progressive enhancement for users who support it?' },
  { type: 'what_if', text: 'What if an attacker gets access to your signing keys? How do you rotate them without invalidating all sessions?' },
]);

// Add some comments
addComment(section_ids[0], 'Should we support SAML for enterprise customers?', true, null);
addComment(section_ids[2], 'The dual-write migration approach is good. Make sure to add monitoring for write discrepancies.', false, null);

console.error('[seed] Created plan:', plan_id);
console.error('[seed] Section IDs:', section_ids);
console.error('[seed] Done! Open http://127.0.0.1:3456/#/plans/' + plan_id);
