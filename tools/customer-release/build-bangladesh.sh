#!/usr/bin/env bash
#
# Build the Bangladesh source release.
#
#   tools/customer-release/build-bangladesh.sh [ref] [outdir]
#   tools/customer-release/build-bangladesh.sh master
#
# Deliberately simple: export a clean tree from a git ref and delete whole files and
# directories belonging to other partners. It never edits source, so a shared file that
# happens to mention another country is left alone - that is tracked manually.
#
# Nothing is pushed. Publishing is a separate, deliberate step.

set -euo pipefail

REF="${1:-master}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$HERE/../.." && pwd)"
OUT="${2:-$REPO/.release/bangladesh}"

step() { printf '\n\033[1m==> %s\033[0m\n' "$1"; }

# ---------------------------------------------------------------------------
# What Bangladesh does NOT get.
#
# Everything here is deletable outright: nothing outside these paths statically
# imports them. Partner plugins qualify because loadPlugin.js discovers plugins by
# scanning its directory - if you make that map static again, deleting them breaks
# API startup.
#
# Four blocks of other-partner code are deliberately NOT listed here, because deleting
# them would break the release. Do not add them without doing the refactor first:
#
#   web/src/pages/PkDashboard/     the shared XDRFLQResistanceGraph component - used by
#                                  the main dashboard in pages/Dashboard/status/Status.jsx
#                                  - imports its i18n from PkDashboard.Messages. The
#                                  dashboard routes are permission-gated and unreachable.
#   api/src/deviceApi/mozambique/  statically imported by the route table in
#                                  api/src/deviceApi/endpoints.js.
#   api/seeds/development/         the shared test corpus is built on other partners' demo
#   api/seeds/test/                data (contract tests log in as myanmar_admin, demo
#                                  clinics come from Malawi geography). Deleting it ships
#                                  a test suite that cannot pass.
#   api/migrations/*_myanmar*.js   generic schema DDL merely named after the partner that
#                                  funded it. knex tracks applied migrations by filename,
#                                  so removing or renaming one breaks every future upgrade.
# ---------------------------------------------------------------------------

DELETE=(
  # -- other partners' seed data: the bulk of the maintenance drag, ~350 files --
  api/seeds/angola api/seeds/chad api/seeds/eswatini api/seeds/ghana
  api/seeds/lesotho api/seeds/malawi api/seeds/mozambique api/seeds/myanmar
  api/seeds/nigeria api/seeds/pakistan api/seeds/png api/seeds/tanzania
  api/seeds/ukraine api/seeds/zimbabwe

  # -- partner plugins (discovered dynamically, so removal needs no code edit) --
  api/src/plugin/partner/Angola api/src/plugin/partner/Lesotho
  api/src/plugin/partner/Malawi api/src/plugin/partner/Myanmar
  api/src/plugin/partner/Nigeria api/src/plugin/partner/Pakistan
  api/src/plugin/plugins/angolaPlugin.js api/src/plugin/plugins/lesothoPlugin.js
  api/src/plugin/plugins/malawiPlugin.js api/src/plugin/plugins/myanmarPlugin.js
  api/src/plugin/plugins/nigeriaPlugin.js api/src/plugin/plugins/pakistanPlugin.js

  # -- per-partner report code: resolved at runtime from Report.moduleName, no imports --
  api/src/result/serviceReportChad api/src/result/serviceReportEswatini
  api/src/result/serviceReportMalawi api/src/result/serviceReportMyanmar
  api/src/device/serviceReportsLesotho api/src/device/serviceReportsPakistan
  api/src/device/serviceReportsZimbabwe

  # -- per-partner report templates (pk_ Pakistan, sz_ Eswatini, zw_ Zimbabwe) --
  api/templates/pk_annual_utilization_rates
  api/templates/pk_missing_cartridges_report
  api/templates/pk_xpert_site_detailed_report
  api/templates/pk_xpert_site_summary_site_wise_report
  api/templates/pk_xpert_workload_summary_report
  api/templates/sz_mtb_stats api/templates/sz_sms_stats
  api/templates/zw_device_performance

  # -- per-partner custom field definitions (Bangladesh keeps its own four) --
  api/src/forms/formsDefinition/CustomFields_Chad_HivQual.json
  api/src/forms/formsDefinition/CustomFields_Ghana.json
  api/src/forms/formsDefinition/CustomFields_Lesotho.json
  api/src/forms/formsDefinition/CustomFields_Lesotho_Hiv.json
  api/src/forms/formsDefinition/CustomFields_Malawi.json
  api/src/forms/formsDefinition/CustomFields_Malawi_Hiv.json
  api/src/forms/formsDefinition/CustomFields_Malawi_HivQual.json
  api/src/forms/formsDefinition/CustomFields_Malawi_HivVL.json
  api/src/forms/formsDefinition/CustomFields_Malawi_Mtb.json
  api/src/forms/formsDefinition/CustomFields_Myanmar.json
  api/src/forms/formsDefinition/CustomFields_Nigeria.json
  api/src/forms/formsDefinition/CustomFields_Pakistan.json
  api/src/forms/formsDefinition/CustomFields_Ukraine.json
  # sole remaining importer of CustomFields_Pakistan.json
  api/test/plugin/transformPayload/transformPayload.test.js

  # -- test mirrors of everything above --
  api/test/plugin/partner/Angola api/test/plugin/partner/Myanmar
  api/test/plugin/partner/Nigeria api/test/result/serviceReportEswatini
  api/test/deviceApi/inventory/resultPakistan.spec.js

  # -- our secrets and internal tooling, not part of the product --
  api/src/pushNotification/credentials.json
  .github ai-context AGENTS.md .claude .cursor webn
  api/ISSUES.md
  api/contract-test-results.json api/newrelic_agent.log api/log
  tools
)

