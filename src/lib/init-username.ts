/**
 * YieldRouter — .init Username Integration
 *
 * Resolve Initia .init usernames to wallet addresses and vice versa.
 * Uses InterwovenKit's built-in useUsernameQuery hook for resolution.
 *
 * Example: "farouk.init" → "init1abc..."
 */

// ─── Types ────────────────────────────────────────────────────────────

export interface InitUsername {
  username: string;         // e.g. "farouk.init"
  address: string;          // resolved init1... address
  resolved: boolean;
}

export interface UsernameValidation {
  valid: boolean;
  error?: string;
}

// ─── Validation ───────────────────────────────────────────────────────

const USERNAME_REGEX = /^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]\.init$/;

/**
 * Validate a .init username format
 * Rules:
 * - Must end with .init
 * - 3-64 chars (excluding .init)
 * - Lowercase alphanumeric + hyphens
 * - Cannot start/end with hyphen
 */
export function validateUsername(username: string): UsernameValidation {
  if (!username.endsWith(".init")) {
    return { valid: false, error: "Username must end with .init" };
  }

  const label = username.slice(0, -5); // Remove .init

  if (label.length < 3) {
    return { valid: false, error: "Username must be at least 3 characters" };
  }

  if (label.length > 64) {
    return { valid: false, error: "Username must be at most 64 characters" };
  }

  if (!USERNAME_REGEX.test(username)) {
    return {
      valid: false,
      error: "Username can only contain lowercase letters, numbers, and hyphens",
    };
  }

  return { valid: true };
}

/**
 * Format a raw address for display, preferring .init username
 */
export function formatAddress(
  address: string,
  username?: string | null
): string {
  if (username) return username;
  if (!address) return "";
  return `${address.slice(0, 10)}...${address.slice(-6)}`;
}

/**
 * Parse a user input that might be a .init username or an address
 */
export function parseRecipient(input: string): {
  type: "username" | "address" | "invalid";
  value: string;
} {
  const trimmed = input.trim().toLowerCase();

  if (trimmed.endsWith(".init")) {
    const validation = validateUsername(trimmed);
    if (validation.valid) {
      return { type: "username", value: trimmed };
    }
    return { type: "invalid", value: trimmed };
  }

  // Check if it looks like an init1 address
  if (trimmed.startsWith("init1")) {
    return { type: "address", value: trimmed };
  }

  // Check if it looks like a hex address (EVM)
  if (trimmed.startsWith("0x") && trimmed.length === 42) {
    return { type: "address", value: trimmed };
  }

  return { type: "invalid", value: trimmed };
}
