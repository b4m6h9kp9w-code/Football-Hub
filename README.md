rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ── Helper functions ──────────────────────────────────────
    function isSignedIn() {
      return request.auth != null;
    }

    function getCoach() {
      return get(/databases/$(database)/documents/coaches/$(request.auth.uid)).data;
    }

    function isHeadCoach() {
      return isSignedIn() && getCoach().role == 'head_coach';
    }

    function isCoach() {
      return isSignedIn() && getCoach().role in ['head_coach', 'assistant'];
    }

    // ── Coaches ───────────────────────────────────────────────
    match /coaches/{coachId} {
      allow read: if isCoach();
      allow write: if isHeadCoach();
    }

    // ── Players / Roster ──────────────────────────────────────
    match /players/{playerId} {
      allow read: if true;          // Players can read (no auth)
      allow write: if isHeadCoach();
    }

    // ── Formations ────────────────────────────────────────────
    match /formations/{formationId} {
      allow read: if true;
      allow create, update: if isCoach();
      allow delete: if isHeadCoach();
    }

    // ── Plays ─────────────────────────────────────────────────
    match /plays/{playId} {
      allow read: if true;          // Published plays readable by players
      allow create: if isCoach();
      allow update: if isCoach() &&
        // Assistants can only edit drafts, not published plays
        (isHeadCoach() ||
         resource.data.status in ['draft', 'pending_approval']);
      allow delete: if isHeadCoach();
    }

    // ── Game Plans ────────────────────────────────────────────
    match /game_plans/{planId} {
      allow read: if true;
      allow write: if isHeadCoach();
    }

    // ── Opponents ─────────────────────────────────────────────
    match /opponents/{opponentId} {
      allow read: if isCoach();
      allow write: if isHeadCoach();
    }

    // ── Settings ──────────────────────────────────────────────
    match /settings/{settingId} {
      allow read: if isCoach();
      allow write: if isHeadCoach();
    }
  }
}
