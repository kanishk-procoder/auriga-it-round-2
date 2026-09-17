from __future__ import annotations

import sqlite3
from datetime import datetime

from fastapi import Depends, FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field

from backend.config import (
    DATABASE_PATH,
    GOLD_SPEND_THRESHOLD_PAISE,
    PAISE_PER_REGULAR_POINT,
    REWARD_POINTS_PER_RUPEE,
    SILVER_SPEND_THRESHOLD_PAISE,
    TIER_MULTIPLIERS,
)
from backend.db import connect, initialize_database
from backend.security import create_access_token, decode_access_token, hash_password, verify_password

app = FastAPI(title="BrewRewards API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
security = HTTPBearer()


class LoginPayload(BaseModel):
    email: str
    password: str = Field(min_length=8)


class PurchasePayload(BaseModel):
    member_id: int = Field(gt=0)
    amount_paise: int = Field(gt=0)
    note: str = Field(default="Café purchase", max_length=160)


class RedemptionPayload(BaseModel):
    points: int = Field(gt=0)
    note: str = Field(default="Free item reward", max_length=160)


def row_dict(row: sqlite3.Row) -> dict:
    return dict(row)


def get_connection():
    connection = connect()
    try:
        yield connection
    finally:
        connection.close()


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), connection: sqlite3.Connection = Depends(get_connection)) -> sqlite3.Row:
    claims = decode_access_token(credentials.credentials)
    user = connection.execute("SELECT * FROM users WHERE id = ?", (int(claims["sub"]),)).fetchone()
    if user is None:
        raise HTTPException(status_code=401, detail="User no longer exists")
    return user


def require_staff(user: sqlite3.Row = Depends(get_current_user)) -> sqlite3.Row:
    if user["role"] != "STAFF":
        raise HTTPException(status_code=403, detail="Staff access required")
    return user


def tier_for_spend(spend_paise: int) -> str:
    if spend_paise >= GOLD_SPEND_THRESHOLD_PAISE:
        return "GOLD"
    if spend_paise >= SILVER_SPEND_THRESHOLD_PAISE:
        return "SILVER"
    return "REGULAR"


def round_half_up(numerator: int, denominator: int) -> int:
    return (numerator * 2 + denominator) // (denominator * 2)


def earned_points(amount_paise: int, current_tier: str) -> int:
    multiplier_numerator, multiplier_denominator = TIER_MULTIPLIERS[current_tier]
    return round_half_up(amount_paise * multiplier_numerator, PAISE_PER_REGULAR_POINT * multiplier_denominator)


def member_or_404(connection: sqlite3.Connection, member_id: int) -> sqlite3.Row:
    member = connection.execute("SELECT * FROM members WHERE id = ?", (member_id,)).fetchone()
    if member is None:
        raise HTTPException(status_code=404, detail="Member not found")
    return member


def seed_database() -> None:
    initialize_database()
    with connect() as connection:
        if connection.execute("SELECT 1 FROM users LIMIT 1").fetchone():
            return
        cursor = connection.execute(
            """INSERT INTO members (name, country_code, phone_number, points_balance, lifetime_spend_paise, tier)
               VALUES (?, ?, ?, ?, ?, ?)""",
            ("Aarav Sharma", "+91", "9876543210", 1840, 1_875_000, "GOLD"),
        )
        member_id = cursor.lastrowid
        connection.execute(
            "INSERT INTO users (email, password_hash, role, member_id) VALUES (?, ?, 'CUSTOMER', ?)",
            ("aarav@brewrewards.test", hash_password("BrewCustomer#2026"), member_id),
        )
        connection.execute(
            "INSERT INTO users (email, password_hash, role) VALUES (?, ?, 'STAFF')",
            ("admin@brewrewards.test", hash_password("BrewAdmin#2026")),
        )
        connection.execute(
            """INSERT INTO reward_transactions (member_id, type, amount_paise, points_delta, balance_after, lifetime_spend_after_paise, note)
               VALUES (?, 'EARN', 42000, 42, 1840, 1875000, 'Cappuccino & croissant')""",
            (member_id,),
        )


@app.on_event("startup")
def startup() -> None:
    seed_database()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/auth/login")
def login(payload: LoginPayload, connection: sqlite3.Connection = Depends(get_connection)) -> dict:
    user = connection.execute("SELECT * FROM users WHERE lower(email) = lower(?)", (payload.email.strip(),)).fetchone()
    if user is None or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    return {"access_token": create_access_token(user["id"], user["role"]), "token_type": "bearer", "role": user["role"]}


