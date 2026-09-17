# BrewRewards — Requirements Notes

## Confirmed from the challenge brief

The product is a café rewards counter for staff. It must support any café and
any member.

### Core workflow

1. Staff find a member using their phone number.
2. Staff record a purchase.
3. The system awards the correct number of reward points for the member's
   current tier.
4. Members progress through Regular, Silver, and Gold tiers.
5. Staff can redeem a member's points for free items.
6. The member's displayed balance must always be correct and current.

### Lookup and scale

- Phone number is the primary member lookup key.
- The member list can be long, so lookup/list operations should be efficient.
- The brief prioritises correct earning, tiers, and redemption before lookup
  improvements or visual polish.

## Acceptance criteria

- A new member can be identified by a unique phone number.
- Recording a valid purchase updates the member's points balance correctly.
- Tier-dependent earning is applied consistently.
- A member receives the appropriate tier after meeting its qualification rule.
- A redemption cannot make the points balance negative.
- The displayed balance matches the result of all completed earn/redemption
  operations.
- Staff can find a member by phone number even when many members exist.
- The system retains enough transaction information to investigate a balance.

## Data and correctness decisions

These are implementation constraints, not invented business rules:

- Store money in the smallest currency unit (for example, paise) as integers.
- Store point changes as signed integers: positive for earning and negative for
  redemption.
- Keep a transaction history rather than only overwriting a balance.
- Process each earn/redeem operation atomically so two simultaneous operations
  cannot produce an incorrect balance.
- Track the tier-qualification total separately from redeemable points, so
  redemption does not unintentionally demote a member.

## Confirmed business rules

- Regular members earn **1 point per ₹10** spent.
- Silver qualification begins at **5,000** and Gold qualification begins at
  **15,000**. The supplied wording says "purchase", so this is provisionally
  interpreted as lifetime ₹ spend rather than lifetime points.
- Fractional point calculations use standard rounding. The exact tie rule must
  be stated in the implementation (recommended: round .5 upward).
- A purchase earns at the member's current tier. A tier achieved by that
  purchase applies from the next purchase onward.
- Reward redemption converts **10 points to ₹1** of free-item value.
- A free redemption earns no new points.
- Store a phone country code separately from the local phone number.

## User roles and permissions

### Customer

- Can sign in to view their tier and current points wallet.
- Can redeem a free item from their own app.
- A completed redemption immediately reduces the points wallet.
- Cannot modify points, tier, member records, or purchase history.

### Staff / brewer

- Can find members, record purchases, and make authorised changes.
- Can view balances, tiers, and transaction history.
- Can generate a bill for a customer purchase.
- Must not award points for an item redeemed entirely with reward points.

## Remaining decisions required before points logic

- What earning rate/multiplier applies to Silver and Gold members? The story
  says higher tiers earn faster, but only the Regular rate was supplied.
- Do the 5,000 and 15,000 thresholds mean lifetime rupees spent, lifetime
  points earned, or number of purchases? This document currently treats them
  as lifetime rupees spent because of the wording supplied.
- Does a bill need an invoice number, café details, tax, line items, and a PDF,
  or is a simple purchase receipt sufficient?

## Definition of done for the first implementation

The first usable version will let a staff member create/find a member, record
a purchase, generate a receipt, see the live balance and tier, and review the
member's point history. Customers will be able to sign in, view their wallet,
and redeem eligible free-item value. It will support paginated phone search
for a long member list.
