import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const headerSource = readFileSync("components/site-header.tsx", "utf8");

testDesktopNavigationBreakpoint();
testMobileMenuBreakpoint();
testRouteListUnchanged();

console.log("Header responsive tests passed.");

function testDesktopNavigationBreakpoint() {
  assert.match(
    headerSource,
    /aria-label="Primary navigation"[\s\S]*?min-\[1180px\]:flex/,
    "desktop primary navigation should appear at the desktop header breakpoint",
  );
  assert.match(
    headerSource,
    /aria-label="Open navigation menu"[\s\S]*?min-\[1180px\]:hidden/,
    "hamburger should hide at the same breakpoint where desktop nav appears",
  );
  assert.doesNotMatch(
    headerSource,
    /aria-label="Primary navigation"[\s\S]*?className="hidden items-center gap-0 xl:flex"/,
    "primary nav must not be hidden until xl while hamburger hides at lg",
  );
}

function testMobileMenuBreakpoint() {
  assert.match(
    headerSource,
    /fixed inset-0 z-50 bg-surface text-foreground min-\[1180px\]:hidden/,
    "mobile overlay should use the same desktop breakpoint as the hamburger",
  );
}

function testRouteListUnchanged() {
  const navigationSource = readFileSync("config/navigation.ts", "utf8");
  const expectedLabels = [
    "Home",
    "Race Live Center",
    "Events",
    "Riders",
    "Manufacturers",
    "Teams",
    "Media",
    "History",
  ];

  for (const label of expectedLabels) {
    assert.match(navigationSource, new RegExp(`label: "${label}"`));
  }
}
