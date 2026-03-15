import csv
import json
import os
import sqlite3
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from zoneinfo import ZoneInfo

DB_PATH = os.path.join("data", "likes.db")
OUTPUT_DIR = "data"
JST = ZoneInfo("Asia/Tokyo")

# ── ランキングから除外するユーザー（urlname で指定） ──
EXCLUDED_URLNAMES: set = {
    "ktcrs1107",  # 自分のアカウント
}
# ────────────────────────────────────────────────────


@dataclass(frozen=True)
class Period:
    """ランキング対象期間。内部計算は [start, end_exclusive) の半開区間で扱う。"""

    ranking_type: str
    start: Optional[datetime]
    end_exclusive: Optional[datetime]
    display_end: datetime


def parse_iso(dt_str: Optional[str]) -> Optional[datetime]:
    """ISO文字列を JST aware datetime に変換する。"""
    if not dt_str:
        return None

    s = dt_str.strip()
    # note API 由来で末尾が Z のケースにも対応
    if s.endswith("Z"):
        s = s[:-1] + "+00:00"

    dt = datetime.fromisoformat(s)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=JST)
    return dt.astimezone(JST)


def isoformat_or_empty(dt: Optional[datetime]) -> str:
    return dt.isoformat() if dt else ""


def get_connection(db_path: str = DB_PATH) -> sqlite3.Connection:
    if not os.path.exists(db_path):
        raise FileNotFoundError(f"DB not found: {db_path}")
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn


def get_reference_and_min_datetime(conn: sqlite3.Connection) -> Tuple[datetime, datetime]:
    """DB内の最大/最小 liked_at を取得する。"""
    row = conn.execute(
        "SELECT MIN(liked_at) AS min_liked_at, MAX(liked_at) AS max_liked_at FROM fact_likes_events"
    ).fetchone()

    if not row or not row["max_liked_at"]:
        raise ValueError("fact_likes_events に liked_at データが存在しません。")

    min_dt = parse_iso(row["min_liked_at"])
    max_dt = parse_iso(row["max_liked_at"])
    if not min_dt or not max_dt:
        raise ValueError("liked_at の日時解釈に失敗しました。")
    return max_dt, min_dt


def build_periods(reference_at: datetime, min_dt: datetime) -> Dict[str, Period]:
    """総合・月間・今週・先週の期間を作る。"""
    month_start = reference_at.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    this_week_start = (reference_at - timedelta(days=reference_at.weekday())).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    next_week_start = this_week_start + timedelta(days=7)
    last_week_start = this_week_start - timedelta(days=7)
    last_week_display_end = this_week_start - timedelta(microseconds=1)

    return {
        "total": Period(
            ranking_type="total",
            start=min_dt,
            end_exclusive=None,
            display_end=reference_at,
        ),
        "monthly": Period(
            ranking_type="monthly",
            start=month_start,
            end_exclusive=reference_at + timedelta(microseconds=1),
            display_end=reference_at,
        ),
        "this_week": Period(
            ranking_type="this_week",
            start=this_week_start,
            end_exclusive=reference_at + timedelta(microseconds=1),
            display_end=reference_at,
        ),
        "last_week": Period(
            ranking_type="last_week",
            start=last_week_start,
            end_exclusive=this_week_start,
            display_end=last_week_display_end,
        ),
    }


def get_latest_profiles(conn: sqlite3.Connection) -> Dict[str, Dict[str, object]]:
    """like_user_id ごとの最新プロフィール情報を取得する。"""
    query = """
    WITH ranked AS (
        SELECT
            like_user_id,
            COALESCE(NULLIF(like_username, ''), '匿名') AS creator_name,
            COALESCE(NULLIF(like_user_urlname, ''), '') AS creator_urlname,
            COALESCE(follower_count, 0) AS follower_count,
            liked_at,
            id,
            ROW_NUMBER() OVER (
                PARTITION BY like_user_id
                ORDER BY datetime(liked_at) DESC, id DESC
            ) AS rn
        FROM fact_likes_events
        WHERE like_user_id IS NOT NULL
          AND like_user_id != ''
    )
    SELECT
        like_user_id,
        creator_name,
        creator_urlname,
        follower_count
    FROM ranked
    WHERE rn = 1
    """

    profiles: Dict[str, Dict[str, object]] = {}
    for row in conn.execute(query):
        urlname = row["creator_urlname"] or ""
        profiles[str(row["like_user_id"])] = {
            "creator_name": row["creator_name"] or "匿名",
            "creator_urlname": urlname,
            "creator_url": f"https://note.com/{urlname}" if urlname else "",
            "has_profile_url": bool(urlname),
            "follower_count": int(row["follower_count"] or 0),
        }
    return profiles


