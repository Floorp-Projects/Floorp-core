#filter substitution
#include @TOPOBJDIR@/source-repo.h
#include @TOPOBJDIR@/buildid.h
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// Immutable for export.
export var FloorpAppConstants = Object.freeze({
    FLOORP_LIGHTNING_BUILD:
#ifdef FLOORP_LIGHTNING_BUILD
    true,
#else
    false,
#endif
  // Returns true for CN region build when distibution id set as 'MozillaOnline'
  isChinaRepack() {
    return (
      Services.prefs
      .getDefaultBranch("")
      .getCharPref("distribution.id", "default") === "MozillaOnline"
    );
  },
});
