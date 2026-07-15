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
    /aria-label="Primary navigation"[\s\S]*?lg:flex/,
    "desktop primary navigation should appear at the standard Tailwind lg breakpoint",
  );
  assert.match(
    headerSource,
    /aria-label="Open navigation menu"[\s\S]*?lg:hidden/,
    "hamburger should hide at the same standard breakpoint where desktop nav appears",
  );
  assert.doesNotMatch(
    headerSource,
    /min-\[1180px\]/,
    "header must not use the removed custom desktop breakpoint",
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
    /createPortal\(/,
    "mobile overlay should render through a body-level portal instead of staying inside the header stacking context",
  );
  assert.match(
    headerSource,
    /document\.body\.style\.overflow = "hidden"/,
    "mobile overlay should lock body scrolling while open",
  );
  assert.match(
    headerSource,
    /document\.documentElement\.style\.overflow = "hidden"/,
    "mobile overlay should lock document scrolling while open",
  );
  assert.match(
    headerSource,
    /fixed inset-0 z-\[9999\][\s\S]*?bg-\[#06080d\][\s\S]*?lg:hidden/,
    "mobile overlay should use an isolated high-z-index opaque dark surface and the same standard breakpoint as the hamburger",
  );
  assert.match(
    headerSource,
    /flex-1 content-start gap-1 overflow-y-auto overscroll-contain/,
    "mobile navigation content should scroll internally",
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
