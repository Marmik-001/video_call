import { test, expect } from "@playwright/test";

test.describe("Beginner Mode 6-Step Walkthrough E2E", () => {
  test("navigates all 6 steps, interacts with live demos, and validates comprehension quizzes", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("text=WebRTC Learning Lab")).toBeVisible();

    // -------------------------------------------------------------
    // Step 1: The Matchmaker (Signaling)
    // -------------------------------------------------------------
    await expect(page.locator("text=The Matchmaker (Signaling)")).toBeVisible();
    await expect(page.locator("text=Mental Model & Analogy")).toBeVisible();

    // Unpause for real-time WebRTC
    await page.getByTestId("btn-pause-toggle").click();

    // Answer Step 1 quiz correctly (Option B: No, signaling server only exchanges setup notes)
    await page.locator("text=No, the signaling server only exchanges setup notes").click();
    await expect(page.locator("text=Correct! The signaling server only brokers initial contact.")).toBeVisible();

    // Navigate to Step 2
    await page.locator("header").getByRole("button", { name: "Next" }).click();

    // -------------------------------------------------------------
    // Step 2: The Business Card (SDP Offer / Answer)
    // -------------------------------------------------------------
    await expect(page.locator("text=The Business Card (SDP Offer / Answer)")).toBeVisible();

    // Create offer
    await page.getByTestId("btn-start-offer").click();
    await expect(page.getByTestId("peer-a-state")).toHaveText("connected", { timeout: 15000 });
    await expect(page.getByTestId("peer-b-state")).toHaveText("connected", { timeout: 15000 });

    // Inspect real data toggle
    await page.locator("text=Show Real Data").click();
    await expect(page.locator("text=Hide Real Data")).toBeVisible();

    // Navigate to Step 3
    await page.locator("header").getByRole("button", { name: "Next" }).click();

    // -------------------------------------------------------------
    // Step 3: Finding the Path (ICE Candidates)
    // -------------------------------------------------------------
    await expect(page.locator("text=Finding the Path (ICE Candidates)")).toBeVisible();
    await expect(page.locator("text=Gathered Candidates")).toBeVisible();

    // Navigate to Step 4
    await page.locator("header").getByRole("button", { name: "Next" }).click();

    // -------------------------------------------------------------
    // Step 4: The Apartment Front Desk (NAT Basics)
    // -------------------------------------------------------------
    await expect(page.locator("text=The Apartment Front Desk (NAT Basics)")).toBeVisible();
    await expect(page.locator("text=[ILLUSTRATION: Educational Animation]")).toBeVisible();

    // Trigger NAT outbound packet simulation
    await page.locator("button:has-text('Send Outbound Packet through NAT')").click();
    await expect(
      page.locator("text=Pinhole active! STUN server successfully reflected external address")
    ).toBeVisible({ timeout: 5000 });

    // Navigate to Step 5
    await page.locator("header").getByRole("button", { name: "Next" }).click();

    // -------------------------------------------------------------
    // Step 5: Hooking up the Cameras (Media Streams & Tracks)
    // -------------------------------------------------------------
    await expect(page.locator("text=Hooking up the Cameras (Media Streams & Tracks)")).toBeVisible();

    // Request media / synthetic stream
    await page.locator("button:has-text('Request Camera / Synthetic Feed')").click();
    await expect(page.locator("text=Feed Active")).toBeVisible({ timeout: 5000 });

    // Navigate to Step 6
    await page.locator("header").getByRole("button", { name: "Next" }).click();

    // -------------------------------------------------------------
    // Step 6: The Direct Wire (Data Channels)
    // -------------------------------------------------------------
    await expect(page.locator("text=The Direct Wire (Data Channels)")).toBeVisible();

    // Send a message over DataChannel on Step 6
    await page.getByTestId("input-msg-a").fill("Step 6 DataChannel Test");
    await page.getByTestId("btn-send-a").click();
    await expect(page.getByTestId("dc-log")).toContainText("Step 6 DataChannel Test", { timeout: 5000 });

    // Answer Step 6 quiz
    await page.locator("text=SCTP over DTLS").click();
    await expect(page.locator("text=Correct! SCTP (Stream Control Transmission Protocol)")).toBeVisible();
  });
});