@app.get("/api/auth/me")
def me(user: sqlite3.Row = Depends(get_current_user), connection: sqlite3.Connection = Depends(get_connection)) -> dict:
    result = row_dict(user)
    result.pop("password_hash", None)
    if user["member_id"]:
        result["member"] = row_dict(member_or_404(connection, user["member_id"]))
    return result


@app.get("/api/customer/dashboard")
def customer_dashboard(user: sqlite3.Row = Depends(get_current_user), connection: sqlite3.Connection = Depends(get_connection)) -> dict:
    if user["role"] != "CUSTOMER" or user["member_id"] is None:
        raise HTTPException(status_code=403, detail="Customer access required")
    member = member_or_404(connection, user["member_id"])
    transactions = connection.execute("SELECT * FROM reward_transactions WHERE member_id = ? ORDER BY id DESC LIMIT 20", (member["id"],)).fetchall()
    return {"member": row_dict(member), "reward_value_paise": member["points_balance"] * 10, "transactions": [row_dict(item) for item in transactions]}


@app.post("/api/customer/redemptions")
def customer_redeem(payload: RedemptionPayload, user: sqlite3.Row = Depends(get_current_user), connection: sqlite3.Connection = Depends(get_connection)) -> dict:
    if user["role"] != "CUSTOMER" or user["member_id"] is None:
        raise HTTPException(status_code=403, detail="Customer access required")
    try:
        connection.execute("BEGIN IMMEDIATE")
        member = member_or_404(connection, user["member_id"])
        if payload.points > member["points_balance"]:
            raise HTTPException(status_code=409, detail="Insufficient points balance")
        balance_after = member["points_balance"] - payload.points
        connection.execute("UPDATE members SET points_balance = ? WHERE id = ?", (balance_after, member["id"]))
        connection.execute("""INSERT INTO reward_transactions (member_id, type, points_delta, balance_after, lifetime_spend_after_paise, note)
                            VALUES (?, 'REDEEM', ?, ?, ?, ?)""", (member["id"], -payload.points, balance_after, member["lifetime_spend_paise"], payload.note))
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    return {"points_redeemed": payload.points, "reward_value_paise": payload.points * 10, "balance_after": balance_after}


@app.get("/api/staff/members")
def list_members(q: str = "", page: int = 1, limit: int = 20, _: sqlite3.Row = Depends(require_staff), connection: sqlite3.Connection = Depends(get_connection)) -> dict:
    page, limit = max(page, 1), min(max(limit, 1), 100)
    pattern = f"%{q.strip()}%"
    rows = connection.execute("""SELECT * FROM members WHERE name LIKE ? COLLATE NOCASE OR phone_number LIKE ?
                               ORDER BY name ASC LIMIT ? OFFSET ?""", (pattern, pattern, limit, (page - 1) * limit)).fetchall()
    total = connection.execute("SELECT count(*) FROM members WHERE name LIKE ? COLLATE NOCASE OR phone_number LIKE ?", (pattern, pattern)).fetchone()[0]
    return {"items": [row_dict(item) for item in rows], "page": page, "limit": limit, "total": total}


@app.post("/api/staff/purchases")
def create_purchase(payload: PurchasePayload, _: sqlite3.Row = Depends(require_staff), connection: sqlite3.Connection = Depends(get_connection)) -> dict:
    try:
        connection.execute("BEGIN IMMEDIATE")
        member = member_or_404(connection, payload.member_id)
        points = earned_points(payload.amount_paise, member["tier"])
        spend_after = member["lifetime_spend_paise"] + payload.amount_paise
        balance_after = member["points_balance"] + points
        tier_after = tier_for_spend(spend_after)
        connection.execute("UPDATE members SET points_balance = ?, lifetime_spend_paise = ?, tier = ? WHERE id = ?", (balance_after, spend_after, tier_after, member["id"]))
        connection.execute("""INSERT INTO reward_transactions (member_id, type, amount_paise, points_delta, balance_after, lifetime_spend_after_paise, note)
                            VALUES (?, 'EARN', ?, ?, ?, ?, ?)""", (member["id"], payload.amount_paise, points, balance_after, spend_after, payload.note))
        invoice_number = f"BR-{datetime.now():%Y%m%d}-{member['id']}-{connection.execute('SELECT count(*) FROM bills').fetchone()[0] + 1:04d}"
        connection.execute("INSERT INTO bills (invoice_number, member_id, amount_paise, total_paid_paise) VALUES (?, ?, ?, ?)", (invoice_number, member["id"], payload.amount_paise, payload.amount_paise))
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    return {"invoice_number": invoice_number, "points_earned": points, "member": row_dict(member_or_404(connection, payload.member_id))}


seed_database()