def aggregate_period(
    conn: sqlite3.Connection,
    profiles: Dict[str, Dict[str, object]],
    period: Period,
    generated_at: datetime,
) -> List[Dict[str, object]]:
    """指定期間のランキングを生成する。"""
    conditions: List[str] = ["like_user_id IS NOT NULL", "like_user_id != ''"]
    params: List[str] = []

    if period.start is not None:
        conditions.append("datetime(liked_at) >= datetime(?)")
        params.append(period.start.isoformat())

    if period.end_exclusive is not None:
        conditions.append("datetime(liked_at) < datetime(?)")
        params.append(period.end_exclusive.isoformat())

    where_clause = " AND ".join(conditions)
    query = f"""
    SELECT
        like_user_id,
        COUNT(*) AS likes_count,
        MIN(liked_at) AS first_like_at,
        MAX(liked_at) AS last_like_at
    FROM fact_likes_events
    WHERE {where_clause}
    GROUP BY like_user_id
    ORDER BY likes_count DESC, datetime(last_like_at) DESC, like_user_id ASC
    """

    rows = conn.execute(query, params).fetchall()

    records: List[Dict[str, object]] = []
    for row in rows:
        uid = str(row["like_user_id"])
        profile = profiles.get(
            uid,
            {
                "creator_name": "匿名",
                "creator_urlname": "",
                "creator_url": "",
                "has_profile_url": False,
                "follower_count": 0,
            },
        )

        # 除外リストに含まれていたらスキップ
        if profile["creator_urlname"] in EXCLUDED_URLNAMES:
            continue

        first_like_at = parse_iso(row["first_like_at"])
        last_like_at = parse_iso(row["last_like_at"])

        records.append(
            {
                "like_user_id": uid,
                "creator_name": profile["creator_name"],
                "creator_urlname": profile["creator_urlname"],
                "creator_url": profile["creator_url"],
                "has_profile_url": profile["has_profile_url"],
                "likes_count": int(row["likes_count"] or 0),
                "first_like_at": isoformat_or_empty(first_like_at),
                "last_like_at": isoformat_or_empty(last_like_at),
                "follower_count": int(profile["follower_count"] or 0),
                "ranking_type": period.ranking_type,
                "generated_at": generated_at.isoformat(),
                "period_start": isoformat_or_empty(period.start),
                "period_end": isoformat_or_empty(period.display_end),
            }
        )

    # 同率順位ではなく表示用の連番 rank を付与する
    records.sort(
        key=lambda x: (
            -int(x["likes_count"]),
            x["last_like_at"] and -int(parse_iso(x["last_like_at"]).timestamp()) or 0,
            str(x["creator_name"]),
        )
    )
    for idx, record in enumerate(records, start=1):
        record["rank"] = idx

    return records


def export_csv(records: List[Dict[str, object]], path: str) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    fieldnames = [
        "rank",
        "ranking_type",
        "like_user_id",
        "creator_name",
        "creator_urlname",
        "creator_url",
        "has_profile_url",
        "likes_count",
        "first_like_at",
        "last_like_at",
        "follower_count",
        "generated_at",
        "period_start",
        "period_end",
    ]

    with open(path, "w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for row in records:
            writer.writerow({key: row.get(key, "") for key in fieldnames})


def export_json(records: List[Dict[str, object]], path: str) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)

    if records:
        meta = {
            "ranking_type": records[0]["ranking_type"],
            "generated_at": records[0]["generated_at"],
            "period_start": records[0]["period_start"],
            "period_end": records[0]["period_end"],
            "items": records,
        }
    else:
        meta = {
            "ranking_type": os.path.basename(path).replace("ranking_", "").replace(".json", ""),
            "generated_at": "",
            "period_start": "",
            "period_end": "",
            "items": [],
        }

    with open(path, "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)


def build_all_rankings(db_path: str = DB_PATH, output_dir: str = OUTPUT_DIR) -> None:
    conn = get_connection(db_path)
    try:
        reference_at, min_dt = get_reference_and_min_datetime(conn)
        generated_at = datetime.now(JST)
        periods = build_periods(reference_at, min_dt)
        profiles = get_latest_profiles(conn)

        output_map = {
            "total": ("ranking_total.csv", "ranking_total.json"),
            "monthly": ("ranking_monthly.csv", "ranking_monthly.json"),
            "this_week": ("ranking_this_week.csv", "ranking_this_week.json"),
            "last_week": ("ranking_last_week.csv", "ranking_last_week.json"),
        }

        print(f"[INFO] reference_at: {reference_at.isoformat()}")
        print(f"[INFO] generated_at: {generated_at.isoformat()}")
        print(f"[INFO] 除外urlname: {EXCLUDED_URLNAMES}")

        for key, period in periods.items():
            records = aggregate_period(conn, profiles, period, generated_at)
            csv_name, json_name = output_map[key]
            csv_path = os.path.join(output_dir, csv_name)
            json_path = os.path.join(output_dir, json_name)
            export_csv(records, csv_path)
            export_json(records, json_path)
            print(f"[INFO] {key}: {len(records)} rows -> {csv_path}, {json_path}")
    finally:
        conn.close()


def main() -> None:
    build_all_rankings()


if __name__ == "__main__":
    main()
