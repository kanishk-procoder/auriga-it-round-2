from pathlib import Path

DATABASE_PATH = Path(__file__).resolve().parent / "brewrewards.db"
JWT_SECRET = "development-only-change-this-before-deployment"
JWT_ALGORITHM = "HS256"
TOKEN_EXPIRY_MINUTES = 60 * 8

# Keep business rules in one place so they can be changed after validation.
SILVER_SPEND_THRESHOLD_PAISE = 500_000   # ₹5,000
GOLD_SPEND_THRESHOLD_PAISE = 1_500_000  # ₹15,000
PAISE_PER_REGULAR_POINT = 1_000         # ₹10
TIER_MULTIPLIERS = {
    "REGULAR": (1, 1),
    "SILVER": (3, 2),  # 1.5×
    "GOLD": (2, 1),
}
REWARD_POINTS_PER_RUPEE = 10
