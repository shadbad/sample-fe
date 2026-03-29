#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MCP_JSON="$SCRIPT_DIR/.vscode/mcp.json"

# ── 1. Pull the Docker image ────────────────────────────────────────────────
echo "Pulling mcp/filesystem:1.0.2 ..."
docker pull mcp/filesystem:1.0.2

# ── 2. Ask for the backend project folder ───────────────────────────────────
while true; do
  read -rp "Enter the path to the backend project folder (absolute or relative): " BACKEND_FOLDER
  BACKEND_FOLDER="${BACKEND_FOLDER/#\~/$HOME}"   # expand leading ~
  if [[ -d "$BACKEND_FOLDER" ]]; then
    BACKEND_FOLDER="$(cd "$BACKEND_FOLDER" && pwd)"  # resolve to absolute
    break
  fi
  echo "  Directory not found: '$BACKEND_FOLDER'. Please try again."
done

echo "Using backend folder: $BACKEND_FOLDER"

# ── 3. Patch .vscode/mcp.json ───────────────────────────────────────────────
python3 - "$MCP_JSON" "$BACKEND_FOLDER" <<'PYEOF'
import sys, json, re

mcp_json_path = sys.argv[1]
backend_folder = sys.argv[2]
mount_dst = "/projects/backend"

with open(mcp_json_path, "r") as f:
    raw = f.read()

# Strip // … and /* … */ comments so json.loads doesn't choke
raw_no_comments = re.sub(r"//[^\n]*", "", raw)
raw_no_comments = re.sub(r"/\*.*?\*/", "", raw_no_comments, flags=re.DOTALL)

data = json.loads(raw_no_comments)

data.setdefault("servers", {})["filesystem"] = {
    "command": "docker",
    "args": [
        "run", "-i", "--rm",
        "--mount", f"type=bind,src={backend_folder},dst={mount_dst},readonly",
        "mcp/filesystem:1.0.2",
        mount_dst
    ]
}

# Re-serialize (preserve the leading comment line manually)
comment_line = "  // For more information, visit: https://angular.dev/ai/mcp\n"
serialized = json.dumps(data, indent=2)
# Inject comment after the opening brace
output = serialized[:2] + "\n" + comment_line + serialized[2:]

with open(mcp_json_path, "w") as f:
    f.write(output)

print("mcp.json updated successfully.")
PYEOF

echo ""
echo "Done! The 'filesystem' MCP server has been added to .vscode/mcp.json."
echo "Restart VS Code (or reload the MCP servers) to pick up the change."