step "Resolving $REF"
git -C "$REPO" rev-parse --verify "$REF^{commit}" >/dev/null
SHA="$(git -C "$REPO" rev-parse "$REF")"
echo "$REF = $SHA"

step "Exporting a clean tree to $OUT"
# From a git ref, never a copy of the working directory: a release must not be able
# to pick up uncommitted local changes.
rm -rf "$OUT"
mkdir -p "$(dirname "$OUT")"
git -C "$REPO" worktree prune
git -C "$REPO" worktree add --detach "$OUT" "$SHA" >/dev/null
rm -rf "$OUT/.git"

step "Deleting other partners' code"
DELETED=0
for p in "${DELETE[@]}"; do
  if [[ -e "$OUT/$p" ]]; then
    n=$(find "$OUT/$p" -type f | wc -l | tr -d ' ')
    rm -rf "${OUT:?}/$p"
    DELETED=$((DELETED + n))
    printf '  %-70s %5s files\n' "$p" "$n"
  fi
done
echo "  ----"
echo "  $DELETED files removed"

step "Placeholder for the push-notification credentials"
cat > "$OUT/api/src/pushNotification/credentials.json.example" <<'JSON'
{
  "type": "service_account",
  "project_id": "REPLACE_WITH_YOUR_FIREBASE_PROJECT_ID",
  "private_key_id": "REPLACE_ME",
  "private_key": "REPLACE_ME",
  "client_email": "REPLACE_ME",
  "client_id": "REPLACE_ME",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token"
}
JSON
echo "  api/src/pushNotification/credentials.json.example"

step "Checking for dangling references to deleted code"
DANGLING=$(grep -rn --include='*.js' --include='*.jsx' \
  -E "require\(['\"][^'\"]*(serviceReportChad|serviceReportEswatini|serviceReportMalawi|serviceReportMyanmar|serviceReportsLesotho|serviceReportsPakistan|serviceReportsZimbabwe|(angola|lesotho|malawi|myanmar|nigeria|pakistan)Plugin|CustomFields_(Chad|Ghana|Lesotho|Malawi|Myanmar|Nigeria|Pakistan|Ukraine))" \
  "$OUT/api/src" "$OUT/api/test" 2>/dev/null || true)
if [[ -n "$DANGLING" ]]; then
  echo "$DANGLING" | sed "s|$OUT/|  |"
  echo
  echo "!! The release imports code that was deleted. Add the importer to DELETE, or"
  echo "!! stop deleting its dependency. Refusing to continue."
  exit 1
fi
echo "  none"

step "Gate: API unit tests"
if [[ -d "$REPO/api/node_modules" ]]; then
  ln -sfn "$REPO/api/node_modules" "$OUT/api/node_modules"
  ln -sfn "$REPO/web/node_modules" "$OUT/web/node_modules"
  [[ -d "$REPO/node_modules" ]] && ln -sfn "$REPO/node_modules" "$OUT/node_modules"
  [[ -f "$REPO/api/.env" ]] && cp "$REPO/api/.env" "$OUT/api/.env"
  ( cd "$OUT/api" && TZ=UTC ./node_modules/.bin/mocha --config test/unit.mocharc.js 2>&1 | tail -5 )
else
  echo "  skipped - no node_modules to link"
fi

cat <<EOF

$(printf '\033[1mRelease tree ready\033[0m')

  tree:     $OUT
  source:   $REF ($SHA)
  deleted:  $DELETED files

Remaining gate needs a database, so run it yourself:

  cd $OUT/api
  seeds.directory=./seeds/bangladesh yarn db:reseed
  yarn mocha:contract

Then publish, from your clone of the customer repo - NEVER from this repo, whose
history contains every other partner's code:

  cd ~/<your-repos>/bangladesh-aspect
  git pull bangla system-one
  rsync -a --delete --exclude '.git/' --exclude 'node_modules' --exclude 'api/.env' $OUT/ .
  git add -A
  git commit -m "Aspect \$(node -p "require('./api/package.json').version")"
  git push bangla system-one
EOF
